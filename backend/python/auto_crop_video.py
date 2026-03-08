import sys
import os
import subprocess
import json
import traceback
import re

def safe_print(data):
    try:
        if sys.stdout.encoding:
            sys.stdout.buffer.write(data.encode('utf-8'))
        else:
            print(data)
    except Exception:
        pass

def auto_crop_video(input_path, output_path):
    try:
        if not os.path.exists(input_path):
            safe_print(json.dumps({"success": False, "error": f"Input file not found: {input_path}"}))
            return

        os.makedirs(os.path.dirname(output_path), exist_ok=True)

        # Step 1: Detect the crop area
        # We run cropdetect on a subset of the video (e.g. first 240 frames) to find the black bars.
        detect_command = [
            'ffmpeg',
            '-i', input_path,
            '-t', '10', # check first 10 seconds
            '-vf', 'cropdetect=24:16:0',
            '-f', 'null',
            '-'
        ]
        
        detect_process = subprocess.run(detect_command, capture_output=True, text=True, check=False)
        crop_value = None
        
        # Parse the stderr for the crop value (e.g., crop=1920:800:0:140)
        # We search backwards to get a stable value
        for line in reversed(detect_process.stderr.split('\n')):
            if 'crop=' in line:
                match = re.search(r'crop=\d+:\d+:\d+:\d+', line)
                if match:
                    crop_value = match.group(0)
                    break
        
        # Step 2: Apply the crop if found
        if not crop_value:
             # Fallback if cropdetect fails or finds no crop needed
             result = {
                 "success": False,
                 "error": "Could not detect black bars to crop. The video might already be perfectly framed.",
                 "stderr": "No crop= found in cropdetect."
             }
             safe_print(json.dumps(result))
             return

        # Found the crop, now apply it
        command = [
            'ffmpeg',
            '-y',
            '-i', input_path,
            '-vf', crop_value,
            '-c:a', 'copy',
            '-c:v', 'libx264',
            '-preset', 'fast',
            '-crf', '26',
            output_path
        ]

        process = subprocess.run(command, capture_output=True, text=True, check=False)

        if process.returncode == 0:
             result = {
                 "success": True,
                 "output_path": output_path,
                 "message": f"Video auto-cropped successfully using {crop_value}"
             }
        else:
            result = {
                "success": False,
                "error": "FFmpeg cropping failed",
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
         safe_print(json.dumps({"success": False, "error": "Insufficient arguments. Usage: python auto_crop_video.py <input_path> <output_path>"}))
         sys.exit(1)

    input_file_path = sys.argv[1]
    output_file_path = sys.argv[2]

    auto_crop_video(input_file_path, output_file_path)
