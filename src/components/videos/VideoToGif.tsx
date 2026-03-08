import { useState, useRef, useEffect } from 'react';
import { Dropzone } from '../shared/Dropzone.tsx';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import { Loader2, Download, RotateCcw, Image as ImageIcon, Settings } from 'lucide-react';

export function VideoToGif() {
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [duration, setDuration] = useState<number>(0);

    const [startTime, setStartTime] = useState<number>(0);
    const [endTime, setEndTime] = useState<number>(5); // Default 5 seconds

    // Quality controls
    const [fps, setFps] = useState<number>(10);
    const [scale, setScale] = useState<number>(480); // Width, height will auto-scale

    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [outputUrl, setOutputUrl] = useState<string | null>(null);

    const videoRef = useRef<HTMLVideoElement>(null);
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
        const url = URL.createObjectURL(file);
        setVideoUrl(url);
        setOutputUrl(null);
        setProgress(0);
        setStartTime(0);
        setEndTime(5);
    };

    const handleLoadedMetadata = () => {
        if (videoRef.current) {
            const d = videoRef.current.duration;
            setDuration(d);
            setEndTime(Math.min(5, d)); // Default to 5s or total length
        }
    };

    const handleTimeChange = (type: 'start' | 'end', val: number) => {
        if (type === 'start') {
            const newStart = Math.min(val, endTime - 0.1);
            setStartTime(Math.max(0, newStart));
            if (videoRef.current) videoRef.current.currentTime = newStart;
        } else {
            const newEnd = Math.max(val, startTime + 0.1);
            setEndTime(Math.min(duration, newEnd));
            if (videoRef.current) videoRef.current.currentTime = newEnd;
        }
    };

    const formatTime = (timeInSeconds: number) => {
        const d = new Date(timeInSeconds * 1000);
        const m = d.getUTCMinutes().toString().padStart(2, '0');
        const s = d.getUTCSeconds().toString().padStart(2, '0');
        const ms = d.getUTCMilliseconds().toString().padStart(3, '0');
        return `${m}:${s}.${ms}`;
    };

    const handleProcess = async () => {
        if (!videoFile || !ffmpegRef.current.loaded) return;

        setIsProcessing(true);
        setProgress(0);
        setOutputUrl(null);

        const ffmpeg = ffmpegRef.current;
        const inputName = `input.${videoFile.name.split('.').pop()}`;
        const outputName = `animated_output.gif`;

        try {
            await ffmpeg.writeFile(inputName, await fetchFile(videoFile));

            // To make a high-quality GIF in FFmpeg, we must generate a custom color palette
            // from the video first, then map the video's colors to that palette.
            // A complex filter graph makes this a single-command operation natively!

            const durationCut = (endTime - startTime).toFixed(3);

            // The filter string:
            // 1. fps=${fps},scale=${scale}:-1:flags=lanczos [x] -> Sets Framerate and scales width (height auto with Lanczos resampling)
            // 2. [x]split[x1][x2] -> Splits the scaled stream into two identical streams
            // 3. [x1]palettegen[p] -> Analyzes the first stream to create an optimized 256-color palette
            // 4. [x2][p]paletteuse -> takes the second stream and the palette, mapping the colors for a flawless GIF
            const filterGraph = `fps=${fps},scale=${scale}:-1:flags=lanczos[x];[x]split[x1][x2];[x1]palettegen[p];[x2][p]paletteuse`;

            await ffmpeg.exec([
                '-ss', startTime.toString(),       // Seek to start
                '-t', durationCut.toString(),      // Duration string
                '-i', inputName,                   // Input file
                '-filter_complex', filterGraph,    // Apply the magic palette generator
                outputName                         // Output format determined by exact filename (.gif)
            ]);

            const outputData = await ffmpeg.readFile(outputName);
            const dataArray = new Uint8Array(outputData as any);
            const blob = new Blob([dataArray], { type: 'image/gif' });

            const url = URL.createObjectURL(blob);
            setOutputUrl(url);

        } catch (error) {
            console.error("GIF generation failed:", error);
            alert("Failed to extract GIF. See console for details.");
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
                <Dropzone onFileSelect={handleFileSelect} accept="video/*" title="Drop a video to Extract GIF" />
            </div>
        );
    }

    return (
        <div className="watermark-remover">
            <div className="editor-container" style={{ maxWidth: '1000px', margin: '0 auto' }}>
                <div style={{ display: 'flex', gap: '2rem', width: '100%', alignItems: 'stretch' }}>

                    {/* Left Column: Player & Extractor Timeline */}
                    <div style={{ flex: 1.5, display: 'flex', flexDirection: 'column', background: '#f8fafc', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>

                        {outputUrl ? (
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', borderRadius: '12px', border: '1px solid #cbd5e1', padding: '1rem' }}>
                                <img src={outputUrl} alt="Exported GIF" style={{ maxWidth: '100%', maxHeight: '400px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                <p style={{ marginTop: '1rem', color: '#16a34a', fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <ImageIcon size={16} /> GIF successfully extracted
                                </p>
                            </div>
                        ) : (
                            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
                                <video
                                    ref={videoRef}
                                    src={videoUrl}
                                    onLoadedMetadata={handleLoadedMetadata}
                                    controls
                                    style={{
                                        maxWidth: '100%',
                                        maxHeight: '400px',
                                        display: 'block'
                                    }}
                                />
                            </div>
                        )}

                        {/* Interactive Timeline Controls (Hide when showing final result) */}
                        {!outputUrl && (
                            <div style={{ marginTop: '1.5rem', background: '#fff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>
                                            <span>Start Time</span>
                                            <span style={{ fontFamily: 'monospace', color: '#3b82f6' }}>{formatTime(startTime)}</span>
                                        </div>
                                        <input
                                            type="range"
                                            min={0}
                                            max={duration || 100}
                                            step={0.01}
                                            value={startTime}
                                            onChange={(e) => handleTimeChange('start', parseFloat(e.target.value))}
                                            style={{ width: '100%', accentColor: '#3b82f6' }}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>
                                            <span>End Time</span>
                                            <span style={{ fontFamily: 'monospace', color: '#8b5cf6' }}>{formatTime(endTime)}</span>
                                        </div>
                                        <input
                                            type="range"
                                            min={0}
                                            max={duration || 100}
                                            step={0.01}
                                            value={endTime}
                                            onChange={(e) => handleTimeChange('end', parseFloat(e.target.value))}
                                            style={{ width: '100%', accentColor: '#8b5cf6' }}
                                        />
                                    </div>
                                </div>
                                <div style={{ textAlign: 'center', fontSize: '0.85rem', color: '#64748b' }}>
                                    GIF Duration: <strong style={{ color: '#0f172a' }}>{(endTime - startTime).toFixed(2)}s</strong>
                                </div>
                            </div>
                        )}

                    </div>

                    {/* Right Column: Settings & Download */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                        <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <h4 style={{ margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Settings size={18} /> Export Optimization
                            </h4>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
                                GIFs get very large very fast. Adjust framerate and width to ensure the file is lightweight but remains smooth.
                            </p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569', display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Frame Rate (FPS)</span>
                                    <span>{fps} fps</span>
                                </label>
                                <input
                                    type="range"
                                    min="5"
                                    max="30"
                                    step="1"
                                    value={fps}
                                    onChange={(e) => setFps(parseInt(e.target.value))}
                                    style={{ width: '100%', accentColor: '#10b981' }}
                                />
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8' }}>
                                    <span>Choppy/Small</span>
                                    <span>Smooth/Large</span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569', display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Resolution Target (Width)</span>
                                    <span>{scale}px</span>
                                </label>
                                <select
                                    value={scale}
                                    onChange={(e) => setScale(parseInt(e.target.value))}
                                    style={{
                                        padding: '0.5rem',
                                        borderRadius: '8px',
                                        border: '1px solid #cbd5e1',
                                        background: '#f8fafc',
                                        color: '#0f172a',
                                        outline: 'none',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <option value={240}>Tiny (240px) - Email/Slack</option>
                                    <option value={320}>Small (320px) - Web Preview</option>
                                    <option value={480}>Medium (480px) - Blog/Socials</option>
                                    <option value={720}>Large (720px) - Heavy/HQ</option>
                                </select>
                            </div>
                        </div>

                        {/* Core Actions */}
                        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {outputUrl ? (
                                <a
                                    href={outputUrl}
                                    download={`animated_${videoFile?.name || 'video'}.gif`}
                                    className="btn-primary"
                                    style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}
                                >
                                    <Download size={16} /> Save High-Quality GIF
                                </a>
                            ) : (
                                <button
                                    className="btn-primary"
                                    onClick={handleProcess}
                                    disabled={isProcessing || (endTime - startTime <= 0)}
                                    style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
                                >
                                    {isProcessing ? <><Loader2 size={16} className="spin" /> Generating ({progress}%)...</> : <><ImageIcon size={16} /> Generate GIF</>}
                                </button>
                            )}
                            <button className="btn-secondary" onClick={() => { setVideoUrl(null); setVideoFile(null); setOutputUrl(null); }} disabled={isProcessing} style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                                <RotateCcw size={16} /> Start Over
                            </button>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
