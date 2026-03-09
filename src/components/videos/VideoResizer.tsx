import React, { useState, useRef, useEffect } from 'react';
import { Dropzone } from '../shared/Dropzone.tsx';
import { NextStepSuggestions } from '../shared/NextStepSuggestions.tsx';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import { Download, Loader2, Maximize, RotateCcw } from 'lucide-react';

export function VideoResizer() {
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);

    // Original dimensions dynamically pulled from uploaded video metadata
    const [originalSize, setOriginalSize] = useState({ w: 0, h: 0 });
    // User-controlled target dimensions
    const [targetSize, setTargetSize] = useState({ w: 0, h: 0 });
    const [maintainAspect, setMaintainAspect] = useState(false);

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

                // Use the official progress event instead of parsing string logs
                ffmpeg.on('progress', ({ progress }) => {
                    // progress is a ratio from 0 to 1
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
    };

    const handleLoadedMetadata = () => {
        if (videoRef.current) {
            const w = videoRef.current.videoWidth;
            const h = videoRef.current.videoHeight;
            setOriginalSize({ w, h });
            setTargetSize({ w, h });
        }
    };

    const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        const newW = val === '' ? 0 : parseInt(val, 10);

        if (maintainAspect && originalSize.w > 0 && newW > 0) {
            const aspect = originalSize.h / originalSize.w;
            // FFmpeg requires even dimensions for H.264
            let newH = Math.round(newW * aspect);
            if (newH % 2 !== 0) newH++;
            setTargetSize({ w: newW, h: newH });
        } else {
            setTargetSize({ ...targetSize, w: newW });
        }
    };

    const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        const newH = val === '' ? 0 : parseInt(val, 10);

        if (maintainAspect && originalSize.h > 0 && newH > 0) {
            const aspect = originalSize.w / originalSize.h;
            // FFmpeg requires even dimensions for H.264
            let newW = Math.round(newH * aspect);
            if (newW % 2 !== 0) newW++;
            setTargetSize({ w: newW, h: newH });
        } else {
            setTargetSize({ ...targetSize, h: newH });
        }
    };

    const handleProcess = async () => {
        if (!videoFile) return;
        if (!ffmpegRef.current.loaded) {
            alert("FFMPEG is still loading. Please wait a moment and try again.");
            return;
        }

        // Final sanity check for H.264 even dimensions requirement
        let finalW = targetSize.w;
        let finalH = targetSize.h;
        if (finalW % 2 !== 0) finalW++;
        if (finalH % 2 !== 0) finalH++;

        if (finalW <= 0 || finalH <= 0) {
            alert("Dimensions must be greater than 0.");
            return;
        }

        setIsProcessing(true);
        setProgress(0);
        setOutputUrl(null);

        const ffmpeg = ffmpegRef.current;
        const inputName = `input_video.mp4`;
        const outputName = `output_video.mp4`;

        try {
            await ffmpeg.writeFile(inputName, await fetchFile(videoFile));

            // Execute resize command
            await ffmpeg.exec([
                '-i', inputName,
                '-vf', `scale=${finalW}:${finalH}`,
                '-c:v', 'libx264', // Ensure H.264
                '-crf', '18', // Very high quality (0 is lossless, 23 is default, 51 is worst)
                '-preset', 'veryfast', // Fast encoding speed
                '-c:a', 'copy', // Don't re-encode audio, just copy it to save time
                outputName
            ]);

            setProgress(100);

            // Read output
            const outputData = await ffmpeg.readFile(outputName);
            const dataArray = new Uint8Array(outputData as any);
            const blob = new Blob([dataArray], { type: videoFile.type });
            const url = URL.createObjectURL(blob);
            setOutputUrl(url);

        } catch (error) {
            console.error("Resizing failed:", error);
            alert("Failed to resize video. See console for details.");
        } finally {
            setIsProcessing(false);
            // Cleanup
            try {
                await ffmpeg.deleteFile(inputName);
                await ffmpeg.deleteFile(outputName);
            } catch (e) {
                // Ignore cleanup errors
            }
        }
    };

    if (!videoUrl) {
        return (
            <div className="watermark-remover">
            <div className="seo-writeup">
                <h2>Resize Video</h2>
                <p>Change the resolution and dimensions of your video. Adapt your content perfectly for Instagram, TikTok, or YouTube.</p>
            </div>
                <Dropzone onFileSelect={handleFileSelect} accept="video/*" title="Drop a video to Resize" />
            </div>
        );
    }

    return (
        <div className="watermark-remover">
            <div className="seo-writeup">
                <h2>Resize Video</h2>
                <p>Change the resolution and dimensions of your video. Adapt your content perfectly for Instagram, TikTok, or YouTube.</p>
            </div>
            <div className="editor-container" style={{ maxWidth: '1000px', margin: '0 auto' }}>
                <div style={{ display: 'flex', gap: '2rem', width: '100%', alignItems: 'stretch' }}>

                    {/* Left Column: Video Preview */}
                    <div style={{ flex: 1.5, display: 'flex', flexDirection: 'column', background: '#f8fafc', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>

                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
                            <div style={{ position: 'relative', display: 'inline-block', maxWidth: '100%', maxHeight: '500px', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', background: '#000' }}>
                                <video
                                    ref={videoRef}
                                    src={videoUrl}
                                    controls
                                    onLoadedMetadata={handleLoadedMetadata}
                                    style={{
                                        maxWidth: '100%',
                                        maxHeight: '500px',
                                        display: 'block'
                                    }}
                                />
                            </div>
                        </div>

                    </div>

                    {/* Right Column: Controls */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                        <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <h4 style={{ margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                Target Dimensions
                            </h4>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
                                    <span style={{ color: '#64748b', fontSize: '0.9rem' }}>Original Size</span>
                                    <span style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.9rem' }}>{originalSize.w} x {originalSize.h}px</span>
                                </div>
                            </div>

                            {/* Resize Inputs */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <label style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: '4px' }}>Width (px)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={targetSize.w === 0 ? '' : targetSize.w}
                                        onChange={handleWidthChange}
                                        style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                                    />
                                </div>

                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: '#475569', fontSize: '0.85rem' }}>
                                    <input
                                        type="checkbox"
                                        checked={maintainAspect}
                                        onChange={(e) => setMaintainAspect(e.target.checked)}
                                        style={{ width: '16px', height: '16px', accentColor: '#3b82f6' }}
                                    />
                                    Maintain Aspect Ratio
                                </label>

                                <div>
                                    <label style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: '4px' }}>Height (px)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={targetSize.h === 0 ? '' : targetSize.h}
                                        onChange={handleHeightChange}
                                        style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Action List */}
                        {isProcessing && (
                            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '1rem', borderRadius: '8px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem', color: '#166534', fontWeight: 600 }}>
                                    <span>Resizing...</span>
                                    <span>{progress}%</span>
                                </div>
                                <div style={{ width: '100%', background: '#dcfce7', borderRadius: '4px', overflow: 'hidden', height: '6px' }}>
                                    <div style={{ width: `${progress} % `, background: '#22c55e', height: '100%', transition: 'width 0.1s' }} />
                                </div>
                            </div>
                        )}

                        {outputUrl && (
                            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '1.25rem', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'center', textAlign: 'center' }}>
                                <div style={{ color: '#1d4ed8', fontWeight: 600, fontSize: '0.95rem' }}>Resizing Complete!</div>

                                <div style={{ width: '100%', borderRadius: '6px', overflow: 'hidden', background: '#000', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                                    <video
                                        src={outputUrl}
                                        controls
                                        style={{ width: '100%', display: 'block' }}
                                    />
                                </div>

                                <><a
                                    href={outputUrl}
                                    download={`resized_${videoFile?.name}`}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        background: '#2563eb',
                                        color: 'white',
                                        textDecoration: 'none',
                                        padding: '0.5rem 1rem',
                                        borderRadius: '6px',
                                        fontWeight: 600,
                                        fontSize: '0.9rem',
                                        marginTop: '0.5rem'
                                    }}
                                >
                                    <Download size={16} /> Download Result
                                </a>
                                <div style={{ fontSize: '0.8rem', color: '#b91c1c', textAlign: 'center', marginTop: '0.5rem', background: '#fef2f2', padding: '0.5rem', borderRadius: '4px', border: '1px solid #fecaca', lineHeight: 1.4 }}>
                                   ⚠️ <strong>Warning:</strong> Files are not saved on our servers. Please download your work now or it will be lost forever.
                                
                                </div>
                                <NextStepSuggestions 
                                    fileUrl={outputUrl} 
                                    fileName={videoFile?.name || 'processed_file'} 
                                    fileType="video" 
                                /></>
                            </div>
                        )}

                        {/* Core Actions */}
                        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <button className="btn-secondary" onClick={() => { setVideoUrl(null); setVideoFile(null); setOutputUrl(null); }} disabled={isProcessing} style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                                <RotateCcw size={16} /> Start Over
                            </button>
                            <button
                                className="btn-primary"
                                onClick={handleProcess}
                                disabled={isProcessing || !!outputUrl}
                                style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
                            >
                                {isProcessing ? <><Loader2 size={16} className="spin" /> Processing...</> : <><Maximize size={16} /> Resize Video</>}
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}