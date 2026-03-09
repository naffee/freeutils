import { useState, useRef, useEffect } from 'react';
import { Dropzone } from '../shared/Dropzone.tsx';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import { Layers, Loader2, Download, RotateCcw, Settings2, Music, Mic } from 'lucide-react';

export function AudioMerger() {
    const [primaryFile, setPrimaryFile] = useState<File | null>(null);
    const [primaryUrl, setPrimaryUrl] = useState<string | null>(null);

    const [bgFile, setBgFile] = useState<File | null>(null);
    const [bgUrl, setBgUrl] = useState<string | null>(null);

    const [primaryVolume, setPrimaryVolume] = useState(100);
    const [bgVolume, setBgVolume] = useState(20);

    const [isProcessing, setIsProcessing] = useState(false);
    const [outputUrl, setOutputUrl] = useState<string | null>(null);

    const ffmpegRef = useRef(new FFmpeg());

    useEffect(() => {
        const loadFFmpeg = async () => {
            const ffmpeg = ffmpegRef.current;
            if (!ffmpeg.loaded) {
                try {
                    await ffmpeg.load({
                        coreURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.js',
                        wasmURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.wasm',
                    });
                } catch (e) {
                    console.error("Failed to load ffmpeg:", e);
                }
            }
        };
        loadFFmpeg();
    }, []);

    const handlePrimarySelect = (file: File) => {
        setPrimaryFile(file);
        setPrimaryUrl(URL.createObjectURL(file));
        setOutputUrl(null);
    };

    const handleBgSelect = (file: File) => {
        setBgFile(file);
        setBgUrl(URL.createObjectURL(file));
        setOutputUrl(null);
    };

    const handleProcess = async () => {
        if (!primaryFile || !bgFile || !ffmpegRef.current.loaded) return;

        setIsProcessing(true);
        setOutputUrl(null);

        const ffmpeg = ffmpegRef.current;
        const primaryExt = primaryFile.name.split('.').pop() || 'mp3';
        const bgExt = bgFile.name.split('.').pop() || 'mp3';

        const primaryName = `primary.${primaryExt}`;
        const bgName = `bg.${bgExt}`;
        const outputName = `merged_output.mp3`;

        try {
            await ffmpeg.writeFile(primaryName, await fetchFile(primaryFile));
            await ffmpeg.writeFile(bgName, await fetchFile(bgFile));

            const pVol = (primaryVolume / 100).toFixed(2);
            const bVol = (bgVolume / 100).toFixed(2);

            // Merge command:
            // -i primary -i bg
            // -filter_complex "[0:a]volume=X[a0];[1:a]volume=Y[a1];[a0][a1]amix=inputs=2:duration=first:dropout_transition=2[out]"
            // duration=first ensures the output ends when the primary audio ends.
            await ffmpeg.exec([
                '-i', primaryName,
                '-i', bgName,
                '-filter_complex', `[0:a]volume=${pVol}[a0];[1:a]volume=${bVol}[a1];[a0][a1]amix=inputs=2:duration=first:dropout_transition=2[out]`,
                '-map', '[out]',
                '-c:a', 'libmp3lame',
                '-q:a', '2',
                outputName
            ]);

            const outputData = await ffmpeg.readFile(outputName);
            const dataArray = new Uint8Array(outputData as any);

            const blob = new Blob([dataArray], { type: 'audio/mpeg' });
            const url = URL.createObjectURL(blob);
            setOutputUrl(url);

        } catch (error) {
            console.error("Merge failed:", error);
            alert("Failed to merge audio files.");
        } finally {
            setIsProcessing(false);
            try {
                await ffmpeg.deleteFile(primaryName);
                await ffmpeg.deleteFile(bgName);
                await ffmpeg.deleteFile(outputName);
            } catch (e) { }
        }
    };

    const startOver = () => {
        setPrimaryFile(null);
        setPrimaryUrl(null);
        setBgFile(null);
        setBgUrl(null);
        setOutputUrl(null);
    };

    if (!primaryUrl || !bgUrl) {
        return (
            <div className="watermark-remover">
            <div className="seo-writeup">
                <h2>Merge Audio Files</h2>
                <p>Combine multiple audio tracks seamlessly into a single file. Perfect for creating mashups or podcast mixes.</p>
            </div>
                <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div style={{ textAlign: 'center' }}>
                        <h2 style={{ color: '#0f172a', marginBottom: '0.5rem' }}>Audio Merger</h2>
                        <p style={{ color: '#64748b', margin: 0 }}>Combine two audio files together. Perfect for adding background music to voiceovers.</p>
                    </div>

                    <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                        <div style={{ flex: '1 1 300px' }}>
                            <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#1e293b' }}>
                                <Mic size={18} /> 1. Primary Audio (e.g. Voice)
                            </h4>
                            {primaryUrl ? (
                                <div style={{ padding: '1.5rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                                    <p style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: '#1e293b', fontWeight: 500 }}>{primaryFile?.name}</p>
                                    <audio src={primaryUrl} controls style={{ width: '100%', height: '40px' }} />
                                    <button onClick={() => { setPrimaryUrl(null); setPrimaryFile(null); }} style={{ marginTop: '1rem', padding: '0.4rem 0.8rem', fontSize: '0.8rem', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Change File</button>
                                </div>
                            ) : (
                                <Dropzone onFileSelect={handlePrimarySelect} accept="audio/*" title="Drop Primary Audio" />
                            )}
                        </div>

                        <div style={{ flex: '1 1 300px' }}>
                            <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#1e293b' }}>
                                <Music size={18} /> 2. Background Audio (e.g. Music)
                            </h4>
                            {bgUrl ? (
                                <div style={{ padding: '1.5rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                                    <p style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: '#1e293b', fontWeight: 500 }}>{bgFile?.name}</p>
                                    <audio src={bgUrl} controls style={{ width: '100%', height: '40px' }} />
                                    <button onClick={() => { setBgUrl(null); setBgFile(null); }} style={{ marginTop: '1rem', padding: '0.4rem 0.8rem', fontSize: '0.8rem', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Change File</button>
                                </div>
                            ) : (
                                <Dropzone onFileSelect={handleBgSelect} accept="audio/*" title="Drop Background Audio" />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="watermark-remover">
            <div className="seo-writeup">
                <h2>Merge Audio Files</h2>
                <p>Combine multiple audio tracks seamlessly into a single file. Perfect for creating mashups or podcast mixes.</p>
            </div>
            <div className="editor-container" style={{ maxWidth: '1000px', margin: '0 auto' }}>
                <div style={{ display: 'flex', gap: '2rem', width: '100%', alignItems: 'stretch' }}>

                    {/* Left Column: Player Preview */}
                    <div style={{ flex: 1.5, display: 'flex', flexDirection: 'column', background: '#f8fafc', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0', minHeight: '400px' }}>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #1e293b, #0f172a)', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
                            <Layers size={64} color="#8b5cf6" style={{ marginBottom: '2rem', opacity: 0.5 }} />

                            {outputUrl ? (
                                <div style={{ width: '80%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <h4 style={{ color: '#fff', margin: 0, textAlign: 'center', fontSize: '1rem' }}>Merged Output</h4>
                                    <audio src={outputUrl} controls style={{ width: '100%' }} />
                                </div>
                            ) : (
                                <div style={{ width: '80%', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    <div style={{ background: 'rgba(255,255,255,0.1)', padding: '1rem', borderRadius: '8px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: '#e2e8f0', fontSize: '0.85rem' }}>
                                            <span><Mic size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Primary: {primaryFile?.name}</span>
                                            <span>{primaryVolume}%</span>
                                        </div>
                                        <audio src={primaryUrl} controls style={{ width: '100%', height: '30px' }} />
                                    </div>
                                    <div style={{ background: 'rgba(255,255,255,0.1)', padding: '1rem', borderRadius: '8px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: '#e2e8f0', fontSize: '0.85rem' }}>
                                            <span><Music size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Background: {bgFile?.name}</span>
                                            <span>{bgVolume}%</span>
                                        </div>
                                        <audio src={bgUrl} controls style={{ width: '100%', height: '30px' }} />
                                    </div>
                                </div>
                            )}
                        </div>
                        {outputUrl && (
                            <p style={{ textAlign: 'center', marginTop: '1rem', color: '#16a34a', fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                <Layers size={16} /> Audio merged successfully!
                            </p>
                        )}
                    </div>

                    {/* Right Column: Settings */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                        <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                            <h4 style={{ margin: '0 0 1.25rem 0', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Settings2 size={18} /> Mixer Settings
                            </h4>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Mic size={14} /> Primary Volume
                                        </label>
                                        <span style={{ fontSize: '0.85rem', color: '#8b5cf6', fontWeight: 600 }}>{primaryVolume}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="200"
                                        value={primaryVolume}
                                        onChange={(e) => setPrimaryVolume(Number(e.target.value))}
                                        style={{ width: '100%', accentColor: '#8b5cf6' }}
                                    />
                                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8' }}>Over 100% will boost the audio.</p>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Music size={14} /> Background Volume
                                        </label>
                                        <span style={{ fontSize: '0.85rem', color: '#ec4899', fontWeight: 600 }}>{bgVolume}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={bgVolume}
                                        onChange={(e) => setBgVolume(Number(e.target.value))}
                                        style={{ width: '100%', accentColor: '#ec4899' }}
                                    />
                                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8' }}>Keep this low (e.g., 10-20%) so it doesn't overpower the voice.</p>
                                </div>

                            </div>
                        </div>

                        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {outputUrl ? (
                                <><a
                                    href={outputUrl}
                                    download={`merged_audio_${Date.now()}.mp3`}
                                    className="btn-primary"
                                    style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}
                                >
                                    <Download size={16} /> Download Merged Audio
                                </a>
                                <div style={{ fontSize: '0.8rem', color: '#b91c1c', textAlign: 'center', marginTop: '0.5rem', background: '#fef2f2', padding: '0.5rem', borderRadius: '4px', border: '1px solid #fecaca', lineHeight: 1.4 }}>
                                   ⚠️ <strong>Warning:</strong> Files are not saved on our servers. Please download your work now or it will be lost forever.
                                </div></>
                            ) : (
                                <button className="btn-primary" onClick={handleProcess} disabled={isProcessing} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                                    {isProcessing ? <><Loader2 size={16} className="spin" /> Merging...</> : <><Layers size={16} /> Merge Tracks</>}
                                </button>
                            )}
                            <button className="btn-secondary" onClick={startOver} disabled={isProcessing} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                                <RotateCcw size={16} /> Start Over
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
