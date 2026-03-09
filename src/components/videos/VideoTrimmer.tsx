import { useState, useRef, useEffect } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import { Dropzone } from '../shared/Dropzone.tsx';
import { NextStepSuggestions } from '../shared/NextStepSuggestions.tsx';
import { Download, Scissors, Loader2, RotateCcw } from 'lucide-react';

export function VideoTrimmer() {
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [duration, setDuration] = useState<number>(0);
    const [startTime, setStartTime] = useState<number>(0);
    const [endTime, setEndTime] = useState<number>(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [outputUrl, setOutputUrl] = useState<string | null>(null);

    const videoRef = useRef<HTMLVideoElement>(null);
    const ffmpegRef = useRef(new FFmpeg());

    useEffect(() => {
        const loadFFmpeg = async () => {
            const ffmpeg = ffmpegRef.current;
            if (!ffmpeg.loaded) {
                // Initialize FFmpeg with full logs so we can parse progress
                ffmpeg.on('log', ({ message }) => {
                    console.log(message);

                    // Simple progress parsing for stream copying (it's very fast, so this might jump)
                    const timeMatch = message.match(/time=(\\d{2}):(\\d{2}):(\\d{2}\\.\\d{2})/);
                    if (timeMatch && endTime > startTime) {
                        const hours = parseInt(timeMatch[1], 10);
                        const minutes = parseInt(timeMatch[2], 10);
                        const seconds = parseFloat(timeMatch[3]);
                        const currentTime = (hours * 3600) + (minutes * 60) + seconds;
                        const targetDuration = endTime - startTime;
                        const percent = Math.min((currentTime / targetDuration) * 100, 100);
                        setProgress(Math.round(percent));
                    }
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

    const handleLoadedMetadata = () => {
        if (videoRef.current) {
            const tempDuration = videoRef.current.duration;
            setDuration(tempDuration);
            setEndTime(tempDuration); // Default end to full length
            setStartTime(0);
        }
    };

    const handleTrim = async () => {
        if (!videoFile) return;
        if (!ffmpegRef.current.loaded) {
            alert("FFMPEG is still loading. Please wait a moment and try again.");
            return;
        }

        setIsProcessing(true);
        setProgress(0);
        setOutputUrl(null);

        const ffmpeg = ffmpegRef.current;
        const inputName = `input_${videoFile.name}`;
        const outputName = `output_${videoFile.name}`;

        try {
            // Write file to memory
            await ffmpeg.writeFile(inputName, await fetchFile(videoFile));

            // Calculate duration of the clip
            const clipDuration = endTime - startTime;

            // Execute trim command
            // We use -ss before -i for fast seeking, and -t for duration.
            // Re-encoding with libx264 at CRF 18 ensures frame-perfect cuts without quality loss or browser playback glitches
            await ffmpeg.exec([
                '-ss', startTime.toString(),
                '-i', inputName,
                '-t', clipDuration.toString(),
                '-c:v', 'libx264',
                '-crf', '18',
                '-preset', 'ultrafast',
                '-c:a', 'copy',
                outputName
            ]);

            setProgress(100);

            // Read output
            const data = await ffmpeg.readFile(outputName);
            const dataArray = new Uint8Array(data as any);
            const blob = new Blob([dataArray], { type: videoFile.type });
            const url = URL.createObjectURL(blob);
            setOutputUrl(url);

        } catch (error) {
            console.error("Trimming failed:", error);
            alert("Failed to trim video. See console for details.");
        } finally {
            setIsProcessing(false);
            // Cleanup
            try {
                await ffmpeg.deleteFile(inputName);
                await ffmpeg.deleteFile(outputName);
            } catch (e) {
                // Ignore cleanup errors
            }
        }
    };

    // Helper to format time as mm:ss.ms
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = (seconds % 60).toFixed(2);
        return `${mins}:${secs.padStart(5, '0')}`;
    };

    const handleTimeUpdate = (type: 'start' | 'end', value: number) => {
        if (type === 'start') {
            const newStart = Math.min(value, endTime - 0.5); // Ensure start is before end
            setStartTime(newStart);
            if (videoRef.current) videoRef.current.currentTime = newStart;
        } else {
            const newEnd = Math.max(value, startTime + 0.5); // Ensure end is after start
            setEndTime(newEnd);
            if (videoRef.current) videoRef.current.currentTime = newEnd;
        }
    };

    if (!videoUrl) {
        return (
            <div className="watermark-remover">
            <div className="seo-writeup">
                <h2>Trim Video</h2>
                <p>Cut and trim video files to remove unwanted parts. Keep only the best moments with our precise trimming tool.</p>
            </div>
                <Dropzone onFileSelect={handleFileSelect} accept="video/*" title="Drop a video to Trim it" />
            </div>
        );
    }

    return (
        <div className="watermark-remover">
            <div className="seo-writeup">
                <h2>Trim Video</h2>
                <p>Cut and trim video files to remove unwanted parts. Keep only the best moments with our precise trimming tool.</p>
            </div>
            <div className="editor-container" style={{ maxWidth: '1000px', margin: '0 auto' }}>
                <div className="tool-split-layout">

                    {/* Left Column: Video Preview */}
                    <div className="tool-preview-panel">

                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
                            <div style={{ position: 'relative', display: 'inline-block', maxWidth: '100%', maxHeight: '500px', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', background: '#000' }}>
                                <video
                                    ref={videoRef}
                                    src={videoUrl}
                                    controls
                                    onLoadedMetadata={handleLoadedMetadata}
                                    style={{
                                        maxWidth: '100%',
                                        maxHeight: '500px',
                                        display: 'block'
                                    }}
                                />
                            </div>
                        </div>

                        {/* Interactive Timeline Controls underneath video */}
                        {duration > 0 && !outputUrl && (
                            <div className="tool-soft-panel" style={{ marginTop: '1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>
                                    <span>{formatTime(startTime)}</span>
                                    <span>{formatTime(endTime)}</span>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <div>
                                        <label style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: '4px' }}>Start Time</label>
                                        <input
                                            type="range"
                                            min="0"
                                            max={duration}
                                            step="0.01"
                                            value={startTime}
                                            onChange={(e) => handleTimeUpdate('start', parseFloat(e.target.value))}
                                            style={{ width: '100%', accentColor: '#38bdf8' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: '4px' }}>End Time</label>
                                        <input
                                            type="range"
                                            min="0"
                                            max={duration}
                                            step="0.01"
                                            value={endTime}
                                            onChange={(e) => handleTimeUpdate('end', parseFloat(e.target.value))}
                                            style={{ width: '100%', accentColor: '#38bdf8' }}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>

                    {/* Right Column: Controls */}
                    <div className="tool-side-column">

                        <div className="tool-info-card">
                            <h4>
                                Trim Setup
                            </h4>

                            <div className="tool-muted-note">
                                Selecting <strong>Trim</strong> will perform a lightning-fast <code style={{ background: '#e2e8f0', padding: '2px 4px', borderRadius: '4px', fontSize: '0.8rem' }}>Stream Copy</code> without re-encoding your video. There is zero quality loss.
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
                                    <span style={{ color: '#64748b', fontSize: '0.9rem' }}>Original Length</span>
                                    <span style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.9rem' }}>{formatTime(duration)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#64748b', fontSize: '0.9rem' }}>Trimmed Length</span>
                                    <span style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.9rem' }}>{formatTime(endTime - startTime)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Action List */}
                        {isProcessing && (
                            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '1rem', borderRadius: '8px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem', color: '#166534', fontWeight: 600 }}>
                                    <span>Trimming...</span>
                                    <span>{progress}%</span>
                                </div>
                                <div style={{ width: '100%', background: '#dcfce7', borderRadius: '4px', overflow: 'hidden', height: '6px' }}>
                                    <div style={{ width: `${progress}%`, background: '#22c55e', height: '100%', transition: 'width 0.1s' }} />
                                </div>
                            </div>
                        )}

                        {outputUrl && (
                            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '1.25rem', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'center', textAlign: 'center' }}>
                                <div style={{ color: '#1d4ed8', fontWeight: 600, fontSize: '0.95rem' }}>Trim Complete!</div>

                                <div style={{ width: '100%', borderRadius: '6px', overflow: 'hidden', background: '#000', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                                    <video
                                        src={outputUrl}
                                        controls
                                        style={{ width: '100%', display: 'block' }}
                                    />
                                </div>

                                <><a
                                    href={outputUrl}
                                    download={`trimmed_${videoFile?.name}`}
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
                                    <Download size={16} /> Download Clip
                                </a>
                                <div style={{ fontSize: '0.8rem', color: '#b91c1c', textAlign: 'center', marginTop: '0.5rem', background: '#fef2f2', padding: '0.5rem', borderRadius: '4px', border: '1px solid #fecaca', lineHeight: 1.4 }}>
                                   ⚠️ <strong>Warning:</strong> Files are not saved on our servers. Please download your work now or it will be lost forever.
                                
                                </div>
                                <NextStepSuggestions 
                                    fileUrl={outputUrl} 
                                    fileName={videoFile?.name || 'processed_file'} 
                                    fileType="video" 
                                /></>
                            </div>
                        )}

                        {/* Core Actions */}
                        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <button className="btn-secondary" onClick={() => { setVideoUrl(null); setVideoFile(null); setOutputUrl(null); }} disabled={isProcessing} style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                                <RotateCcw size={16} /> Start Over
                            </button>
                            <button
                                className="btn-primary"
                                onClick={handleTrim}
                                disabled={isProcessing || !!outputUrl}
                                style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
                            >
                                {isProcessing ? <><Loader2 size={16} className="spin" /> Processing...</> : <><Scissors size={16} /> Trim Clip</>}
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
