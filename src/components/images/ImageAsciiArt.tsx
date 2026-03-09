import { useState, useRef, useEffect } from 'react';
import { Dropzone } from '../shared/Dropzone.tsx';
import { Download, Copy, Check, Type, RotateCcw } from 'lucide-react';

// ASCII character sets from darkest (dense) to lightest (sparse)
// We provide a few options for different looks
const ASCII_SETS = {
    standard: '@%#*+=-:. ',
    detailed: "$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,\"^`'. ",
    blocks: '██▓▓▒▒░░  ',
    binary: '10 '
};

type CharSetType = keyof typeof ASCII_SETS;

export function ImageAsciiArt() {
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [originalUrl, setOriginalUrl] = useState<string | null>(null);
    const [asciiArt, setAsciiArt] = useState<string>('');

    // Settings
    const [resolution, setResolution] = useState<number>(100); // characters wide
    const [charSet, setCharSet] = useState<CharSetType>('standard');
    const [invert, setInvert] = useState<boolean>(false);
    const [contrast, setContrast] = useState<number>(1); // 0.5 to 2.0

    // UI State
    const [copied, setCopied] = useState(false);

    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    const handleFileSelect = (file: File) => {
        setImageFile(file);
        setOriginalUrl(URL.createObjectURL(file));
        setAsciiArt('');
        setResolution(100);
        setCharSet('standard');
        setInvert(false);
        setContrast(1);
    };

    const generateAscii = () => {
        if (!originalUrl || !canvasRef.current) return;

        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => {
            const canvas = canvasRef.current!;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (!ctx) return;

            // Calculate new dimensions maintaining aspect ratio. 
            // Note: terminal characters are usually twice as tall as they are wide.
            // So we scale the height by 0.5 to compensate, otherwise the image looks stretched vertically.
            const aspectRatio = img.height / img.width;
            const fontAspectRatioAdjustment = 0.5; // typical monospace font is ~2:1 height:width
            const newWidth = resolution;
            const newHeight = Math.floor(newWidth * aspectRatio * fontAspectRatioAdjustment);

            canvas.width = newWidth;
            canvas.height = newHeight;

            // Draw and scale image
            ctx.drawImage(img, 0, 0, newWidth, newHeight);

            // Get pixel data
            const imageData = ctx.getImageData(0, 0, newWidth, newHeight);
            const data = imageData.data;

            let chars = ASCII_SETS[charSet];
            if (invert) {
                chars = chars.split('').reverse().join('');
            }

            let asciiStr = '';

            for (let y = 0; y < newHeight; y++) {
                for (let x = 0; x < newWidth; x++) {
                    const offset = (y * newWidth + x) * 4;
                    const r = data[offset];
                    const g = data[offset + 1];
                    const b = data[offset + 2];
                    const a = data[offset + 3];

                    if (a === 0) {
                        // Transparent background -> map to lightest char
                        asciiStr += chars[chars.length - 1];
                        continue;
                    }

                    // Calculate perceived luminance (standard formula)
                    let luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

                    // Apply Contrast
                    // mapping [0,1] -> centering around 0.5
                    luminance = (luminance - 0.5) * contrast + 0.5;
                    // Clamp
                    luminance = Math.max(0, Math.min(1, luminance));

                    // Map luminance to character index
                    // 0 = darkest (first char), 1 = lightest (last char)
                    const charIndex = Math.floor(luminance * (chars.length - 1));
                    asciiStr += chars[charIndex];
                }
                asciiStr += '\n'; // End of row
            }

            setAsciiArt(asciiStr);
        };
        img.src = originalUrl;
    };

    // Re-run generation when settings change (debounced slightly)
    useEffect(() => {
        const timer = setTimeout(() => {
            if (originalUrl) {
                generateAscii();
            }
        }, 150);
        return () => clearTimeout(timer);
    }, [originalUrl, resolution, charSet, invert, contrast]);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(asciiArt);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy text', err);
        }
    };

    const handleDownloadTxt = () => {
        const blob = new Blob([asciiArt], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `ascii_${imageFile?.name.split('.')[0] || 'art'}.txt`;
        link.click();
        URL.revokeObjectURL(url);
    };

    if (!originalUrl) {
        return (
            <div className="watermark-remover">
            <div className="seo-writeup">
                <h2>Image to ASCII Art</h2>
                <p>Transform any colorful image into retro-style text-based ASCII art effortlessly.</p>
            </div>
                <Dropzone onFileSelect={handleFileSelect} accept="image/*" title="Drop an image to generate ASCII Art" />
            </div>
        );
    }

    return (
        <div className="watermark-remover">
            <div className="seo-writeup">
                <h2>Image to ASCII Art</h2>
                <p>Transform any colorful image into retro-style text-based ASCII art effortlessly.</p>
            </div>
            {/* Hidden canvas for processing */}
            <canvas ref={canvasRef} style={{ display: 'none' }} />

            <div className="editor-container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{ display: 'flex', gap: '2rem', width: '100%', alignItems: 'stretch' }}>

                    {/* Left Column: Output Preview */}
                    <div style={{ flex: 1.5, display: 'flex', flexDirection: 'column', background: '#0f172a', padding: '1.5rem', borderRadius: '16px', border: '1px solid #1e293b', position: 'relative', overflow: 'hidden' }}>

                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '500px', overflow: 'auto', background: '#000', borderRadius: '8px', padding: '1rem' }}>

                            {asciiArt ? (
                                <pre style={{
                                    margin: 0,
                                    fontFamily: '"Fira Code", "Courier New", Courier, monospace',
                                    fontSize: '8px', // Very small to fit
                                    lineHeight: '8px', // Must match font size exactly for square "pixels"
                                    letterSpacing: '0px',
                                    color: '#22c55e', // matrix green
                                    whiteSpace: 'pre',
                                    textAlign: 'left'
                                }}>
                                    {asciiArt}
                                </pre>
                            ) : (
                                <div style={{ color: '#64748b' }}>Generating...</div>
                            )}

                        </div>

                        <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                            <button onClick={handleCopy} className="btn-secondary" style={{ background: '#1e293b', border: '1px solid #334155', color: '#f8fafc', padding: '0.5rem 1rem' }}>
                                {copied ? <Check size={16} color="#22c55e" /> : <Copy size={16} />}
                                {copied ? 'Copied!' : 'Copy Text'}
                            </button>
                            <button onClick={handleDownloadTxt} className="btn-primary" style={{ background: '#22c55e', color: '#000', boxShadow: 'none' }}>
                                <Download size={16} /> Save .txt
                            </button>
                        </div>
                    </div>

                    {/* Right Column: Controls */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                        {/* Thumbnail Original */}
                        <div style={{ background: '#ffffff', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <img src={originalUrl} alt="Original" style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '8px' }} />
                            <div style={{ overflow: 'hidden' }}>
                                <div style={{ fontWeight: 600, color: '#0f172a', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>{imageFile?.name}</div>
                                <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Original Reference</div>
                            </div>
                        </div>

                        {/* Controls Box */}
                        <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <h4 style={{ margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Type size={18} color="#8b5cf6" /> Art Settings
                            </h4>

                            {/* Character Dataset Profile */}
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#64748b', marginBottom: '0.5rem' }}>Character Set Style</label>
                                <select
                                    value={charSet}
                                    onChange={(e) => setCharSet(e.target.value as CharSetType)}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#0f172a', outline: 'none', cursor: 'pointer' }}
                                >
                                    <option value="standard">Standard (@%#*+=-:. )</option>
                                    <option value="detailed">Detailed (70+ characters)</option>
                                    <option value="blocks">Solid Blocks (ANSI)</option>
                                    <option value="binary">Binary (1 0)</option>
                                </select>
                            </div>

                            {/* Resolution (Width in chars) */}
                            <div>
                                <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600, color: '#64748b', marginBottom: '0.5rem' }}>
                                    <span>Resolution (Columns)</span>
                                    <span>{resolution} chars</span>
                                </label>
                                <input
                                    type="range" min="30" max="300" step="5"
                                    value={resolution}
                                    onChange={(e) => setResolution(parseInt(e.target.value))}
                                    style={{ width: '100%', accentColor: '#8b5cf6' }}
                                />
                                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>Higher resolution requires zooming out to view correctly.</div>
                            </div>

                            {/* Contrast */}
                            <div>
                                <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600, color: '#64748b', marginBottom: '0.5rem' }}>
                                    <span>Contrast Tuning</span>
                                    <span>{Math.round(contrast * 100)}%</span>
                                </label>
                                <input
                                    type="range" min="0.5" max="2.0" step="0.1"
                                    value={contrast}
                                    onChange={(e) => setContrast(parseFloat(e.target.value))}
                                    style={{ width: '100%', accentColor: '#8b5cf6' }}
                                />
                            </div>

                            {/* Invert */}
                            <div style={{ paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600, color: '#0f172a' }}>
                                    <input
                                        type="checkbox"
                                        checked={invert}
                                        onChange={(e) => setInvert(e.target.checked)}
                                        style={{ width: '18px', height: '18px', accentColor: '#8b5cf6', cursor: 'pointer' }}
                                    />
                                    Invert Dark/Light Mapping
                                </label>
                                <div style={{ fontSize: '0.8rem', color: '#64748b', marginLeft: '28px', marginTop: '0.25rem' }}>
                                    Useful if copying text onto a white background (e.g. Notepad).
                                </div>
                            </div>

                        </div>

                        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <button className="btn-secondary" onClick={() => { setOriginalUrl(null); setImageFile(null); }} style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                                <RotateCcw size={16} /> Convert Another Image
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
