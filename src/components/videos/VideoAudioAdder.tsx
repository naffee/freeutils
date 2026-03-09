import { useState, useRef, useEffect } from 'react';
import { Dropzone } from '../shared/Dropzone.tsx';
import { NextStepSuggestions } from '../shared/NextStepSuggestions.tsx';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import { FileAudio, Loader2, Download, RotateCcw, MonitorPlay } from 'lucide-react';

export function VideoAudioAdder() {
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [audioFile, setAudioFile] = useState<File | null>(null);

    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);

    // Determines how long the final output is based on inputs.
    // 'shortest' = stop when the shortest stream ends.
    // 'longest' = stop when the longest stream ends (fills with silence or frozen frame).
    const [durationMode, setDurationMode] = useState<'shortest' | 'longest'>('shortest');

    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [outputUrl, setOutputUrl] = useState<string | null>(null);

    const ffmpegRef = useRef(new FFmpeg());

    useEffect(() => {
        const loadFFmpeg = async () => {
            const ffmpeg = ffmpegRef.current;
            if (!ffmpeg.loaded) {
                ffmpeg.on('log', ({ message }) => {
                    console.log(message);
                });
                ffmpeg.on('progress', ({ progress }) => {
                    const percent = Math.min(Math.round(progress * 100), 100);
                    setProgress(percent);
                });
                try {
                    await ffmpeg.load({
                        coreURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.js',
                        wasmURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.wasm',
                    });
                } catch (e) {
                    console.error("Failed to load ffmpeg:", e);
                }
            }
        };
        loadFFmpeg();
    }, []);

    const handleVideoSelect = (file: File) => {
        setVideoFile(file);
        setVideoUrl(URL.createObjectURL(file));
        setOutputUrl(null);
    };

    const handleAudioSelect = (file: File) => {
        setAudioFile(file);
        setAudioUrl(URL.createObjectURL(file));
        setOutputUrl(null);
    };

    const handleProcess = async () => {
        if (!videoFile || !audioFile || !ffmpegRef.current.loaded) return;

        setIsProcessing(true);
        setProgress(0);
        setOutputUrl(null);

        const ffmpeg = ffmpegRef.current;
        const videoInputExt = videoFile.name.split('.').pop()?.toLowerCase() || 'mp4';
        const audioInputExt = audioFile.name.split('.').pop()?.toLowerCase() || 'mp3';

        const videoInputName = `vid_in.${videoInputExt}`;
        const audioInputName = `aud_in.${audioInputExt}`;
        const outputName = `replaced_audio.${videoInputExt}`; // Use video's native format

        try {
            await ffmpeg.writeFile(videoInputName, await fetchFile(videoFile));
            await ffmpeg.writeFile(audioInputName, await fetchFile(audioFile));

            // Strategy: take the video from input 0, take the audio from input 1.
            // Copy both streams directly if possible, or attempt to transcode audio safely.
            // We use -map to explicitly grab the right streams.

            const args = [
                '-i', videoInputName,
                '-i', audioInputName,
                '-map', '0:v:0', // Explicitly take the first video stream from the video file
                '-map', '1:a:0', // Explicitly take the first audio stream from the audio file
                '-c:v', 'copy', // Don't re-encode the video (instant)
            ];

            // If it's an MP4, the safest general audio format is AAC. If we just blindly copied
            // an MP3 into an MP4 container, it sometimes causes playback issues on iOS/Mac.
            // So we re-encode the audio to standard AAC. Audio encoding is very fast.
            if (videoInputExt === 'mp4' || videoInputExt === 'mov') {
                args.push('-c:a', 'aac');
            } else {
                args.push('-c:a', 'copy');
            }

            if (durationMode === 'shortest') {
                args.push('-shortest'); // Caps everything to the shortest stream length automatically!
            }

            args.push(outputName);

            await ffmpeg.exec(args);

            const outputData = await ffmpeg.readFile(outputName);
            const dataArray = new Uint8Array(outputData as any);

            let mimeType = 'video/mp4';
            if (videoInputExt === 'webm') mimeType = 'video/webm';
            if (videoInputExt === 'avi') mimeType = 'video/x-msvideo';
            if (videoInputExt === 'mov') mimeType = 'video/quicktime';

            const blob = new Blob([dataArray], { type: mimeType });
            const url = URL.createObjectURL(blob);
            setOutputUrl(url);

        } catch (error) {
            console.error("Audio Replacement failed:", error);
            alert("Failed to mix video and audio. See console for details.");
        } finally {
            setIsProcessing(false);
            try {
                await ffmpeg.deleteFile(videoInputName);
                await ffmpeg.deleteFile(audioInputName);
                await ffmpeg.deleteFile(outputName);
            } catch (e) { }
        }
    };

    if (!videoUrl || !audioUrl) {
        return (
            <div className="watermark-remover" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <h3 style={{ margin: 0, textAlign: 'center', color: '#1e293b' }}>Select Media to Mix</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
                    <div style={{ padding: '1.5rem', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                        <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#3b82f6' }}>
                            <MonitorPlay size={20} /> 1. Select Video
                        </h4>
                        {videoUrl ? (
                            <div style={{ background: '#000', borderRadius: '8px', overflow: 'hidden', height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <video src={videoUrl} style={{ maxHeight: '100%', maxWidth: '100%' }} />
                            </div>
                        ) : (
                            <Dropzone onFileSelect={handleVideoSelect} accept="video/*" title="Drop Video File" />
                        )}
                    </div>

                    <div style={{ padding: '1.5rem', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                        <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#8b5cf6' }}>
                            <FileAudio size={20} /> 2. Select Audio Track
                        </h4>
                        {audioUrl ? (
                            <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #cbd5e1', height: '180px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', padding: '1rem' }}>
                                <FileAudio size={40} color="#8b5cf6" />
                                <audio src={audioUrl} controls style={{ width: '100%' }} />
                            </div>
                        ) : (
                            <Dropzone onFileSelect={handleAudioSelect} accept="audio/*" title="Drop Audio File" />
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="watermark-remover">
            <div className="seo-writeup">
                <h2>Add Audio to Video</h2>
                <p>Combine your favorite music or voiceovers with your video clips. Mix audio and video seamlessly online.</p>
            </div>
            <div className="editor-container" style={{ maxWidth: '1000px', margin: '0 auto' }}>
                <div style={{ display: 'flex', gap: '2rem', width: '100%', alignItems: 'stretch' }}>

                    {/* Left Column: Output Viewer */}
                    <div style={{ flex: 1.5, display: 'flex', flexDirection: 'column', background: '#f8fafc', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
                            <video
                                src={outputUrl || videoUrl}
                                controls
                                style={{
                                    maxWidth: '100%',
                                    maxHeight: '500px',
                                    display: 'block'
                                }}
                            />
                        </div>
                        {outputUrl && (
                            <p style={{ textAlign: 'center', marginTop: '1rem', color: '#16a34a', fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                <MonitorPlay size={16} /> Mixed and ready to play!
                            </p>
                        )}
                    </div>

                    {/* Right Column: Settings & Actions */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                        <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <h4 style={{ margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                Mixing Settings
                            </h4>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', lineHeight: 1.5 }}>
                                The video stream will be instantly copied without loss of quality. The new audio track will entirely replace the original one.
                            </p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Length Strategy</label>
                                <select
                                    value={durationMode}
                                    onChange={(e) => setDurationMode(e.target.value as any)}
                                    style={{
                                        padding: '0.65rem',
                                        borderRadius: '8px',
                                        border: '1px solid #cbd5e1',
                                        background: '#f8fafc',
                                        color: '#0f172a',
                                        outline: 'none',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <option value="shortest">Cut exactly to the shortest file</option>
                                    <option value="longest">Keep going until both end</option>
                                </select>
                            </div>

                        </div>

                        {/* Core Actions */}
                        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {outputUrl ? (
                                <><a
                                    href={outputUrl}
                                    download={`mixed_${videoFile?.name || 'video'}`}
                                    className="btn-primary"
                                    style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}
                                >
                                    <Download size={16} /> Save Mixed Video
                                </a>
                                <div style={{ fontSize: '0.8rem', color: '#b91c1c', textAlign: 'center', marginTop: '0.5rem', background: '#fef2f2', padding: '0.5rem', borderRadius: '4px', border: '1px solid #fecaca', lineHeight: 1.4 }}>
                                   ⚠️ <strong>Warning:</strong> Files are not saved on our servers. Please download your work now or it will be lost forever.
                                
                                </div>
                                <NextStepSuggestions 
                                    fileUrl={outputUrl} 
                                    fileName={videoFile?.name || 'processed_file'} 
                                    fileType="video" 
                                /></>
                            ) : (
                                <button className="btn-primary" onClick={handleProcess} disabled={isProcessing} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                                    {isProcessing ? <><Loader2 size={16} className="spin" /> Mixing ({progress}%)...</> : <><FileAudio size={16} /> Mix Tracks</>}
                                </button>
                            )}
                            <button className="btn-secondary" onClick={() => { setVideoUrl(null); setAudioUrl(null); setVideoFile(null); setAudioFile(null); setOutputUrl(null); }} disabled={isProcessing} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                                <RotateCcw size={16} /> Start Over
                            </button>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}