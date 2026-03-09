import React, { useState, useRef, useEffect } from 'react';
import { Dropzone } from '../shared/Dropzone.tsx';
import { NextStepSuggestions } from '../shared/NextStepSuggestions.tsx';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import { Download } from 'lucide-react';

interface SelectionBox {
    x: number;
    y: number;
    w: number;
    h: number;
}

export function ImageWatermarkRemover() {
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [selection, setSelection] = useState<SelectionBox | null>(null);
    const [isSelecting, setIsSelecting] = useState(false);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });
    const [isProcessing, setIsProcessing] = useState(false);
    const [outputUrl, setOutputUrl] = useState<string | null>(null);
    const [loadingMsg, setLoadingMsg] = useState('Loading FFMPEG...');

    const imageRef = useRef<HTMLImageElement>(null);
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
        setSelection(null);
        setOutputUrl(null);
    };

    const workspaceRef = useRef<HTMLDivElement>(null);

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!imageRef.current || !workspaceRef.current) return;
        const rect = imageRef.current.getBoundingClientRect();
        // Calculate coordinate relative to the image itself, regardless of scroll
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setIsSelecting(true);
        setStartPos({ x, y });
        setSelection({ x, y, w: 0, h: 0 });
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isSelecting || !imageRef.current || !selection || !workspaceRef.current) return;
        const rect = imageRef.current.getBoundingClientRect();

        // Calculate coordinate relative to the image itself
        const currentX = e.clientX - rect.left;
        const currentY = e.clientY - rect.top;

        // Constrain to image bounds safely
        const constrainedX = Math.max(0, Math.min(currentX, imageRef.current.width));
        const constrainedY = Math.max(0, Math.min(currentY, imageRef.current.height));

        const x = Math.min(startPos.x, constrainedX);
        const y = Math.min(startPos.y, constrainedY);
        const w = Math.abs(constrainedX - startPos.x);
        const h = Math.abs(constrainedY - startPos.y);

        setSelection({ x, y, w, h });
    };

    const handleMouseUp = () => {
        setIsSelecting(false);
    };

    const handleProcess = async () => {
        if (!ffmpegRef.current || !ffmpegRef.current.loaded || !imageFile || !selection || !imageRef.current) return;

        // Calculate the actual image dimensions vs displayed
        const scaleX = imageRef.current.naturalWidth / imageRef.current.width;
        const scaleY = imageRef.current.naturalHeight / imageRef.current.height;

        // Scale the selection up to exact image coordinates
        const scaledSelection = {
            x: Math.round(selection.x * scaleX),
            y: Math.round(selection.y * scaleY),
            w: Math.round(selection.w * scaleX),
            h: Math.round(selection.h * scaleY),
        };

        setIsProcessing(true);
        setLoadingMsg('Removing watermark...');

        const ffmpeg = ffmpegRef.current;
        const inputName = 'input_image.png';
        const outputName = 'output_image.png';

        try {
            await ffmpeg.writeFile(inputName, await fetchFile(imageFile));

            // Use FFMPEG's delogo filter
            const filter = `delogo=x=${scaledSelection.x}:y=${scaledSelection.y}:w=${scaledSelection.w}:h=${scaledSelection.h}`;
            await ffmpeg.exec(['-i', inputName, '-vf', filter, outputName]);

            const outputData = await ffmpeg.readFile(outputName);
            const blob = new Blob([outputData as any], { type: 'image/png' });
            const url = URL.createObjectURL(blob);
            setOutputUrl(url);

            await ffmpeg.deleteFile(inputName);
            await ffmpeg.deleteFile(outputName);
        } catch (e) {
            console.error(e);
            alert('Failed to remove watermark. Ensure the box is completely within the image boundaries without touching the edges.');
        } finally {
            setIsProcessing(false);
        }
    };

    if (!imageUrl) {
        return (
            <div className="watermark-remover">
            <div className="seo-writeup">
                <h2>Remove Watermark from Image</h2>
                <p>Automatically detect and remove distracting watermarks or unwanted objects from any image.</p>
            </div>
                <Dropzone onFileSelect={handleFileSelect} accept="image/*" title="Drag & Drop an image here" />
            </div>
        );
    }

    return (
        <div className="watermark-remover">
            <div className="seo-writeup">
                <h2>Remove Watermark from Image</h2>
                <p>Automatically detect and remove distracting watermarks or unwanted objects from any image.</p>
            </div>
            <div className="editor-container">
                {!outputUrl ? (
                    <>
                        <p className="instruction">Click and drag over the watermark to select it.</p>
                        <div
                            ref={workspaceRef}
                            className="image-workspace"
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                        >
                            <img
                                ref={imageRef}
                                src={imageUrl}
                                alt="Upload"
                                draggable={false}
                                className="target-image"
                            />
                            {selection && (
                                <div
                                    className="selection-box"
                                    style={{
                                        left: selection.x,
                                        top: selection.y,
                                        width: selection.w,
                                        height: selection.h,
                                    }}
                                />
                            )}
                        </div>

                        <div className="actions">
                            <button
                                className="btn-primary"
                                disabled={!selection || selection.w === 0 || isProcessing}
                                onClick={handleProcess}
                            >
                                {isProcessing ? loadingMsg : 'Remove Watermark'}
                            </button>
                            <button className="btn-secondary" onClick={() => setImageUrl(null)}>Cancel</button>
                        
                                </div>
                                <NextStepSuggestions 
                                    fileUrl={outputUrl || ''} 
                                    fileName={'processed_file'} 
                                    fileType="image" 
                                />
                    </>
                ) : (
                    <div className="result-container">
                        <h3>Result</h3>
                        <img src={outputUrl} alt="Processed" className="target-image" />
                        <div className="actions">
                            <><a href={outputUrl} download={`clean_${Date.now()}.png`} className="btn-primary" style={{ textDecoration: 'none' }}>
                                <Download size={18} /> Download Clean Image
                            </a>
                                <div style={{ fontSize: '0.8rem', color: '#b91c1c', textAlign: 'center', marginTop: '0.5rem', background: '#fef2f2', padding: '0.5rem', borderRadius: '4px', border: '1px solid #fecaca', lineHeight: 1.4 }}>
                                   ⚠️ <strong>Warning:</strong> Files are not saved on our servers. Please download your work now or it will be lost forever.
                                
                                </div>
                                <NextStepSuggestions 
                                    fileUrl={outputUrl || ''} 
                                    fileName={'processed_file'} 
                                    fileType="image" 
                                /></>
                            <button className="btn-secondary" onClick={() => { setOutputUrl(null); setImageUrl(null); }}>
                                Process Another
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
