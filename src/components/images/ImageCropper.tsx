import React, { useState, useRef, useEffect } from 'react';
import { Dropzone } from '../shared/Dropzone.tsx';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import { Download } from 'lucide-react';

interface SelectionBox {
    x: number;
    y: number;
    w: number;
    h: number;
}

export function ImageCropper() {
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [selection, setSelection] = useState<SelectionBox | null>(null);
    const [isSelecting, setIsSelecting] = useState(false);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });
    const [isProcessing, setIsProcessing] = useState(false);
    const [outputUrl, setOutputUrl] = useState<string | null>(null);
    const [loadingMsg, setLoadingMsg] = useState('Loading FFMPEG...');

    const imageRef = useRef<HTMLImageElement>(null);
    const workspaceRef = useRef<HTMLDivElement>(null);
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

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!imageRef.current || !workspaceRef.current) return;
        const rect = imageRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setIsSelecting(true);
        setStartPos({ x, y });
        setSelection({ x, y, w: 0, h: 0 });
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isSelecting || !imageRef.current || !selection || !workspaceRef.current) return;
        const rect = imageRef.current.getBoundingClientRect();

        const currentX = e.clientX - rect.left;
        const currentY = e.clientY - rect.top;

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
        if (!ffmpegRef.current || !ffmpegRef.current.loaded || !imageFile || !selection || !imageRef.current || selection.w === 0 || selection.h === 0) return;

        const scaleX = imageRef.current.naturalWidth / imageRef.current.width;
        const scaleY = imageRef.current.naturalHeight / imageRef.current.height;

        const scaledSelection = {
            x: Math.round(selection.x * scaleX),
            y: Math.round(selection.y * scaleY),
            w: Math.round(selection.w * scaleX),
            h: Math.round(selection.h * scaleY),
        };

        setIsProcessing(true);
        setLoadingMsg('Cropping image...');

        const ffmpeg = ffmpegRef.current;
        const inputName = 'input_image.png';
        const outputName = 'output_image.png';

        try {
            await ffmpeg.writeFile(inputName, await fetchFile(imageFile));

            // ffmpeg crop filter format: crop=out_w:out_h:x:y
            const filter = `crop=${scaledSelection.w}:${scaledSelection.h}:${scaledSelection.x}:${scaledSelection.y}`;
            await ffmpeg.exec(['-i', inputName, '-vf', filter, outputName]);

            const outputData = await ffmpeg.readFile(outputName);
            const blob = new Blob([outputData as any], { type: 'image/png' });
            const url = URL.createObjectURL(blob);
            setOutputUrl(url);

            await ffmpeg.deleteFile(inputName);
            await ffmpeg.deleteFile(outputName);
        } catch (e) {
            console.error(e);
            alert('Failed to crop image.');
        } finally {
            setIsProcessing(false);
        }
    };

    if (!imageUrl) {
        return (
            <div className="watermark-remover">
                <Dropzone onFileSelect={handleFileSelect} accept="image/*" title="Drag & Drop an image to crop" />
            </div>
        );
    }

    return (
        <div className="watermark-remover">
            <div className="editor-container">
                {!outputUrl ? (
                    <>
                        <p className="instruction">Click and drag to select the region you want to keep.</p>
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
                                        borderColor: '#10b981', // green accent for cropper
                                        backgroundColor: 'rgba(16, 185, 129, 0.1)', // very faint green overlay
                                        boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.7)' // dimmer rest frame
                                    }}
                                />
                            )}
                        </div>

                        <div className="actions">
                            <button
                                className="btn-primary"
                                style={{ backgroundColor: '#10b981' }} // override to green
                                disabled={!selection || selection.w === 0 || isProcessing}
                                onClick={handleProcess}
                            >
                                {isProcessing ? loadingMsg : 'Crop Image'}
                            </button>
                            <button className="btn-secondary" onClick={() => setImageUrl(null)}>Cancel</button>
                        </div>
                    </>
                ) : (
                    <div className="result-container">
                        <h3>Cropped Result</h3>
                        <img src={outputUrl} alt="Processed" className="target-image" style={{ boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)' }} />
                        <div className="actions">
                            <a href={outputUrl} download={`cropped_${Date.now()}.png`} className="btn-primary" style={{ textDecoration: 'none', backgroundColor: '#10b981' }}>
                                <Download size={18} /> Download Selection
                            </a>
                            <button className="btn-secondary" onClick={() => { setOutputUrl(null); setImageUrl(null); }}>
                                Crop Another
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
