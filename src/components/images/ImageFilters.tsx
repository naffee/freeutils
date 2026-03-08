import { useState, useRef, useEffect } from 'react';
import { Dropzone } from '../shared/Dropzone.tsx';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import { Download, SlidersHorizontal, Image as ImageIcon, RotateCcw } from 'lucide-react';

export function ImageFilters() {
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [originalUrl, setOriginalUrl] = useState<string | null>(null);

    const [outputUrl, setOutputUrl] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [comparePosition, setComparePosition] = useState<number>(50);

    const ffmpegRef = useRef<FFmpeg | null>(null);
    const isProcessingRef = useRef(false);
    const needsUpdateRef = useRef(false);

    // --- State for Filters ---

    // Preset Filters
    const [activePreset, setActivePreset] = useState<string>('none');

    // Adjustments
    const [brightness, setBrightness] = useState<number>(0); // -1.0 to 1.0 (eq filter)
    const [contrast, setContrast] = useState<number>(1); // -2.0 to 2.0 (eq filter)
    const [saturation, setSaturation] = useState<number>(1); // 0.0 to 3.0 (eq filter)
    const [blur, setBlur] = useState<number>(0); // 0 to 20 (boxblur radius)
    const [sharpen, setSharpen] = useState<number>(0); // 0 to 5 (unsharp amount)
    const [enhance, setEnhance] = useState<number>(0); // 0 to 2 (vibrance intensity)

    useEffect(() => {
        const loadFFmpeg = async () => {
            const ffmpeg = new FFmpeg();
            // Silence logs for realtime slider dragging so console doesn't crash
            // ffmpeg.on('log', ({ message }) => console.log(message));
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

    const handleFileSelect = (file: File) => {
        setImageFile(file);
        setOriginalUrl(URL.createObjectURL(file));
        setOutputUrl(null);
        resetFilters();
    };

    const resetFilters = () => {
        setActivePreset('none');
        setBrightness(0);
        setContrast(1);
        setSaturation(1);
        setBlur(0);
        setSharpen(0);
        setEnhance(0);
    };

    const hasChanges = activePreset !== 'none' || brightness !== 0 || contrast !== 1 || saturation !== 1 || blur !== 0 || sharpen !== 0 || enhance !== 0;

    const configRef = useRef({ activePreset, brightness, contrast, saturation, blur, sharpen, enhance, hasChanges });
    useEffect(() => {
        configRef.current = { activePreset, brightness, contrast, saturation, blur, sharpen, enhance, hasChanges };
    }, [activePreset, brightness, contrast, saturation, blur, sharpen, enhance, hasChanges]);

    const runFFmpeg = async () => {
        if (!ffmpegRef.current || !ffmpegRef.current.loaded || !imageFile) return;

        if (isProcessingRef.current) {
            needsUpdateRef.current = true;
            return;
        }

        isProcessingRef.current = true;
        setIsProcessing(true);

        const ffmpeg = ffmpegRef.current;
        const ext = imageFile.name.split('.').pop() || 'png';
        const inputName = `input_${Date.now()}.${ext}`;
        const outputName = `output_${Date.now()}.${ext}`;

        try {
            await ffmpeg.writeFile(inputName, await fetchFile(imageFile));

            let filterChain: string[] = [];
            const config = configRef.current;

            // 1. Presets
            if (config.activePreset === 'grayscale') {
                filterChain.push('format=gray');
            } else if (config.activePreset === 'sepia') {
                filterChain.push('colorchannelmixer=.393:.769:.189:0:.349:.686:.168:0:.272:.534:.131:0');
            } else if (config.activePreset === 'invert') {
                filterChain.push('negate');
            }

            // 2. Adjustments
            if (config.brightness !== 0 || config.contrast !== 1 || config.saturation !== 1) {
                filterChain.push(`eq=brightness=${config.brightness}:contrast=${config.contrast}:saturation=${config.saturation}`);
            }

            // 3. Blur
            if (config.blur > 0) {
                filterChain.push(`boxblur=${config.blur}:1`);
            }

            // 4. Sharpen
            if (config.sharpen > 0) {
                // unsharp=lx:ly:la (luma spatial x, y, luma amount)
                filterChain.push(`unsharp=5:5:${config.sharpen}`);
            }

            // 5. Enhance (Vibrance)
            if (config.enhance > 0) {
                filterChain.push(`vibrance=intensity=${config.enhance}`);
            }

            const args = ['-i', inputName];

            if (filterChain.length > 0) {
                args.push('-vf', filterChain.join(','));
            }

            args.push('-qscale:v', '2');
            args.push(outputName);

            await ffmpeg.exec(args);

            const outputData = await ffmpeg.readFile(outputName);
            const blob = new Blob([outputData as any], { type: imageFile.type });
            const url = URL.createObjectURL(blob);

            setOutputUrl(url);

            await ffmpeg.deleteFile(inputName);
            await ffmpeg.deleteFile(outputName);
        } catch (e) {
            console.error("Filter failed:", e);
        } finally {
            isProcessingRef.current = false;
            setIsProcessing(false);

            if (needsUpdateRef.current) {
                needsUpdateRef.current = false;
                if (configRef.current.hasChanges) {
                    runFFmpeg();
                } else {
                    setOutputUrl(null);
                }
            }
        }
    };

    const handlePresetChange = (preset: string) => {
        setActivePreset(preset);
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            if (imageFile && hasChanges) {
                runFFmpeg();
            } else if (imageFile && !hasChanges) {
                setOutputUrl(null);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [activePreset, brightness, contrast, saturation, blur, sharpen, enhance, imageFile, hasChanges]);

    if (!originalUrl) {
        return (
            <div className="watermark-remover">
                <Dropzone onFileSelect={handleFileSelect} accept="image/*" title="Drop an image to apply filters" />
            </div>
        );
    }

    return (
        <div className="watermark-remover">
            <div className="editor-container" style={{ maxWidth: '1000px', margin: '0 auto' }}>
                <div style={{ display: 'flex', gap: '2rem', width: '100%', alignItems: 'stretch' }}>

                    {/* Left Column: Image Preview */}
                    <div style={{ flex: 1.5, display: 'flex', flexDirection: 'column', background: '#f8fafc', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0', position: 'relative' }}>

                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px', position: 'relative' }}>
                            <div style={{ position: 'relative', display: 'inline-block', maxWidth: '100%', maxHeight: '500px', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
                                {/* Bottom Image (Original) */}
                                <img
                                    src={originalUrl}
                                    alt="Original Preview"
                                    style={{
                                        maxWidth: '100%',
                                        maxHeight: '500px',
                                        display: 'block'
                                    }}
                                />

                                {/* Top Image (Filtered) */}
                                {hasChanges && outputUrl && (
                                    <img
                                        src={outputUrl}
                                        alt="Filtered Preview"
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: '100%',
                                            height: '100%',
                                            display: 'block',
                                            clipPath: `polygon(0 0, ${comparePosition}% 0, ${comparePosition}% 100%, 0 100%)`,
                                            transition: isProcessing ? 'opacity 0.2s' : 'none',
                                            opacity: isProcessing ? 0.7 : 1
                                        }}
                                    />
                                )}

                                {/* Compare Slider Line & Handle */}
                                {hasChanges && outputUrl && (
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
                                )}

                                {/* Invisible Slider Input for Interaction */}
                                {hasChanges && outputUrl && (
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
                                )}
                            </div>

                            {/* Overlaid Processing Indicator */}
                            {isProcessing && (
                                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'rgba(15, 23, 42, 0.7)', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '32px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', backdropFilter: 'blur(4px)' }}>
                                    <div className="spinner" style={{ width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                                    Applying...
                                </div>
                            )}
                        </div>

                        <div style={{ marginTop: '1rem', textAlign: 'center', color: '#64748b', fontSize: '0.9rem', fontWeight: 500, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>{imageFile?.name}</span>
                            {hasChanges && (
                                <button onClick={resetFilters} style={{ background: 'none', border: 'none', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                                    <RotateCcw size={14} /> Reset
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Controls */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                        {/* Presets Grid */}
                        <div style={{ background: '#ffffff', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                            <h4 style={{ margin: '0 0 1rem 0', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <ImageIcon size={18} color="#8b5cf6" /> Style Presets
                            </h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                <button
                                    onClick={() => handlePresetChange('none')}
                                    style={{ padding: '0.5rem', borderRadius: '8px', border: `1px solid ${activePreset === 'none' ? '#8b5cf6' : '#e2e8f0'}`, background: activePreset === 'none' ? '#f5f3ff' : '#f8fafc', color: activePreset === 'none' ? '#8b5cf6' : '#64748b', cursor: 'pointer', fontWeight: 500 }}
                                >
                                    Normal
                                </button>
                                <button
                                    onClick={() => handlePresetChange('grayscale')}
                                    style={{ padding: '0.5rem', borderRadius: '8px', border: `1px solid ${activePreset === 'grayscale' ? '#8b5cf6' : '#e2e8f0'}`, background: activePreset === 'grayscale' ? '#f5f3ff' : '#f8fafc', color: activePreset === 'grayscale' ? '#8b5cf6' : '#64748b', cursor: 'pointer', fontWeight: 500 }}
                                >
                                    Grayscale
                                </button>
                                <button
                                    onClick={() => handlePresetChange('sepia')}
                                    style={{ padding: '0.5rem', borderRadius: '8px', border: `1px solid ${activePreset === 'sepia' ? '#8b5cf6' : '#e2e8f0'}`, background: activePreset === 'sepia' ? '#f5f3ff' : '#f8fafc', color: activePreset === 'sepia' ? '#8b5cf6' : '#64748b', cursor: 'pointer', fontWeight: 500 }}
                                >
                                    Sepia
                                </button>
                                <button
                                    onClick={() => handlePresetChange('invert')}
                                    style={{ padding: '0.5rem', borderRadius: '8px', border: `1px solid ${activePreset === 'invert' ? '#8b5cf6' : '#e2e8f0'}`, background: activePreset === 'invert' ? '#f5f3ff' : '#f8fafc', color: activePreset === 'invert' ? '#8b5cf6' : '#64748b', cursor: 'pointer', fontWeight: 500 }}
                                >
                                    Invert Base
                                </button>
                            </div>
                        </div>

                        {/* Adjustments */}
                        <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <h4 style={{ margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <SlidersHorizontal size={18} color="#eb4898" /> Adjustments
                            </h4>

                            {/* Brightness (-1 to 1) */}
                            <div>
                                <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600, color: '#64748b', marginBottom: '0.5rem' }}>
                                    <span>Brightness</span>
                                    <span>{Math.round(brightness * 100)}</span>
                                </label>
                                <input
                                    type="range" min="-1" max="1" step="0.05"
                                    value={brightness}
                                    onChange={(e) => setBrightness(parseFloat(e.target.value))}
                                    style={{ width: '100%', accentColor: '#eb4898' }}
                                />
                            </div>

                            {/* Contrast (-2 to 2) - Normalized visually to -100 to 100 for user */}
                            <div>
                                <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600, color: '#64748b', marginBottom: '0.5rem' }}>
                                    <span>Contrast</span>
                                    <span>{Math.round((contrast - 1) * 100)}</span>
                                </label>
                                <input
                                    type="range" min="0" max="2" step="0.05"
                                    value={contrast}
                                    onChange={(e) => setContrast(parseFloat(e.target.value))}
                                    style={{ width: '100%', accentColor: '#eb4898' }}
                                />
                            </div>

                            {/* Saturation (0 to 3) */}
                            <div>
                                <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600, color: '#64748b', marginBottom: '0.5rem' }}>
                                    <span>Saturation</span>
                                    <span>{Math.round(saturation * 100)}%</span>
                                </label>
                                <input
                                    type="range" min="0" max="3" step="0.1"
                                    value={saturation}
                                    onChange={(e) => setSaturation(parseFloat(e.target.value))}
                                    style={{ width: '100%', accentColor: '#eb4898' }}
                                />
                            </div>

                            {/* Enhance (Vibrance) */}
                            <div>
                                <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600, color: '#64748b', marginBottom: '0.5rem' }}>
                                    <span>Enhance (Vibrance)</span>
                                    <span>{Math.round(enhance * 50)}%</span>
                                </label>
                                <input
                                    type="range" min="0" max="2" step="0.1"
                                    value={enhance}
                                    onChange={(e) => setEnhance(parseFloat(e.target.value))}
                                    style={{ width: '100%', accentColor: '#eb4898' }}
                                />
                            </div>

                            {/* Blur (0 to 20) */}
                            <div style={{ paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
                                <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600, color: '#64748b', marginBottom: '0.5rem' }}>
                                    <span>Box Blur Radius</span>
                                    <span>{blur}</span>
                                </label>
                                <input
                                    type="range" min="0" max="20" step="1"
                                    value={blur}
                                    onChange={(e) => setBlur(parseInt(e.target.value))}
                                    style={{ width: '100%', accentColor: '#eb4898' }}
                                />
                            </div>

                            {/* Sharpen (0 to 5) */}
                            <div>
                                <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600, color: '#64748b', marginBottom: '0.5rem' }}>
                                    <span>Sharpen Amount</span>
                                    <span>{Math.round(sharpen * 20)}%</span>
                                </label>
                                <input
                                    type="range" min="0" max="5" step="0.25"
                                    value={sharpen}
                                    onChange={(e) => setSharpen(parseFloat(e.target.value))}
                                    style={{ width: '100%', accentColor: '#eb4898' }}
                                />
                            </div>

                        </div>

                        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <a
                                href={hasChanges && outputUrl ? outputUrl : originalUrl}
                                download={`filtered_${imageFile?.name || 'image.png'}`}
                                className={`btn-primary ${isProcessing ? 'disabled' : ''}`}
                                style={{ textDecoration: 'none', justifyContent: 'center', pointerEvents: isProcessing ? 'none' : 'auto', opacity: isProcessing ? 0.7 : 1 }}
                            >
                                <Download size={18} /> Download Image
                            </a>
                            <button className="btn-secondary" onClick={() => { setOriginalUrl(null); setOutputUrl(null); setImageFile(null); }} style={{ width: '100%' }}>
                                Choose New Image
                            </button>
                        </div>

                    </div>
                </div>
            </div>
            {/* Minimal CSS for the loading spinner inside the component to avoid touching index.css right now */}
            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
