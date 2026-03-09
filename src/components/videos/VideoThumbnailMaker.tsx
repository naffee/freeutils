import React, { useState, useRef, useEffect } from 'react';
import { Dropzone } from '../shared/Dropzone.tsx';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import { Image as ImageIcon, Loader2, Download, RotateCcw } from 'lucide-react';

export function VideoThumbnailMaker() {
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [currentTime, setCurrentTime] = useState<number>(0);
    const [duration, setDuration] = useState<number>(0);

    const [isExtracting, setIsExtracting] = useState(false);
    const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);

    const videoRef = useRef<HTMLVideoElement>(null);
    const ffmpegRef = useRef(new FFmpeg());

    useEffect(() => {
        const loadFFmpeg = async () => {
            const ffmpeg = ffmpegRef.current;
            if (!ffmpeg.loaded) {
                ffmpeg.on('log', ({ message }) => {
                    console.log(message);
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
        setThumbnailUrl(null);
        setCurrentTime(0);
        setDuration(0);
    };

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            setCurrentTime(videoRef.current.currentTime);
        }
    };

    const handleLoadedMetadata = () => {
        if (videoRef.current) {
            setDuration(videoRef.current.duration);
        }
    };

    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newTime = parseFloat(e.target.value);
        if (videoRef.current) {
            videoRef.current.currentTime = newTime;
            setCurrentTime(newTime);
        }
    };

    const formatTime = (timeInSeconds: number) => {
        const d = new Date(timeInSeconds * 1000);
        const m = d.getUTCMinutes().toString().padStart(2, '0');
        const s = d.getUTCSeconds().toString().padStart(2, '0');
        const ms = d.getUTCMilliseconds().toString().padStart(3, '0');
        return `${m}:${s}.${ms}`;
    };

    const handleExtractThumbnail = async () => {
        if (!videoFile || !ffmpegRef.current.loaded) return;

        setIsExtracting(true);
        setThumbnailUrl(null);

        const ffmpeg = ffmpegRef.current;
        const inputName = `input.${videoFile.name.split('.').pop()}`;
        const outputName = `thumbnail.png`; // Force High Quality PNG

        try {
            await ffmpeg.writeFile(inputName, await fetchFile(videoFile));

            // FFMPEG command to extract a single high-quality frame at exact timestamp
            await ffmpeg.exec([
                '-ss', currentTime.toString(),
                '-i', inputName,
                '-vframes', '1',
                '-q:v', '2', // High quality flag
                outputName
            ]);

            const outputData = await ffmpeg.readFile(outputName);
            const dataArray = new Uint8Array(outputData as any);
            const blob = new Blob([dataArray], { type: 'image/png' });

            const url = URL.createObjectURL(blob);
            setThumbnailUrl(url);

        } catch (error) {
            console.error("Extraction failed:", error);
            alert("Failed to extract thumbnail.");
        } finally {
            setIsExtracting(false);
            try {
                await ffmpeg.deleteFile(inputName);
                await ffmpeg.deleteFile(outputName);
            } catch (e) { }
        }
    };

    if (!videoUrl) {
        return (
            <div className="watermark-remover">
            <div className="seo-writeup">
                <h2>Video Thumbnail Extractor</h2>
                <p>Capture the perfect thumbnail or poster frame from your video. Generate engaging cover images effortlessly.</p>
            </div>
                <Dropzone onFileSelect={handleFileSelect} accept="video/*" title="Drop a video to Extract Thumbnail" />
            </div>
        );
    }

    return (
        <div className="watermark-remover">
            <div className="seo-writeup">
                <h2>Video Thumbnail Extractor</h2>
                <p>Capture the perfect thumbnail or poster frame from your video. Generate engaging cover images effortlessly.</p>
            </div>
            <div className="editor-container" style={{ maxWidth: '1000px', margin: '0 auto' }}>
                <div style={{ display: 'flex', gap: '2rem', width: '100%', alignItems: 'stretch' }}>

                    {/* Left Column: Player & Extractor Timeline */}
                    <div style={{ flex: 1.5, display: 'flex', flexDirection: 'column', background: '#f8fafc', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>

                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', position: 'relative' }}>
                            <video
                                ref={videoRef}
                                src={videoUrl}
                                onTimeUpdate={handleTimeUpdate}
                                onLoadedMetadata={handleLoadedMetadata}
                                controls
                                style={{
                                    maxWidth: '100%',
                                    maxHeight: '500px',
                                    display: 'block'
                                }}
                            />
                        </div>

                        {/* Interactive Timeline Controls */}
                        <div style={{ marginTop: '1.5rem', background: '#fff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>
                                <span>Seek Frame</span>
                                <span style={{ fontFamily: 'monospace', color: '#3b82f6' }}>{formatTime(currentTime)}</span>
                            </div>

                            <input
                                type="range"
                                min={0}
                                max={duration || 100}
                                step={0.01}
                                value={currentTime}
                                onChange={handleSliderChange}
                                style={{
                                    width: '100%',
                                    accentColor: '#3b82f6',
                                    cursor: 'pointer'
                                }}
                            />
                        </div>

                    </div>

                    {/* Right Column: Settings & Download */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                        <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <h4 style={{ margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                Thumbnail Result
                            </h4>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
                                Drag the timeline to perfectly isolate the frame you want to extract as a crispy High-Res PNG.
                            </p>

                            {thumbnailUrl ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', background: '#f1f5f9', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                    <div style={{ width: '100%', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', background: '#fff', border: '1px solid #cbd5e1' }}>
                                        <img src={thumbnailUrl} alt="Thumbnail Extract" style={{ width: '100%', height: 'auto', display: 'block' }} />
                                    </div>

                                    <a
                                        href={thumbnailUrl}
                                        download={`thumbnail_${formatTime(currentTime).replace(/[:.]/g, '-')}.png`}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '0.5rem',
                                            background: '#2563eb',
                                            color: '#fff',
                                            textDecoration: 'none',
                                            padding: '0.75rem 1rem',
                                            borderRadius: '8px',
                                            fontWeight: 600,
                                            fontSize: '0.9rem',
                                            width: '100%',
                                            transition: 'background 0.2s',
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = '#1d4ed8'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = '#2563eb'}
                                    >
                                        <Download size={18} /> Download High-Res PNG
                                    </a>
                                </div>
                            ) : (
                                <div style={{ flex: 1, minHeight: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', border: '2px dashed #cbd5e1', borderRadius: '12px', color: '#94a3b8' }}>
                                    {isExtracting ? <Loader2 size={24} className="spin" /> : <span>No thumbnail extracted yet</span>}
                                </div>
                            )}
                        </div>

                        {/* Core Actions */}
                        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <button className="btn-secondary" onClick={() => { setVideoUrl(null); setVideoFile(null); setThumbnailUrl(null); }} disabled={isExtracting} style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                                <RotateCcw size={16} /> Start Over
                            </button>
                            <button
                                className="btn-primary"
                                onClick={handleExtractThumbnail}
                                disabled={isExtracting}
                                style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
                            >
                                {isExtracting ? <><Loader2 size={16} className="spin" /> Extracting High-Res...</> : <><ImageIcon size={16} /> Capture Exact Frame</>}
                            </button>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}