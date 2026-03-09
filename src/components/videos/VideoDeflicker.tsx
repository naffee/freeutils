import { useState } from 'react';
import { Dropzone } from '../shared/Dropzone.tsx';
import { NextStepSuggestions } from '../shared/NextStepSuggestions.tsx';
import { Loader2, Download, RotateCcw, LightbulbOff } from 'lucide-react';

export function VideoDeflicker() {
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);

    const [isProcessing, setIsProcessing] = useState(false);
    const [outputUrl, setOutputUrl] = useState<string | null>(null);

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

        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
            const response = await fetch(`${API_URL}/api/deflicker-video`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Server processing failed');
            }

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            setOutputUrl(url);

        } catch (error: any) {
            console.error("Video deflicker failed:", error);
            alert(`Failed to deflicker video: ${error.message}`);
        } finally {
            setIsProcessing(false);
        }
    };

    if (!videoUrl) {
        return (
            <div className="watermark-remover">
            <div className="seo-writeup">
                <h2>Deflicker Video</h2>
                <p>Remove annoying flickering and strobe effects from your videos. Perfect for fixing lighting issues and slow-motion shots.</p>
            </div>
                <Dropzone onFileSelect={handleVideoSelect} accept="video/*" title="Drop a video to fix Flickering / Strobing" />
            </div>
        );
    }

    return (
        <div className="watermark-remover">
            <div className="seo-writeup">
                <h2>Deflicker Video</h2>
                <p>Remove annoying flickering and strobe effects from your videos. Perfect for fixing lighting issues and slow-motion shots.</p>
            </div>
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
                                <LightbulbOff size={16} /> Video Deflickered & Restored!
                            </p>
                        )}
                    </div>

                    {/* Right Column: Settings */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                        {/* Info Block */}
                        <div style={{ background: '#fffbeb', padding: '1.25rem', borderRadius: '12px', border: '1px solid #fef3c7' }}>
                            <h4 style={{ margin: '0 0 0.5rem 0', color: '#b45309', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <LightbulbOff size={18} /> Anti-Flicker & Strobing
                            </h4>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: '#92400e', lineHeight: 1.5 }}>
                                This tool is perfect for videos shot under LED lights, old TVs, monitors, or slow-motion clips that have an annoying strobing light effect.
                                <br /><br />
                                It works by analyzing a temporal sliding window of frames and smoothing out the rapid luminance variations.
                            </p>
                        </div>

                        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {outputUrl ? (
                                <><a
                                    href={outputUrl}
                                    download={`deflicker_${videoFile?.name || 'video.mp4'}`}
                                    className="btn-primary"
                                    style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}
                                >
                                    <Download size={16} /> Save Restored Video
                                </a>
                                <div style={{ fontSize: '0.8rem', color: '#b91c1c', textAlign: 'center', marginTop: '0.5rem', background: '#fef2f2', padding: '0.5rem', borderRadius: '4px', border: '1px solid #fecaca', lineHeight: 1.4 }}>
                                   ⚠️ <strong>Warning:</strong> Files are not saved on our servers. Please download your work now or it will be lost forever.
                                
                                </div>
                                <NextStepSuggestions 
                                    fileUrl={outputUrl} 
                                    fileName={videoFile?.name || 'processed_file'} 
                                    fileType="video" 
                                /></>
                            ) : (
                                <button className="btn-primary" onClick={handleProcess} disabled={isProcessing} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                                    {isProcessing ? <><Loader2 size={16} className="spin" /> Fixing Light Flickers...</> : <><LightbulbOff size={16} /> Deflicker Video</>}
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