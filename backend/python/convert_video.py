import sys
import subprocess
import os
import json

def convert_video(input_path, output_path, target_format, quality):
    try:
        args = ['ffmpeg', '-i', input_path, '-y'] # -y overwrites output file if exists
        
        if target_format == 'mp4':
            args.extend(['-c:v', 'libx264', '-threads', '0'])
            if quality == 'draft':
                args.extend(['-vf', 'scale=-2:480', '-crf', '28', '-preset', 'ultrafast'])
            elif quality == 'balanced':
                args.extend(['-vf', 'scale=-2:720', '-crf', '23', '-preset', 'veryfast'])
            else: # high
                args.extend(['-crf', '18', '-preset', 'medium'])
            args.extend(['-c:a', 'aac', '-b:a', '128k'])
            
        elif target_format == 'webm':
            args.extend(['-c:v', 'libvpx-vp9', '-threads', '8', '-row-mt', '1'])
            if quality == 'draft':
                args.extend(['-vf', 'scale=-2:480', '-crf', '40', '-b:v', '0', '-deadline', 'realtime'])
            elif quality == 'balanced':
                args.extend(['-vf', 'scale=-2:720', '-crf', '30', '-b:v', '0', '-deadline', 'good'])
            else: # high
                args.extend(['-crf', '20', '-b:v', '0', '-deadline', 'best'])
            args.extend(['-c:a', 'libopus', '-b:a', '96k'])
            
        elif target_format == 'gif':
            # Complex filter graph for high quality gif generation
            if quality == 'draft':
                args.extend(['-vf', 'fps=10,scale=320:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse'])
            elif quality == 'balanced':
                args.extend(['-vf', 'fps=15,scale=480:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse'])
            else: # high
                args.extend(['-vf', 'fps=24,scale=720:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse'])
                
        elif target_format == 'avi':
            args.extend(['-c:v', 'mpeg4', '-threads', '0'])
            if quality == 'draft':
                args.extend(['-vf', 'scale=-2:480', '-qscale:v', '6'])
            elif quality == 'balanced':
                args.extend(['-vf', 'scale=-2:720', '-qscale:v', '4'])
            else: # high
                args.extend(['-qscale:v', '2'])
            args.extend(['-c:a', 'libmp3lame', '-b:a', '128k'])
            
        args.append(output_path)
        
        # Execute FFMPEG
        process = subprocess.run(args, capture_output=True, text=True)
        
        if process.returncode != 0:
            print(json.dumps({
                "success": False,
                "error": "FFMPEG logic failed",
                "details": process.stderr
            }))
            sys.exit(1)
            
        print(json.dumps({
            "success": True,
            "output_path": output_path
        }))
        
    except Exception as e:
        print(json.dumps({
            "success": False,
            "error": str(e)
        }))
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) != 5:
        print(json.dumps({
            "success": False,
            "error": "Usage: python convert_video.py <inputFile> <outputFile> <format> <quality>"
        }))
        sys.exit(1)

    input_file = sys.argv[1]
    output_file = sys.argv[2]
    target_format = sys.argv[3]
    quality = sys.argv[4]

    convert_video(input_file, output_file, target_format, quality)
