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

def interpolate_video(input_path, output_path, target_fps='60'):
    try:
        if not os.path.exists(input_path):
            safe_print(json.dumps({"success": False, "error": f"Input file not found: {input_path}"}))
            return

        os.makedirs(os.path.dirname(output_path), exist_ok=True)

        # minterpolate filter doubles the framerate using motion interpolation
        # mi_mode=mci is motion compensated interpolation (the AI-like smooth effect)
        # mc_mode=aobmc is overlapped block motion compensation
        command = [
            'ffmpeg',
            '-y',
            '-i', input_path,
            '-filter:v', f'minterpolate=fps={target_fps}:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1',
            '-c:a', 'copy',
            '-preset', 'fast',
            '-crf', '26',
            output_path
        ]

        process = subprocess.run(command, capture_output=True, text=True, check=False)

        if process.returncode == 0:
             result = {
                 "success": True,
                 "output_path": output_path,
                 "message": "Video interpolated successfully"
             }
        else:
            result = {
                "success": False,
                "error": "FFmpeg interpolation failed",
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
         safe_print(json.dumps({"success": False, "error": "Insufficient arguments. Usage: python interpolate_video.py <input_path> <output_path> [target_fps]"}))
         sys.exit(1)

    input_file_path = sys.argv[1]
    output_file_path = sys.argv[2]
    
    tgt_fps = '60'
    if len(sys.argv) >= 4:
         tgt_fps = sys.argv[3]

    interpolate_video(input_file_path, output_file_path, tgt_fps)
