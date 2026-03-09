import { useState, useRef } from 'react';
import { Dropzone } from '../shared/Dropzone.tsx';
import { NextStepSuggestions } from '../shared/NextStepSuggestions.tsx';
import { FileText, Loader2, Download, RotateCcw, MonitorPlay } from 'lucide-react';

export function VideoSubtitleBurner() {
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);

    const [srtFile, setSrtFile] = useState<File | null>(null);
    const [srtContent, setSrtContent] = useState<string | null>(null);

    const [isProcessing, setIsProcessing] = useState(false);
    const [outputUrl, setOutputUrl] = useState<string | null>(null);

    const srtInputRef = useRef<HTMLInputElement>(null);

    const handleVideoSelect = (file: File) => {
        setVideoFile(file);
        setVideoUrl(URL.createObjectURL(file));
        setOutputUrl(null);
    };

    const handleSrtSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSrtFile(file);

            // Read preview content
            const reader = new FileReader();
            reader.onload = (e) => {
                const text = e.target?.result as string;
                // Just keep first ~200 chars for a preview snippet
                setSrtContent(text.slice(0, 200) + (text.length > 200 ? '...' : ''));
            };
            reader.readAsText(file);

            setOutputUrl(null);
        }
    };

    const removeSrt = () => {
        setSrtFile(null);
        setSrtContent(null);
        if (srtInputRef.current) srtInputRef.current.value = '';
    };

    const handleProcess = async () => {
        if (!videoFile || !srtFile) return;

        setIsProcessing(true);
        setOutputUrl(null);

        const formData = new FormData();
        formData.append('video', videoFile);
        formData.append('srt', srtFile);

        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
            const response = await fetch(`${API_URL}/api/burn-subtitles`, {
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
            console.error("Subtitle burn failed:", error);
            alert(`Failed to burn subtitles: ${error.message}`);
        } finally {
            setIsProcessing(false);
        }
    };

    if (!videoUrl) {
        return (
            <div className="watermark-remover">
            <div className="seo-writeup">
                <h2>Add Subtitles to Video</h2>
                <p>Hardcode subtitles directly into your video. Ensure your message is understood, even when the sound is off.</p>
            </div>
                <Dropzone onFileSelect={handleVideoSelect} accept="video/*" title="Drop a Video to hardcode subtitles" />
            </div>
        );
    }

    return (
        <div className="watermark-remover">
            <div className="seo-writeup">
                <h2>Add Subtitles to Video</h2>
                <p>Hardcode subtitles directly into your video. Ensure your message is understood, even when the sound is off.</p>
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
                                <MonitorPlay size={16} /> Subtitles Burned and Rendered!
                            </p>
                        )}
                    </div>

                    {/* Right Column: Settings */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                        {/* SRT Upload Section */}
                        <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <h4 style={{ margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <FileText size={18} color="#8b5cf6" /> Subtitle Target
                            </h4>

                            {!srtFile ? (
                                <div
                                    onClick={() => srtInputRef.current?.click()}
                                    style={{
                                        border: '2px dashed #cbd5e1',
                                        borderRadius: '8px',
                                        padding: '1.5rem',
                                        textAlign: 'center',
                                        cursor: 'pointer',
                                        background: '#f8fafc',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseOver={(e) => (e.currentTarget.style.borderColor = '#8b5cf6')}
                                    onMouseOut={(e) => (e.currentTarget.style.borderColor = '#cbd5e1')}
                                >
                                    <FileText size={24} color="#64748b" style={{ marginBottom: '0.5rem' }} />
                                    <p style={{ margin: 0, color: '#334155', fontWeight: 500, fontSize: '0.9rem' }}>Click to upload .SRT</p>
                                    <p style={{ margin: '0.25rem 0 0 0', color: '#94a3b8', fontSize: '0.75rem' }}>Only standard SubRip files supported</p>
                                    <input
                                        type="file"
                                        accept=".srt"
                                        onChange={handleSrtSelect}
                                        ref={srtInputRef}
                                        style={{ display: 'none' }}
                                    />
                                </div>
                            ) : (
                                <div style={{ background: '#f8fafc', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: '#f1f5f9', borderBottom: '1px solid #e2e8f0' }}>
                                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <FileText size={14} color="#3b82f6" /> {srtFile.name}
                                        </div>
                                        <button onClick={removeSrt} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', padding: '0.25rem' }}>
                                            REMOVE
                                        </button>
                                    </div>
                                    <div style={{ padding: '1rem', maxHeight: '120px', overflowY: 'auto' }}>
                                        <pre style={{ margin: 0, fontSize: '0.7rem', color: '#64748b', whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                                            {srtContent}
                                        </pre>
                                    </div>
                                </div>
                            )}

                        </div>

                        {/* Info Block */}
                        <div style={{ background: '#fffbeb', padding: '1rem', borderRadius: '8px', border: '1px solid #fde68a' }}>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: '#b45309', lineHeight: 1.5 }}>
                                <strong>Note:</strong> Burning subtitles into the video track is a CPU-intensive operation. It requires re-encoding every frame of the video. This will take time depending on the video length and your device's speed.
                            </p>
                        </div>

                        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {outputUrl ? (
                                <><a
                                    href={outputUrl}
                                    download={`subtitled_${videoFile?.name || 'video'}`}
                                    className="btn-primary"
                                    style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}
                                >
                                    <Download size={16} /> Save Burned Video
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
                                <button className="btn-primary" onClick={handleProcess} disabled={isProcessing || !srtFile} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                                    {isProcessing ? <><Loader2 size={16} className="spin" /> Sending to Server...</> : <><MonitorPlay size={16} /> Hardcode Subtitles</>}
                                </button>
                            )}
                            <button className="btn-secondary" onClick={() => { setVideoUrl(null); setVideoFile(null); setOutputUrl(null); setSrtFile(null); }} disabled={isProcessing} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                                <RotateCcw size={16} /> Start Over
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}