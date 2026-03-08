import sys
import json
import cv2
import os
import subprocess
import shutil
import numpy as np

def main():
    if len(sys.argv) < 3:
        print(json.dumps({
            "success": False,
            "error": "Missing arguments. Usage: python remove_subtitles.py <input_video_path> <output_video_path>",
            "output_path": None
        }))
        sys.exit(1)

    input_video_path = sys.argv[1]
    output_video_path = sys.argv[2]
    
    # Optional parameters for tuning depending on subtitle color/position
    # Subtitles are usually bright/white and at the bottom 20%
    threshold_value = 200 # Brightness threshold to detect text (0-255)
    bottom_crop_ratio = 0.25 # Only check the bottom 25% of the video

    try:
        # Open video to read properties
        cap = cv2.VideoCapture(input_video_path)
        if not cap.isOpened():
             raise Exception(f"Failed to open video {input_video_path}")
             
        fps = cap.get(cv2.CAP_PROP_FPS)
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        
        # Calculate Y coordinate to start looking for subtitles
        start_y = int(height * (1.0 - bottom_crop_ratio))

        # We will use OpenCV to process frames and save them to a temp folder, then use ffmpeg to put it together with audio.
        base_name = os.path.basename(input_video_path).replace('.', '_')
        temp_dir = os.path.join(os.path.dirname(output_video_path), f"temp_{base_name}_nosub_frames")
        
        if not os.path.exists(temp_dir):
            os.makedirs(temp_dir)

        print("Removing subtitles frame by frame...", file=sys.stderr)
        
        frame_count = 0
        while True:
            ret, frame = cap.read()
            if not ret:
                break
                
            # Extract the bottom region where subtitles usually reside
            bottom_region = frame[start_y:height, 0:width]
            
            # --- Detect Subtitles ---
            # 1. Convert to grayscale
            gray = cv2.cvtColor(bottom_region, cv2.COLOR_BGR2GRAY)
            
            # 2. Edge detection to catch text borders (captures both white text and black outlines)
            # This is much more reliable than simple thresholding for subtitles
            edges = cv2.Canny(gray, 100, 200)
            
            # --- Check if subtitles actually exist in this frame ---
            # Calculate the percentage of edge pixels
            edge_density = np.sum(edges > 0) / (width * bottom_region.shape[0])
            
            # If edge density is very low, there's likely no text. Skip processing.
            if edge_density < 0.005: # 0.5% threshold - adjust if needed
                res_frame = frame.copy()
            else:
                # 3. Morphological operations to group text characters into solid blocks
                kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (9, 5)) 
                mask = cv2.morphologyEx(edges, cv2.MORPH_DILATE, kernel, iterations=2)
                
                # --- Inpaint (Remove) Subtitles ---
                # 4. Use OpenCV's fast Telea inpainting algorithm to fill in the mask
                inpainted_bottom = cv2.inpaint(bottom_region, mask, 7, cv2.INPAINT_TELEA)
                
                # 5. Apply a slight blur to the inpainted region to smooth out the patchy look
                inpainted_bottom = cv2.GaussianBlur(inpainted_bottom, (7, 7), 0)
                
                # 6. Blend the blurred part only where the mask was applied so we don't blur the whole bottom
                blur_mask = mask.astype(np.float32) / 255.0
                # Dilate the blur mask slightly to soften the edges of the inpainting
                blur_mask_dilated = cv2.dilate(blur_mask, np.ones((5,5), np.float32), iterations=1)
                blur_mask_3d = np.dstack([blur_mask_dilated] * 3)
                
                bottom_region_float = bottom_region.astype(np.float32)
                inpainted_float = inpainted_bottom.astype(np.float32)
                
                final_bottom = (inpainted_float * blur_mask_3d) + (bottom_region_float * (1.0 - blur_mask_3d))
                final_bottom = np.clip(final_bottom, 0, 255).astype(np.uint8)
                
                # 7. Place the inpainted region back into the original frame
                res_frame = frame.copy()
                res_frame[start_y:height, 0:width] = final_bottom

            # Save the processed frame
            frame_path = os.path.join(temp_dir, f"frame_{frame_count:06d}.jpg")
            # Lower jpg quality slightly to save disk space and I/O time during temp processing
            cv2.imwrite(frame_path, res_frame, [int(cv2.IMWRITE_JPEG_QUALITY), 95])
            
            frame_count += 1
            if frame_count % 30 == 0:
                print(f"Processed {frame_count}/{total_frames} frames", file=sys.stderr)
                
        cap.release()

        # Reassemble using FFmpeg and copy the original audio
        print("Reassembling video with audio...", file=sys.stderr)
        frames_pattern = os.path.join(temp_dir, "frame_%06d.jpg")
        
        ffmpeg_cmd = [
            'ffmpeg', '-y',
            '-framerate', str(fps),
            '-i', frames_pattern,
            '-i', input_video_path,
            '-c:v', 'libx264',
            '-pix_fmt', 'yuv420p',
            '-map', '0:v:0',
            '-map', '1:a:0?', # map audio from original if it exists
            '-c:a', 'copy',
            output_video_path
        ]
        
        subprocess.run(ffmpeg_cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

        # Output success
        print(json.dumps({
            "success": True,
            "output_path": output_video_path,
            "message": "Subtitles removed successfully"
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
        # Clean up temporary frames directory
        if 'temp_dir' in locals() and os.path.exists(temp_dir):
            shutil.rmtree(temp_dir, ignore_errors=True)

if __name__ == "__main__":
    main()
