import React, { useState } from 'react';
import { Download, AlertCircle, Server, Eraser, FileVideo } from 'lucide-react';
import { Dropzone } from '../shared/Dropzone.tsx';

export function VideoSubtitleRemover() {
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [resultUrl, setResultUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const handleFileSelect = (file: File) => {
        setVideoFile(file);
        setResultUrl(null);
        setError(null);
    };

    const processVideo = async () => {
        if (!videoFile) return;

        setIsProcessing(true);
        setError(null);
        setResultUrl(null);

        const formData = new FormData();
        formData.append('video', videoFile);

        try {
            const response = await fetch('http://localhost:3001/api/remove-subtitles', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                let errorMessage = 'Processing failed';
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorData.details || errorMessage;
                } catch (e) {
                    errorMessage = `Server responded with status ${response.status}`;
                }
                throw new Error(errorMessage);
            }

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            setResultUrl(url);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred during processing');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="tool-container">
            <div className="tool-header">
                <Eraser size={24} className="text-pink-500" />
                <h2>Remove Hardcoded Subtitles</h2>
            </div>
            <p className="tool-description">
                Automatically detect and blur/remove hardcoded subtitles from the bottom of your video.
            </p>

            {error && (
                <div className="error-box">
                    <AlertCircle size={20} />
                    <p>{error}</p>
                </div>
            )}

            {!videoFile ? (
                <Dropzone onFileSelect={handleFileSelect} accept="video/*" title="Drop Video to Remove Subtitles" />
            ) : (
                <div className="processing-container">
                    {!isProcessing && !resultUrl ? (
                        <div className="compression-details">
                            <h3>Ready to Remove Subtitles</h3>
                            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '2rem', textAlign: 'left' }}>
                                <p style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: '#64748b' }}><FileVideo size={16} /> Target Video</p>
                                <p className="instruction" style={{ wordBreak: 'break-all' }}>{videoFile.name}</p>
                                <p className="instruction" style={{ marginTop: '0.25rem' }}>Size: {(videoFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                            </div>

                            <div className="actions" style={{ justifyContent: 'center' }}>
                                <button className="btn-primary" onClick={processVideo} style={{ padding: '0.75rem 2rem', fontSize: '1.1rem' }}>
                                    <Server size={18} /> Start Subtitle Removal
                                </button>
                                <button className="btn-secondary" onClick={() => setVideoFile(null)}>Cancel</button>
                            </div>
                        </div>
                    ) : isProcessing ? (
                        <div className="loading-state">
                            <p>Detecting and Removing Subtitles (This may take a while)...</p>
                            <div className="progress-bar">
                                <div className="progress-fill" style={{ width: `100%`, animation: 'pulse 1.5s infinite' }} />
                            </div>
                        </div>
                    ) : resultUrl ? (
                        <div className="result-container">
                            <h3>Subtitle Removal Complete</h3>
                            <div className="video-container" style={{ maxWidth: '600px', margin: '1rem auto' }}>
                                <video src={resultUrl} controls className="preview-video" style={{ width: '100%', borderRadius: '8px' }} />
                            </div>
                            <div className="actions">
                                <a href={resultUrl} download={`nosubs-${videoFile.name}`} className="btn-primary" style={{ textDecoration: 'none' }}>
                                    <Download size={18} /> Save Video
                                </a>
                                <button className="btn-secondary" onClick={() => { setResultUrl(null); setVideoFile(null); }}>
                                    Process Another
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
