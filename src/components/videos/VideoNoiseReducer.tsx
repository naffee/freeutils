import { useState } from 'react';
import { Dropzone } from '../shared/Dropzone.tsx';
import { Loader2, Download, RotateCcw, MicOff } from 'lucide-react';

export function VideoNoiseReducer() {
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);

    const [isProcessing, setIsProcessing] = useState(false);
    const [outputUrl, setOutputUrl] = useState<string | null>(null);
    const [noiseType, setNoiseType] = useState<'audio' | 'video' | 'both'>('both');

    const handleVideoSelect = (file: File) => {
        setVideoFile(file);
        setVideoUrl(URL.createObjectURL(file));
        setOutputUrl(null);
    };

    const handleProcess = async () => {
        if (!videoFile) return;

        setIsProcessing(true);
        setOutputUrl(null);

        const formData = new FormData();
        formData.append('video', videoFile);
        formData.append('noiseType', noiseType);

        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
            const response = await fetch(`${API_URL}/api/reduce-noise`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Server processing failed');
            }

            // The backend returns the file directly
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            setOutputUrl(url);

        } catch (error: any) {
            console.error("Video noise reduction failed:", error);
            alert(`Failed to reduce noise: ${error.message}`);
        } finally {
            setIsProcessing(false);
        }
    };

    if (!videoUrl) {
        return (
            <div className="watermark-remover">
                <Dropzone onFileSelect={handleVideoSelect} accept="video/*" title="Drop a Video to Reduce Noise" />
            </div>
        );
    }

    return (
        <div className="watermark-remover">
            <div className="editor-container" style={{ maxWidth: '1000px', margin: '0 auto' }}>
                <div style={{ display: 'flex', gap: '2rem', width: '100%', alignItems: 'stretch' }}>

                    {/* Left Column: Player Preview */}
                    <div style={{ flex: 1.5, display: 'flex', flexDirection: 'column', background: '#f8fafc', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0', minHeight: '500px' }}>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#000', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
                            <video
                                src={outputUrl || videoUrl}
                                controls
                                style={{ maxWidth: '100%', maxHeight: '450px', display: 'block' }}
                            />
                        </div>
                        {outputUrl && (
                            <p style={{ textAlign: 'center', marginTop: '1rem', color: '#16a34a', fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                <MicOff size={16} /> Noise Reduced and Rendered!
                            </p>
                        )}
                    </div>

                    {/* Right Column: Settings */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                        {/* Info Block */}
                        <div style={{ background: '#eff6ff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #bfdbfe' }}>
                            <h4 style={{ margin: '0 0 0.5rem 0', color: '#1e40af', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <MicOff size={18} /> Noise Reduction
                            </h4>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: '#334155', lineHeight: 1.5 }}>
                                Select the type of noise you want to remove. You can clean up grainy video frames or remove background static/hiss from audio.
                            </p>
                        </div>

                        {/* Type Selection */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#475569' }}>Filter Type</label>

                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.5rem', borderRadius: '8px', border: noiseType === 'audio' ? '1px solid #3b82f6' : '1px solid #e2e8f0', background: noiseType === 'audio' ? '#eff6ff' : 'white' }}>
                                <input type="radio" name="noiseType" value="audio" checked={noiseType === 'audio'} onChange={() => setNoiseType('audio')} style={{ cursor: 'pointer' }} />
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontWeight: 500, color: '#1e293b', fontSize: '0.95rem' }}>Audio Noise Only</span>
                                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Removes background static & hiss</span>
                                </div>
                            </label>

                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.5rem', borderRadius: '8px', border: noiseType === 'video' ? '1px solid #3b82f6' : '1px solid #e2e8f0', background: noiseType === 'video' ? '#eff6ff' : 'white' }}>
                                <input type="radio" name="noiseType" value="video" checked={noiseType === 'video'} onChange={() => setNoiseType('video')} style={{ cursor: 'pointer' }} />
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontWeight: 500, color: '#1e293b', fontSize: '0.95rem' }}>Video Noise Only</span>
                                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Reduces visual grain and artifacts</span>
                                </div>
                            </label>

                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.5rem', borderRadius: '8px', border: noiseType === 'both' ? '1px solid #3b82f6' : '1px solid #e2e8f0', background: noiseType === 'both' ? '#eff6ff' : 'white' }}>
                                <input type="radio" name="noiseType" value="both" checked={noiseType === 'both'} onChange={() => setNoiseType('both')} style={{ cursor: 'pointer' }} />
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontWeight: 500, color: '#1e293b', fontSize: '0.95rem' }}>Both Audio & Video</span>
                                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Applies both filters for maximum clarity</span>
                                </div>
                            </label>
                        </div>

                        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {outputUrl ? (
                                <a
                                    href={outputUrl}
                                    download={`denoised_${videoFile?.name || 'video.mp4'}`}
                                    className="btn-primary"
                                    style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}
                                >
                                    <Download size={16} /> Save Denoised Video
                                </a>
                            ) : (
                                <button className="btn-primary" onClick={handleProcess} disabled={isProcessing} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                                    {isProcessing ? <><Loader2 size={16} className="spin" /> Sending to Server...</> : <><MicOff size={16} /> Clean Video</>}
                                </button>
                            )}
                            <button className="btn-secondary" onClick={() => { setVideoUrl(null); setVideoFile(null); setOutputUrl(null); }} disabled={isProcessing} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                                <RotateCcw size={16} /> Start Over
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
