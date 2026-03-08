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

def reduce_noise(input_path, output_path, noise_type):
    try:
        if not os.path.exists(input_path):
            safe_print(json.dumps({"success": False, "error": f"Input file not found: {input_path}"}))
            return

        os.makedirs(os.path.dirname(output_path), exist_ok=True)

        # Base ffmpeg command
        command = [
            'ffmpeg',
            '-y',
            '-i', input_path
        ]
        
        # Apply filters based on noise_type
        if noise_type == 'audio':
            command.extend(['-af', 'afftdn', '-c:v', 'copy'])
        elif noise_type == 'video':
            command.extend(['-vf', 'hqdn3d', '-c:a', 'copy'])
        elif noise_type == 'both':
            command.extend(['-vf', 'hqdn3d', '-af', 'afftdn'])
        else:
            safe_print(json.dumps({"success": False, "error": f"Invalid noise_type: {noise_type}"}))
            return

        command.extend([
            '-preset', 'fast',
            '-crf', '26',
            output_path
        ])

        process = subprocess.run(command, capture_output=True, text=True, check=False)

        if process.returncode == 0:
             result = {
                 "success": True,
                 "output_path": output_path,
                 "message": "Noise reduced successfully"
             }
        else:
            result = {
                "success": False,
                "error": "FFmpeg noise reduction failed",
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
    if len(sys.argv) < 4:
         safe_print(json.dumps({"success": False, "error": "Insufficient arguments. Usage: python reduce_noise.py <input_path> <output_path> <noise_type>"}))
         sys.exit(1)

    input_file_path = sys.argv[1]
    output_file_path = sys.argv[2]
    type_of_noise = sys.argv[3] # audio, video, both

    reduce_noise(input_file_path, output_file_path, type_of_noise)
