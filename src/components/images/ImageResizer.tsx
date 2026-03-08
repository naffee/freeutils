import React, { useState, useRef, useEffect } from 'react';
import { Dropzone } from '../shared/Dropzone.tsx';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import { Download } from 'lucide-react';

export function ImageResizer() {
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [originalSize, setOriginalSize] = useState({ w: 0, h: 0 });
    const [targetSize, setTargetSize] = useState({ w: 0, h: 0 });
    const [maintainAspect, setMaintainAspect] = useState(true);

    const [isProcessing, setIsProcessing] = useState(false);
    const [outputUrl, setOutputUrl] = useState<string | null>(null);
    const [loadingMsg, setLoadingMsg] = useState('Loading FFMPEG...');

    const ffmpegRef = useRef<FFmpeg | null>(null);

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

    const handleFileSelect = (file: File) => {
        setImageFile(file);
        const url = URL.createObjectURL(file);
        setImageUrl(url);
        setOutputUrl(null);

        const img = new Image();
        img.onload = () => {
            setOriginalSize({ w: img.width, h: img.height });
            setTargetSize({ w: img.width, h: img.height });
        };
        img.src = url;
    };

    const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newW = parseInt(e.target.value) || 0;
        if (maintainAspect && originalSize.w > 0) {
            const aspect = originalSize.h / originalSize.w;
            setTargetSize({ w: newW, h: Math.round(newW * aspect) });
        } else {
            setTargetSize({ ...targetSize, w: newW });
        }
    };

    const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newH = parseInt(e.target.value) || 0;
        if (maintainAspect && originalSize.h > 0) {
            const aspect = originalSize.w / originalSize.h;
            setTargetSize({ w: Math.round(newH * aspect), h: newH });
        } else {
            setTargetSize({ ...targetSize, h: newH });
        }
    };

    const handleProcess = async () => {
        if (!ffmpegRef.current || !ffmpegRef.current.loaded || !imageFile || targetSize.w <= 0 || targetSize.h <= 0) return;

        setIsProcessing(true);
        setLoadingMsg('Resizing image...');

        const ffmpeg = ffmpegRef.current;
        const inputName = 'input_image.png';
        const outputName = 'output_image.png';

        try {
            await ffmpeg.writeFile(inputName, await fetchFile(imageFile));

            // ffmpeg scale filter
            const filter = `scale=${targetSize.w}:${targetSize.h}`;
            await ffmpeg.exec(['-i', inputName, '-vf', filter, outputName]);

            const outputData = await ffmpeg.readFile(outputName);
            const blob = new Blob([outputData as any], { type: 'image/png' });
            const url = URL.createObjectURL(blob);
            setOutputUrl(url);

            await ffmpeg.deleteFile(inputName);
            await ffmpeg.deleteFile(outputName);
        } catch (e) {
            console.error(e);
            alert('Failed to resize image.');
        } finally {
            setIsProcessing(false);
        }
    };

    if (!imageUrl) {
        return (
            <div className="watermark-remover">
                <Dropzone onFileSelect={handleFileSelect} accept="image/*" title="Drag & Drop an image to resize" />
            </div>
        );
    }

    return (
        <div className="watermark-remover">
            <div className="editor-container" style={{ maxWidth: '800px', margin: '0 auto' }}>
                {!outputUrl ? (
                    <>
                        <div className="image-workspace" style={{ padding: '2rem', display: 'flex', justifyContent: 'center', background: 'transparent', boxShadow: 'none' }}>
                            <img
                                src={imageUrl}
                                alt="Upload"
                                style={{ maxHeight: '400px', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                            />
                        </div>

                        <div className="resize-controls" style={{ display: 'flex', gap: '2rem', alignItems: 'center', width: '100%', justifyContent: 'center', background: '#f8fafc', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 600 }}>Width (px)</label>
                                <input
                                    type="number"
                                    value={targetSize.w}
                                    onChange={handleWidthChange}
                                    style={{ padding: '0.75rem', borderRadius: '8px', border: '2px solid #e2e8f0', width: '120px', fontSize: '1.1rem', textAlign: 'center' }}
                                />
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: '#64748b', fontSize: '0.9rem' }}>
                                    <input
                                        type="checkbox"
                                        checked={maintainAspect}
                                        onChange={(e) => setMaintainAspect(e.target.checked)}
                                        style={{ width: '18px', height: '18px', accentColor: '#8b5cf6' }}
                                    />
                                    Maintain ratio
                                </label>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 600 }}>Height (px)</label>
                                <input
                                    type="number"
                                    value={targetSize.h}
                                    onChange={handleHeightChange}
                                    style={{ padding: '0.75rem', borderRadius: '8px', border: '2px solid #e2e8f0', width: '120px', fontSize: '1.1rem', textAlign: 'center' }}
                                />
                            </div>
                        </div>

                        <div className="actions" style={{ marginTop: '1rem' }}>
                            <button
                                className="btn-primary"
                                disabled={isProcessing}
                                onClick={handleProcess}
                            >
                                {isProcessing ? loadingMsg : 'Resize Image'}
                            </button>
                            <button className="btn-secondary" onClick={() => setImageUrl(null)}>Cancel</button>
                        </div>
                    </>
                ) : (
                    <div className="result-container">
                        <h3>Resized Result</h3>
                        <p style={{ color: '#64748b', marginBottom: '1rem' }}>{targetSize.w}x{targetSize.h} pixels</p>
                        <img src={outputUrl} alt="Processed" style={{ maxHeight: '400px', borderRadius: '12px', boxShadow: '0 10px 40px rgba(139, 92, 246, 0.15)' }} />
                        <div className="actions" style={{ marginTop: '2rem' }}>
                            <a href={outputUrl} download={`resized_${targetSize.w}x${targetSize.h}.png`} className="btn-primary" style={{ textDecoration: 'none' }}>
                                <Download size={18} /> Download Selection
                            </a>
                            <button className="btn-secondary" onClick={() => { setOutputUrl(null); setImageUrl(null); }}>
                                Resize Another
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
