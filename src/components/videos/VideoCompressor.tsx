import { useState } from 'react';
import { Download, Server } from 'lucide-react';
import { Dropzone } from '../shared/Dropzone.tsx';

export function VideoCompressor() {
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progressMsg, setProgressMsg] = useState('');
    const [result, setResult] = useState<{ url: string; sizeMb: number } | null>(null);

    const handleFileSelect = (file: File) => {
        setVideoFile(file);
        setResult(null);
    };

    const handleUpload = async () => {
        if (!videoFile) return;

        setIsProcessing(true);
        setProgressMsg('Uploading to server...');

        const formData = new FormData();
        formData.append('video', videoFile);

        try {
            // Because of Vite proxy, this goes to localhost:3001
            setProgressMsg('Compressing on Server (this may take a moment)...');

            const response = await fetch('/api/compress-video', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Upload failed');
            }

            setProgressMsg('Downloading compressed file...');

            // The server responds with the actual file download stream
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);

            // Assume an average compression size reduction for demonstration if not parsed via headers
            const approxSizeMb = blob.size / (1024 * 1024);

            setResult({
                url,
                sizeMb: Number(approxSizeMb.toFixed(2))
            });

        } catch (e: any) {
            console.error(e);
            alert(`Compression Error: ${e.message}`);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="video-processor">
            {!videoFile ? (
                <Dropzone onFileSelect={handleFileSelect} title="Drag & Drop video to compress" />
            ) : (
                <div className="processing-container">
                    {!isProcessing && !result ? (
                        <div className="compression-details">
                            <h3>Ready to Compress</h3>
                            <p className="instruction">File: {videoFile.name}</p>
                            <p className="instruction">Size: {(videoFile.size / (1024 * 1024)).toFixed(2)} MB</p>

                            <div className="actions" style={{ marginTop: '2rem' }}>
                                <button className="btn-primary" onClick={handleUpload}>
                                    <Server size={18} /> Run on Server
                                </button>
                                <button className="btn-secondary" onClick={() => setVideoFile(null)}>Cancel</button>
                            </div>
                        </div>
                    ) : isProcessing ? (
                        <div className="loading-state">
                            <p>{progressMsg}</p>
                            <div className="progress-bar">
                                <div className="progress-fill" style={{ width: `100%`, animation: 'pulse 1.5s infinite' }} />
                            </div>
                        </div>
                    ) : result ? (
                        <div className="result-container">
                            <h3>Compression Complete</h3>
                            <div className="stats" style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                                <p>Original Size: {(videoFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                                <p style={{ color: 'var(--accent-primary)', fontWeight: 'bold' }}>
                                    New Size: {result.sizeMb} MB
                                </p>
                            </div>
                            <div className="actions">
                                <a href={result.url} download={`compressed_${videoFile.name}`} className="btn-primary" style={{ textDecoration: 'none' }}>
                                    <Download size={18} /> Save Video
                                </a>
                                <button className="btn-secondary" onClick={() => { setResult(null); setVideoFile(null); }}>
                                    Compress Another
                                </button>
                            </div>
                        </div>
                    ) : null}
                </div>
            )}

            <style>{`
                @keyframes pulse {
                    0% { opacity: 0.6; }
                    50% { opacity: 1; }
                    100% { opacity: 0.6; }
                }
            `}</style>
        </div>
    );
}
