import { useState, useRef, useEffect } from 'react';
import { Dropzone } from '../shared/Dropzone.tsx';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import { FastForward, Loader2, Download, RotateCcw } from 'lucide-react';

export function VideoSpeedChanger() {
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [speedMultiplier, setSpeedMultiplier] = useState<number>(1.0);
    const [targetFormat, setTargetFormat] = useState<string>('original');

    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
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
        setSpeedMultiplier(1.0);
    };

    const handleProcess = async () => {
        if (!videoFile || !ffmpegRef.current.loaded) return;

        setIsProcessing(true);
        setProgress(0);
        setOutputUrl(null);

        const ffmpeg = ffmpegRef.current;
        const inputName = `input.${videoFile.name.split('.').pop()}`;
        const inputExt = videoFile.name.split('.').pop()?.toLowerCase() || 'mp4';
        const finalFormat = targetFormat === 'original' ? inputExt : targetFormat;
        const outputName = `output_${speedMultiplier}x.${finalFormat}`;

        try {
            await ffmpeg.writeFile(inputName, await fetchFile(videoFile));

            const ptsMultiplier = (1 / speedMultiplier).toFixed(4);
            let audioFilter = '';

            if (speedMultiplier < 0.5) {
                audioFilter = `atempo=0.5,atempo=${(speedMultiplier / 0.5).toFixed(4)}`;
            } else {
                audioFilter = `atempo=${speedMultiplier.toFixed(4)}`;
            }

            const args = [
                '-i', inputName,
                '-filter_complex', `[0:v]setpts=${ptsMultiplier}*PTS[v];[0:a]${audioFilter}[a]`,
                '-map', '[v]',
                '-map', '[a]',
            ];

            if (finalFormat === 'mp4' || finalFormat === 'mov' || finalFormat === 'mkv') {
                args.push('-c:v', 'libx264', '-preset', 'veryfast');
            } else if (finalFormat === 'webm') {
                args.push('-c:v', 'libvpx-vp9', '-threads', '2', '-deadline', 'realtime', '-cpu-used', '4');
            } else if (finalFormat === 'avi') {
                args.push('-c:v', 'mpeg4');
            }

            args.push(outputName);
            await ffmpeg.exec(args);

            const outputData = await ffmpeg.readFile(outputName);
            const dataArray = new Uint8Array(outputData as any);

            let mimeType = 'video/mp4';
            if (finalFormat === 'webm') mimeType = 'video/webm';
            if (finalFormat === 'avi') mimeType = 'video/x-msvideo';

            const blob = new Blob([dataArray], { type: mimeType });

            const url = URL.createObjectURL(blob);
            setOutputUrl(url);

        } catch (error) {
            console.error("Change speed failed:", error);
            alert("Failed to change video speed.");
        } finally {
            setIsProcessing(false);
            try {
                await ffmpeg.deleteFile(inputName);
                await ffmpeg.deleteFile(outputName);
            } catch (e) { }
        }
    };

    if (!videoUrl) {
        return (
            <div className="watermark-remover">
                <Dropzone onFileSelect={handleFileSelect} accept="video/*" title="Drop a video to Change Speed" />
            </div>
        );
    }

    const speedOptions = [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 3.0, 4.0];

    return (
        <div className="watermark-remover">
            <div className="editor-container" style={{ maxWidth: '1000px', margin: '0 auto' }}>
                <div style={{ display: 'flex', gap: '2rem', width: '100%', alignItems: 'stretch' }}>

                    {/* Left Column: Player */}
                    <div style={{ flex: 1.5, display: 'flex', flexDirection: 'column', background: '#f8fafc', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
                            <video
                                src={outputUrl || videoUrl}
                                controls
                                style={{
                                    maxWidth: '100%',
                                    maxHeight: '500px',
                                    display: 'block'
                                }}
                            />
                        </div>
                        {outputUrl && (
                            <p style={{ textAlign: 'center', marginTop: '1rem', color: '#16a34a', fontWeight: 600, fontSize: '0.9rem' }}>
                                Previewing Output at {speedMultiplier}x Speed
                            </p>
                        )}
                    </div>

                    {/* Right Column: Settings & Actions */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                        <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <h4 style={{ margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                Output Settings
                            </h4>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Format</label>
                                <select
                                    value={targetFormat}
                                    onChange={(e) => setTargetFormat(e.target.value)}
                                    style={{
                                        padding: '0.5rem',
                                        borderRadius: '8px',
                                        border: '1px solid #cbd5e1',
                                        background: '#f8fafc',
                                        color: '#0f172a',
                                        outline: 'none',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <option value="original">Original Format</option>
                                    <option value="mp4">MP4 Video</option>
                                    <option value="webm">WebM Video</option>
                                    <option value="avi">AVI Video</option>
                                </select>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Speed Multiplier</label>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                                    {speedOptions.map(speed => (
                                        <button
                                            key={speed}
                                            onClick={() => setSpeedMultiplier(speed)}
                                            style={{
                                                padding: '0.75rem',
                                                borderRadius: '8px',
                                                border: `1px solid ${speedMultiplier === speed ? '#3b82f6' : '#cbd5e1'}`,
                                                background: speedMultiplier === speed ? '#eff6ff' : '#fff',
                                                color: speedMultiplier === speed ? '#1d4ed8' : '#475569',
                                                fontWeight: speedMultiplier === speed ? 600 : 400,
                                                cursor: 'pointer',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            {speed}x
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Core Actions */}
                        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {outputUrl ? (
                                <a
                                    href={outputUrl}
                                    download={`speed_${speedMultiplier}x_${videoFile?.name || 'video'}.mp4`}
                                    className="btn-primary"
                                    style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}
                                >
                                    <Download size={16} /> Save video
                                </a>
                            ) : (
                                <button className="btn-primary" onClick={handleProcess} disabled={isProcessing} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                                    {isProcessing ? <><Loader2 size={16} className="spin" /> Processing ({progress}%)...</> : <><FastForward size={16} /> Apply Speed</>}
                                </button>
                            )}
                            <button className="btn-secondary" onClick={() => { setVideoUrl(null); setVideoFile(null); setOutputUrl(null); }} disabled={isProcessing} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                                <RotateCcw size={16} /> Try another
                            </button>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
