import { useState, useRef, useEffect } from 'react';
import { Dropzone } from '../shared/Dropzone.tsx';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import { Wand2, Loader2, Download, RotateCcw, SlidersHorizontal } from 'lucide-react';

const PRESETS = [
    { id: 'none', label: 'Normal', cmd: '', css: 'none' },
    { id: 'grayscale', label: 'Grayscale', cmd: 'colorchannelmixer=.3:.4:.3:0:.3:.4:.3:0:.3:.4:.3', css: 'grayscale(100%)' },
    { id: 'sepia', label: 'Sepia', cmd: 'colorchannelmixer=.393:.769:.189:0:.349:.686:.168:0:.272:.534:.131', css: 'sepia(100%)' },
    { id: 'invert', label: 'Invert Colors', cmd: 'negate', css: 'invert(100%)' },
    { id: 'blur', label: 'Blur', cmd: 'boxblur=5:1', css: 'blur(5px)' },
    { id: 'brightness', label: 'High Brightness', cmd: 'eq=brightness=0.3', css: 'brightness(130%)' },
    { id: 'contrast', label: 'High Contrast', cmd: 'eq=contrast=2.0', css: 'contrast(200%)' },
    { id: 'vintage', label: 'Vintage', cmd: 'curves=vintage', css: 'sepia(50%) contrast(120%) saturate(80%) hue-rotate(-15deg)' },
];

