import { useState } from 'react';
import { Dropzone } from '../shared/Dropzone.tsx';
import { Download, SlidersHorizontal, RotateCcw } from 'lucide-react';
import { removeBackground, type Config } from '@imgly/background-removal';

export function ImageBackgroundRemover() {
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [originalUrl, setOriginalUrl] = useState<string | null>(null);
    const [outputUrl, setOutputUrl] = useState<string | null>(null);

    // UI State
    const [isProcessing, setIsProcessing] = useState(false);
    const [comparePosition, setComparePosition] = useState<number>(50);
    const [progress, setProgress] = useState<string>('');

    const handleFileSelect = async (file: File) => {
        setImageFile(file);
        setOriginalUrl(URL.createObjectURL(file));
        setOutputUrl(null);
        setComparePosition(50);
        await processImage(file);
    };

    const processImage = async (file: File) => {
        try {
            setIsProcessing(true);
            setProgress('Initializing AI Model...');

            // The first time this is run, it will download ~40MB of WASM and models unless cached.
            const config: Config = {
                progress: (key: string, current: number, total: number) => {
                    if (key.includes('fetch')) {
                        setProgress(`Downloading Model: ${Math.round((current / total) * 100)}%`);
                    } else if (key.includes('compute')) {
                        setProgress('Processing Image...');
                    }
                }
            };

            const blob = await removeBackground(file, config);
            setOutputUrl(URL.createObjectURL(blob));
        } catch (err) {
            console.error("Background Removal Failed", err);
            setProgress('Failed to process image.');
            setTimeout(() => setProgress(''), 3000);
        } finally {
            setIsProcessing(false);
            setProgress('');
        }
    };

    const handleDownload = () => {
        if (!outputUrl) return;
        const link = document.createElement('a');
        link.href = outputUrl;
        link.download = `nobg_${imageFile?.name || 'image.png'}`;
        link.click();
    };

    if (!originalUrl) {
        return (
            <div className="watermark-remover">
            <div className="seo-writeup">
                <h2>Remove Image Background</h2>
                <p>Instantly remove image backgrounds using advanced AI. Create transparent PNGs for your designs.</p>
            </div>
                <Dropzone onFileSelect={handleFileSelect} accept="image/*" title="Drop an image to remove its background" />
            </div>
        );
    }

    return (
        <div className="watermark-remover">
            <div className="seo-writeup">
                <h2>Remove Image Background</h2>
                <p>Instantly remove image backgrounds using advanced AI. Create transparent PNGs for your designs.</p>
            </div>
            <div className="editor-container" style={{ maxWidth: '1000px', margin: '0 auto' }}>

                {/* Header Actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', background: '#ffffff', padding: '1rem 1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <img src={originalUrl} alt="Original" style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '8px' }} />
                        <div>
                            <div style={{ fontWeight: 600, color: '#0f172a' }}>{imageFile?.name}</div>
                            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>AI Background Removal</div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button className="btn-secondary" onClick={() => { setOriginalUrl(null); setImageFile(null); setOutputUrl(null); }}>
                            <RotateCcw size={16} /> New Image
                        </button>
                        <button className="btn-primary" onClick={handleDownload} disabled={!outputUrl || isProcessing} style={{ background: '#22c55e', color: '#000', boxShadow: 'none', opacity: (!outputUrl || isProcessing) ? 0.5 : 1 }}>
                            <Download size={16} /> Save Transparent PNG
                        </button>
                    </div>
                </div>

                {/* Main Preview Area */}
                <div style={{ display: 'flex', flexDirection: 'column', background: '#f8fafc', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0', position: 'relative' }}>

                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '500px', position: 'relative' }}>
                        <div style={{ position: 'relative', display: 'inline-block', maxWidth: '100%', maxHeight: '600px', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>

                            {/* Checkerboard Pattern underneath (for transparent PNG testing) */}
                            <div style={{
                                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                                backgroundImage: 'linear-gradient(45deg, #e2e8f0 25%, transparent 25%), linear-gradient(-45deg, #e2e8f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e2e8f0 75%), linear-gradient(-45deg, transparent 75%, #e2e8f0 75%)',
                                backgroundSize: '20px 20px',
                                backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
                                backgroundColor: '#ffffff',
                                zIndex: 0
                            }}></div>

                            {/* Bottom Image (Processed PNG with transparency) */}
                            {outputUrl ? (
                                <img
                                    src={outputUrl}
                                    alt="Processed Preview"
                                    style={{
                                        maxWidth: '100%',
                                        maxHeight: '600px',
                                        display: 'block',
                                        position: 'relative',
                                        zIndex: 1
                                    }}
                                />
                            ) : undefined}

                            {/* Top Image (Original Image) masked by comparePosition */}
                            <img
                                src={originalUrl}
                                alt="Original Preview"
                                style={{
                                    position: outputUrl ? 'absolute' : 'relative',
                                    top: 0,
                                    left: 0,
                                    maxWidth: '100%',
                                    maxHeight: '600px',
                                    display: 'block',
                                    clipPath: outputUrl ? `polygon(0 0, ${comparePosition}% 0, ${comparePosition}% 100%, 0 100%)` : 'none',
                                    zIndex: 2,
                                    opacity: isProcessing ? 0.6 : 1,
                                    transition: 'opacity 0.2s'
                                }}
                            />

                            {/* Compare Slider Line & Handle */}
                            {outputUrl && (
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
                            {outputUrl && (
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
                            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'rgba(255,255,255,0.95)', padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: '16px', zIndex: 20, boxShadow: '0 10px 30px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' }}>
                                <div className="spinner" style={{ borderTopColor: '#8b5cf6', width: '40px', height: '40px', borderWidth: '4px', marginBottom: '1rem' }}></div>
                                <h3 style={{ margin: 0, color: '#0f172a' }}>{progress || 'Processing...'}</h3>
                                <p style={{ color: '#64748b', fontSize: '0.9rem', maxWidth: '300px', textAlign: 'center', marginTop: '0.5rem', lineHeight: 1.5 }}>The AI model runs entirely in your browser. This might take a few seconds.</p>
                            </div>
                        )}
                    </div>

                    {/* Help Text */}
                    {outputUrl && (
                        <div style={{ textAlign: 'center', marginTop: '1rem', color: '#64748b', fontSize: '0.9rem' }}>
                            Swipe left and right to compare the original image with the removed background.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
