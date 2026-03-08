import { useState, useRef, useEffect } from 'react';
import { Dropzone } from '../shared/Dropzone.tsx';
import { Download, RotateCcw } from 'lucide-react';

export function ImageMemeGenerator() {
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [originalUrl, setOriginalUrl] = useState<string | null>(null);

    // Meme Data
    const [topText, setTopText] = useState('WHEN YOU FINALLY FIX');
    const [bottomText, setBottomText] = useState('THAT ONE CSS BUG');

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

    const drawMeme = () => {
        if (!imageObj || !canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // 1. Set Canvas size to match image natively
        canvas.width = imageObj.width;
        canvas.height = imageObj.height;

        // 2. Draw Image
        ctx.drawImage(imageObj, 0, 0);

        // 3. Setup Classic Meme Font Style
        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'black';
        ctx.textAlign = 'center';

        // Scale stroke thickness based on image size
        ctx.lineWidth = Math.max(2, Math.floor(canvas.width / 150));

        // Helper to draw wrapped centered text
        const drawText = (text: string, yPos: 'top' | 'bottom') => {
            const lines = text.toUpperCase().split('\\n');
            const padding = canvas.height * 0.05;

            // Dynamic font sizing (start at 1/8th height, shrink until fits)
            let fontSize = Math.floor(canvas.height / 8);
            ctx.font = `900 ${fontSize}px Impact, config, sans-serif`;

            // Measure longest line
            let maxWidth = 0;
            lines.forEach(line => {
                const width = ctx.measureText(line).width;
                if (width > maxWidth) maxWidth = width;
            });

            // Shrink if it exceeds canvas width (with 5% padding on each side)
            while (maxWidth > canvas.width * 0.9 && fontSize > 12) {
                fontSize -= 2;
                ctx.font = `900 ${fontSize}px Impact, config, sans-serif`;

                maxWidth = 0;
                lines.forEach(line => {
                    const width = ctx.measureText(line).width;
                    if (width > maxWidth) maxWidth = width;
                });
            }

            // Draw
            const totalTextHeight = lines.length * fontSize;
            let startY = yPos === 'top'
                ? padding + (fontSize * 0.8) // approx ascender height
                : canvas.height - padding - totalTextHeight + (fontSize * 0.8);

            lines.forEach(line => {
                ctx.strokeText(line, canvas.width / 2, startY);
                ctx.fillText(line, canvas.width / 2, startY);
                startY += fontSize; // Line height
            });
        };

        if (topText) drawText(topText, 'top');
        if (bottomText) drawText(bottomText, 'bottom');
    };

    // Redraw whenever inputs or image changes
    useEffect(() => {
        drawMeme();
    }, [imageObj, topText, bottomText]);

    const handleDownload = () => {
        if (!canvasRef.current) return;
        const url = canvasRef.current.toDataURL('image/jpeg', 0.9);
        const link = document.createElement('a');
        link.href = url;
        link.download = `meme_${imageFile?.name || 'image.jpg'}`;
        link.click();
    };

    if (!originalUrl) {
        return (
            <div className="watermark-remover">
                <Dropzone onFileSelect={handleFileSelect} accept="image/*" title="Drop an image to generate a Meme" />
            </div>
        );
    }

    return (
        <div className="watermark-remover">
            <div className="editor-container" style={{ maxWidth: '1000px', margin: '0 auto' }}>
                <div style={{ display: 'flex', gap: '2rem', width: '100%', alignItems: 'stretch' }}>

                    {/* Left Column: Canvas Preview */}
                    <div style={{ flex: 1.5, display: 'flex', flexDirection: 'column', background: '#f8fafc', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>

                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px', position: 'relative' }}>
                            <div style={{ position: 'relative', display: 'inline-block', maxWidth: '100%', maxHeight: '600px', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
                                <canvas
                                    ref={canvasRef}
                                    style={{
                                        maxWidth: '100%',
                                        maxHeight: '600px',
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
                                Meme Text Settings
                            </h4>

                            <div>
                                <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600, color: '#64748b', marginBottom: '0.5rem' }}>
                                    <span>Top Text</span>
                                </label>
                                <input
                                    type="text"
                                    value={topText}
                                    onChange={(e) => setTopText(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        boxSizing: 'border-box',
                                        border: '1px solid #cbd5e1',
                                        borderRadius: '8px',
                                        fontFamily: 'inherit',
                                        fontSize: '0.95rem'
                                    }}
                                    placeholder="e.g., WHEN YOU REALIZE"
                                />
                            </div>

                            <div>
                                <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600, color: '#64748b', marginBottom: '0.5rem' }}>
                                    <span>Bottom Text</span>
                                </label>
                                <input
                                    type="text"
                                    value={bottomText}
                                    onChange={(e) => setBottomText(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        boxSizing: 'border-box',
                                        border: '1px solid #cbd5e1',
                                        borderRadius: '8px',
                                        fontFamily: 'inherit',
                                        fontSize: '0.95rem'
                                    }}
                                    placeholder="e.g., IT'S ALREADY MONDAY"
                                />
                            </div>

                            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem', lineHeight: 1.4 }}>
                                The text automatically scales to fit the graphic. It uses the legendary 'Impact' font stack.
                            </div>
                        </div>


                        {/* Action Buttons */}
                        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <button className="btn-secondary" onClick={() => { setOriginalUrl(null); setImageFile(null); }} style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                                <RotateCcw size={16} /> Choose New Image
                            </button>
                            <button className="btn-primary" onClick={handleDownload} style={{ background: '#22c55e', color: '#000', boxShadow: 'none', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                                <Download size={16} /> Download Meme
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
