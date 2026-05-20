import { useState, useRef, useEffect } from 'react';
import { Dropzone } from '../shared/Dropzone.tsx';
import { NextStepSuggestions } from '../shared/NextStepSuggestions.tsx';
import { Download, Loader2, ArrowRightLeft, RotateCcw } from 'lucide-react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

type OutputFormat = 'mp4' | 'webm' | 'gif' | 'avi';
type QualityPreset = 'draft' | 'balanced' | 'high';

export function VideoConverter() {
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);

    // Converter settings
    const [targetFormat, setTargetFormat] = useState<OutputFormat>('mp4');
    const [quality, setQuality] = useState<QualityPreset>('balanced');

    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [progressMsg, setProgressMsg] = useState('');
    const [outputUrl, setOutputUrl] = useState<string | null>(null);

    const ffmpegRef = useRef(new FFmpeg());

    useEffect(() => {
        const loadFFmpeg = async () => {
            const ffmpeg = ffmpegRef.current;
            if (!ffmpeg.loaded) {
                ffmpeg.on('log', ({ message }) => {
                    console.log(message);
                });
                ffmpeg.on('progress', ({ progress }) => {
                    const percent = Math.min(Math.round(progress * 100), 100);
                    setProgress(percent);
                });
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
        setVideoFile(file);
        const url = URL.createObjectURL(file);
        setVideoUrl(url);
        setOutputUrl(null);
        setProgress(0);
    };

    const handleProcess = async () => {
        if (!videoFile) return;

        setIsProcessing(true);
        setProgress(0);
        setProgressMsg('Initializing FFmpeg...');
        setOutputUrl(null);

        try {
            const ffmpeg = ffmpegRef.current;
            if (!ffmpeg.loaded) {
                setProgressMsg('Loading FFmpeg libraries...');
                await ffmpeg.load({
                    coreURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.js',
                    wasmURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.wasm',
                });
            }

            setProgressMsg('Writing file to memory...');
            const extension = videoFile.name.split('.').pop() || 'mp4';
            const inputName = `input_${Date.now()}.${extension}`;
            const outputName = `converted_${Date.now()}.${targetFormat}`;

            await ffmpeg.writeFile(inputName, await fetchFile(videoFile));

            setProgressMsg('Converting format (this may take a while)...');

            const args = ['-i', inputName];

            if (targetFormat === 'mp4') {
                args.push('-c:v', 'libx264', '-threads', '0');
                if (quality === 'draft') {
                    args.push('-vf', 'scale=-2:480', '-crf', '28', '-preset', 'ultrafast');
                } else if (quality === 'balanced') {
                    args.push('-vf', 'scale=-2:720', '-crf', '23', '-preset', 'veryfast');
                } else { // high
                    args.push('-crf', '18', '-preset', 'medium');
                }
                args.push('-c:a', 'aac', '-b:a', '128k');

            } else if (targetFormat === 'webm') {
                args.push('-c:v', 'libvpx-vp9', '-threads', '8', '-row-mt', '1');
                if (quality === 'draft') {
                    args.push('-vf', 'scale=-2:480', '-crf', '40', '-b:v', '0', '-deadline', 'realtime');
                } else if (quality === 'balanced') {
                    args.push('-vf', 'scale=-2:720', '-crf', '30', '-b:v', '0', '-deadline', 'good');
                } else { // high
                    args.push('-crf', '20', '-b:v', '0', '-deadline', 'best');
                }
                args.push('-c:a', 'libopus', '-b:a', '96k');

            } else if (targetFormat === 'gif') {
                if (quality === 'draft') {
                    args.push('-vf', 'fps=10,scale=320:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse');
                } else if (quality === 'balanced') {
                    args.push('-vf', 'fps=15,scale=480:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse');
                } else { // high
                    args.push('-vf', 'fps=24,scale=720:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse');
                }

            } else if (targetFormat === 'avi') {
                args.push('-c:v', 'mpeg4', '-threads', '0');
                if (quality === 'draft') {
                    args.push('-vf', 'scale=-2:480', '-qscale:v', '6');
                } else if (quality === 'balanced') {
                    args.push('-vf', 'scale=-2:720', '-qscale:v', '4');
                } else { // high
                    args.push('-qscale:v', '2');
                }
                args.push('-c:a', 'libmp3lame', '-b:a', '128k');
            }

            args.push(outputName);

            await ffmpeg.exec(args);

            setProgress(100);
            setProgressMsg('Reading converted file...');

            const outputData = await ffmpeg.readFile(outputName);
            const dataArray = new Uint8Array(outputData as any);
            const mimeType = targetFormat === 'gif' ? 'image/gif' : targetFormat === 'webm' ? 'video/webm' : targetFormat === 'avi' ? 'video/x-msvideo' : 'video/mp4';
            const blob = new Blob([dataArray], { type: mimeType });

            const url = URL.createObjectURL(blob);
            setOutputUrl(url);

            // clean up
            try {
                await ffmpeg.deleteFile(inputName);
                await ffmpeg.deleteFile(outputName);
            } catch (cleanupErr) {
                console.error("Cleanup error:", cleanupErr);
            }

        } catch (error: any) {
            console.error("Conversion error:", error);
            alert(`Failed: ${error.message}`);
        } finally {
            setIsProcessing(false);
        }
    };

    if (!videoUrl) {
        return (
            <div className="watermark-remover">
                <div className="seo-writeup">
                    <h2>Video Format Converter</h2>
                    <p>Convert video files from one format to another easily. Supports MP4, WebM, MOV, and more. Fast and secure.</p>
                </div>
                <Dropzone onFileSelect={handleFileSelect} accept="video/*" title="Drop a video to Convert Format" />
            </div>
        );
    }

    return (
        <div className="watermark-remover">
            <div className="seo-writeup">
                <h2>Video Format Converter</h2>
                <p>Convert video files from one format to another easily. Supports MP4, WebM, MOV, and more. Fast and secure.</p>
            </div>
            <div className="editor-container" style={{ maxWidth: '1000px', margin: '0 auto' }}>
                <div style={{ display: 'flex', gap: '2rem', width: '100%', alignItems: 'stretch' }}>

                    {/* Left Column: Video Preview */}
                    <div style={{ flex: 1.5, display: 'flex', flexDirection: 'column', background: '#f8fafc', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
                            <div style={{ position: 'relative', display: 'inline-block', maxWidth: '100%', maxHeight: '500px', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', background: '#000' }}>
                                <video
                                    src={videoUrl}
                                    controls
                                    style={{
                                        maxWidth: '100%',
                                        maxHeight: '500px',
                                        display: 'block'
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Controls */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                        <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <h4 style={{ margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                Conversion Settings
                            </h4>

                            {/* Format Selection */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Target Format</label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                    {[
                                        { id: 'mp4', label: 'MP4 (H.264)', desc: 'Best Compatibility' },
                                        { id: 'webm', label: 'WebM (VP9)', desc: 'Best Web Size' },
                                        { id: 'gif', label: 'GIF', desc: 'No Audio Animation' },
                                        { id: 'avi', label: 'AVI', desc: 'Legacy Windows' }
                                    ].map(fmt => (
                                        <button
                                            key={fmt.id}
                                            onClick={() => setTargetFormat(fmt.id as OutputFormat)}
                                            style={{
                                                padding: '0.75rem 0.5rem',
                                                border: `2px solid ${targetFormat === fmt.id ? '#3b82f6' : '#e2e8f0'}`,
                                                background: targetFormat === fmt.id ? '#eff6ff' : '#fff',
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                gap: '0.25rem',
                                                transition: 'all 0.15s'
                                            }}
                                        >
                                            <span style={{ fontWeight: 600, color: targetFormat === fmt.id ? '#1d4ed8' : '#334155', fontSize: '0.9rem' }}>
                                                {fmt.label}
                                            </span>
                                            <span style={{ fontSize: '0.65rem', color: targetFormat === fmt.id ? '#3b82f6' : '#64748b' }}>
                                                {fmt.desc}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Quality Selection */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Encoding Quality</label>
                                <div style={{ display: 'flex', background: '#f1f5f9', padding: '0.25rem', borderRadius: '8px' }}>
                                    {[
                                        { id: 'draft', label: 'Draft (Fast)' },
                                        { id: 'balanced', label: 'Balanced' },
                                        { id: 'high', label: 'High Quality' }
                                    ].map(q => (
                                        <button
                                            key={q.id}
                                            onClick={() => setQuality(q.id as QualityPreset)}
                                            style={{
                                                flex: 1,
                                                padding: '0.5rem',
                                                border: 'none',
                                                background: quality === q.id ? '#fff' : 'transparent',
                                                color: quality === q.id ? '#0f172a' : '#64748b',
                                                fontWeight: quality === q.id ? 600 : 500,
                                                borderRadius: '6px',
                                                fontSize: '0.8rem',
                                                cursor: 'pointer',
                                                boxShadow: quality === q.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                                transition: 'all 0.15s'
                                            }}
                                        >
                                            {q.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Action List */}
                        {isProcessing && (
                            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '1rem', borderRadius: '8px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem', color: '#166534', fontWeight: 600 }}>
                                    <span>{progressMsg}</span>
                                    <span>{progress}%</span>
                                </div>
                                <div style={{ width: '100%', background: '#dcfce7', borderRadius: '4px', overflow: 'hidden', height: '6px' }}>
                                    <div style={{ width: `${progress}%`, background: '#22c55e', height: '100%', transition: 'width 0.1s' }} />
                                </div>
                            </div>
                        )}

                        {outputUrl && (
                            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '1.25rem', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'center', textAlign: 'center' }}>
                                <div style={{ color: '#1d4ed8', fontWeight: 600, fontSize: '0.95rem' }}>Conversion Complete!</div>

                                <div style={{ width: '100%', borderRadius: '6px', overflow: 'hidden', background: '#000', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                                    {targetFormat === 'gif' ? (
                                        <img src={outputUrl} alt="Converted GIF" style={{ width: '100%', display: 'block' }} />
                                    ) : (
                                        <video
                                            src={outputUrl}
                                            controls
                                            style={{ width: '100%', display: 'block' }}
                                        />
                                    )}
                                </div>

                                <a
                                    href={outputUrl}
                                    download={`converted_${videoFile?.name.replace(/\.[^/.]+$/, "")}.${targetFormat}`}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        background: '#2563eb',
                                        color: 'white',
                                        textDecoration: 'none',
                                        padding: '0.5rem 1rem',
                                        borderRadius: '6px',
                                        fontWeight: 600,
                                        fontSize: '0.9rem',
                                        marginTop: '0.5rem'
                                    }}
                                >
                                    <Download size={16} /> Download .{targetFormat.toUpperCase()}
                                </a>
                                <div style={{ fontSize: '0.8rem', color: '#b91c1c', textAlign: 'center', marginTop: '0.5rem', background: '#fef2f2', padding: '0.5rem', borderRadius: '4px', border: '1px solid #fecaca', lineHeight: 1.4 }}>
                                    ⚠️ <strong>Warning:</strong> Files are not saved on our servers. Please download your work now or it will be lost forever.
                                </div>
                                <NextStepSuggestions
                                    fileUrl={outputUrl}
                                    fileName={videoFile?.name || 'processed_file'}
                                    fileType={targetFormat === 'gif' ? 'image' : 'video'}
                                />
                            </div>
                        )}

                        {/* Core Actions */}
                        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <button className="btn-secondary" onClick={() => { setVideoUrl(null); setVideoFile(null); setOutputUrl(null); setProgress(0); }} disabled={isProcessing} style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                                <RotateCcw size={16} /> Start Over
                            </button>
                            <button
                                className="btn-primary"
                                onClick={handleProcess}
                                disabled={isProcessing || !!outputUrl}
                                style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
                            >
                                {isProcessing ? <><Loader2 size={16} className="spin" /> Converting...</> : <><ArrowRightLeft size={16} /> Convert Video</>}
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}