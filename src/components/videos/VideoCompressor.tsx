import { useState, useRef, useEffect } from 'react';
import { Download, Film } from 'lucide-react';
import { Dropzone } from '../shared/Dropzone.tsx';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

export function VideoCompressor() {
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progressMsg, setProgressMsg] = useState('');
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState<{ url: string; sizeMb: number } | null>(null);

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

    const handleFileSelect = (file: File) => {
        setVideoFile(file);
        setResult(null);
        setProgress(0);
    };

    const handleCompress = async () => {
        if (!videoFile) return;

        setIsProcessing(true);
        setProgress(0);
        setProgressMsg('Initializing FFmpeg...');

        try {
            const ffmpeg = ffmpegRef.current;
            if (!ffmpeg.loaded) {
                setProgressMsg('Loading FFmpeg libraries...');
                await ffmpeg.load({
                    coreURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.js',
                    wasmURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.wasm',
                });
            }

            setProgressMsg('Writing file to memory...');
            const extension = videoFile.name.split('.').pop() || 'mp4';
            const inputName = `input_${Date.now()}.${extension}`;
            const outputName = `compressed_${Date.now()}.mp4`;

            await ffmpeg.writeFile(inputName, await fetchFile(videoFile));

            setProgressMsg('Compressing video (this may take a moment)...');

            await ffmpeg.exec([
                '-i', inputName,
                '-vcodec', 'libx264',
                '-crf', '28',
                '-preset', 'veryfast',
                '-acodec', 'aac',
                '-b:a', '128k',
                '-movflags', '+faststart',
                outputName
            ]);

            setProgressMsg('Reading compressed video...');
            const outputData = await ffmpeg.readFile(outputName);
            const dataArray = new Uint8Array(outputData as any);
            const blob = new Blob([dataArray], { type: 'video/mp4' });

            const url = URL.createObjectURL(blob);
            const approxSizeMb = blob.size / (1024 * 1024);

            setResult({
                url,
                sizeMb: Number(approxSizeMb.toFixed(2))
            });

            // clean up
            try {
                await ffmpeg.deleteFile(inputName);
                await ffmpeg.deleteFile(outputName);
            } catch (cleanupErr) {
                console.error("Cleanup error:", cleanupErr);
            }

        } catch (e: any) {
            console.error(e);
            alert(`Compression Error: ${e.message}`);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="video-processor">
            <div className="seo-writeup">
                <h2>Compress Video Online</h2>
                <p>Reduce your video file size without losing quality. Our free video compressor makes sharing and uploading faster.</p>
            </div>
            {!videoFile ? (
                <Dropzone onFileSelect={handleFileSelect} title="Drag & Drop video to compress" />
            ) : (
                <div className="processing-container">
                    {!isProcessing && !result ? (
                        <div className="tool-stack">
                            <div className="tool-topbar">
                                <div className="tool-topbar-left">
                                    <span className="tool-icon-badge">
                                        <Film size={20} />
                                    </span>
                                    <h3>Ready to Compress</h3>
                                </div>
                            </div>

                            <div className="tool-file-summary">
                                <div className="tool-file-summary-row">
                                    <span>File</span>
                                    <strong>{videoFile.name}</strong>
                                </div>
                                <div className="tool-file-summary-row">
                                    <span>Original size</span>
                                    <strong>{(videoFile.size / (1024 * 1024)).toFixed(2)} MB</strong>
                                </div>
                            </div>

                            <div className="actions">
                                <button className="btn-primary" onClick={handleCompress}>
                                    <Film size={18} /> Compress Video
                                </button>
                                <button className="btn-secondary" onClick={() => setVideoFile(null)}>Cancel</button>
                            </div>
                        </div>
                    ) : isProcessing ? (
                        <div className="loading-state">
                            <p>{progressMsg} {progress > 0 ? `(${progress}%)` : ''}</p>
                            <div className="progress-bar">
                                <div className="progress-fill" style={{ width: `${progress || 100}%`, animation: progress === 0 ? 'pulse 1.5s infinite' : 'none' }} />
                            </div>
                        </div>
                    ) : result ? (
                        <div className="result-container">
                            <h3>Compression Complete</h3>
                            <div className="tool-file-summary" style={{ width: '100%', maxWidth: '520px', marginBottom: '1rem' }}>
                                <div className="tool-file-summary-row">
                                    <span>Original size</span>
                                    <strong>{(videoFile.size / (1024 * 1024)).toFixed(2)} MB</strong>
                                </div>
                                <div className="tool-file-summary-row">
                                    <span>Compressed size</span>
                                    <strong className="tool-success-text">{result.sizeMb} MB</strong>
                                </div>
                            </div>
                            <div className="actions">
                                <a href={result.url} download={`compressed_${videoFile.name}`} className="btn-primary" style={{ textDecoration: 'none' }}>
                                    <Download size={18} /> Save Video
                                </a>
                                <button className="btn-secondary" onClick={() => { setResult(null); setVideoFile(null); }}>
                                    Compress Another
                                </button>
                            </div>
                        </div>
                    ) : null}
                </div>
            )}

            <style>{`
                @keyframes pulse {
                    0% { opacity: 0.6; }
                    50% { opacity: 1; }
                    100% { opacity: 0.6; }
                }
            `}</style>
        </div>
    );
}
