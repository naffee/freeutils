import sys
import json
import os
import subprocess
from pathlib import Path

# Try to import required ML libraries
try:
    import whisper
    from deep_translator import GoogleTranslator
except ImportError:
    print(json.dumps({
        "success": False,
        "error": "Missing dependencies. Please run: pip install openai-whisper deep-translator",
        "output_path": None
    }))
    sys.exit(1)

def format_timestamp(seconds: float):
    # Format seconds to SRT format: HH:MM:SS,mmm
    hours = int(seconds / 3600)
    minutes = int((seconds % 3600) / 60)
    secs = int(seconds % 60)
    ms = int((seconds - int(seconds)) * 1000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d},{ms:03d}"

def generate_srt(segments, target_lang="en", output_file="output.srt"):
    """
    Translates Whisper text segments and writes an SRT file.
    """
    translator = None
    if target_lang not in ("en", "original"):
        try:
            translator = GoogleTranslator(source='auto', target=target_lang)
        except Exception as e:
            raise Exception(f"Failed to initialize translator for language '{target_lang}': {e}")
        
    with open(output_file, "w", encoding="utf-8") as f:
        for i, segment in enumerate(segments, start=1):
            start_time = format_timestamp(segment['start'])
            end_time = format_timestamp(segment['end'])
            original_text = segment['text'].strip()
            
            # Translate text if we are actually translating
            if translator and original_text:
                try:
                    translated_text = translator.translate(original_text)
                except Exception as e:
                    print(f"Warning: Failed to translate segment '{original_text}': {e}", file=sys.stderr)
                    translated_text = original_text # Fallback to original
            else:
                 translated_text = original_text
                 
            # Write SRT block
            f.write(f"{i}\n")
            f.write(f"{start_time} --> {end_time}\n")
            f.write(f"{translated_text}\n\n")

def main():
    if len(sys.argv) < 6:
        print(json.dumps({
            "success": False,
            "error": "Missing arguments. Usage: python translate_media.py <input_path> <source_lang> <target_lang> <burn_subtitles: true/false> <output_path>",
            "output_path": None
        }))
        sys.exit(1)

    input_path = sys.argv[1]
    source_lang = sys.argv[2]
    target_lang = sys.argv[3] # e.g., 'es' for Spanish, 'fr' for French
    burn_subtitles = sys.argv[4].lower() == 'true'
    output_path = sys.argv[5]

    # Generate temp srt path regardless, we need it to translate
    base_name = os.path.basename(input_path).replace('.', '_')
    srt_path = os.path.join(os.path.dirname(output_path), f"{base_name}_translated.srt")

    try:
        # 1. Load Whisper Model (Base model is fast and ~140MB)
        print("Loading Whisper model (this will auto-download if not present)...", file=sys.stderr)
        model = whisper.load_model("base")

        # 2. Transcribe Audio
        print("Transcribing media...", file=sys.stderr)
        
        # Build transcription arguments
        transcribe_args = {'task': 'translate'}
        if source_lang != 'auto':
            transcribe_args['language'] = source_lang
            
        if target_lang == 'original':
            transcribe_args['task'] = 'transcribe'
            
        result = model.transcribe(input_path, **transcribe_args)
        segments = result["segments"]

        # 3. Translate Segments & Generate SRT
        print(f"Translating to {target_lang}...", file=sys.stderr)
        generate_srt(segments, target_lang=target_lang, output_file=srt_path)

        # 4. Handle Output Request
        if burn_subtitles:
            # Check if input is likely a video based on extension to avoid burning into audio files
            is_video = input_path.lower().endswith(('.mp4', '.mkv', '.avi', '.mov', '.webm'))
            
            if is_video:
                print("Burning subtitles into video...", file=sys.stderr)
                # Need to escape paths for FFmpeg filter graph
                # Convert backslashes to forward slashes, then escape the drive colon
                escaped_srt_path = srt_path.replace("\\", "/").replace(":", "\\:")
                
                # FFmpeg command to burn subtitles
                # Using scale filter to ensure video works well with subtitles, then burning them
                ffmpeg_cmd = [
                    'ffmpeg', '-y',
                    '-i', input_path,
                    '-vf', f"subtitles='{escaped_srt_path}':force_style='Fontsize=24,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BorderStyle=1,Outline=2'",
                    '-c:a', 'copy',
                    output_path
                ]
                subprocess.run(ffmpeg_cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
                
                # Clean up temporary SRT file
                if os.path.exists(srt_path):
                     os.remove(srt_path)
                     
                final_output = output_path
            else:
                 # If user asked to burn subtitles but uploaded an audio file, just return the SRT
                 print("Cannot burn subtitles into an audio file. Returning standalone SRT.", file=sys.stderr)
                 # Ensure proper extension
                 final_output = output_path.rsplit('.', 1)[0] + '.srt'
                 import shutil
                 shutil.move(srt_path, final_output)
        else:
            # Just return the SRT file
            print("Exporting SRT file...", file=sys.stderr)
            # Make sure output path ends in .srt
            final_output = output_path.rsplit('.', 1)[0] + '.srt'
            import shutil
            shutil.move(srt_path, final_output)


        # Output success JSON
        print(json.dumps({
            "success": True,
            "output_path": final_output,
            "message": "Translation completed successfully"
        }))

    except subprocess.CalledProcessError as e:
         print(json.dumps({
            "success": False,
            "error": "FFmpeg processing failed",
            "details": e.stderr.decode('utf-8', errors='ignore') if e.stderr else str(e),
            "output_path": None
        }))
    except Exception as e:
        print(json.dumps({
            "success": False,
            "error": str(e),
            "output_path": None
        }))
    finally:
         # Failsafe cleanup of temp srt if still exists and we errored
         if os.path.exists(srt_path):
             try:
                 os.remove(srt_path)
             except:
                 pass

if __name__ == "__main__":
    main()
