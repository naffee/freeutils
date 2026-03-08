import { useState, useRef, useEffect } from 'react';
import { Dropzone } from '../shared/Dropzone.tsx';
import { Check, Palette, RotateCcw } from 'lucide-react';

type RGB = [number, number, number];

interface ColorCluster {
    center: RGB;
    points: RGB[];
}

export function ImageColorExtractor() {
    const [originalUrl, setOriginalUrl] = useState<string | null>(null);
    const [palette, setPalette] = useState<RGB[]>([]);

    // Settings
    const [colorCount, setColorCount] = useState<number>(5);
    const [isExtracting, setIsExtracting] = useState(false);

    // UI State
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    const handleFileSelect = (file: File) => {
        setOriginalUrl(URL.createObjectURL(file));
        setPalette([]);
    };

    // Very basic K-Means implementation for RGB colors
    const extractDominantColors = (imageData: Uint8ClampedArray, k: number): RGB[] => {
        // 1. Gather all pixels (skip alpha for performance, jump by 4)
        const pixels: RGB[] = [];
        for (let i = 0; i < imageData.length; i += 4) {
            // Ignore fully transparent pixels
            if (imageData[i + 3] > 0) {
                pixels.push([imageData[i], imageData[i + 1], imageData[i + 2]]);
            }
        }

        if (pixels.length === 0) return [];

        // 2. Initialize k random centers
        let clusters: ColorCluster[] = Array.from({ length: k }, () => {
            const randomPixel = pixels[Math.floor(Math.random() * pixels.length)];
            return { center: [...randomPixel] as RGB, points: [] };
        });

        const maxIterations = 10;

        for (let iter = 0; iter < maxIterations; iter++) {
            // Clear points from previous iteration
            clusters.forEach(c => c.points = []);

            // 3. Assign each pixel to the nearest cluster
            for (const pixel of pixels) {
                let minDist = Infinity;
                let clusterIndex = 0;

                for (let j = 0; j < k; j++) {
                    const center = clusters[j].center;
                    // Euclidean distance squared
                    const dist = (pixel[0] - center[0]) ** 2 +
                        (pixel[1] - center[1]) ** 2 +
                        (pixel[2] - center[2]) ** 2;

                    if (dist < minDist) {
                        minDist = dist;
                        clusterIndex = j;
                    }
                }
                clusters[clusterIndex].points.push(pixel);
            }

            // 4. Recalculate centers
            let moved = false;
            for (let j = 0; j < k; j++) {
                const cluster = clusters[j];
                if (cluster.points.length === 0) continue;

                let sumR = 0, sumG = 0, sumB = 0;
                for (const p of cluster.points) {
                    sumR += p[0];
                    sumG += p[1];
                    sumB += p[2];
                }

                const newCenter: RGB = [
                    Math.round(sumR / cluster.points.length),
                    Math.round(sumG / cluster.points.length),
                    Math.round(sumB / cluster.points.length)
                ];

                // Check if center moved significantly
                if (Math.abs(newCenter[0] - cluster.center[0]) > 2 ||
                    Math.abs(newCenter[1] - cluster.center[1]) > 2 ||
                    Math.abs(newCenter[2] - cluster.center[2]) > 2) {
                    moved = true;
                }

                cluster.center = newCenter;
            }

            if (!moved) break; // Converged
        }

        // 5. Sort clusters by size (most prominent colors first)
        clusters.sort((a, b) => b.points.length - a.points.length);

        // Filter out empty clusters that might happen
        return clusters.filter(c => c.points.length > 0).map(c => c.center);
    };

    const processImage = () => {
        if (!originalUrl || !canvasRef.current) return;
        setIsExtracting(true);

        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => {
            // We use a small fixed square for K-means downsampling to keep it incredibly fast on the main thread
            const sampleSize = 50;
            const canvas = canvasRef.current!;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });

            if (!ctx) {
                setIsExtracting(false);
                return;
            }

            canvas.width = sampleSize;
            canvas.height = sampleSize;

            // Draw image scaled down
            ctx.drawImage(img, 0, 0, sampleSize, sampleSize);

            // Extract pixels
            const imageData = ctx.getImageData(0, 0, sampleSize, sampleSize);

            // Run K-Means
            const result = extractDominantColors(imageData.data, colorCount);
            setPalette(result);
            setIsExtracting(false);
        };
        img.onerror = () => setIsExtracting(false);
        img.src = originalUrl;
    };

    // Auto-run when URL or color count changes
    useEffect(() => {
        const timer = setTimeout(() => {
            if (originalUrl) processImage();
        }, 300);
        return () => clearTimeout(timer);
    }, [originalUrl, colorCount]);

    // Helpers
    const rgbToHex = (r: number, g: number, b: number) =>
        "#" + (1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1).toUpperCase();

    const getLuminance = (r: number, g: number, b: number) =>
        (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    const handleCopy = async (hex: string, index: number) => {
        try {
            await navigator.clipboard.writeText(hex);
            setCopiedIndex(index);
            setTimeout(() => setCopiedIndex(null), 1500);
        } catch (err) {
            console.error('Failed to copy', err);
        }
    };

    if (!originalUrl) {
        return (
            <div className="watermark-remover">
                <Dropzone onFileSelect={handleFileSelect} accept="image/*" title="Drop an image to extract its color palette" />
            </div>
        );
    }

    return (
        <div className="watermark-remover">
            {/* Hidden canvas for offscreen processing */}
            <canvas ref={canvasRef} style={{ display: 'none' }} />

            <div className="editor-container" style={{ maxWidth: '1000px', margin: '0 auto' }}>
                <div style={{ display: 'flex', gap: '2rem', width: '100%', alignItems: 'stretch' }}>

                    {/* Left Column: Image Preview & Palette */}
                    <div style={{ flex: 1.5, display: 'flex', flexDirection: 'column', background: '#f8fafc', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>

                        {/* Image Preview */}
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px', marginBottom: '2rem' }}>
                            <img
                                src={originalUrl}
                                alt="Original Image"
                                style={{
                                    maxWidth: '100%',
                                    maxHeight: '400px',
                                    borderRadius: '12px',
                                    boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                                    objectFit: 'contain'
                                }}
                            />
                        </div>

                        {/* Extracted Palette Display */}
                        <div style={{ background: '#ffffff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', position: 'relative' }}>
                            <h3 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0f172a' }}>
                                <Palette size={20} color="#8b5cf6" />
                                {isExtracting ? 'Analyzing Colors...' : 'Dominant Palette'}
                            </h3>

                            <div style={{
                                display: 'flex',
                                height: '120px',
                                borderRadius: '8px',
                                overflow: 'hidden',
                                boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.1)',
                                opacity: isExtracting ? 0.5 : 1,
                                transition: 'opacity 0.2s'
                            }}>
                                {palette.map((color, index) => {
                                    const hex = rgbToHex(color[0], color[1], color[2]);
                                    const isLight = getLuminance(color[0], color[1], color[2]) > 0.6;

                                    return (
                                        <div
                                            key={index}
                                            onClick={() => handleCopy(hex, index)}
                                            style={{
                                                flex: 1,
                                                backgroundColor: hex,
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                cursor: 'pointer',
                                                transition: 'transform 0.1s, flex 0.2s',
                                                position: 'relative',
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.flex = '1.2';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.flex = '1';
                                            }}
                                            title="Click to copy HEX"
                                        >
                                            <span style={{
                                                color: isLight ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.9)',
                                                fontWeight: 600,
                                                fontFamily: 'monospace',
                                                fontSize: '0.9rem',
                                                letterSpacing: '0.5px',
                                                background: isLight ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                pointerEvents: 'none'
                                            }}>
                                                {copiedIndex === index ? 'COPIED!' : hex}
                                            </span>
                                            {copiedIndex === index && (
                                                <Check size={16} color={isLight ? '#000' : '#fff'} style={{ position: 'absolute', top: '10px' }} />
                                            )}
                                        </div>
                                    )
                                })}
                                {!isExtracting && palette.length === 0 && (
                                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', color: '#94a3b8' }}>
                                        No colors found
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>

                    {/* Right Column: Controls */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                        <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <h4 style={{ margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                Settings
                            </h4>

                            <div>
                                <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600, color: '#64748b', marginBottom: '0.5rem' }}>
                                    <span>Number of Colors to Extract</span>
                                    <span>{colorCount}</span>
                                </label>
                                <input
                                    type="range" min="2" max="10" step="1"
                                    value={colorCount}
                                    onChange={(e) => setColorCount(parseInt(e.target.value))}
                                    style={{ width: '100%', accentColor: '#8b5cf6' }}
                                />
                                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.5rem', lineHeight: 1.4 }}>
                                    Higher values split the image into more specific shades using the K-Means clustering algorithm.
                                </div>
                            </div>
                        </div>

                        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <button className="btn-secondary" onClick={() => { setOriginalUrl(null); setPalette([]); }} style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                                <RotateCcw size={16} /> Choose New Image
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
