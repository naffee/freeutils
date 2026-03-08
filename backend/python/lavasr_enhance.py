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

def enhance_speech(input_path, output_path):
    temp_wav_path = None
    enhanced_wav_path = None
    try:
        if not os.path.exists(input_path):
            safe_print(json.dumps({"success": False, "error": f"Input file not found: {input_path}"}))
            return

        os.makedirs(os.path.dirname(output_path), exist_ok=True)

        # We need a temporary 16kHz wav file for LavaSR
        base_name = os.path.splitext(os.path.basename(input_path))[0]
        temp_wav_path = os.path.join(os.path.dirname(output_path), f"temp_{base_name}_16k.wav")
        enhanced_wav_path = os.path.join(os.path.dirname(output_path), f"temp_{base_name}_enhanced.wav")

        # 1. Extract audio to 16kHz WAV
        extract_cmd = [
            'ffmpeg', '-y', '-i', input_path,
            '-ar', '16000', '-ac', '1', '-c:a', 'pcm_s16le',
            temp_wav_path
        ]
        subprocess.run(extract_cmd, capture_output=True, check=True)

        # 2. Process with LavaSR
        # We import here so that if the script is just executed to check syntax, it doesn't crash if uninstalled
        from LavaSR.model import LavaEnhance2
        import soundfile as sf
        import torch
        
        # Use CUDA if available, else CPU (mps is for Apple Silicon)
        device = 'cuda' if torch.cuda.is_available() else 'cpu'
        
        lava_model = LavaEnhance2("YatharthS/LavaSR", device)
        
        # Load audio using their built-in method
        # batch=True is safer for longer files to prevent memory OOM
        input_audio, input_sr = lava_model.load_audio(temp_wav_path, input_sr=16000)
        
        # Enhance audio (denoise=True helps with background noise removal)
        # Note: the example code says .squeeze() but typically outputs to 48kHz
        output_audio = lava_model.enhance(input_audio, denoise=True, batch=True).cpu().numpy().squeeze()
        
        # Save enhanced audio to 48kHz (LavaSR upsamples to 48k)
        sf.write(enhanced_wav_path, output_audio, 48000)

        # 3. Stitch back or encode directly
        # If output is mp4, stitch it with the original video
        # If output is mp3/wav, just convert the enhanced wav to that format
        ext = os.path.splitext(output_path)[1].lower()
        if ext in ['.mp4', '.mov', '.mkv', '.avi']:
            # Replace original audio with enhanced audio
            merge_cmd = [
                'ffmpeg', '-y',
                '-i', input_path,
                '-i', enhanced_wav_path,
                '-c:v', 'copy',
                '-c:a', 'aac', '-b:a', '192k',
                '-map', '0:v:0?', # Keep video from first input if it exists
                '-map', '1:a:0',  # Use audio from second input
                '-shortest',      # Drop any extra audio tail if video is shorter
                output_path
            ]
            subprocess.run(merge_cmd, capture_output=True, check=True)
        else:
            # Just convert the audio to the requested format (e.g. mp3)
            convert_cmd = [
                'ffmpeg', '-y',
                '-i', enhanced_wav_path,
                '-c:a', 'libmp3lame' if ext == '.mp3' else 'copy',
                '-q:a', '2',
                output_path
            ]
            subprocess.run(convert_cmd, capture_output=True, check=True)

        result = {
            "success": True,
            "output_path": output_path,
            "message": "AI Speech Enhanced successfully"
        }
        
    except Exception as e:
        result = {
            "success": False,
            "error": f"An error occurred: {str(e)}",
            "traceback": traceback.format_exc()
        }
    finally:
        # Cleanup temporary WAV files to save space
        for p in [temp_wav_path, enhanced_wav_path]:
            if p and os.path.exists(p):
                try:
                    os.remove(p)
                except:
                    pass
    
    safe_print(json.dumps(result))

if __name__ == "__main__":
    if len(sys.argv) < 3:
         safe_print(json.dumps({"success": False, "error": "Insufficient arguments. Usage: python lavasr_enhance.py <input_path> <output_path>"}))
         sys.exit(1)

    input_file_path = sys.argv[1]
    output_file_path = sys.argv[2]

    enhance_speech(input_file_path, output_file_path)
