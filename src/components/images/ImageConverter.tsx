import { useState, useRef, useEffect } from 'react';
import { Dropzone } from '../shared/Dropzone.tsx';
import { NextStepSuggestions } from '../shared/NextStepSuggestions.tsx';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import { Download, Repeat } from 'lucide-react';

const SUPPORTED_FORMATS = [
    { label: 'PNG', value: 'png', mime: 'image/png' },
    { label: 'JPEG', value: 'jpg', mime: 'image/jpeg' },
    { label: 'WebP', value: 'webp', mime: 'image/webp' },
    { label: 'GIF', value: 'gif', mime: 'image/gif' },
    { label: 'BMP', value: 'bmp', mime: 'image/bmp' }
];

export function ImageConverter() {
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [targetFormat, setTargetFormat] = useState('png');
    const [originalSize, setOriginalSize] = useState(0);
    const [convertedSize, setConvertedSize] = useState(0);

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
        setOutputUrl(null);
        setConvertedSize(0);

        // Auto-select a format different from the input if possible
        const ext = file.name.split('.').pop()?.toLowerCase() || '';
        if (ext === 'png') setTargetFormat('jpg');
        else if (ext === 'jpg' || ext === 'jpeg') setTargetFormat('png');
        else setTargetFormat('png');
    };

    const handleProcess = async () => {
        if (!ffmpegRef.current || !ffmpegRef.current.loaded || !imageFile) return;

        setIsProcessing(true);
        setLoadingMsg(`Converting to ${targetFormat.toUpperCase()}...`);

        const ffmpeg = ffmpegRef.current;
        const ext = imageFile.name.split('.').pop() || 'tmp';
        const inputName = `input_${Date.now()}.${ext}`;
        const outputName = `output.${targetFormat}`;

        try {
            await ffmpeg.writeFile(inputName, await fetchFile(imageFile));

            // Basic conversion: ffmpeg -i input.ext output.target
            await ffmpeg.exec(['-i', inputName, outputName]);

            const outputData = await ffmpeg.readFile(outputName);
            const mimeType = SUPPORTED_FORMATS.find(f => f.value === targetFormat)?.mime || 'image/png';
            const blob = new Blob([outputData as any], { type: mimeType });
            const url = URL.createObjectURL(blob);

            setOutputUrl(url);
            setConvertedSize(blob.size);

            await ffmpeg.deleteFile(inputName);
            await ffmpeg.deleteFile(outputName);
        } catch (e) {
            console.error(e);
            alert('Failed to convert image.');
        } finally {
            setIsProcessing(false);
        }
    };

    if (!imageUrl) {
        return (
            <div className="watermark-remover">
            <div className="seo-writeup">
                <h2>Image Format Converter</h2>
                <p>Convert images between modern web formats like WebP, JPEG, PNG, and more. Fast and free.</p>
            </div>
                <Dropzone onFileSelect={handleFileSelect} accept="image/*" title="Drag & Drop an image to convert" />
            </div>
        );
    }

    return (
        <div className="watermark-remover">
            <div className="seo-writeup">
                <h2>Image Format Converter</h2>
                <p>Convert images between modern web formats like WebP, JPEG, PNG, and more. Fast and free.</p>
            </div>
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
                            {outputUrl ? `Converted Preview (${targetFormat.toUpperCase()})` : `Original Image`}
                        </div>
                    </div>

                    {/* Right Column: Controls & Stats */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem', justifyContent: 'center' }}>

                        {!outputUrl ? (
                            <>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <h3 style={{ margin: 0, color: '#0f172a' }}>Select Target Format</h3>
                                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b' }}>Convert from {imageFile?.name?.split('.').pop()?.toUpperCase() || 'unknown'} to:</p>
                                </div>

                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    {SUPPORTED_FORMATS.map(fmt => (
                                        <label
                                            key={fmt.value}
                                            style={{
                                                flex: '1 1 calc(33% - 0.5rem)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                padding: '0.75rem',
                                                borderRadius: '8px',
                                                border: `2px solid ${targetFormat === fmt.value ? '#8b5cf6' : '#e2e8f0'}`,
                                                background: targetFormat === fmt.value ? '#f5f3ff' : '#ffffff',
                                                color: targetFormat === fmt.value ? '#8b5cf6' : '#64748b',
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            <input
                                                type="radio"
                                                name="format"
                                                value={fmt.value}
                                                checked={targetFormat === fmt.value}
                                                onChange={(e) => setTargetFormat(e.target.value)}
                                                style={{ display: 'none' }}
                                            />
                                            {fmt.label}
                                        </label>
                                    ))}
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', padding: '1rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#0f172a', fontWeight: 500 }}>
                                        <span>Original Size:</span>
                                        <span>{formatBytes(originalSize)}</span>
                                    </div>
                                </div>

                                <button
                                    className="btn-primary"
                                    disabled={isProcessing}
                                    onClick={handleProcess}
                                    style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}
                                >
                                    {isProcessing ? loadingMsg : <><Repeat size={18} /> Convert Format</>}
                                </button>
                                <button className="btn-secondary" onClick={() => setImageUrl(null)} style={{ width: '100%' }}>
                                    Cancel
                                </button>
                            </>
                        ) : (
                            <>
                                <h3 style={{ margin: 0, color: '#8b5cf6', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Repeat size={24} /> Conversion Complete!
                                </h3>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1.5rem', background: '#f5f3ff', borderRadius: '12px', border: '1px solid #ddd6fe' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', color: '#64748b' }}>
                                        <span>Original Size:</span>
                                        <span>{formatBytes(originalSize)}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 600, color: '#8b5cf6' }}>
                                        <span>New Size:</span>
                                        <span>{formatBytes(convertedSize)}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', color: '#64748b', marginTop: '0.5rem' }}>
                                        <span>Format:</span>
                                        <span style={{ fontWeight: 'bold' }}>{targetFormat.toUpperCase()}</span>
                                    </div>
                                </div>

                                <div className="actions" style={{ marginTop: '1rem', flexDirection: 'column', gap: '0.75rem' }}>
                                    <><a href={outputUrl} download={`converted_${Date.now()}.${targetFormat}`} className="btn-primary" style={{ textDecoration: 'none', justifyContent: 'center' }}>
                                        <Download size={18} /> Download Image
                                    </a>
                                <div style={{ fontSize: '0.8rem', color: '#b91c1c', textAlign: 'center', marginTop: '0.5rem', background: '#fef2f2', padding: '0.5rem', borderRadius: '4px', border: '1px solid #fecaca', lineHeight: 1.4 }}>
                                   ⚠️ <strong>Warning:</strong> Files are not saved on our servers. Please download your work now or it will be lost forever.
                                
                                </div>
                                <NextStepSuggestions 
                                    fileUrl={outputUrl} 
                                    fileName={imageFile?.name || 'processed_file'} 
                                    fileType="image" 
                                /></>
                                    <button className="btn-secondary" onClick={() => { setOutputUrl(null); }} style={{ width: '100%' }}>
                                        Change Format again
                                    </button>
                                    <button className="btn-secondary" onClick={() => { setOutputUrl(null); setImageUrl(null); }} style={{ width: '100%', border: 'none', background: 'transparent' }}>
                                        Convert New Image
                                    </button>
                                
                                </div>
                                <NextStepSuggestions 
                                    fileUrl={outputUrl} 
                                    fileName={imageFile?.name || 'processed_file'} 
                                    fileType="image" 
                                />
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
