import { useState, useRef, useEffect } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import { Dropzone } from '../shared/Dropzone.tsx';
import { NextStepSuggestions } from '../shared/NextStepSuggestions.tsx';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import { Download, Layers, Trash2, Move, Copy } from 'lucide-react';

interface Watermark {
    id: string;
    file: File;
    url: string;
    xPct: number; // 0 to 100 percentage
    yPct: number; // 0 to 100 percentage
    scalePx: number; // width in pixels relative to base image
    opacity: number; // 0.1 to 1.0
}

export function ImageWatermarkAdder() {
    const [mainFile, setMainFile] = useState<File | null>(null);
    const [mainUrl, setMainUrl] = useState<string | null>(null);
    const [mainImageDims, setMainImageDims] = useState({ w: 0, h: 0 });

    const [watermarks, setWatermarks] = useState<Watermark[]>([]);
    const [activeWmId, setActiveWmId] = useState<string | null>(null);

    const [isProcessing, setIsProcessing] = useState(false);

    // Dragging state
    const [outputUrl, setOutputUrl] = useState<string | null>(null);

    const previewContainerRef = useRef<HTMLDivElement>(null);
    const ffmpegRef = useRef<FFmpeg | null>(null);

    // Dragging state
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0, wmX: 0, wmY: 0 });

    useEffect(() => {
        const loadFFmpeg = async () => {
            const ffmpeg = new FFmpeg();
            ffmpeg.on('log', ({ message }) => console.log(message));
            try {
                await ffmpeg.load({
                    coreURL: "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.js",
                    wasmURL: "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.wasm",
                });
                ffmpegRef.current = ffmpeg;
            } catch (e) {
                console.error("Error loading FFmpeg:", e);
            }
        };
        loadFFmpeg();
    }, []);

    const handleMainFileSelect = (file: File) => {
        setMainFile(file);
        const url = URL.createObjectURL(file);
        setMainUrl(url);
        setOutputUrl(null);
        setWatermarks([]);

        // Get actual dimensions
        const img = new Image();
        img.onload = () => setMainImageDims({ w: img.width, h: img.height });
        img.src = url;
    };

    const handleAddWatermark = (file: File) => {
        const url = URL.createObjectURL(file);
        const newWm: Watermark = {
            id: Date.now().toString(),
            file,
            url,
            xPct: 10,
            yPct: 10,
            scalePx: mainImageDims.w > 0 ? Math.max(100, Math.floor(mainImageDims.w * 0.2)) : 150,
            opacity: 1
        };
        setWatermarks([...watermarks, newWm]);
        setActiveWmId(newWm.id);
    };

    const removeWatermark = (id: string) => {
        setWatermarks(watermarks.filter(wm => wm.id !== id));
        if (activeWmId === id) setActiveWmId(null);
    };

    const updateActiveWm = (updates: Partial<Watermark>) => {
        setWatermarks(watermarks.map(wm => wm.id === activeWmId ? { ...wm, ...updates } : wm));
    };

    const duplicateWatermark = (wm: Watermark) => {
        const newWm: Watermark = {
            ...wm,
            id: Date.now().toString(),
            xPct: Math.min(100, wm.xPct + 5), // Offset slightly down and right
            yPct: Math.min(100, wm.yPct + 5),
        };
        setWatermarks([...watermarks, newWm]);
        setActiveWmId(newWm.id);
    };

    // --- Drag Handling ---
    const handleMouseDown = (e: ReactMouseEvent, wm: Watermark) => {
        if (!previewContainerRef.current) return;
        e.preventDefault(); // Prevent image dragging
        setActiveWmId(wm.id);
        setIsDragging(true);
        setDragStart({ x: e.clientX, y: e.clientY, wmX: wm.xPct, wmY: wm.yPct });
    };

    const handleMouseMove = (e: ReactMouseEvent) => {
        if (!isDragging || !activeWmId || !previewContainerRef.current) return;

        const rect = previewContainerRef.current.getBoundingClientRect();
        const deltaX = e.clientX - dragStart.x;
        const deltaY = e.clientY - dragStart.y;

        // Convert pixel delta to percentage delta
        const deltaXPct = (deltaX / rect.width) * 100;
        const deltaYPct = (deltaY / rect.height) * 100;

        let newX = dragStart.wmX + deltaXPct;
        let newY = dragStart.wmY + deltaYPct;

        // Clamp
        newX = Math.max(0, Math.min(100, newX));
        newY = Math.max(0, Math.min(100, newY));

        updateActiveWm({ xPct: newX, yPct: newY });
    };

    const handleMouseUp = () => setIsDragging(false);
    // ----------------------

    const handleProcess = async () => {
        if (!ffmpegRef.current || !ffmpegRef.current.loaded || !mainFile || watermarks.length === 0) return;

        setIsProcessing(true);

        const ffmpeg = ffmpegRef.current;
        const mainExt = mainFile.name.split('.').pop() || 'png';
        const mainInput = `main.${mainExt}`;
        const outputName = `temp_output.${mainExt}`;

        try {
            await ffmpeg.writeFile(mainInput, await fetchFile(mainFile));

            const args = ['-i', mainInput];

            // Write all watermark files and build input args
            for (let i = 0; i < watermarks.length; i++) {
                const wm = watermarks[i];
                const wmExt = wm.file.name.split('.').pop() || 'png';
                const wmName = `wm_${i}.${wmExt}`;
                await ffmpeg.writeFile(wmName, await fetchFile(wm.file));
                args.push('-i', wmName);
            }

            // Build complex filter graph
            // ffmpeg inputs are 0-indexed. Base is 0. Watermarks are 1, 2, ...
            let filterString = '';
            let lastOverlayLabel = '[0:v]';

            for (let i = 0; i < watermarks.length; i++) {
                const wm = watermarks[i];
                const inputIdx = i + 1;

                // 1. Scale relative to target px width
                const scaleFilter = `[${inputIdx}:v]scale=${wm.scalePx}:-1[scaled${i}]`;

                // 2. Opacity
                const opacityFilter = `[scaled${i}]format=rgba,colorchannelmixer=aa=${wm.opacity}[wm${i}]`;

                // Calculate physical pixels for overlay relative to the primary image dimensions
                // xPct/yPct are based on the base image dimensions. 
                // e.g., if xPct is 50%, the *top-left* of the watermark is at 50% of the main image width.
                const pxX = Math.floor((wm.xPct / 100) * mainImageDims.w);
                const pxY = Math.floor((wm.yPct / 100) * mainImageDims.h);

                // 3. Overlay onto the running base
                const outLabel = i === watermarks.length - 1 ? '[out]' : `[base${i}]`;
                const overlayFilter = `${lastOverlayLabel}[wm${i}]overlay=${pxX}:${pxY}${outLabel}`;

                lastOverlayLabel = `[base${i}]`;
                filterString += `${scaleFilter};${opacityFilter};${overlayFilter};`;
            }

            // Remove trailing semicolon
            if (filterString.endsWith(';')) filterString = filterString.slice(0, -1);

            args.push('-filter_complex', filterString);
            args.push('-map', '[out]');
            args.push('-qscale:v', '2'); // High quality
            args.push(outputName);

            await ffmpeg.exec(args);

            const outputData = await ffmpeg.readFile(outputName);
            const blob = new Blob([outputData as any], { type: mainFile.type });
            const url = URL.createObjectURL(blob);

            setOutputUrl(url);

            // Cleanup
            await ffmpeg.deleteFile(mainInput);
            await ffmpeg.deleteFile(outputName);
            for (let i = 0; i < watermarks.length; i++) {
                const wmExt = watermarks[i].file.name.split('.').pop() || 'png';
                await ffmpeg.deleteFile(`wm_${i}.${wmExt}`);
            }

        } catch (e) {
            console.error(e);
            alert('Failed to apply watermarks. Try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    const activeWm = watermarks.find(wm => wm.id === activeWmId);

    if (!mainUrl) {
        return (
            <div className="watermark-remover">
            <div className="seo-writeup">
                <h2>Add Watermark to Image</h2>
                <p>Protect your original photography by stamping custom text or logo watermarks on your images.</p>
            </div>
                <Dropzone onFileSelect={handleMainFileSelect} accept="image/*" title="Drag & Drop your BASE image" />
            </div>
        );
    }

    return (
        <div className="watermark-remover" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
            <div className="editor-container" style={{ maxWidth: '1000px', margin: '0 auto' }}>
                <div className="tool-split-layout">

                    {/* Left Column: Interactive Image Preview */}
                    <div className="tool-preview-panel">

                        {!outputUrl ? (
                            <div
                                style={{
                                    position: 'relative',
                                    width: '100%',
                                    flex: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    overflow: 'hidden', // prevent watermarks from hanging out
                                    userSelect: 'none'
                                }}
                            >
                                {/* Base Image */}
                                <img
                                    src={mainUrl}
                                    alt="Base"
                                    style={{
                                        maxWidth: '100%',
                                        maxHeight: '500px',
                                        objectFit: 'contain',
                                        boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                                    }}
                                />

                                {/* Interactive Overlay Container that perfectly matches the image size */}
                                <div
                                    ref={previewContainerRef}
                                    style={{
                                        position: 'absolute',
                                        // We use the image's bounding box to constrain draggables accurately. 
                                        // For simplicity right now, assume container bounds = image bounds since objectFit is contain.
                                        // Note: If aspect ratios differ wildly this might allow dragging into letterbox areas.
                                        inset: 0,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    {watermarks.map(wm => (
                                        <div
                                            key={wm.id}
                                            onMouseDown={(e) => handleMouseDown(e, wm)}
                                            style={{
                                                position: 'absolute',
                                                left: `${wm.xPct}%`,
                                                top: `${wm.yPct}%`,
                                                opacity: wm.opacity,
                                                cursor: isDragging && activeWmId === wm.id ? 'grabbing' : 'grab',
                                                boxShadow: activeWmId === wm.id ? '0 0 0 2px #8b5cf6, 0 4px 12px rgba(139,92,246,0.3)' : 'none',
                                                borderRadius: '4px',
                                                zIndex: activeWmId === wm.id ? 10 : 1,
                                                // Convert scalePx (which is relative to ORIGINAL image width) to preview size.
                                                // For the preview, we approximate by keeping it proportional.
                                                // A better way is using a fixed width and letting the browser scale it visually,
                                                // but since we encode using scalePx later, let's represent its relative size.
                                                width: `${(wm.scalePx / mainImageDims.w) * 100}%`,
                                            }}
                                        >
                                            <img src={wm.url} alt="Watermark overlay" style={{ width: '100%', display: 'block', pointerEvents: 'none' }} />

                                            {/* Drag Handle Icon visible only when hovering or active */}
                                            {activeWmId === wm.id && (
                                                <div style={{ position: 'absolute', top: '-12px', left: '-12px', background: '#8b5cf6', color: 'white', borderRadius: '50%', padding: '4px', display: 'flex' }}>
                                                    <Move size={12} />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            // Render final output
                            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <img src={outputUrl} alt="Final" style={{ maxWidth: '100%', maxHeight: '500px', borderRadius: '8px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
                            </div>
                        )}

                        <div className="tool-preview-caption">
                            {outputUrl ? `Final Baked Image` : `Live Interactive Preview - Click & Drag to move`}
                        </div>
                    </div>

                    {/* Right Column: Controls */}
                    <div className="tool-side-column">

                        {!outputUrl ? (
                            <>
                                <Dropzone
                                    onFileSelect={handleAddWatermark}
                                    accept="image/*"
                                    title={watermarks.length === 0 ? "Add your first Watermark" : "Add another Watermark"}
                                />

                                {/* List of watermarks */}
                                {watermarks.length > 0 && (
                                    <div className="tool-layer-list">
                                        <div className="tool-layer-header">
                                            Active Layers ({watermarks.length})
                                        </div>
                                        <div className="tool-scroll-region">
                                            {watermarks.map((wm, i) => (
                                                <div
                                                    key={wm.id}
                                                    onClick={() => setActiveWmId(wm.id)}
                                                    className="tool-layer-row"
                                                    style={{ background: activeWmId === wm.id ? '#eff6ff' : '#ffffff' }}
                                                >
                                                    <img src={wm.url} alt={`layer ${i}`} style={{ width: '32px', height: '32px', objectFit: 'contain', background: '#e2e8f0', borderRadius: '4px' }} />
                                                    <div className="tool-layer-name" style={{ color: activeWmId === wm.id ? '#0284c7' : '#64748b', fontWeight: activeWmId === wm.id ? 600 : 400 }}>
                                                        {wm.file.name}
                                                    </div>
                                                    <div className="tool-layer-actions">
                                                        <button onClick={(e) => { e.stopPropagation(); duplicateWatermark(wm); }} style={{ background: 'none', border: 'none', color: '#0284c7', padding: '4px', cursor: 'pointer', borderRadius: '4px' }} title="Duplicate layer">
                                                            <Copy size={16} />
                                                        </button>
                                                        <button onClick={(e) => { e.stopPropagation(); removeWatermark(wm.id); }} style={{ background: 'none', border: 'none', color: '#ef4444', padding: '4px', cursor: 'pointer', borderRadius: '4px' }} title="Remove layer">
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Controls for ACTIVE watermark */}
                                {activeWm && (
                                    <div className="tool-control-card">

                                        <div style={{ marginBottom: '1rem' }}>
                                            <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600, color: '#64748b', marginBottom: '0.25rem' }}>
                                                <span>Size (Width Px)</span>
                                                <span>{activeWm.scalePx}px</span>
                                            </label>
                                            <input
                                                type="range"
                                                min="50"
                                                max={mainImageDims.w}
                                                step="10"
                                                value={activeWm.scalePx}
                                                onChange={(e) => updateActiveWm({ scalePx: parseInt(e.target.value) })}
                                                style={{ width: '100%', accentColor: '#38bdf8' }}
                                            />
                                            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem' }}>Relative to base image width of {mainImageDims.w}px</div>
                                        </div>

                                        <div style={{ marginBottom: '0.5rem' }}>
                                            <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600, color: '#64748b', marginBottom: '0.25rem' }}>
                                                <span>Opacity</span>
                                                <span>{Math.round(activeWm.opacity * 100)}%</span>
                                            </label>
                                            <input
                                                type="range"
                                                min="0.1" max="1" step="0.05"
                                                value={activeWm.opacity}
                                                onChange={(e) => updateActiveWm({ opacity: parseFloat(e.target.value) })}
                                                style={{ width: '100%', accentColor: '#38bdf8' }}
                                            />
                                        </div>
                                    </div>
                                )}

                                <button
                                    className="btn-primary"
                                    disabled={isProcessing || watermarks.length === 0}
                                    onClick={handleProcess}
                                    style={{ width: '100%', justifyContent: 'center', marginTop: 'auto' }}
                                >
                                    {isProcessing ? "Baking Watermarks..." : <><Layers size={18} /> Bake {watermarks.length} Watermark(s)</>}
                                </button>
                            </>
                        ) : (
                            <>
                                <h3 style={{ margin: 0, color: '#0284c7', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Layers size={24} /> Success!
                                </h3>

                                <div className="actions" style={{ marginTop: '1rem', flexDirection: 'column', gap: '0.75rem' }}>
                                    <><a href={outputUrl} download={`watermarked_${mainFile?.name}`} className="btn-primary" style={{ textDecoration: 'none', justifyContent: 'center' }}>
                                        <Download size={18} /> Download Image
                                    </a>
                                <div className="tool-danger-note">
                                   ⚠️ <strong>Warning:</strong> Files are not saved on our servers. Please download your work now or it will be lost forever.
                                
                                </div>
                                <NextStepSuggestions 
                                    fileUrl={outputUrl} 
                                    fileName={mainFile?.name || 'processed_file'} 
                                    fileType="image" 
                                /></>
                                    <button className="btn-secondary" onClick={() => { setOutputUrl(null); }} style={{ width: '100%' }}>
                                        Back to Editor
                                    </button>
                                    <button className="btn-secondary" onClick={() => { setOutputUrl(null); setMainUrl(null); setWatermarks([]); }} style={{ width: '100%', border: 'none', background: 'transparent' }}>
                                        Start Completely Over
                                    </button>
                                
                                </div>
                                <NextStepSuggestions 
                                    fileUrl={outputUrl} 
                                    fileName={mainFile?.name || 'processed_file'} 
                                    fileType="image" 
                                />
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
