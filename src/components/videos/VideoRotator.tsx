import { useState, useRef, useEffect } from 'react';
import { Dropzone } from '../shared/Dropzone.tsx';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import { RefreshCw, RotateCcw, Loader2, Download, FlipHorizontal, FlipVertical } from 'lucide-react';

export function VideoRotator() {
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);

    // Transformation State
    const [rotation, setRotation] = useState<number>(0); // 0, 90, 180, 270
    const [flipH, setFlipH] = useState<boolean>(false);
    const [flipV, setFlipV] = useState<boolean>(false);

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
        setVideoUrl(URL.createObjectURL(file));
        resetState();
    };

    const resetState = () => {
        setRotation(0);
        setFlipH(false);
        setFlipV(false);
        setOutputUrl(null);
        setProgress(0);
    };

    // UI Preview Transform CSS - simulates what FFmpeg will do
    const getTransformStyle = () => {
        let transform = `rotate(${rotation}deg)`;
        if (flipH) transform += ' scaleX(-1)';
        if (flipV) transform += ' scaleY(-1)';
        return transform;
    };

    const handleProcess = async () => {
        if (!videoFile || !ffmpegRef.current.loaded) return;

        // If nothing changed, tell user
        if (rotation === 0 && !flipH && !flipV) {
            alert("No rotations or flips applied!");
            return;
        }

        setIsProcessing(true);
        setProgress(0);
        setOutputUrl(null);

        const ffmpeg = ffmpegRef.current;
        const inputName = `input.${videoFile.name.split('.').pop()}`;
        const outputExt = videoFile.name.split('.').pop()?.toLowerCase() || 'mp4';
        const outputName = `rotated_output.${outputExt}`;

        try {
            await ffmpeg.writeFile(inputName, await fetchFile(videoFile));

            // Build FFMPEG filter graph string based on accumulated states
            const filters: string[] = [];

            // 1. Handle Flip Horizontal
            if (flipH) filters.push('hflip');

            // 2. Handle Flip Vertical
            if (flipV) filters.push('vflip');

            // 3. Handle Rotation
            // In FFMPEG transpose:
            // 0 = 90CounterCLockwise and Vertical Flip (default)
            // 1 = 90Clockwise
            // 2 = 90CounterClockwise
            // 3 = 90Clockwise and Vertical Flip
            if (rotation === 90) {
                filters.push('transpose=1');
            } else if (rotation === 180) {
                // FFMPEG doesn't have a 180 transpose, it just uses two 90s, or horizontal+vertical flip
                filters.push('transpose=1,transpose=1');
            } else if (rotation === 270) {
                filters.push('transpose=2');
            }

            const filterString = filters.join(',');

            // Video encoding required for visual transformation, but we can copy the audio!
            await ffmpeg.exec([
                '-i', inputName,
                '-vf', filterString,
                '-c:a', 'copy', // Keep audio identical and instant
                '-c:v', 'libx264', '-crf', '23', '-preset', 'veryfast', // Fast video transcode
                outputName
            ]);

            const outputData = await ffmpeg.readFile(outputName);
            const dataArray = new Uint8Array(outputData as any);

            let mimeType = 'video/mp4';
            if (outputExt === 'webm') mimeType = 'video/webm';
            if (outputExt === 'avi') mimeType = 'video/x-msvideo';
            if (outputExt === 'mov') mimeType = 'video/quicktime';

            const blob = new Blob([dataArray], { type: mimeType });
            const url = URL.createObjectURL(blob);
            setOutputUrl(url);

        } catch (error) {
            console.error("Rotation failed:", error);
            alert("Failed to transform video. See console for details.");
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
                <Dropzone onFileSelect={handleFileSelect} accept="video/*" title="Drop a video to Rotate / Flip" />
            </div>
        );
    }

    return (
        <div className="watermark-remover">
            <div className="editor-container" style={{ maxWidth: '1000px', margin: '0 auto' }}>
                <div style={{ display: 'flex', gap: '2rem', width: '100%', alignItems: 'stretch' }}>

                    {/* Left Column: Player Preview */}
                    <div style={{ flex: 1.5, display: 'flex', flexDirection: 'column', background: '#f8fafc', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0', minHeight: '500px' }}>

                        {outputUrl ? (
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#000', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
                                <video
                                    src={outputUrl}
                                    controls
                                    style={{ maxWidth: '100%', maxHeight: '450px', display: 'block' }}
                                />
                            </div>
                        ) : (
                            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
                                {/* Note: we wrap the video in a div that handles the CSS rotation so it doesn't break player controls */}
                                <div style={{ transition: 'transform 0.3s ease', transform: getTransformStyle() }}>
                                    <video
                                        src={videoUrl}
                                        controls
                                        style={{ maxWidth: '100%', maxHeight: '450px', display: 'block' }}
                                    />
                                </div>
                            </div>
                        )}

                        {outputUrl && (
                            <p style={{ textAlign: 'center', marginTop: '1rem', color: '#16a34a', fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                <RefreshCw size={16} /> Permanently Rotated & Rendered!
                            </p>
                        )}
                    </div>

                    {/* Right Column: Settings & Actions */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                        <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <h4 style={{ margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                Transformations
                            </h4>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
                                Preview your adjustments in real-time. The audio track will remain untouched and copy instantly.
                            </p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                    <button
                                        className="btn-secondary"
                                        onClick={() => setRotation(r => (r === 0 ? 270 : r - 90))}
                                        disabled={!!outputUrl || isProcessing}
                                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: '#f1f5f9', border: '1px solid #cbd5e1' }}
                                    >
                                        <RotateCcw size={16} /> Left 90°
                                    </button>
                                    <button
                                        className="btn-secondary"
                                        onClick={() => setRotation(r => (r === 270 ? 0 : r + 90))}
                                        disabled={!!outputUrl || isProcessing}
                                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: '#f1f5f9', border: '1px solid #cbd5e1' }}
                                    >
                                        <RefreshCw size={16} /> Right 90°
                                    </button>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                    <button
                                        className="btn-secondary"
                                        onClick={() => setFlipH(!flipH)}
                                        disabled={!!outputUrl || isProcessing}
                                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: flipH ? '#e0f2fe' : '#f1f5f9', border: `1px solid ${flipH ? '#38bdf8' : '#cbd5e1'}`, color: flipH ? '#0369a1' : 'inherit' }}
                                    >
                                        <FlipHorizontal size={16} /> Flip H
                                    </button>
                                    <button
                                        className="btn-secondary"
                                        onClick={() => setFlipV(!flipV)}
                                        disabled={!!outputUrl || isProcessing}
                                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: flipV ? '#e0f2fe' : '#f1f5f9', border: `1px solid ${flipV ? '#38bdf8' : '#cbd5e1'}`, color: flipV ? '#0369a1' : 'inherit' }}
                                    >
                                        <FlipVertical size={16} /> Flip V
                                    </button>
                                </div>

                                {(rotation !== 0 || flipH || flipV) && !outputUrl && (
                                    <button
                                        onClick={() => { setRotation(0); setFlipH(false); setFlipV(false); }}
                                        style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.85rem', cursor: 'pointer', marginTop: '0.5rem', fontWeight: 500 }}
                                    >
                                        Reset all transforms
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Core Actions */}
                        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {outputUrl ? (
                                <a
                                    href={outputUrl}
                                    download={`rotated_${videoFile?.name || 'video'}`}
                                    className="btn-primary"
                                    style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}
                                >
                                    <Download size={16} /> Save Rendered Video
                                </a>
                            ) : (
                                <button
                                    className="btn-primary"
                                    onClick={handleProcess}
                                    disabled={isProcessing || (rotation === 0 && !flipH && !flipV)}
                                    style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
                                >
                                    {isProcessing ? <><Loader2 size={16} className="spin" /> Rendering ({progress}%)...</> : <><RefreshCw size={16} /> Render File</>}
                                </button>
                            )}
                            <button className="btn-secondary" onClick={() => { setVideoUrl(null); setVideoFile(null); resetState(); }} disabled={isProcessing} style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                                <RotateCcw size={16} /> Start Over
                            </button>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
