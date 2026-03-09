import { useState } from 'react';
import { Dropzone } from '../shared/Dropzone.tsx';
import { NextStepSuggestions } from '../shared/NextStepSuggestions.tsx';
import { Loader2, Download, RotateCcw, FastForward, Info } from 'lucide-react';

export function VideoInterpolator() {
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);

    const [isProcessing, setIsProcessing] = useState(false);
    const [outputUrl, setOutputUrl] = useState<string | null>(null);
    const [targetFps, setTargetFps] = useState<string>('60');

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
        formData.append('fps', targetFps);

        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
            const response = await fetch(`${API_URL}/api/interpolate-video`, {
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
            console.error("Video interpolation failed:", error);
            alert(`Failed to interpolate video: ${error.message}`);
        } finally {
            setIsProcessing(false);
        }
    };

    if (!videoUrl) {
        return (
            <div className="watermark-remover">
            <div className="seo-writeup">
                <h2>Smooth Video Motion</h2>
                <p>Turn low frame rate videos into ultra-smooth clips. Enhance the fluidity of your footage effortlessly.</p>
            </div>
                <Dropzone onFileSelect={handleVideoSelect} accept="video/*" title="Drop a Video to make it Smooth (60fps/120fps)" />
            </div>
        );
    }

    return (
        <div className="watermark-remover">
            <div className="seo-writeup">
                <h2>Smooth Video Motion</h2>
                <p>Turn low frame rate videos into ultra-smooth clips. Enhance the fluidity of your footage effortlessly.</p>
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
                                <FastForward size={16} /> Interpolated to {targetFps} FPS!
                            </p>
                        )}
                    </div>

                    {/* Right Column: Settings */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                        {/* Info Block */}
                        <div style={{ background: '#f5f3ff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #ddd6fe' }}>
                            <h4 style={{ margin: '0 0 0.5rem 0', color: '#6d28d9', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <FastForward size={18} /> AI Smooth Motion
                            </h4>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: '#4c1d95', lineHeight: 1.5 }}>
                                This tool uses Motion Compensated Interpolation to analyze movement between frames and intelligently draw completely new transition frames, resulting in buttery-smooth video.
                            </p>
                            <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: '#7c3aed', display: 'flex', gap: '0.4rem', alignItems: 'flex-start' }}>
                                <Info size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
                                <span><strong>Warning:</strong> This is an extremely CPU-intensive algorithmic process. Short clips under 15 seconds are highly recommended.</span>
                            </div>
                        </div>

                        {/* Settings */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#475569' }}>Target Framerate</label>

                            <select
                                value={targetFps}
                                onChange={(e) => setTargetFps(e.target.value)}
                                style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '0.95rem', cursor: 'pointer', background: 'white' }}
                            >
                                <option value="60">60 FPS (Smooth)</option>
                                <option value="120">120 FPS (Ultra Smooth)</option>
                            </select>
                        </div>

                        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {outputUrl ? (
                                <><a
                                    href={outputUrl}
                                    download={`smooth_${targetFps}fps_${videoFile?.name || 'video.mp4'}`}
                                    className="btn-primary"
                                    style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}
                                >
                                    <Download size={16} /> Save Interpolated Video
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
                                    {isProcessing ? <><Loader2 size={16} className="spin" /> Generating Frames...</> : <><FastForward size={16} /> Smooth Video</>}
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