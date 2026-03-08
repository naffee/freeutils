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

def isolate_vocals(input_path, output_path, mode='remove'):
    try:
        if not os.path.exists(input_path):
            safe_print(json.dumps({"success": False, "error": f"Input file not found: {input_path}"}))
            return

        os.makedirs(os.path.dirname(output_path), exist_ok=True)

        # Uses the stereotools or pan filter for phase cancellation
        # phase cancellation removes center-panned audio (usually lead vocals)
        # to create a karaoke effect
        
        # Audio filter for removing vocals 
        # (L-R) mixed into both L and R effectively cancels out anything exactly in the center
        karaoke_filter = 'pan=stereo|c0=c0-c1|c1=c0-c1'

        command = [
            'ffmpeg',
            '-y',
            '-i', input_path,
            '-af', karaoke_filter,
            # We must preserve the video track if it's a video file, or just encode audio if it's an audio file
            '-c:v', 'copy', # Copy video stream without re-encoding
            '-c:a', 'aac',
            '-b:a', '192k',
            output_path
        ]

        process = subprocess.run(command, capture_output=True, text=True, check=False)

        if process.returncode == 0:
             result = {
                 "success": True,
                 "output_path": output_path,
                 "message": "Vocals isolated/removed successfully"
             }
        else:
            result = {
                "success": False,
                "error": "FFmpeg vocal isolation failed",
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
         safe_print(json.dumps({"success": False, "error": "Insufficient arguments. Usage: python isolate_vocals.py <input_path> <output_path>"}))
         sys.exit(1)

    input_file_path = sys.argv[1]
    output_file_path = sys.argv[2]
    
    # We always do "remove" for this simple phase cancellation Implementation
    # High-end AI separation is required for actual extraction 
    mode = 'remove' 

    isolate_vocals(input_file_path, output_file_path, mode)
