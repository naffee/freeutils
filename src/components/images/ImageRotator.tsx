import { useState, useRef, useEffect } from 'react';
import { Dropzone } from '../shared/Dropzone.tsx';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import { Download, RotateCcw, RotateCw, FlipHorizontal, FlipVertical, RefreshCw } from 'lucide-react';

export function ImageRotator() {
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imageUrl, setImageUrl] = useState<string | null>(null);

    // State to accumulate transformations. 
    // We can just keep an array of ffmpeg filter command strings, or keep track of the degrees/flips.
    // Easiest is to keep a running list of ffmpeg filter parts, or just process the file immediately on each click for interactive feel.
    // Let's do instant processing on each click so the user sees the preview instantly.

    const [isProcessing, setIsProcessing] = useState(false);
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
        setImageUrl(URL.createObjectURL(file));
    };

    // Helper to process the current image with a specific filter
    const applyTransformation = async (filter: string) => {
        if (!ffmpegRef.current || !ffmpegRef.current.loaded || !imageFile) return;

        setIsProcessing(true);
        setLoadingMsg('Processing...');

        const ffmpeg = ffmpegRef.current;
        const ext = imageFile.name.split('.').pop() || 'png';
        const inputName = `input_${Date.now()}.${ext}`;
        const outputName = `output_${Date.now()}.${ext}`;

        try {
            // Write the CURRENT image state (from the JS File object) to wasm fs
            await ffmpeg.writeFile(inputName, await fetchFile(imageFile));

            await ffmpeg.exec(['-i', inputName, '-vf', filter, outputName]);

            const outputData = await ffmpeg.readFile(outputName);
            const blob = new Blob([outputData as any], { type: imageFile.type });
            const url = URL.createObjectURL(blob);

            // Update the file state to the NEW transformed file so subsequent edits stack correctly
            const newFile = new File([blob], imageFile.name, { type: imageFile.type });
            setImageFile(newFile);
            setImageUrl(url);

            await ffmpeg.deleteFile(inputName);
            await ffmpeg.deleteFile(outputName);
        } catch (e) {
            console.error(e);
            alert('Failed to transform image.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleRotateLeft = () => applyTransformation('transpose=2'); // 90 deg counter-clockwise
    const handleRotateRight = () => applyTransformation('transpose=1'); // 90 deg clockwise
    const handleFlipHorizontal = () => applyTransformation('hflip');
    const handleFlipVertical = () => applyTransformation('vflip');

    if (!imageUrl) {
        return (
            <div className="watermark-remover">
            <div className="seo-writeup">
                <h2>Rotate & Flip Image</h2>
                <p>Fix incorrect image orientation instantly. Rotate clockwise, counter-clockwise, or mirror your photos.</p>
            </div>
                <Dropzone onFileSelect={handleFileSelect} accept="image/*" title="Drag & Drop an image to rotate/flip" />
            </div>
        );
    }

    return (
        <div className="watermark-remover">
            <div className="seo-writeup">
                <h2>Rotate & Flip Image</h2>
                <p>Fix incorrect image orientation instantly. Rotate clockwise, counter-clockwise, or mirror your photos.</p>
            </div>
            <div className="editor-container" style={{ maxWidth: '800px', margin: '0 auto' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', width: '100%', alignItems: 'center' }}>

                    {/* Controls Row */}
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                        <button
                            onClick={handleRotateLeft}
                            disabled={isProcessing}
                            className="btn-secondary"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#ffffff', borderColor: '#e2e8f0' }}
                        >
                            <RotateCcw size={18} color="#8b5cf6" />
                            Rotate Left
                        </button>
                        <button
                            onClick={handleRotateRight}
                            disabled={isProcessing}
                            className="btn-secondary"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#ffffff', borderColor: '#e2e8f0' }}
                        >
                            <RotateCw size={18} color="#8b5cf6" />
                            Rotate Right
                        </button>
                        <button
                            onClick={handleFlipHorizontal}
                            disabled={isProcessing}
                            className="btn-secondary"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#ffffff', borderColor: '#e2e8f0' }}
                        >
                            <FlipHorizontal size={18} color="#f43f5e" />
                            Flip Horizontal
                        </button>
                        <button
                            onClick={handleFlipVertical}
                            disabled={isProcessing}
                            className="btn-secondary"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#ffffff', borderColor: '#e2e8f0' }}
                        >
                            <FlipVertical size={18} color="#f43f5e" />
                            Flip Vertical
                        </button>
                    </div>

                    {/* Image Preview */}
                    <div style={{ position: 'relative', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: '2rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                        {isProcessing && (
                            <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, borderRadius: '16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#8b5cf6', fontWeight: 600 }}>
                                    <RefreshCw className="spin-animation" size={24} />
                                    {loadingMsg}
                                </div>
                            </div>
                        )}
                        <img
                            src={imageUrl}
                            alt="Preview"
                            style={{
                                maxWidth: '100%',
                                maxHeight: '500px',
                                borderRadius: '12px',
                                boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                                objectFit: 'contain',
                                transition: 'opacity 0.2s'
                            }}
                        />
                    </div>

                    {/* Actions */}
                    <div className="actions" style={{ marginTop: '1rem', display: 'flex', gap: '1rem', justifyContent: 'center', width: '100%' }}>
                        <a href={imageUrl} download={`rotated_${imageFile?.name || 'image.png'}`} className="btn-primary" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem 2rem' }}>
                            <Download size={20} /> Download Result
                        </a>
                        <button className="btn-secondary" onClick={() => setImageUrl(null)} style={{ padding: '1rem 2rem' }}>
                            Start Over
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
