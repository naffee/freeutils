import sys
import subprocess
import os
import json

def compress_video(input_path, output_path, target_crf=28):
    """
    Compress a video using FFmpeg.
    target_crf: Constant Rate Factor. Lower is better quality/larger file.
                28 is a good baseline for noticeable compression on a VPS.
    """
    if not os.path.exists(input_path):
        print(json.dumps({"error": "Input file not found."}))
        sys.exit(1)

    # ffmpeg command for standard h264 compression, optimized for fast start (web)
    # Using 'preset' fast or veryfast to save CPU time on a VPS
    command = [
        'ffmpeg',
        '-y',                  # Overwrite output
        '-i', input_path,      # Input file
        '-vcodec', 'libx264',  # Video codec
        '-crf', str(target_crf), # Compression level
        '-preset', 'veryfast', # VPS optimization
        '-acodec', 'aac',      # Audio codec
        '-b:a', '128k',        # Audio bitrate
        '-movflags', '+faststart', # Web optimization
        output_path            # Output file
    ]

    try:
        # Run FFmpeg and capture exceptions
        process = subprocess.run(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        if process.returncode != 0:
            print(json.dumps({"error": f"FFmpeg error: {process.stderr}"}))
            sys.exit(1)
        
        # Check if output exists and return success
        if os.path.exists(output_path):
            size_mb = os.path.getsize(output_path) / (1024 * 1024)
            print(json.dumps({
                "success": True, 
                "output_path": output_path,
                "size_mb": round(size_mb, 2)
            }))
            sys.exit(0)
        else:
            print(json.dumps({"error": "Compression finished but output file missing."}))
            sys.exit(1)

    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Usage: python compress.py <input_path> <output_path> [crf]"}))
        sys.exit(1)
        
    in_path = sys.argv[1]
    out_path = sys.argv[2]
    crf = sys.argv[3] if len(sys.argv) > 3 else 28
    
    compress_video(in_path, out_path, crf)
