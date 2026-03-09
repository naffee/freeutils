import { useState } from 'react';
import { Dropzone } from '../shared/Dropzone.tsx';
import { NextStepSuggestions } from '../shared/NextStepSuggestions.tsx';
import { Loader2, Download, RotateCcw, MicOff, Music } from 'lucide-react';

export function VideoKaraokeMaker() {
    const [mediaFile, setMediaFile] = useState<File | null>(null);
    const [mediaUrl, setMediaUrl] = useState<string | null>(null);
    const [isVideo, setIsVideo] = useState(false);

    const [isProcessing, setIsProcessing] = useState(false);
    const [outputUrl, setOutputUrl] = useState<string | null>(null);

    const handleMediaSelect = (file: File) => {
        setMediaFile(file);
        setMediaUrl(URL.createObjectURL(file));
        setIsVideo(file.type.startsWith('video/'));
        setOutputUrl(null);
    };

    const handleProcess = async () => {
        if (!mediaFile) return;

        setIsProcessing(true);
        setOutputUrl(null);

        const formData = new FormData();
        formData.append('media', mediaFile);

        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
            const response = await fetch(`${API_URL}/api/isolate-vocals`, {
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
            console.error("Vocal isolation failed:", error);
            alert(`Failed to isolate vocals: ${error.message}`);
        } finally {
            setIsProcessing(false);
        }
    };

    if (!mediaUrl) {
        return (
            <div className="watermark-remover">
            <div className="seo-writeup">
                <h2>Karaoke Video Maker</h2>
                <p>Remove vocals from any music video to create your own karaoke track. Sing along with high-quality instrumental audio.</p>
            </div>
                <Dropzone onFileSelect={handleMediaSelect} accept="video/*,audio/*" title="Drop Video or Audio to Remove Vocals (Karaoke)" />
            </div>
        );
    }

    return (
        <div className="watermark-remover">
            <div className="seo-writeup">
                <h2>Karaoke Video Maker</h2>
                <p>Remove vocals from any music video to create your own karaoke track. Sing along with high-quality instrumental audio.</p>
            </div>
            <div className="editor-container" style={{ maxWidth: '1000px', margin: '0 auto' }}>
                <div style={{ display: 'flex', gap: '2rem', width: '100%', alignItems: 'stretch' }}>

                    {/* Left Column: Player Preview */}
                    <div style={{ flex: 1.5, display: 'flex', flexDirection: 'column', background: '#f8fafc', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0', minHeight: '500px' }}>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#000', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
                            {isVideo ? (
                                <video
                                    src={outputUrl || mediaUrl}
                                    controls
                                    style={{ maxWidth: '100%', maxHeight: '450px', display: 'block' }}
                                />
                            ) : (
                                <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #1e293b, #0f172a)' }}>
                                    <Music size={64} color="#3b82f6" style={{ marginBottom: '2rem', opacity: 0.5 }} />
                                    <audio src={outputUrl || mediaUrl} controls style={{ width: '80%' }} />
                                </div>
                            )}
                        </div>
                        {outputUrl && (
                            <p style={{ textAlign: 'center', marginTop: '1rem', color: '#16a34a', fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                <MicOff size={16} /> Vocals Removed! (Karaoke Track Ready)
                            </p>
                        )}
                    </div>

                    {/* Right Column: Settings */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                        {/* Info Block */}
                        <div style={{ background: '#eff6ff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #bfdbfe' }}>
                            <h4 style={{ margin: '0 0 0.5rem 0', color: '#1d4ed8', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <MicOff size={18} /> Vocal Isolation (Karaoke AI)
                            </h4>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: '#1e40af', lineHeight: 1.5 }}>
                                Start your own Karaoke night! This tool uses advanced stereo phase cancellation to subtract exact center-panned frequencies (which are almost always the lead vocals), leaving just the instrumental track behind.
                                <br /><br />
                                <strong>Note:</strong> Result quality depends on how the original song was mixed. Works on both regular Audio and Video files!
                            </p>
                        </div>

                        <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', flex: 1 }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '1rem', textAlign: 'center', color: '#64748b' }}>
                                <MicOff size={48} strokeWidth={1} />
                                <p style={{ margin: 0, fontSize: '0.9rem', maxWidth: '80%' }}>Extract the instrumental beat by cancelling out center vocals.</p>
                            </div>
                        </div>

                        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {outputUrl ? (
                                <><a
                                    href={outputUrl}
                                    download={`karaoke_${mediaFile?.name || 'media.mp4'}`}
                                    className="btn-primary"
                                    style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}
                                >
                                    <Download size={16} /> Save Karaoke Track
                                </a>
                                <div style={{ fontSize: '0.8rem', color: '#b91c1c', textAlign: 'center', marginTop: '0.5rem', background: '#fef2f2', padding: '0.5rem', borderRadius: '4px', border: '1px solid #fecaca', lineHeight: 1.4 }}>
                                   ⚠️ <strong>Warning:</strong> Files are not saved on our servers. Please download your work now or it will be lost forever.
                                
                                </div>
                                <NextStepSuggestions 
                                    fileUrl={outputUrl} 
                                    fileName={'processed_file'} 
                                    fileType="video" 
                                /></>
                            ) : (
                                <button className="btn-primary" onClick={handleProcess} disabled={isProcessing} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                                    {isProcessing ? <><Loader2 size={16} className="spin" /> Isolating Vocals...</> : <><MicOff size={16} /> Remove Vocals</>}
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