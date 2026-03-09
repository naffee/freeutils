import { useState } from 'react';
import { Download, AlertCircle, Sparkles, Server, FileVideo, Image as ImageIcon } from 'lucide-react';
import { Dropzone } from '../shared/Dropzone.tsx';

export function VideoFaceSwapper() {
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [resultUrl, setResultUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleVideoSelect = (file: File) => {
        setVideoFile(file);
        setResultUrl(null);
        setError(null);
    };

    const handleImageSelect = (file: File) => {
        setImageFile(file);
        setResultUrl(null);
        setError(null);
    };

    const processVideo = async () => {
        if (!videoFile || !imageFile) return;

        setIsProcessing(true);
        setError(null);
        setResultUrl(null);

        const formData = new FormData();
        formData.append('video', videoFile);
        formData.append('image', imageFile);

        try {
            const response = await fetch('http://localhost:3001/api/face-swap-video', {
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
            <div className="seo-writeup">
                <h2>AI Face Swapper</h2>
                <p>Swap faces in your videos using advanced AI technology. Create fun, engaging content with just a few clicks.</p>
            </div>
            <div className="tool-header">
                <Sparkles size={24} className="text-purple-500" />
                <h2>AI Video Face Swapper</h2>
            </div>
            <p className="tool-description">
                Swap faces in a video using advanced AI. Upload a target video and an image containing the face you want to swap in.
            </p>

            {error && (
                <div className="error-box">
                    <AlertCircle size={20} />
                    <p>{error}</p>
                </div>
            )}

            {!videoFile ? (
                <Dropzone onFileSelect={handleVideoSelect} accept="video/*" title="Drop Target Video" />
            ) : !imageFile ? (
                <div className="processing-container">
                    <div style={{ marginBottom: '1rem', padding: '1rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px', borderLeft: '4px solid #3b82f6' }}>
                        <p style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1e293b', fontWeight: 600 }}>
                            <FileVideo size={18} /> Selected Video: {videoFile.name}
                        </p>
                        <button className="btn-secondary" style={{ marginTop: '0.5rem', padding: '0.25rem 0.75rem', fontSize: '0.8rem' }} onClick={() => setVideoFile(null)}>Change Video</button>
                    </div>
                    <Dropzone onFileSelect={handleImageSelect} accept="image/*" title="Drop Source Face Image" />
                </div>
            ) : (
                <div className="processing-container">
                    {!isProcessing && !resultUrl ? (
                        <div className="compression-details">
                            <h3>Ready to Face Swap</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem', textAlign: 'left' }}>
                                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                    <p style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: '#64748b' }}><FileVideo size={16} /> Target Video</p>
                                    <p className="instruction" style={{ wordBreak: 'break-all' }}>{videoFile.name}</p>
                                    <button className="btn-secondary" style={{ marginTop: '0.5rem', padding: '0.25rem 0.5rem', fontSize: '0.8rem' }} onClick={() => setVideoFile(null)}>Change</button>
                                </div>
                                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                    <p style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: '#64748b' }}><ImageIcon size={16} /> Source Face</p>
                                    <p className="instruction" style={{ wordBreak: 'break-all' }}>{imageFile.name}</p>
                                    <button className="btn-secondary" style={{ marginTop: '0.5rem', padding: '0.25rem 0.5rem', fontSize: '0.8rem' }} onClick={() => setImageFile(null)}>Change</button>
                                </div>
                            </div>

                            <div className="actions" style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center' }}>
                                <button className="btn-primary" onClick={processVideo} style={{ padding: '0.75rem 2rem', fontSize: '1.1rem' }}>
                                    <Server size={18} /> Start Face Swap
                                </button>
                                <button className="btn-secondary" onClick={() => { setVideoFile(null); setImageFile(null); }}>Reset Both</button>
                            </div>
                        </div>
                    ) : isProcessing ? (
                        <div className="loading-state">
                            <p>Processing Face Swap (This may take a while)...</p>
                            <div className="progress-bar">
                                <div className="progress-fill" style={{ width: `100%`, animation: 'pulse 1.5s infinite' }} />
                            </div>
                        </div>
                    ) : resultUrl ? (
                        <div className="result-container">
                            <h3>Face Swap Complete</h3>
                            <div className="video-container" style={{ maxWidth: '600px', margin: '1rem auto' }}>
                                <video src={resultUrl} controls className="preview-video" style={{ width: '100%', borderRadius: '8px' }} />
                            </div>
                            <div className="actions">
                                <a href={resultUrl} download={`faceswapped-${videoFile.name}`} className="btn-primary" style={{ textDecoration: 'none' }}>
                                    <Download size={18} /> Save Video
                                </a>
                                <button className="btn-secondary" onClick={() => { setResultUrl(null); setVideoFile(null); setImageFile(null); }}>
                                    Swap Another
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