import { useState, useRef, useEffect, type MouseEvent as ReactMouseEvent } from 'react';
import { Dropzone } from '../shared/Dropzone.tsx';
import { FFmpeg } from '@ffmpeg/ffmpeg';

import { Loader2, Download, RotateCcw, Video, Layers, Trash2, Move, Copy } from 'lucide-react';

interface Watermark {
    id: string;
    file: File;
    url: string;
    xPct: number; // 0 to 100 percentage
    yPct: number; // 0 to 100 percentage
    scalePct: number; // scale relative to main video width
    opacity: number; // 0.1 to 1.0
}

export function VideoWatermarkAdder() {
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);

    const [watermarks, setWatermarks] = useState<Watermark[]>([]);
    const [activeWmId, setActiveWmId] = useState<string | null>(null);

    // Dragging state
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0, wmX: 0, wmY: 0 });

    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [outputUrl, setOutputUrl] = useState<string | null>(null);

    const ffmpegRef = useRef(new FFmpeg());
    const watermarkInputRef = useRef<HTMLInputElement>(null);
    const previewContainerRef = useRef<HTMLDivElement>(null);

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
        setWatermarks([]);
    };

    const handleAddWatermark = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const url = URL.createObjectURL(file);
            const newWm: Watermark = {
                id: Date.now().toString(),
                file,
                url,
                xPct: 10,
                yPct: 10,
                scalePct: 15,
                opacity: 1
            };
            setWatermarks([...watermarks, newWm]);
            setActiveWmId(newWm.id);
            setOutputUrl(null);

            // Reset so we can add the same file again if desired
            if (watermarkInputRef.current) watermarkInputRef.current.value = '';
        }
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
        if (!videoFile || watermarks.length === 0 || !ffmpegRef.current.loaded) return;

        setIsProcessing(true);
        setProgress(0);
        setOutputUrl(null);

        const ffmpeg = ffmpegRef.current;
        const outputExt = videoFile.name.split('.').pop()?.toLowerCase() || 'mp4';
        const videoInputName = `input_video.${outputExt}`;
        const outputName = `watermarked_output.${outputExt}`;

        try {
            const videoData = await videoFile.arrayBuffer();
            await ffmpeg.writeFile(videoInputName, new Uint8Array(videoData));
            const args = ['-i', videoInputName];

            for (let i = 0; i < watermarks.length; i++) {
                const wm = watermarks[i];
                const wmExt = wm.file.name.split('.').pop() || 'png';
                const wmName = `wm_${i}.${wmExt}`;
                const wmData = await wm.file.arrayBuffer();
                await ffmpeg.writeFile(wmName, new Uint8Array(wmData));
                args.push('-i', wmName);
            }

            // Build complex filter graph
            let filterString = '';
            let lastOverlayLabel = '[0:v]';

            for (let i = 0; i < watermarks.length; i++) {
                const wm = watermarks[i];
                const inputIdx = i + 1;

                // Scale the watermark relative to the primary video's width (`main_w`)
                const scaleFilter = `[${inputIdx}:v]scale=main_w*${(wm.scalePct / 100).toFixed(2)}:-1[scaled${i}]`;

                // Add opacity
                const opacityFilter = `[scaled${i}]format=rgba,colorchannelmixer=aa=${wm.opacity}[wm${i}]`;

                // Calculate overlay position mathematically. xPct/yPct maps to FFMPEG main_w / main_h.
                const pxX = `main_w*${(wm.xPct / 100).toFixed(4)}`;
                const pxY = `main_h*${(wm.yPct / 100).toFixed(4)}`;

                const outLabel = i === watermarks.length - 1 ? '[out]' : `[base${i}]`;
                const overlayFilter = `${lastOverlayLabel}[wm${i}]overlay=${pxX}:${pxY}${outLabel}`;

                lastOverlayLabel = `[base${i}]`;
                filterString += `${scaleFilter};${opacityFilter};${overlayFilter};`;
            }

            if (filterString.endsWith(';')) filterString = filterString.slice(0, -1);

            args.push('-filter_complex', filterString);
            args.push('-map', '[out]');
            args.push('-map', '0:a?'); // Grab audio if it exists from input 0
            args.push('-c:a', 'copy'); // Keep audio untouched
            args.push('-c:v', 'libx264', '-crf', '26', '-preset', 'fast'); // Fast re-encode
            args.push(outputName);

            await ffmpeg.exec(args);

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
            console.error("Watermarking failed:", error);
            alert("Failed to apply watermark. See console for details.");
        } finally {
            setIsProcessing(false);
            try {
                await ffmpeg.deleteFile(videoInputName);
                await ffmpeg.deleteFile(outputName);
                for (let i = 0; i < watermarks.length; i++) {
                    const wmExt = watermarks[i].file.name.split('.').pop() || 'png';
                    await ffmpeg.deleteFile(`wm_${i}.${wmExt}`);
                }
            } catch (e) { }
        }
    };

    const activeWm = watermarks.find(wm => wm.id === activeWmId);

    if (!videoUrl) {
        return (
            <div className="watermark-remover">
                <Dropzone onFileSelect={handleVideoSelect} accept="video/*" title="Drop a Base Video" />
            </div>
        );
    }

    return (
        <div className="watermark-remover" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
            <div className="editor-container" style={{ maxWidth: '1000px', margin: '0 auto' }}>
                <div style={{ display: 'flex', gap: '2rem', width: '100%', alignItems: 'stretch' }}>

                    {/* Left Column: Player & Watermark Preview */}
                    <div style={{ flex: 1.5, display: 'flex', flexDirection: 'column', background: '#f8fafc', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0', minHeight: '500px' }}>

                        {outputUrl ? (
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#000', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
                                <video
                                    src={outputUrl}
                                    controls
                                    style={{ maxWidth: '100%', maxHeight: '450px', display: 'block' }}
                                />
                            </div>
                        ) : (
                            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', position: 'relative' }}>
                                <video
                                    src={videoUrl}
                                    controls
                                    style={{ maxWidth: '100%', maxHeight: '450px', display: 'block' }}
                                />
                                {/* Interactive Overlay Container that follows video dims constraints using flex parent bounds */}
                                <div
                                    ref={previewContainerRef}
                                    style={{
                                        position: 'absolute',
                                        inset: 0,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        pointerEvents: 'none'
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
                                                boxShadow: activeWmId === wm.id ? '0 0 0 2px #3b82f6, 0 4px 12px rgba(59, 130, 246, 0.4)' : 'none',
                                                borderRadius: '4px',
                                                zIndex: activeWmId === wm.id ? 10 : 1,
                                                width: `${wm.scalePct}%`,
                                                pointerEvents: 'auto'
                                            }}
                                        >
                                            <img src={wm.url} alt="Watermark overlay" style={{ width: '100%', display: 'block', pointerEvents: 'none' }} />
                                            {activeWmId === wm.id && (
                                                <div style={{ position: 'absolute', top: '-12px', left: '-12px', background: '#3b82f6', color: 'white', borderRadius: '50%', padding: '4px', display: 'flex' }}>
                                                    <Move size={12} />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {outputUrl && (
                            <p style={{ textAlign: 'center', marginTop: '1rem', color: '#16a34a', fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                <Video size={16} /> Watermark Burned and Rendered!
                            </p>
                        )}
                    </div>

                    {/* Right Column: Settings & Actions */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                        {!outputUrl && (
                            <>
                                <Dropzone
                                    onFileSelect={(e) => {
                                        if (e instanceof File) {
                                            const fakeEvent = { target: { files: [e] } } as any;
                                            handleAddWatermark(fakeEvent);
                                        }
                                    }}
                                    accept="image/png, image/jpeg, image/webp"
                                    title={watermarks.length === 0 ? "Add a Watermark Logo" : "Add another Watermark"}
                                />

                                {/* List of watermarks */}
                                {watermarks.length > 0 && (
                                    <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                                        <div style={{ background: '#f8fafc', padding: '0.75rem 1rem', borderBottom: '1px solid #e2e8f0', fontWeight: 600, color: '#0f172a', fontSize: '0.9rem' }}>
                                            Active Layers ({watermarks.length})
                                        </div>
                                        <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                                            {watermarks.map((wm, i) => (
                                                <div
                                                    key={wm.id}
                                                    onClick={() => setActiveWmId(wm.id)}
                                                    style={{
                                                        padding: '0.75rem 1rem',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.75rem',
                                                        borderBottom: '1px solid #f1f5f9',
                                                        background: activeWmId === wm.id ? '#eff6ff' : '#ffffff',
                                                        cursor: 'pointer',
                                                        transition: 'background 0.2s'
                                                    }}
                                                >
                                                    <img src={wm.url} alt={`layer ${i}`} style={{ width: '32px', height: '32px', objectFit: 'contain', background: '#e2e8f0', borderRadius: '4px' }} />
                                                    <div style={{ flex: 1, fontSize: '0.9rem', color: activeWmId === wm.id ? '#1d4ed8' : '#64748b', fontWeight: activeWmId === wm.id ? 600 : 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        {wm.file.name}
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                                                        <button onClick={(e) => { e.stopPropagation(); duplicateWatermark(wm); }} style={{ background: 'none', border: 'none', color: '#3b82f6', padding: '4px', cursor: 'pointer', borderRadius: '4px' }} title="Duplicate layer">
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
                                    <div style={{ background: '#eff6ff', padding: '1rem', borderRadius: '12px', border: '1px solid #bfdbfe' }}>
                                        <div style={{ marginBottom: '1rem' }}>
                                            <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600, color: '#64748b', marginBottom: '0.25rem' }}>
                                                <span>Scale (vs video width)</span>
                                                <span>{activeWm.scalePct}%</span>
                                            </label>
                                            <input
                                                type="range"
                                                min="2" max="50" step="1"
                                                value={activeWm.scalePct}
                                                onChange={(e) => updateActiveWm({ scalePct: parseInt(e.target.value) })}
                                                style={{ width: '100%', accentColor: '#3b82f6' }}
                                            />
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
                                                style={{ width: '100%', accentColor: '#3b82f6' }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                        {/* Core Actions */}
                        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {outputUrl ? (
                                <a
                                    href={outputUrl}
                                    download={`watermarked_${videoFile?.name || 'video.mp4'}`}
                                    className="btn-primary"
                                    style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}
                                >
                                    <Download size={16} /> Save Final Video
                                </a>
                            ) : (
                                <button className="btn-primary" onClick={handleProcess} disabled={isProcessing || watermarks.length === 0} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                                    {isProcessing ? <><Loader2 size={16} className="spin" /> Rendering Filter ({progress}%)...</> : <><Layers size={16} /> Bake {watermarks.length} Watermark(s)</>}
                                </button>
                            )}
                            <button className="btn-secondary" onClick={() => { setVideoUrl(null); setVideoFile(null); setOutputUrl(null); setWatermarks([]); }} disabled={isProcessing} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                                <RotateCcw size={16} /> Start Over
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
