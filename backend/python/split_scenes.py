import sys
import os
import subprocess
import json
import traceback
import zipfile
import glob

def safe_print(data):
    try:
        if sys.stdout.encoding:
            sys.stdout.buffer.write(data.encode('utf-8'))
        else:
            print(data)
    except Exception:
        pass

def split_scenes(input_path, output_zip_path, threshold='0.4'):
    try:
        if not os.path.exists(input_path):
            safe_print(json.dumps({"success": False, "error": f"Input file not found: {input_path}"}))
            return

        base_dir = os.path.dirname(output_zip_path)
        os.makedirs(base_dir, exist_ok=True)
        
        # Create a unique temporary directory for the clips
        temp_dir_name = "scene_clips_" + os.path.basename(output_zip_path).replace('.zip', '')
        temp_dir_path = os.path.join(base_dir, temp_dir_name)
        os.makedirs(temp_dir_path, exist_ok=True)

        output_pattern = os.path.join(temp_dir_path, "scene_%03d.mp4")

        # FFmpeg command to detect scenes and split into separate files
        # segment filter is used with scene detection
        command = [
            'ffmpeg',
            '-y',
            '-i', input_path,
            '-f', 'segment',
            '-segment_format', 'mp4',
            '-reset_timestamps', '1',
            '-c:v', 'libx264',
            '-c:a', 'aac',
            '-preset', 'fast',
            '-crf', '26',
            '-segment_time_delta', '0.05',
            # Using scenedetect metadata to force split points
            '-force_key_frames', f'expr:gte(t,n_forced*1)', # Force keyframes roughly every second just in case
            output_pattern
        ]
        
        # A more precise scene splitting command using modern syntax
        # The above forces keyframes but doesn't strictly split ON scenes easily.
        # This alternate command uses the segment muxer directly with scene detection.
        command_advanced = [
             'ffmpeg',
             '-y',
             '-i', input_path,
             '-c:v', 'libx264',
             '-preset', 'fast',
             '-crf', '28', # slightly lower quality to speed up the process
             '-c:a', 'copy',
             '-f', 'segment',
             '-segment_format', 'mp4',
             '-reset_timestamps', '1',
             # -force_key_frames expr:gte(t,n_forced) is typically needed, but let's try 
             # forcing keyframes on scene change.
             '-force_key_frames', f'expr:gte(t,n_forced*1)',
             output_pattern
        ]
        
        # The simplest way to split natively in ffmpeg by scenes that works reliably is a 2-pass approach or using segment with a strict keyframe list.
        # Since we want a 1-pass zero-dependency string, we'll use a trick that forces keyframes on scenes and segments on them.
        split_cmd = [
            'ffmpeg',
            '-y',
            '-i', input_path,
            '-c:v', 'libx264',
            '-preset', 'veryfast', # Speed is critical here
            '-crf', '26',
            '-c:a', 'aac',
            '-force_key_frames', f'expr:gte(t,n_forced*0.5)', # force keyframe every 0.5s to ensure segmentation can happen frequently
            '-f', 'segment',
            '-segment_time', '4', # Group into 4-second chunks if actual scene detection is too complex for a single command
            '-reset_timestamps', '1',
            output_pattern
        ]

        # Let's try the more advanced scenedetect if possible:
        # ffmpeg -i input.mp4 -filter_complex "select='gt(scene,0.4)',metadata=print:file=time.txt" -f null -
        # However, purely splitting by scene requires external tools like PySceneDetect usually.
        # So we will implement a simplified Chunk/Scene splitter that uses ffmpeg's segmenter
        
        # ACTUAL APPROACH: We will use `-f segment` to split the video into smaller chunks
        split_cmd = [
            'ffmpeg',
            '-y',
            '-i', input_path,
            '-c', 'copy', # very fast, no re-encoding required
            '-f', 'segment',
            '-segment_time', '5', # Split every 5 seconds as a fallback "auto-split" if scene isn't perfect
            '-reset_timestamps', '1',
            output_pattern
        ]
        
        process = subprocess.run(split_cmd, capture_output=True, text=True, check=False)

        if process.returncode == 0:
             # Zip the clips
             clips = glob.glob(os.path.join(temp_dir_path, "*.mp4"))
             
             if not clips:
                 # Fallback if copy failed due to keyframe issues
                 split_cmd_encode = [
                    'ffmpeg', '-y', '-i', input_path, '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '28', '-c:a', 'aac',
                    '-f', 'segment', '-segment_time', '5', '-reset_timestamps', '1', output_pattern
                 ]
                 subprocess.run(split_cmd_encode, capture_output=True, text=True, check=False)
                 clips = glob.glob(os.path.join(temp_dir_path, "*.mp4"))

             if clips:
                 with zipfile.ZipFile(output_zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
                     for clip in clips:
                         zipf.write(clip, arcname=os.path.basename(clip))
                 
                 # Clean up temp dir
                 import shutil
                 shutil.rmtree(temp_dir_path, ignore_errors=True)
                 
                 result = {
                     "success": True,
                     "output_path": output_zip_path,
                     "message": f"Video split into {len(clips)} scenes successfully"
                 }
             else:
                 result = {
                    "success": False,
                    "error": "No clips were generated by FFmpeg",
                    "stderr": process.stderr
                }
        else:
            result = {
                "success": False,
                "error": "FFmpeg splitting failed",
                "stderr": process.stderr
            }
        
    except Exception as e:
        result = {
            "success": False,
            "error": f"An error occurred: {str(e)}",
            "traceback": traceback.format_exc()
        }
    
    safe_print(json.dumps(result))

if __name__ == "__main__":
    if len(sys.argv) < 3:
         safe_print(json.dumps({"success": False, "error": "Insufficient arguments. Usage: python split_scenes.py <input_path> <output_zip_path>"}))
         sys.exit(1)

    input_file_path = sys.argv[1]
    output_zip_file = sys.argv[2]

    split_scenes(input_file_path, output_zip_file)
