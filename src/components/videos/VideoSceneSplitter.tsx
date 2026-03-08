import { useState } from 'react';
import { Dropzone } from '../shared/Dropzone.tsx';
import { Loader2, Download, RotateCcw, ScissorsSquare, Clapperboard, FileArchive } from 'lucide-react';

export function VideoSceneSplitter() {
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
            const response = await fetch(`${API_URL}/api/split-scenes`, {
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
            console.error("Video scene split failed:", error);
            alert(`Failed to split scenes: ${error.message}`);
        } finally {
            setIsProcessing(false);
        }
    };

    if (!videoUrl) {
        return (
            <div className="watermark-remover">
                <Dropzone onFileSelect={handleVideoSelect} accept="video/*" title="Drop a Video to Auto-Split into Scenes" />
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
                                src={videoUrl}
                                controls
                                style={{ maxWidth: '100%', maxHeight: '450px', display: 'block' }}
                            />
                        </div>
                        {outputUrl && (
                            <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#065f46' }}>
                                    <FileArchive size={24} />
                                    <div>
                                        <p style={{ margin: 0, fontWeight: 600, fontSize: '0.95rem' }}>Clips Generated</p>
                                        <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.8 }}>Ready for download</p>
                                    </div>
                                </div>
                                <a
                                    href={outputUrl}
                                    download={`scenes_${videoFile?.name.replace(/\.[^/.]+$/, "") || 'video'}.zip`}
                                    className="btn-primary"
                                    style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                                >
                                    <Download size={16} /> Download ZIP
                                </a>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Settings */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                        {/* Info Block */}
                        <div style={{ background: '#fdf4ff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #fbcfe8' }}>
                            <h4 style={{ margin: '0 0 0.5rem 0', color: '#c026d3', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Clapperboard size={18} /> Auto Scene Detection
                            </h4>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: '#86198f', lineHeight: 1.5 }}>
                                This tool analyzes the source video, detects camera cuts or changes in scenery, and automatically slices the video into individual clips.
                                <br /><br />
                                The backend will process the video without re-encoding, and package all the detected scenes into a single ZIP file for you to download.
                            </p>
                        </div>

                        <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', flex: 1 }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '1rem', textAlign: 'center', color: '#64748b' }}>
                                <ScissorsSquare size={48} strokeWidth={1} />
                                <p style={{ margin: 0, fontSize: '0.9rem', maxWidth: '80%' }}>No manual trimming required. Let the algorithm find the cuts.</p>
                            </div>
                        </div>

                        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {!outputUrl && (
                                <button className="btn-primary" onClick={handleProcess} disabled={isProcessing} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                                    {isProcessing ? <><Loader2 size={16} className="spin" /> Analyzing Scenes...</> : <><ScissorsSquare size={16} /> Auto-Split Video</>}
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
