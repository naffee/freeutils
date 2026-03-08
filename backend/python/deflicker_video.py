import sys
import os
import subprocess
import json
import traceback

def safe_print(data):
    try:
        if sys.stdout.encoding:
            sys.stdout.buffer.write(data.encode('utf-8'))
        else:
            print(data)
    except Exception:
        pass

def deflicker_video(input_path, output_path):
    try:
        if not os.path.exists(input_path):
            safe_print(json.dumps({"success": False, "error": f"Input file not found: {input_path}"}))
            return

        os.makedirs(os.path.dirname(output_path), exist_ok=True)

        # FFmpeg command using deflicker filter
        # It analyzes a sliding window of frames (default is slightly small, we'll use size=7) 
        # and smooths out the luminance variation.
        command = [
            'ffmpeg',
            '-y',
            '-i', input_path,
            '-vf', 'deflicker=s=7:m=am', # s=size=7 frames window, m=mode=am (arithmetic mean)
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
                 "message": "Video deflickered successfully"
             }
        else:
            result = {
                "success": False,
                "error": "FFmpeg deflicker failed",
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
         safe_print(json.dumps({"success": False, "error": "Insufficient arguments. Usage: python deflicker_video.py <input_path> <output_path>"}))
         sys.exit(1)

    input_file_path = sys.argv[1]
    output_file_path = sys.argv[2]

    deflicker_video(input_file_path, output_file_path)
