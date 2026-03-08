import { useState, useRef, useEffect } from 'react';
import { Dropzone } from '../shared/Dropzone.tsx';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import { Music, Loader2, Download, RotateCcw, Settings2 } from 'lucide-react';

const AUDIO_FORMATS = [
    { label: 'MP3 (MPEG Layer 3)', value: 'mp3', mime: 'audio/mpeg' },
    { label: 'WAV (Waveform Audio)', value: 'wav', mime: 'audio/wav' },
    { label: 'AAC (Advanced Audio Coding)', value: 'aac', mime: 'audio/aac' },
    { label: 'OGG (Vorbis)', value: 'ogg', mime: 'audio/ogg' },
    { label: 'FLAC (Lossless)', value: 'flac', mime: 'audio/flac' },
    { label: 'M4A (Apple Audio)', value: 'm4a', mime: 'audio/mp4' },
];

export function AudioConverter() {
    const [audioFile, setAudioFile] = useState<File | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [targetFormat, setTargetFormat] = useState('mp3');

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

    const handleFileSelect = (file: File) => {
        setAudioFile(file);
        const url = URL.createObjectURL(file);
        setAudioUrl(url);
        setOutputUrl(null);
    };

    const handleProcess = async () => {
        if (!audioFile || !ffmpegRef.current.loaded) return;

        setIsProcessing(true);
        setOutputUrl(null);

        const ffmpeg = ffmpegRef.current;
        const inputExt = audioFile.name.split('.').pop();
        const inputName = `input.${inputExt}`;
        const outputName = `output.${targetFormat}`;

        try {
            await ffmpeg.writeFile(inputName, await fetchFile(audioFile));

            // Conversion command
            await ffmpeg.exec([
                '-i', inputName,
                outputName
            ]);

            const outputData = await ffmpeg.readFile(outputName);
            const dataArray = new Uint8Array(outputData as any);

            const formatInfo = AUDIO_FORMATS.find(f => f.value === targetFormat);
            const blob = new Blob([dataArray], { type: formatInfo?.mime || 'audio/octet-stream' });
            const url = URL.createObjectURL(blob);
            setOutputUrl(url);

        } catch (error) {
            console.error("Conversion failed:", error);
            alert("Failed to convert audio. The format pair might not be supported in this browser version.");
        } finally {
            setIsProcessing(false);
            try {
                await ffmpeg.deleteFile(inputName);
                await ffmpeg.deleteFile(outputName);
            } catch (e) { }
        }
    };

    if (!audioUrl) {
        return (
            <div className="watermark-remover">
                <Dropzone onFileSelect={handleFileSelect} accept="audio/*" title="Drop an Audio file to Convert" />
            </div>
        );
    }

    return (
        <div className="watermark-remover">
            <div className="editor-container" style={{ maxWidth: '1000px', margin: '0 auto' }}>
                <div style={{ display: 'flex', gap: '2rem', width: '100%', alignItems: 'stretch' }}>

                    {/* Left Column: Player Preview */}
                    <div style={{ flex: 1.5, display: 'flex', flexDirection: 'column', background: '#f8fafc', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0', minHeight: '400px' }}>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #1e293b, #0f172a)', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
                            <Music size={64} color="#3b82f6" style={{ marginBottom: '2rem', opacity: 0.5 }} />
                            <audio
                                src={outputUrl || audioUrl}
                                controls
                                style={{ width: '80%' }}
                            />
                        </div>
                        {outputUrl && (
                            <p style={{ textAlign: 'center', marginTop: '1rem', color: '#16a34a', fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                <Music size={16} /> Audio converted successfully!
                            </p>
                        )}
                    </div>

                    {/* Right Column: Settings */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                        <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                            <h4 style={{ margin: '0 0 1.25rem 0', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Settings2 size={18} /> Conversion Settings
                            </h4>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>Target Format</label>
                                <select
                                    className="filter-select"
                                    value={targetFormat}
                                    onChange={(e) => setTargetFormat(e.target.value)}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff' }}
                                >
                                    {AUDIO_FORMATS.map(fmt => (
                                        <option key={fmt.value} value={fmt.value}>{fmt.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {outputUrl ? (
                                <a
                                    href={outputUrl}
                                    download={`converted_${audioFile?.name.split('.')[0]}.${targetFormat}`}
                                    className="btn-primary"
                                    style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}
                                >
                                    <Download size={16} /> Download {targetFormat.toUpperCase()}
                                </a>
                            ) : (
                                <button className="btn-primary" onClick={handleProcess} disabled={isProcessing} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                                    {isProcessing ? <><Loader2 size={16} className="spin" /> Converting...</> : <><Music size={16} /> Convert Audio</>}
                                </button>
                            )}
                            <button className="btn-secondary" onClick={() => { setAudioUrl(null); setAudioFile(null); setOutputUrl(null); }} disabled={isProcessing} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                                <RotateCcw size={16} /> Start Over
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
