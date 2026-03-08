import { useState } from 'react';
import { Dropzone } from '../shared/Dropzone.tsx';
import { Loader2, Download, RotateCcw, Sparkles } from 'lucide-react';

export function VideoSpeechEnhancer() {
    const [mediaFile, setMediaFile] = useState<File | null>(null);
    const [mediaUrl, setMediaUrl] = useState<string | null>(null);

    const [isProcessing, setProcessing] = useState(false);
    const [outputUrl, setOutputUrl] = useState<string | null>(null);

    const handleMediaSelect = (file: File) => {
        setMediaFile(file);
        setMediaUrl(URL.createObjectURL(file));
        setOutputUrl(null);
    };

    const handleProcess = async () => {
        if (!mediaFile) return;

        setProcessing(true);
        setOutputUrl(null);

        const formData = new FormData();
        formData.append('media', mediaFile);

        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
            const response = await fetch(`${API_URL}/api/enhance-speech`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Server processing failed');
            }

            // The backend returns the enhanced file directly
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            setOutputUrl(url);

        } catch (error: any) {
            console.error("AI Speech Enhancement failed:", error);
            alert(`Failed to enhance speech: ${error.message}`);
        } finally {
            setProcessing(false);
        }
    };

    if (!mediaUrl) {
        return (
            <div className="watermark-remover">
                <Dropzone
                    onFileSelect={handleMediaSelect}
                    accept="video/*,audio/*"
                    title="Drop Audio or Video to AI Enhance"
                />
            </div>
        );
    }

    const isVideo = mediaFile?.type.startsWith('video/');

    return (
        <div className="watermark-remover">
            <div className="editor-container" style={{ maxWidth: '1000px', margin: '0 auto' }}>
                <div style={{ display: 'flex', gap: '2rem', width: '100%', alignItems: 'stretch' }}>

                    {/* Left Column: Player Preview */}
                    <div style={{ flex: 1.5, display: 'flex', flexDirection: 'column', background: '#f8fafc', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0', minHeight: '400px' }}>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: isVideo ? '#000' : 'linear-gradient(135deg, #1e293b, #0f172a)', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
                            {isVideo ? (
                                <video
                                    src={outputUrl || mediaUrl}
                                    controls
                                    style={{ maxWidth: '100%', maxHeight: '450px', display: 'block' }}
                                />
                            ) : (
                                <>
                                    <Sparkles size={64} color="#8b5cf6" style={{ marginBottom: '2rem', opacity: 0.5 }} />
                                    <audio
                                        src={outputUrl || mediaUrl}
                                        controls
                                        style={{ width: '80%' }}
                                    />
                                </>
                            )}
                        </div>
                        {outputUrl && (
                            <p style={{ textAlign: 'center', marginTop: '1rem', color: '#16a34a', fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                <Sparkles size={16} /> AI Enhancement Complete!
                            </p>
                        )}
                    </div>

                    {/* Right Column: Settings */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                        {/* Info Block */}
                        <div style={{ background: '#fdf4ff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #fbcfe8' }}>
                            <h4 style={{ margin: '0 0 0.5rem 0', color: '#c026d3', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Sparkles size={18} /> LavaSR AI Enhancer
                            </h4>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: '#701a75', lineHeight: 1.5 }}>
                                Uses a deep learning model to reconstruct lost frequencies, remove stubborn background noise, and turn low-quality speech into studio-crisp audio.
                            </p>
                            <br />
                            <p style={{ margin: 0, fontSize: '0.8rem', color: '#831843', fontWeight: 600 }}>
                                ⚠️ Note: AI processing may take 1-3 minutes depending on length.
                            </p>
                        </div>

                        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {outputUrl ? (
                                <a
                                    href={outputUrl}
                                    download={`enhanced_${mediaFile?.name || 'media.mp4'}`}
                                    className="btn-primary"
                                    style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}
                                >
                                    <Download size={16} /> Save Enhanced Media
                                </a>
                            ) : (
                                <button className="btn-primary" onClick={handleProcess} disabled={isProcessing} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                                    {isProcessing ? <><Loader2 size={16} className="spin" /> AI Processing...</> : <><Sparkles size={16} /> Enhance Audio</>}
                                </button>
                            )}
                            <button className="btn-secondary" onClick={() => { setMediaUrl(null); setMediaFile(null); setOutputUrl(null); }} disabled={isProcessing} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                                <RotateCcw size={16} /> Start Over
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
