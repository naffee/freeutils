import { useState, useRef, useEffect } from 'react';
import { Dropzone } from '../shared/Dropzone.tsx';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import { Download, Zap } from 'lucide-react';

export function ImageCompressor() {
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [targetSize, setTargetSize] = useState<number>(500);
    const [originalSize, setOriginalSize] = useState(0);
    const [compressedSize, setCompressedSize] = useState(0);

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

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const handleFileSelect = (file: File) => {
        setImageFile(file);
        setImageUrl(URL.createObjectURL(file));
        setOriginalSize(file.size);
        setTargetSize(Math.max(1, Math.floor((file.size / 1024) * 0.8)));
        setOutputUrl(null);
        setCompressedSize(0);
    };

    const handleProcess = async () => {
        if (!ffmpegRef.current || !ffmpegRef.current.loaded || !imageFile) return;

        setIsProcessing(true);
        setLoadingMsg('Compressing image...');

        const ffmpeg = ffmpegRef.current;
        const extension = imageFile.name.split('.').pop() || 'png';
        const inputName = `input_${imageFile.name}`;
        const outputName = `output.${extension}`;

        try {
            await ffmpeg.writeFile(inputName, await fetchFile(imageFile));

            const targetBytes = targetSize * 1024;
            let low = 1;
            let high = 100;
            let bestOutputData: any = null;
            let bestSize = Infinity;

            for (let i = 0; i < 7; i++) {
                if (low > high) break;

                const mid = Math.floor((low + high) / 2);
                const qValue = mid <= 31 ? mid : 31;
                const scaleFactor = mid <= 31 ? 1 : 1 - ((mid - 31) / 69) * 0.9;
                const scaleFilter = `scale=trunc(iw*${scaleFactor}):trunc(ih*${scaleFactor})`;

                await ffmpeg.exec([
                    '-i', inputName,
                    '-vf', scaleFilter,
                    '-qscale:v', qValue.toString(),
                    outputName
                ]);

                const outputData = await ffmpeg.readFile(outputName);
                const size = (outputData as Uint8Array).length;

                if (bestOutputData === null) {
                    bestOutputData = outputData;
                    bestSize = size;
                } else if (size <= targetBytes) {
                    if (bestSize > targetBytes || size > bestSize) {
                        bestOutputData = outputData;
                        bestSize = size;
                    }
                } else if (size > targetBytes && bestSize > targetBytes) {
                    if (size < bestSize) {
                        bestOutputData = outputData;
                        bestSize = size;
                    }
                }

                if (size === targetBytes) {
                    break;
                } else if (size > targetBytes) {
                    low = mid + 1;
                } else {
                    high = mid - 1;
                }

                try {
                    await ffmpeg.deleteFile(outputName);
                } catch (e) { }
            }

            const blob = new Blob([bestOutputData], { type: imageFile.type });
            const url = URL.createObjectURL(blob);

            setOutputUrl(url);
            setCompressedSize(blob.size);

            await ffmpeg.deleteFile(inputName);
        } catch (e) {
            console.error(e);
            alert('Failed to compress image.');
        } finally {
            setIsProcessing(false);
        }
    };

    const savingsPercentage = originalSize > 0 && compressedSize > 0
        ? Math.round(((originalSize - compressedSize) / originalSize) * 100)
        : 0;

    if (!imageUrl) {
        return (
            <div className="watermark-remover">
                <Dropzone onFileSelect={handleFileSelect} accept="image/*" title="Drag & Drop an image to compress" />
            </div>
        );
    }

    return (
        <div className="watermark-remover">
            <div className="editor-container" style={{ maxWidth: '800px', margin: '0 auto' }}>
                <div style={{ display: 'flex', gap: '2rem', width: '100%' }}>

                    {/* Left Column: Image Preview */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                        <img
                            src={outputUrl || imageUrl}
                            alt="Preview"
                            style={{
                                maxWidth: '100%',
                                maxHeight: '350px',
                                borderRadius: '12px',
                                boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                                objectFit: 'contain'
                            }}
                        />
                        <div style={{ marginTop: '1rem', color: '#64748b', fontSize: '0.9rem', fontWeight: 500 }}>
                            {outputUrl ? 'Compressed Preview' : 'Original Image'}
                        </div>
                    </div>

                    {/* Right Column: Controls & Stats */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem', justifyContent: 'center' }}>

                        {!outputUrl ? (
                            <>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <h3 style={{ margin: 0, color: '#0f172a' }}>Target Size (KB)</h3>
                                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b' }}>Enter your desired maximum file size.</p>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <input
                                        type="number"
                                        min="1"
                                        value={targetSize || ''}
                                        onChange={(e) => setTargetSize(e.target.value ? Number(e.target.value) : 0)}
                                        style={{
                                            flex: 1,
                                            padding: '0.75rem',
                                            borderRadius: '8px',
                                            border: '1px solid #cbd5e1',
                                            fontSize: '1rem'
                                        }}
                                    />
                                    <span style={{ fontWeight: 'bold', minWidth: '40px', color: '#8b5cf6' }}>KB</span>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', padding: '1rem', background: '#f0fdf4', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#166534', fontWeight: 500 }}>
                                        <span>Original Size:</span>
                                        <span>{formatBytes(originalSize)}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#166534', fontSize: '0.85rem' }}>
                                        <span>Target Format:</span>
                                        <span style={{ textTransform: 'uppercase' }}>{imageFile?.name.split('.').pop() || 'PNG'}</span>
                                    </div>
                                </div>

                                <button
                                    className="btn-primary"
                                    disabled={isProcessing}
                                    onClick={handleProcess}
                                    style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}
                                >
                                    {isProcessing ? loadingMsg : <><Zap size={18} /> Compress Now</>}
                                </button>
                                <button className="btn-secondary" onClick={() => setImageUrl(null)} style={{ width: '100%' }}>
                                    Cancel
                                </button>
                            </>
                        ) : (
                            <>
                                <h3 style={{ margin: 0, color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Zap size={24} /> Compression Complete!
                                </h3>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1.5rem', background: '#f5f3ff', borderRadius: '12px', border: '1px solid #ddd6fe' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', color: '#64748b' }}>
                                        <span>Original:</span>
                                        <span style={{ textDecoration: 'line-through' }}>{formatBytes(originalSize)}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 600, color: '#8b5cf6' }}>
                                        <span>Compressed:</span>
                                        <span>{formatBytes(compressedSize)}</span>
                                    </div>

                                    <div style={{ marginTop: '0.5rem', paddingTop: '0.75rem', borderTop: '1px dashed #c4b5fd', textAlign: 'center', fontWeight: 'bold', color: '#10b981', fontSize: '1.1rem' }}>
                                        You saved {savingsPercentage}%!
                                    </div>
                                </div>

                                <div className="actions" style={{ marginTop: '1rem', flexDirection: 'column', gap: '0.75rem' }}>
                                    <a href={outputUrl} download={`compressed_${imageFile?.name || 'image.png'}`} className="btn-primary" style={{ textDecoration: 'none', justifyContent: 'center' }}>
                                        <Download size={18} /> Download Image
                                    </a>
                                    <button className="btn-secondary" onClick={() => { setOutputUrl(null); }} style={{ width: '100%' }}>
                                        Adjust Target Size
                                    </button>
                                    <button className="btn-secondary" onClick={() => { setOutputUrl(null); setImageUrl(null); }} style={{ width: '100%', border: 'none', background: 'transparent' }}>
                                        Compress Another
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
