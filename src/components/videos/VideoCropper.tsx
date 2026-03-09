import React, { useState, useRef, useEffect } from 'react';
import { Dropzone } from '../shared/Dropzone.tsx';
import { NextStepSuggestions } from '../shared/NextStepSuggestions.tsx';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import { Download, Loader2, Crop, RotateCcw } from 'lucide-react';

interface SelectionBox {
    x: number;
    y: number;
    w: number;
    h: number;
}

type HandlePos = 'tl' | 'tr' | 'bl' | 'br' | 't' | 'b' | 'l' | 'r' | 'move' | null;

export function VideoCropper() {
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);

    // Original dimensions dynamically pulled from uploaded video metadata
    const [originalSize, setOriginalSize] = useState({ w: 0, h: 0 });

    const [selection, setSelection] = useState<SelectionBox | null>(null);
    const [activeHandle, setActiveHandle] = useState<HandlePos>(null);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0, boxX: 0, boxY: 0, boxW: 0, boxH: 0 });

    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [outputUrl, setOutputUrl] = useState<string | null>(null);

    const videoRef = useRef<HTMLVideoElement>(null);
    const workspaceRef = useRef<HTMLDivElement>(null);
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
        setSelection(null);
    };

    const handleLoadedMetadata = () => {
        if (videoRef.current) {
            const w = videoRef.current.videoWidth;
            const h = videoRef.current.videoHeight;
            setOriginalSize({ w, h });

            // Initialize selection to cover the full video rendered area
            const rect = videoRef.current.getBoundingClientRect();
            setSelection({ x: 0, y: 0, w: rect.width, h: rect.height });
        }
    };

    // Keep selection box synced to window resizes (since the video element scales via CSS max-width: 100%)
    useEffect(() => {
        const handleResize = () => {
            if (videoRef.current && originalSize.w > 0 && selection) {
                // If it's a new load, we wait for handleLoadedMetadata
                // But during a window resize, we need to adapt the selection proportionally.
                // Note: For simplicity, a complex resize listener could be implemented,
                // but re-selecting handles edge cases better.
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [originalSize, selection]);

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>, handle: HandlePos) => {
        if (!videoRef.current || !workspaceRef.current || !selection) return;
        e.preventDefault(); // prevent text selection

        const rect = videoRef.current.getBoundingClientRect();
        const startX = e.clientX - rect.left;
        const startY = e.clientY - rect.top;

        setActiveHandle(handle);
        setDragStart({ x: startX, y: startY, boxX: selection.x, boxY: selection.y, boxW: selection.w, boxH: selection.h });
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!activeHandle || !videoRef.current || !selection || !workspaceRef.current) return;

        const rect = videoRef.current.getBoundingClientRect();
        // Constrain mouse coordinates to video bounds
        const currentX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
        const currentY = Math.max(0, Math.min(e.clientY - rect.top, rect.height));

        const dx = currentX - dragStart.x;
        const dy = currentY - dragStart.y;

        let { boxX, boxY, boxW, boxH } = dragStart;

        // Minimum dimensions
        const MIN_SIZE = 20;

        if (activeHandle === 'tl') {
            boxX = Math.min(boxX + dx, boxX + boxW - MIN_SIZE);
            boxY = Math.min(boxY + dy, boxY + boxH - MIN_SIZE);
            boxW = dragStart.boxW - (boxX - dragStart.boxX);
            boxH = dragStart.boxH - (boxY - dragStart.boxY);
        } else if (activeHandle === 'tr') {
            boxY = Math.min(boxY + dy, boxY + boxH - MIN_SIZE);
            boxW = Math.max(MIN_SIZE, dragStart.boxW + dx);
            boxW = Math.min(boxW, rect.width - boxX); // constrain right edge
            boxH = dragStart.boxH - (boxY - dragStart.boxY);
        } else if (activeHandle === 'bl') {
            boxX = Math.min(boxX + dx, boxX + boxW - MIN_SIZE);
            boxW = dragStart.boxW - (boxX - dragStart.boxX);
            boxH = Math.max(MIN_SIZE, dragStart.boxH + dy);
            boxH = Math.min(boxH, rect.height - boxY); // constrain bottom edge
        } else if (activeHandle === 'br') {
            boxW = Math.max(MIN_SIZE, dragStart.boxW + dx);
            boxW = Math.min(boxW, rect.width - boxX);
            boxH = Math.max(MIN_SIZE, dragStart.boxH + dy);
            boxH = Math.min(boxH, rect.height - boxY);
        } else if (activeHandle === 't') {
            boxY = Math.min(boxY + dy, boxY + boxH - MIN_SIZE);
            boxH = dragStart.boxH - (boxY - dragStart.boxY);
        } else if (activeHandle === 'b') {
            boxH = Math.max(MIN_SIZE, dragStart.boxH + dy);
            boxH = Math.min(boxH, rect.height - boxY);
        } else if (activeHandle === 'l') {
            boxX = Math.min(boxX + dx, boxX + boxW - MIN_SIZE);
            boxW = dragStart.boxW - (boxX - dragStart.boxX);
        } else if (activeHandle === 'r') {
            boxW = Math.max(MIN_SIZE, dragStart.boxW + dx);
            boxW = Math.min(boxW, rect.width - boxX);
        } else if (activeHandle === 'move') {
            boxX = Math.max(0, Math.min(boxX + dx, rect.width - boxW));
            boxY = Math.max(0, Math.min(boxY + dy, rect.height - boxH));
        }

        setSelection({ x: boxX, y: boxY, w: boxW, h: boxH });
    };

    const handleMouseUp = () => {
        setActiveHandle(null);
    };

    const handleProcess = async () => {
        if (!videoFile || !videoRef.current) return;
        if (!ffmpegRef.current.loaded) {
            alert("FFMPEG is still loading. Please wait a moment and try again.");
            return;
        }

        if (!selection || selection.w === 0 || selection.h === 0) {
            alert("Invalid crop region.");
            return;
        }

        const rect = videoRef.current.getBoundingClientRect();
        const scaleX = videoRef.current.videoWidth / rect.width;
        const scaleY = videoRef.current.videoHeight / rect.height;

        const scaledSelection = {
            x: Math.round(selection.x * scaleX),
            y: Math.round(selection.y * scaleY),
            w: Math.round(selection.w * scaleX),
            h: Math.round(selection.h * scaleY),
        };

        // Final sanity check
        if (scaledSelection.w <= 0 || scaledSelection.h <= 0) {
            alert("Crop width and height must be greater than 0.");
            return;
        }

        if (scaledSelection.x + scaledSelection.w > originalSize.w || scaledSelection.y + scaledSelection.h > originalSize.h) {
            alert("Crop bounds exceed original video size.");
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

            // Execute crop command
            // Format: crop=w:h:x:y
            await ffmpeg.exec([
                '-i', inputName,
                '-vf', `crop=${scaledSelection.w}:${scaledSelection.h}:${scaledSelection.x}:${scaledSelection.y}`,
                '-c:v', 'libx264',
                '-crf', '18',
                '-preset', 'veryfast',
                '-c:a', 'copy', // Copy audio without re-encoding
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
            console.error("Cropping failed:", error);
            alert("Failed to crop video. See console for details.");
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
                <h2>Crop Video</h2>
                <p>Crop the dimensions of your video to remove unwanted edges. Resize your footage perfectly for any platform.</p>
            </div>
                <Dropzone onFileSelect={handleFileSelect} accept="video/*" title="Drop a video to Crop" />
            </div>
        );
    }

    const resetSelection = () => {
        if (videoRef.current) {
            const rect = videoRef.current.getBoundingClientRect();
            setSelection({ x: 0, y: 0, w: rect.width, h: rect.height });
        }
    }

    // Standardize handle rendering
    const handleStyle = (pos: HandlePos): React.CSSProperties => {
        const size = 12;
        const halfSize = size / 2;

        const base: React.CSSProperties = {
            position: 'absolute',
            width: `${size}px`,
            height: `${size}px`,
            backgroundColor: 'white',
            border: '2px solid #3b82f6',
            borderRadius: '50%',
            zIndex: 15,
        };

        switch (pos) {
            case 'tl': return { ...base, top: -halfSize, left: -halfSize, cursor: 'nwse-resize' };
            case 'tr': return { ...base, top: -halfSize, right: -halfSize, cursor: 'nesw-resize' };
            case 'bl': return { ...base, bottom: -halfSize, left: -halfSize, cursor: 'nesw-resize' };
            case 'br': return { ...base, bottom: -halfSize, right: -halfSize, cursor: 'nwse-resize' };
            case 't': return { ...base, top: -halfSize, left: '50%', transform: 'translateX(-50%)', cursor: 'ns-resize' };
            case 'b': return { ...base, bottom: -halfSize, left: '50%', transform: 'translateX(-50%)', cursor: 'ns-resize' };
            case 'l': return { ...base, left: -halfSize, top: '50%', transform: 'translateY(-50%)', cursor: 'ew-resize' };
            case 'r': return { ...base, right: -halfSize, top: '50%', transform: 'translateY(-50%)', cursor: 'ew-resize' };
            default: return {};
        }
    };

    // Edge transparent hitboxes to make dragging easier
    const edgeHitboxStyle = (pos: HandlePos): React.CSSProperties => {
        const thickness = 10;
        const halfThick = thickness / 2;
        const base: React.CSSProperties = {
            position: 'absolute',
            zIndex: 12,
            backgroundColor: 'transparent'
        };

        switch (pos) {
            case 't': return { ...base, top: -halfThick, left: 0, right: 0, height: `${thickness}px`, cursor: 'ns-resize' };
            case 'b': return { ...base, bottom: -halfThick, left: 0, right: 0, height: `${thickness}px`, cursor: 'ns-resize' };
            case 'l': return { ...base, left: -halfThick, top: 0, bottom: 0, width: `${thickness}px`, cursor: 'ew-resize' };
            case 'r': return { ...base, right: -halfThick, top: 0, bottom: 0, width: `${thickness}px`, cursor: 'ew-resize' };
            default: return {};
        }
    };


    return (
        <div className="watermark-remover">
            <div className="seo-writeup">
                <h2>Crop Video</h2>
                <p>Crop the dimensions of your video to remove unwanted edges. Resize your footage perfectly for any platform.</p>
            </div>
            <div className="editor-container" style={{ maxWidth: '1000px', margin: '0 auto' }}>
                <div style={{ display: 'flex', gap: '2rem', width: '100%', alignItems: 'stretch' }}>

                    {/* Left Column: Video Preview and Crop Box */}
                    <div style={{ flex: 1.5, display: 'flex', flexDirection: 'column', background: '#f8fafc', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>

                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
                            <div style={{ position: 'relative', display: 'inline-block', maxWidth: '100%', maxHeight: '500px', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', background: '#000' }}>
                                <video
                                    ref={videoRef}
                                    src={videoUrl}
                                    onLoadedMetadata={handleLoadedMetadata}
                                    style={{
                                        maxWidth: '100%',
                                        maxHeight: '500px',
                                        display: 'block',
                                        pointerEvents: 'none' // Let the overlay handle events
                                    }}
                                />

                                {/* Container for global mouse tracking during drag */}
                                <div
                                    ref={workspaceRef}
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        zIndex: 5
                                    }}
                                    onMouseMove={handleMouseMove}
                                    onMouseUp={handleMouseUp}
                                    onMouseLeave={handleMouseUp}
                                >
                                    {/* Crop Box Visual */}
                                    {selection && (
                                        <div
                                            style={{
                                                position: 'absolute',
                                                left: selection.x,
                                                top: selection.y,
                                                width: selection.w,
                                                height: selection.h,
                                                border: '2px solid rgba(255, 255, 255, 0.8)',
                                                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.65)', // Dim outer area
                                                zIndex: 10
                                            }}
                                        >
                                            {/* Draggable central area */}
                                            <div
                                                style={{ width: '100%', height: '100%', cursor: 'move' }}
                                                onMouseDown={(e) => handleMouseDown(e, 'move')}
                                            />

                                            {/* Edge Hitboxes */}
                                            <div style={edgeHitboxStyle('t')} onMouseDown={(e) => handleMouseDown(e, 't')} />
                                            <div style={edgeHitboxStyle('b')} onMouseDown={(e) => handleMouseDown(e, 'b')} />
                                            <div style={edgeHitboxStyle('l')} onMouseDown={(e) => handleMouseDown(e, 'l')} />
                                            <div style={edgeHitboxStyle('r')} onMouseDown={(e) => handleMouseDown(e, 'r')} />

                                            {/* Corner Visual Handles */}
                                            <div style={handleStyle('tl')} onMouseDown={(e) => handleMouseDown(e, 'tl')} />
                                            <div style={handleStyle('tr')} onMouseDown={(e) => handleMouseDown(e, 'tr')} />
                                            <div style={handleStyle('bl')} onMouseDown={(e) => handleMouseDown(e, 'bl')} />
                                            <div style={handleStyle('br')} onMouseDown={(e) => handleMouseDown(e, 'br')} />

                                            {/* Edge Visual Handles */}
                                            <div style={handleStyle('t')} onMouseDown={(e) => handleMouseDown(e, 't')} />
                                            <div style={handleStyle('b')} onMouseDown={(e) => handleMouseDown(e, 'b')} />
                                            <div style={handleStyle('l')} onMouseDown={(e) => handleMouseDown(e, 'l')} />
                                            <div style={handleStyle('r')} onMouseDown={(e) => handleMouseDown(e, 'r')} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Right Column: Controls */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                        <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <h4 style={{ margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                Crop Region
                            </h4>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
                                    <span style={{ color: '#64748b', fontSize: '0.9rem' }}>Original Video Size</span>
                                    <span style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.9rem' }}>{originalSize.w} x {originalSize.h}px</span>
                                </div>
                            </div>

                            {!selection ? (
                                <div style={{ fontSize: '0.85rem', color: '#64748b', background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px dashed #cbd5e1', textAlign: 'center' }}>
                                    Loading video dimensions...
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', color: '#475569', background: '#f0f9ff', padding: '1rem', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                                    <div style={{ color: '#0284c7', fontWeight: 600, marginBottom: '0.25rem' }}>Selection Active</div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>Display Width:</span>
                                        <span style={{ fontWeight: 600 }}>{Math.round(selection.w)}px</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>Display Height:</span>
                                        <span style={{ fontWeight: 600 }}>{Math.round(selection.h)}px</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                                        <button
                                            onClick={resetSelection}
                                            style={{ flex: 1, padding: '0.25rem', fontSize: '0.75rem', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '4px', cursor: 'pointer' }}
                                        >
                                            Reset Full
                                        </button>
                                    </div>
                                    <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid #e0f2fe', fontSize: '0.75rem', color: '#64748b' }}>
                                        Coordinates will be automatically scaled to match the original {originalSize.w}x{originalSize.h} dimensions during export.
                                    </div>
                                </div>
                            )}

                        </div>

                        {/* Action List */}
                        {isProcessing && (
                            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '1rem', borderRadius: '8px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem', color: '#166534', fontWeight: 600 }}>
                                    <span>Cropping...</span>
                                    <span>{progress}%</span>
                                </div>
                                <div style={{ width: '100%', background: '#dcfce7', borderRadius: '4px', overflow: 'hidden', height: '6px' }}>
                                    <div style={{ width: `${progress}%`, background: '#22c55e', height: '100%', transition: 'width 0.1s' }} />
                                </div>
                            </div>
                        )}

                        {outputUrl && (
                            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '1.25rem', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'center', textAlign: 'center' }}>
                                <div style={{ color: '#1d4ed8', fontWeight: 600, fontSize: '0.95rem' }}>Cropping Complete!</div>

                                <div style={{ width: '100%', borderRadius: '6px', overflow: 'hidden', background: '#000', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                                    <video
                                        src={outputUrl}
                                        controls
                                        style={{ width: '100%', display: 'block' }}
                                    />
                                </div>

                                <><a
                                    href={outputUrl}
                                    download={`cropped_${videoFile?.name}`}
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
                            <button className="btn-secondary" onClick={() => { setVideoUrl(null); setVideoFile(null); setOutputUrl(null); setSelection(null); }} disabled={isProcessing} style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                                <RotateCcw size={16} /> Start Over
                            </button>
                            <button
                                className="btn-primary"
                                onClick={handleProcess}
                                disabled={isProcessing || !!outputUrl || !selection || selection.w === 0}
                                style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
                            >
                                {isProcessing ? <><Loader2 size={16} className="spin" /> Processing...</> : <><Crop size={16} /> Crop Video</>}
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}