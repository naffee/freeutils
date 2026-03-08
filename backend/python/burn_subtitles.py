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

def burn_subtitles(input_video, input_srt, output_path):
    try:
        # Check if input files exist
        if not os.path.exists(input_video):
            safe_print(json.dumps({"success": False, "error": f"Input video not found: {input_video}"}))
            return
        if not os.path.exists(input_srt):
            safe_print(json.dumps({"success": False, "error": f"Input srt not found: {input_srt}"}))
            return
            
        # Ensure output directory exists
        os.makedirs(os.path.dirname(output_path), exist_ok=True)

        # In ffmpeg, paths in filters need to be thoroughly escaped, especially on windows
        escaped_srt = input_srt.replace('\\', '/').replace(':', '\\:')

        # ffmpeg command
        # Burn subtitles, copy audio, re-encode video fast
        command = [
            'ffmpeg',
            '-y', # Overwrite output if exists
            '-i', input_video,
            '-vf', f"subtitles='{escaped_srt}'",
            '-c:a', 'copy',
            '-c:v', 'libx264',
            '-preset', 'fast',
            '-crf', '28',
            output_path
        ]

        # Use subprocess.run to execute ffmpeg command
        process = subprocess.run(command, capture_output=True, text=True, check=False)

        if process.returncode == 0:
             result = {
                 "success": True,
                 "output_path": output_path,
                 "message": "Subtitles burned successfully"
             }
        else:
            result = {
                "success": False,
                "error": "FFmpeg compression failed",
                "stderr": process.stderr
            }
        
    except Exception as e:
        result = {
            "success": False,
            "error": f"An error occurred: {str(e)}",
            "traceback": traceback.format_exc()
        }
    
    # Print the json result to standard output so node.js can read it
    safe_print(json.dumps(result))

if __name__ == "__main__":
    if len(sys.argv) < 4:
         safe_print(json.dumps({"success": False, "error": "Insufficient arguments. Usage: python burn_subtitles.py <input_video_path> <input_srt_path> <output_path>"}))
         sys.exit(1)

    input_video_path = sys.argv[1]
    input_srt_path = sys.argv[2]
    output_video_path = sys.argv[3]

    burn_subtitles(input_video_path, input_srt_path, output_video_path)
