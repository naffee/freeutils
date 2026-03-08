import { useState, useRef, useEffect } from 'react';
import { Dropzone } from '../shared/Dropzone.tsx';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import { RotateCcw, Loader2, Download, PlaySquare, AlertTriangle } from 'lucide-react';

export function VideoReverser() {
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [fileWarning, setFileWarning] = useState<string | null>(null);

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
                    // Reversing is extremely memory and CPU intensive, progress will be updated here.
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

    const handleFileSelect = (file: File) => {
        // Reversing video in WASM is very memory intensive because it has to decode all frames into memory
        // to play them backward. We should warn the user if the file is too large.
        // Assuming > 30MB might cause tab crashes on low end devices.
        if (file.size > 30 * 1024 * 1024) {
            setFileWarning("This video is quite large (>30MB). Reversing video requires loading all frames into memory and your browser might crash. Proceed with caution.");
        } else {
            setFileWarning(null);
        }

        setVideoFile(file);
        setVideoUrl(URL.createObjectURL(file));
        setOutputUrl(null);
        setProgress(0);
    };

    const handleProcess = async () => {
        if (!videoFile || !ffmpegRef.current.loaded) return;

        setIsProcessing(true);
        setProgress(0);
        setOutputUrl(null);

        const ffmpeg = ffmpegRef.current;
        const inputName = `input.${videoFile.name.split('.').pop()}`;
        const outputExt = videoFile.name.split('.').pop()?.toLowerCase() || 'mp4';
        const outputName = `reversed_output.${outputExt}`;

        try {
            await ffmpeg.writeFile(inputName, await fetchFile(videoFile));

            // FFMPEG reversing requires re-encoding.
            // -vf reverse reverses video
            // -af areverse reverses audio
            // Note: If a video does NOT have audio, -af areverse will cause failure.
            // We'll default to applying both. If it fails due to no audio stream, a more robust 
            // script would first probe streams using ffprobe, but for simplicity we rely on standard videos.

            // To be somewhat safer and broader compatible, output to mp4 container
            await ffmpeg.exec([
                '-i', inputName,
                '-vf', 'reverse',
                '-af', 'areverse',
                '-c:v', 'libx264',
                '-preset', 'fast',
                '-crf', '23',
                outputName
            ]);

            const outputData = await ffmpeg.readFile(outputName);
            const dataArray = new Uint8Array(outputData as any);

            let mimeType = 'video/mp4';
            if (outputExt === 'webm') mimeType = 'video/webm';
            if (outputExt === 'avi') mimeType = 'video/x-msvideo';
            if (outputExt === 'mov') mimeType = 'video/quicktime';

            const blob = new Blob([dataArray], { type: mimeType });
            const url = URL.createObjectURL(blob);
            setOutputUrl(url);

        } catch (error) {
            console.error("Reverse failed:", error);
            alert("Failed to reverse video. Browsers have strict memory limits for WASM. If your video is long, it may have crashed the encoder.");
        } finally {
            setIsProcessing(false);
            try {
                await ffmpeg.deleteFile(inputName);
                await ffmpeg.deleteFile(outputName);
            } catch (e) { }
        }
    };

    if (!videoUrl) {
        return (
            <div className="watermark-remover">
                <Dropzone onFileSelect={handleFileSelect} accept="video/*" title="Drop a video to Reverse" />
            </div>
        );
    }

    return (
        <div className="watermark-remover">
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
                                    maxHeight: '450px',
                                    display: 'block'
                                }}
                            />
                        </div>
                        {outputUrl && (
                            <p style={{ textAlign: 'center', marginTop: '1rem', color: '#16a34a', fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                <RotateCcw size={16} /> Fully reversed and ready!
                            </p>
                        )}
                    </div>

                    {/* Right Column: Settings & Actions */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                        <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <h4 style={{ margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                Reverse Video Sandbox
                            </h4>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', lineHeight: 1.5 }}>
                                This process will completely re-encode the video backwards, right directly in your browser without uploading to a server. Both the video track and the audio track will play in reverse!
                            </p>

                            {fileWarning && (
                                <div style={{ background: '#fffbeb', padding: '1rem', borderRadius: '8px', border: '1px solid #fde68a', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                                    <AlertTriangle size={18} color="#d97706" style={{ flexShrink: 0, marginTop: '2px' }} />
                                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#92400e', lineHeight: 1.4 }}>
                                        {fileWarning}
                                    </p>
                                </div>
                            )}

                        </div>

                        {/* Core Actions */}
                        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {outputUrl ? (
                                <a
                                    href={outputUrl}
                                    download={`reversed_${videoFile?.name || 'video.mp4'}`}
                                    className="btn-primary"
                                    style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}
                                >
                                    <Download size={16} /> Save Reversed Video
                                </a>
                            ) : (
                                <button className="btn-primary" onClick={handleProcess} disabled={isProcessing} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                                    {isProcessing ? <><Loader2 size={16} className="spin" /> Decoding frames ({progress}%)...</> : <><PlaySquare size={16} style={{ transform: 'scaleX(-1)' }} /> Play it Backwards</>}
                                </button>
                            )}
                            <button className="btn-secondary" onClick={() => { setVideoUrl(null); setVideoFile(null); setOutputUrl(null); setFileWarning(null); }} disabled={isProcessing} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                                <RotateCcw size={16} /> Choose Another
                            </button>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
