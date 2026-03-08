import sys
import json
import os
import cv2
import shutil
import subprocess
from pathlib import Path

# Try to import required ML libraries
try:
    import insightface
    from insightface.app import FaceAnalysis
    import onnxruntime
except ImportError:
    print(json.dumps({
        "success": False,
        "error": "Missing dependencies. Please run: pip install insightface onnxruntime opencv-python onnx",
        "output_path": None
    }))
    sys.exit(1)

def main():
    if len(sys.argv) < 4:
        print(json.dumps({
            "success": False,
            "error": "Missing arguments. Usage: python face_swap_video.py <input_video_path> <source_face_image_path> <output_video_path>",
            "output_path": None
        }))
        sys.exit(1)

    input_video_path = sys.argv[1]
    source_face_path = sys.argv[2]
    output_video_path = sys.argv[3]

    # Model path - assume it's in a 'models' directory next to this script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(script_dir, 'models', 'inswapper_128.onnx')

    if not os.path.exists(model_path):
        # Provide a helpful error message with download instructions
        print(json.dumps({
            "success": False,
            "error": f"Model not found at {model_path}. Please download inswapper_128.onnx and place it in backend/python/models/",
            "output_path": None
        }))
        sys.exit(1)

    # Temporary directory for frames
    base_name = os.path.basename(input_video_path).replace('.', '_')
    temp_dir = os.path.join(os.path.dirname(output_video_path), f"temp_{base_name}_frames")
    
    if not os.path.exists(temp_dir):
        os.makedirs(temp_dir)

    try:
        print("Loading models (this might take a moment)...", file=sys.stderr)
        
        # Initialize FaceAnalysis (for detecting the face to replace)
        app = FaceAnalysis(name='buffalo_l')
        app.prepare(ctx_id=0, det_size=(640, 640))
        
        # Initialize the Face Swapper
        swapper = insightface.model_zoo.get_model(model_path, download=False, download_zip=False)

        # 1. Process the source face image
        source_img = cv2.imread(source_face_path)
        if source_img is None:
            raise Exception("Could not read source face image.")
            
        source_faces = app.get(source_img)
        if not source_faces:
            raise Exception("No face detected in the source image.")
            
        source_face = sorted(source_faces, key=lambda x: x.bbox[2]-x.bbox[0], reverse=True)[0]

        # 2. Extract frames and properties from the target video
        print("Extracting frames and processing...", file=sys.stderr)
        cap = cv2.VideoCapture(input_video_path)
        if not cap.isOpened():
             raise Exception(f"Failed to open video {input_video_path}")
             
        fps = cap.get(cv2.CAP_PROP_FPS)
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

        frame_count = 0
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            
            # Detect faces in the current frame
            target_faces = app.get(frame)
            
            res_frame = frame.copy()
            if target_faces:
                # Optionally swap all faces, or just the largest one
                for face in target_faces:
                    try:
                        res_frame = swapper.get(res_frame, face, source_face, paste_back=True)
                    except Exception as e:
                        # If swap fails for a face, just continue
                        pass

            # Save the processed frame
            frame_path = os.path.join(temp_dir, f"frame_{frame_count:06d}.jpg")
            cv2.imwrite(frame_path, res_frame)
            
            frame_count += 1
            if frame_count % 30 == 0:
                print(f"Processed {frame_count}/{total_frames} frames", file=sys.stderr)
                
        cap.release()

        # 3. Create the video from frames using FFmpeg and merge original audio
        print("Reassembling video with audio using FFmpeg...", file=sys.stderr)
        
        # ffmpeg -y -framerate {fps} -i {temp_dir}/frame_%06d.jpg -i {input_video} -c:v libx264 -pix_fmt yuv420p -map 0:v:0 -map 1:a:0? -c:a copy {output}
        frames_pattern = os.path.join(temp_dir, "frame_%06d.jpg")
        
        ffmpeg_cmd = [
            'ffmpeg', '-y',
            '-framerate', str(fps),
            '-i', frames_pattern,
            '-i', input_video_path,
            '-c:v', 'libx264',
            '-pix_fmt', 'yuv420p',
            '-map', '0:v:0',
            '-map', '1:a:0?', # map audio if it exists
            '-c:a', 'copy',
            output_video_path
        ]
        
        subprocess.run(ffmpeg_cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

        # Output success
        print(json.dumps({
            "success": True,
            "output_path": output_video_path,
            "message": "Face swapping completed successfully"
        }))

    except subprocess.CalledProcessError as e:
         print(json.dumps({
            "success": False,
            "error": "FFmpeg processing failed",
            "details": e.stderr.decode('utf-8', errors='ignore') if e.stderr else str(e),
            "output_path": None
        }))
    except Exception as e:
        print(json.dumps({
            "success": False,
            "error": str(e),
            "output_path": None
        }))
    finally:
        # Clean up temporary frames
        if os.path.exists(temp_dir):
            shutil.rmtree(temp_dir, ignore_errors=True)

if __name__ == "__main__":
    main()
