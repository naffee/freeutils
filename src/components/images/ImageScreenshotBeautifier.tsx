import { useState, useRef, useEffect } from 'react';
import { Dropzone } from '../shared/Dropzone.tsx';
import { Download, RotateCcw } from 'lucide-react';

// Preset beautiful CSS-like gradients
const GRADIENTS = [
    { name: 'Aurora', css: 'linear-gradient(135deg, #8BC6EC 0%, #9599E2 100%)', stops: [{ color: '#8BC6EC', pos: 0 }, { color: '#9599E2', pos: 1 }] },
    { name: 'Sunset', css: 'linear-gradient(135deg, #FF9A9E 0%, #FECFEF 99%, #FECFEF 100%)', stops: [{ color: '#FF9A9E', pos: 0 }, { color: '#FECFEF', pos: 1 }] },
    { name: 'Ocean', css: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)', stops: [{ color: '#a18cd1', pos: 0 }, { color: '#fbc2eb', pos: 1 }] },
    { name: 'Cyberpunk', css: 'linear-gradient(135deg, #ff0844 0%, #ffb199 100%)', stops: [{ color: '#ff0844', pos: 0 }, { color: '#ffb199', pos: 1 }] },
    { name: 'Emerald', css: 'linear-gradient(135deg, #10b981 0%, #047857 100%)', stops: [{ color: '#10b981', pos: 0 }, { color: '#047857', pos: 1 }] },
    { name: 'Dark Mode', css: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', stops: [{ color: '#1e293b', pos: 0 }, { color: '#0f172a', pos: 1 }] },
    { name: 'Transparent', css: 'transparent', stops: [] }
];

export function ImageScreenshotBeautifier() {
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [originalUrl, setOriginalUrl] = useState<string | null>(null);

    // Beautifier State
    const [activeGradientIdx, setActiveGradientIdx] = useState(0);
    const [paddingScale, setPaddingScale] = useState(0.15); // Percentage of image width (0-0.4)
    const [borderRadius, setBorderRadius] = useState(16); // px
    const [shadowSpread, setShadowSpread] = useState(30);
    const [shadowOpacity, setShadowOpacity] = useState(0.3);
    const [showMacTitleBar, setShowMacTitleBar] = useState(true);

    // UI State
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [imageObj, setImageObj] = useState<HTMLImageElement | null>(null);

    const handleFileSelect = (file: File) => {
        setImageFile(file);
        const url = URL.createObjectURL(file);
        setOriginalUrl(url);

        const img = new Image();
        img.onload = () => {
            setImageObj(img);
        };
        img.src = url;
    };

    // Helper: Draw a rounded rectangle Path
    const roundRectPath = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
        if (w < 2 * r) r = w / 2;
        if (h < 2 * r) r = h / 2;
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
    };

    const drawCanvas = () => {
        if (!imageObj || !canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // 1. Calculate Dimensions
        const imgW = imageObj.width;
        const imgH = imageObj.height;
        const paddingPx = Math.floor(imgW * paddingScale);

        // Final canvas includes padding on all sides
        canvas.width = imgW + (paddingPx * 2);

        // If macOS Title bar is true, we artificially add height to the "image" container
        const titleBarHeight = showMacTitleBar ? Math.max(24, Math.floor(imgW * 0.04)) : 0;
        const combinedInnerHeight = imgH + titleBarHeight;

        canvas.height = combinedInnerHeight + (paddingPx * 2);

        // 2. Draw Background
        ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear for 'transparent'
        const gradientRef = GRADIENTS[activeGradientIdx];

        if (gradientRef.stops.length > 0) {
            const grd = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
            gradientRef.stops.forEach(s => grd.addColorStop(s.pos, s.color));
            ctx.fillStyle = grd;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        // Inner rect coords
        const innerX = paddingPx;
        const innerY = paddingPx;

        // 3. Draw Shadow
        // We do this by drawing the rounded rect shape filled with a shadow color, then blurring it
        ctx.save();
        ctx.shadowColor = `rgba(0, 0, 0, ${shadowOpacity})`;
        ctx.shadowBlur = shadowSpread;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = shadowSpread * 0.4; // Slightly offset downward

        roundRectPath(ctx, innerX, innerY, imgW, combinedInnerHeight, borderRadius);
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.fill(); // This draws the shadow
        ctx.restore();

        // 4. Clip Inner Content (so the image + titlebar have rounded corners globally)
        ctx.save();
        roundRectPath(ctx, innerX, innerY, imgW, combinedInnerHeight, borderRadius);
        ctx.clip();

        // 5. Draw macOS Title Bar (if enabled)
        if (showMacTitleBar) {
            // Title bar background
            ctx.fillStyle = '#dbdcdf'; // Classic light gray (could be dark depending on gradient, keeping simple for now)
            ctx.fillRect(innerX, innerY, imgW, titleBarHeight);

            // The three macOS dots (Red, Yellow, Green)
            const dotRadius = titleBarHeight * 0.18;
            const dotY = innerY + (titleBarHeight / 2);
            let dotX = innerX + (titleBarHeight * 0.6); // Start padding
            const dotSpacing = dotRadius * 3;

            // Red
            ctx.beginPath(); ctx.arc(dotX, dotY, dotRadius, 0, Math.PI * 2); ctx.fillStyle = '#ff5f56'; ctx.fill();
            // Yellow
            dotX += dotSpacing;
            ctx.beginPath(); ctx.arc(dotX, dotY, dotRadius, 0, Math.PI * 2); ctx.fillStyle = '#ffbd2e'; ctx.fill();
            // Green
            dotX += dotSpacing;
            ctx.beginPath(); ctx.arc(dotX, dotY, dotRadius, 0, Math.PI * 2); ctx.fillStyle = '#27c93f'; ctx.fill();
        }

        // 6. Draw the actual screenshot below the titlebar
        ctx.drawImage(imageObj, innerX, innerY + titleBarHeight, imgW, imgH);

        // End Clipping
        ctx.restore();
    };

    // Redraw whenever inputs or image changes
    useEffect(() => {
        drawCanvas();
    }, [imageObj, activeGradientIdx, paddingScale, borderRadius, shadowSpread, shadowOpacity, showMacTitleBar]);


    const handleDownload = () => {
        if (!canvasRef.current) return;
        // Download as PNG to preserve transparency if selected
        const url = canvasRef.current.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = url;
        link.download = `beautified_${imageFile?.name || 'screenshot.png'}`;
        link.click();
    };

    if (!originalUrl) {
        return (
            <div className="watermark-remover">
            <div className="seo-writeup">
                <h2>Screenshot Beautifier</h2>
                <p>Enhance your raw screenshots with beautiful browser mockups, custom backgrounds, and aesthetic shadows.</p>
            </div>
                <Dropzone onFileSelect={handleFileSelect} accept="image/*" title="Drop a screenshot to Beautify it" />
            </div>
        );
    }

    return (
        <div className="watermark-remover">
            <div className="seo-writeup">
                <h2>Screenshot Beautifier</h2>
                <p>Enhance your raw screenshots with beautiful browser mockups, custom backgrounds, and aesthetic shadows.</p>
            </div>
            <div className="editor-container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{ display: 'flex', gap: '2rem', width: '100%', alignItems: 'stretch' }}>

                    {/* Left Column: Canvas Preview */}
                    <div style={{ flex: 1.8, display: 'flex', flexDirection: 'column', background: '#f8fafc', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>

                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px', position: 'relative' }}>
                            {/* Checkerboard background wrapper for transparent previews */}
                            <div style={{
                                position: 'relative',
                                display: 'inline-block',
                                maxWidth: '100%',
                                maxHeight: '700px',
                                borderRadius: '12px',
                                overflow: 'hidden',
                                boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                                backgroundImage: GRADIENTS[activeGradientIdx].name === 'Transparent' ? 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(135deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(135deg, transparent 75%, #ccc 75%)' : 'none',
                                backgroundSize: '20px 20px',
                                backgroundPosition: '0 0, 10px 0, 10px -10px, 0px 10px'
                            }}>
                                <canvas
                                    ref={canvasRef}
                                    style={{
                                        maxWidth: '100%',
                                        maxHeight: '700px',
                                        display: 'block',
                                        width: 'auto',
                                        height: 'auto'
                                    }}
                                />
                            </div>
                        </div>

                    </div>

                    {/* Right Column: Controls */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                        <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                            <h4 style={{ margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                Background Theme
                            </h4>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                                {GRADIENTS.map((grad, i) => (
                                    <button
                                        key={grad.name}
                                        onClick={() => setActiveGradientIdx(i)}
                                        title={grad.name}
                                        style={{
                                            height: '36px',
                                            borderRadius: '8px',
                                            background: grad.css,
                                            border: activeGradientIdx === i ? '2px solid #8b5cf6' : '2px solid transparent',
                                            cursor: 'pointer',
                                            boxShadow: activeGradientIdx === i ? '0 0 0 2px rgba(139, 92, 246, 0.2)' : 'none',
                                            padding: 0
                                        }}
                                        aria-label={grad.name}
                                    />
                                ))}
                            </div>

                            <hr style={{ border: 0, borderTop: '1px solid #e2e8f0', margin: '0.5rem 0' }} />

                            <h4 style={{ margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                Frame Settings
                            </h4>

                            <div>
                                <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600, color: '#64748b', marginBottom: '0.5rem' }}>
                                    <span>Background Padding</span>
                                </label>
                                <input
                                    type="range" min="0" max="0.4" step="0.02"
                                    value={paddingScale}
                                    onChange={(e) => setPaddingScale(parseFloat(e.target.value))}
                                    style={{ width: '100%', accentColor: '#8b5cf6' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600, color: '#64748b', marginBottom: '0.5rem' }}>
                                    <span>Border Radius</span>
                                    <span>{borderRadius}px</span>
                                </label>
                                <input
                                    type="range" min="0" max="100" step="1"
                                    value={borderRadius}
                                    onChange={(e) => setBorderRadius(parseInt(e.target.value))}
                                    style={{ width: '100%', accentColor: '#8b5cf6' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600, color: '#64748b', marginBottom: '0.5rem' }}>
                                    <span>Drop Shadow Spread</span>
                                </label>
                                <input
                                    type="range" min="0" max="150" step="5"
                                    value={shadowSpread}
                                    onChange={(e) => setShadowSpread(parseInt(e.target.value))}
                                    style={{ width: '100%', accentColor: '#8b5cf6' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600, color: '#64748b', marginBottom: '0.5rem' }}>
                                    <span>Drop Shadow Opacity</span>
                                </label>
                                <input
                                    type="range" min="0" max="1" step="0.05"
                                    value={shadowOpacity}
                                    onChange={(e) => setShadowOpacity(parseFloat(e.target.value))}
                                    style={{ width: '100%', accentColor: '#8b5cf6' }}
                                />
                            </div>

                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', fontSize: '0.9rem', color: '#334155', fontWeight: 500, padding: '0.5rem 0' }}>
                                <input
                                    type="checkbox"
                                    checked={showMacTitleBar}
                                    onChange={(e) => setShowMacTitleBar(e.target.checked)}
                                    style={{ width: '16px', height: '16px', accentColor: '#8b5cf6' }}
                                />
                                Enable macOS Title Bar Layer
                            </label>

                        </div>

                        {/* Action Buttons */}
                        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <button className="btn-secondary" onClick={() => { setOriginalUrl(null); setImageFile(null); }} style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                                <RotateCcw size={16} /> Choose New Image
                            </button>
                            <button className="btn-primary" onClick={handleDownload} style={{ background: '#22c55e', color: '#000', boxShadow: 'none', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                                <Download size={16} /> Download Graphic
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