export function VideoFilterAdder() {
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);

    const [selectedFilter, setSelectedFilter] = useState<string>(PRESETS[0].id);
    const [comparePosition, setComparePosition] = useState<number>(50);

    const video1Ref = useRef<HTMLVideoElement>(null);
    const video2Ref = useRef<HTMLVideoElement>(null);

    const [isProcessing, setIsProcessing] = useState(false);
    const [outputUrl, setOutputUrl] = useState<string | null>(null);

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
        setOutputUrl(null);
        setSelectedFilter(PRESETS[0].id);
    };

    const handlePlay = () => video2Ref.current?.play().catch(e => console.log(e));
    const handlePause = () => video2Ref.current?.pause();
    const syncVideos = (e: React.SyntheticEvent<HTMLVideoElement>) => {
        if (video2Ref.current && Math.abs(video2Ref.current.currentTime - e.currentTarget.currentTime) > 0.1) {
            video2Ref.current.currentTime = e.currentTarget.currentTime;
        }
    };

    const handleFilterChange = (id: string) => {
        setSelectedFilter(id);
        setOutputUrl(null);
    };

    const handleProcess = async () => {
        if (!videoFile || !ffmpegRef.current.loaded) return;

        setIsProcessing(true);
        setOutputUrl(null);

        const filterCmd = PRESETS.find(p => p.id === selectedFilter)?.cmd || '';
        if (!filterCmd) {
            setIsProcessing(false);
            return;
        }

        const ffmpeg = ffmpegRef.current;
        const inputName = `input.${videoFile.name.split('.').pop()}`;
        const outputExt = videoFile.name.split('.').pop()?.toLowerCase() || 'mp4';
        const outputName = `filtered_output.${outputExt}`;

        try {
            await ffmpeg.writeFile(inputName, await fetchFile(videoFile));

            await ffmpeg.exec([
                '-i', inputName,
                '-vf', filterCmd,
                '-c:a', 'copy',
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
            console.error("Filter injection failed:", error);
            alert("Failed to inject filter. See console for details.");
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
                <Dropzone onFileSelect={handleFileSelect} accept="video/*" title="Drop a video to Apply Filter" />
            </div>
        );
    }

    return (
        <div className="watermark-remover">
            <div className="editor-container" style={{ maxWidth: '1000px', margin: '0 auto' }}>
                <div style={{ display: 'flex', gap: '2rem', width: '100%', alignItems: 'stretch' }}>

                    {/* Left Column: Player */}
                    <div style={{ flex: 1.5, display: 'flex', flexDirection: 'column', background: '#f8fafc', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0', position: 'relative' }}>
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px', position: 'relative' }}>
                            <div style={{ position: 'relative', display: 'inline-block', maxWidth: '100%', maxHeight: '500px', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', background: '#000' }}>
                                <video
                                    ref={video1Ref}
                                    src={outputUrl || videoUrl}
                                    controls
                                    onPlay={handlePlay}
                                    onPause={handlePause}
                                    onSeeked={syncVideos}
                                    onTimeUpdate={syncVideos}
                                    style={{
                                        maxWidth: '100%',
                                        maxHeight: '500px',
                                        display: 'block'
                                    }}
                                />

                                {/* Top Filtered Video Overlay (Only visible before processing and if a filter is selected) */}
                                {selectedFilter !== 'none' && !outputUrl && (
                                    <>
                                        <video
                                            ref={video2Ref}
                                            src={videoUrl}
                                            muted
                                            style={{
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'fill',
                                                display: 'block',
                                                filter: PRESETS.find(p => p.id === selectedFilter)?.css || 'none',
                                                clipPath: `polygon(0 0, ${comparePosition}% 0, ${comparePosition}% 100%, 0 100%)`,
                                                pointerEvents: 'none'
                                            }}
                                        />

                                        {/* Compare Slider Line & Handle */}
                                        <div style={{
                                            position: 'absolute',
                                            top: 0,
                                            bottom: 0,
                                            left: `${comparePosition}%`,
                                            width: '2px',
                                            background: 'white',
                                            transform: 'translateX(-50%)',
                                            pointerEvents: 'none',
                                            boxShadow: '0 0 10px rgba(0,0,0,0.3)',
                                            zIndex: 5,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            <div style={{ width: '28px', height: '28px', background: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.3)', color: '#8b5cf6' }}>
                                                <SlidersHorizontal size={14} />
                                            </div>
                                        </div>

                                        {/* Invisible Slider Input for Interaction */}
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={comparePosition}
                                            onChange={(e) => setComparePosition(parseInt(e.target.value))}
                                            style={{
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                width: '100%',
                                                height: '100%',
                                                opacity: 0,
                                                cursor: 'ew-resize',
                                                zIndex: 10,
                                                margin: 0
                                            }}
                                        />
                                    </>
                                )}
                            </div>

                            {/* Overlaid Processing Indicator */}
                            {isProcessing && (
                                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'rgba(15, 23, 42, 0.7)', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '32px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', backdropFilter: 'blur(4px)', zIndex: 20 }}>
                                    <Loader2 size={18} className="spin" />
                                    Baking Filter...
                                </div>
                            )}
                        </div>
                        {outputUrl && !isProcessing && (
                            <p style={{ textAlign: 'center', marginTop: '1rem', color: '#16a34a', fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                <Wand2 size={16} /> Filter baked successfully
                            </p>
                        )}
                    </div>

                    {/* Right Column: Settings & Actions */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                        <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <h4 style={{ margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                Visual Filters
                            </h4>

                            <div className="control-group">
                                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.5rem' }}>Select Filter</label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                    {PRESETS.map((preset) => (
                                        <button
                                            key={preset.id}
                                            onClick={() => handleFilterChange(preset.id)}
                                            style={{
                                                padding: '0.75rem',
                                                borderRadius: '8px',
                                                border: `1px solid ${selectedFilter === preset.id ? '#8b5cf6' : '#e2e8f0'}`,
                                                background: selectedFilter === preset.id ? '#f3e8ff' : '#fff',
                                                color: selectedFilter === preset.id ? '#6d28d9' : '#475569',
                                                fontWeight: 500,
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                textAlign: 'center',
                                                fontSize: '0.85rem'
                                            }}
                                        >
                                            {preset.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                        </div>

                        {/* Core Actions */}
                        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {outputUrl ? (
                                <a
                                    href={outputUrl}
                                    download={`filtered_${videoFile?.name || 'video'}`}
                                    className="btn-primary"
                                    style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}
                                >
                                    <Download size={16} /> Save Video
                                </a>
                            ) : (
                                <button className="btn-primary" onClick={handleProcess} disabled={isProcessing || selectedFilter === 'none'} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                                    {isProcessing ? <><Loader2 size={16} className="spin" /> Processing Filter...</> : <><Wand2 size={16} /> Bake Filter Now</>}
                                </button>
                            )}
                            <button className="btn-secondary" onClick={() => { setVideoUrl(null); setVideoFile(null); setOutputUrl(null); }} disabled={isProcessing} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                                <RotateCcw size={16} /> Map Another File
                            </button>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
