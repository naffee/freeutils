import { useState, useRef, useEffect } from 'react';
import { Dropzone } from '../shared/Dropzone.tsx';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import { Scissors, Loader2, Download, RotateCcw, Clock, Play, Pause, Music, Settings2 } from 'lucide-react';

export function AudioTrimmer() {
    const [audioFile, setAudioFile] = useState<File | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);

    // Range state (in seconds)
    const [rangeStart, setRangeStart] = useState(0);
    const [rangeEnd, setRangeEnd] = useState(10);
    const [duration, setDuration] = useState(0);

    const [isProcessing, setIsProcessing] = useState(false);
    const [outputUrl, setOutputUrl] = useState<string | null>(null);
    const [isPlayingSelection, setIsPlayingSelection] = useState(false);

    const ffmpegRef = useRef(new FFmpeg());
    const audioRef = useRef<HTMLAudioElement>(null);
    const timelineRef = useRef<HTMLDivElement>(null);

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

    // Handle audio time update to stop at rangeEnd if playing selection
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const handleTimeUpdate = () => {
            if (isPlayingSelection && audio.currentTime >= rangeEnd) {
                audio.pause();
                setIsPlayingSelection(false);
                audio.currentTime = rangeStart;
            }
        };

        audio.addEventListener('timeupdate', handleTimeUpdate);
        return () => audio.removeEventListener('timeupdate', handleTimeUpdate);
    }, [isPlayingSelection, rangeEnd, rangeStart]);

    const handleFileSelect = (file: File) => {
        setAudioFile(file);
        const url = URL.createObjectURL(file);
        setAudioUrl(url);
        setOutputUrl(null);

        const tempAudio = new Audio(url);
        tempAudio.onloadedmetadata = () => {
            setDuration(tempAudio.duration);
            setRangeStart(0);
            setRangeEnd(Math.min(tempAudio.duration, 10));
        };
    };

    const formatSeconds = (seconds: number) => {
        const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
        const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toFixed(1).padStart(4, '0');
        return `${h}:${m}:${s}`;
    };

    const handleProcess = async () => {
        if (!audioFile || !ffmpegRef.current.loaded) return;

        setIsProcessing(true);
        setOutputUrl(null);

        const ffmpeg = ffmpegRef.current;
        const inputExt = audioFile.name.split('.').pop();
        const inputName = `input.${inputExt}`;
        const outputName = `trimmed.${inputExt}`;

        try {
            await ffmpeg.writeFile(inputName, await fetchFile(audioFile));

            await ffmpeg.exec([
                '-i', inputName,
                '-ss', rangeStart.toString(),
                '-to', rangeEnd.toString(),
                '-c', 'copy',
                outputName
            ]);

            const outputData = await ffmpeg.readFile(outputName);
            const dataArray = new Uint8Array(outputData as any);
            const blob = new Blob([dataArray], { type: audioFile.type });
            const url = URL.createObjectURL(blob);
            setOutputUrl(url);

        } catch (error) {
            console.error("Trimming failed:", error);
            alert("Failed to trim audio.");
        } finally {
            setIsProcessing(false);
            try {
                await ffmpeg.deleteFile(inputName);
                await ffmpeg.deleteFile(outputName);
            } catch (e) { }
        }
    };

    const handlePlaySelection = () => {
        if (!audioRef.current) return;

        if (isPlayingSelection) {
            audioRef.current.pause();
            setIsPlayingSelection(false);
        } else {
            audioRef.current.currentTime = rangeStart;
            audioRef.current.play();
            setIsPlayingSelection(true);
        }
    };

    const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!timelineRef.current || duration === 0) return;
        const rect = timelineRef.current.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        const time = percent * duration;

        // Closest handle movement
        if (Math.abs(time - rangeStart) < Math.abs(time - rangeEnd)) {
            setRangeStart(Math.max(0, Math.min(time, rangeEnd - 0.1)));
        } else {
            setRangeEnd(Math.min(duration, Math.max(time, rangeStart + 0.1)));
        }
        setOutputUrl(null);
    };

    if (!audioUrl) {
        return (
            <div className="watermark-remover">
                <Dropzone onFileSelect={handleFileSelect} accept="audio/*" title="Drop an Audio file to Trim/Cut with Preview" />
            </div>
        );
    }

    return (
        <div className="watermark-remover">
            <div className="editor-container" style={{ maxWidth: '1000px', margin: '0 auto' }}>
                <div style={{ display: 'flex', gap: '2rem', width: '100%', alignItems: 'stretch' }}>

                    {/* Left Column: Audio Preview & Timeline */}
                    <div style={{ flex: 1.5, display: 'flex', flexDirection: 'column', background: '#f8fafc', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0', minHeight: '400px' }}>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #1e293b, #0f172a)', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', padding: '2rem', position: 'relative' }}>
                            <audio
                                ref={audioRef}
                                src={audioUrl}
                                controls={false}
                                style={{ display: 'none' }}
                            />

                            <div style={{ width: '100%', marginBottom: '2rem', textAlign: 'center' }}>
                                <MusicIcon size={64} color="#3b82f6" style={{ opacity: 0.5, marginBottom: '1rem' }} />
                                <div style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 700 }}>
                                    {isProcessing ? 'Processing...' : outputUrl ? 'Trimmed Result' : 'Original Track'}
                                </div>
                            </div>

                            {/* Custom Timeline Tool */}
                            {!outputUrl && (
                                <div style={{ width: '100%', marginTop: 'auto' }}>
                                    <div
                                        ref={timelineRef}
                                        onClick={handleTimelineClick}
                                        style={{ height: '32px', background: 'rgba(255,255,255,0.1)', borderRadius: '16px', position: 'relative', cursor: 'pointer', overflow: 'hidden' }}
                                    >
                                        {/* Selection Range Overlay */}
                                        <div style={{
                                            position: 'absolute',
                                            left: `${(rangeStart / duration) * 100}%`,
                                            width: `${((rangeEnd - rangeStart) / duration) * 100}%`,
                                            height: '100%',
                                            background: 'rgba(59, 130, 246, 0.4)',
                                            borderLeft: '2px solid #3b82f6',
                                            borderRight: '2px solid #3b82f6',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}>
                                            <div style={{ width: '4px', height: '60%', background: '#fff', borderRadius: '2px', marginLeft: '2px' }} />
                                            <div style={{ width: '4px', height: '60%', background: '#fff', borderRadius: '2px', marginRight: '2px' }} />
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem', color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>
                                        <span>{formatSeconds(rangeStart)}</span>
                                        <span>{formatSeconds(rangeEnd)}</span>
                                    </div>
                                </div>
                            )}

                            {outputUrl && (
                                <audio src={outputUrl} controls style={{ width: '100%' }} />
                            )}
                        </div>

                        {!outputUrl && (
                            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem', gap: '1rem' }}>
                                <button
                                    className="btn-primary"
                                    onClick={handlePlaySelection}
                                    style={{ background: isPlayingSelection ? '#f43f5e' : '#3b82f6', minWidth: '180px' }}
                                >
                                    {isPlayingSelection ? <><Pause size={16} /> Stop Preview</> : <><Play size={16} /> Preview Selection</>}
                                </button>
                            </div>
                        )}

                        {outputUrl && (
                            <p style={{ textAlign: 'center', marginTop: '1rem', color: '#16a34a', fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                <Scissors size={16} /> Cut complete!
                            </p>
                        )}
                    </div>

                    {/* Right Column: Information & Actions */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                        <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                            <h4 style={{ margin: '0 0 1.25rem 0', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <SettingsIcon size={18} /> Trim Controls
                            </h4>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                <div style={{ background: '#f1f5f9', padding: '1rem', borderRadius: '8px' }}>
                                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>START POSITION</div>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>{formatSeconds(rangeStart)}</div>
                                </div>

                                <div style={{ background: '#f1f5f9', padding: '1rem', borderRadius: '8px' }}>
                                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>END POSITION</div>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>{formatSeconds(rangeEnd)}</div>
                                </div>

                                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Selection length:</span>
                                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#3b82f6' }}>{formatSeconds(rangeEnd - rangeStart)}</span>
                                </div>
                            </div>
                        </div>

                        <div style={{ background: '#eff6ff', padding: '1rem', borderRadius: '12px', border: '1px solid #bfdbfe' }}>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: '#1e40af', lineHeight: 1.5 }}>
                                <Clock size={12} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                                Click and drag on the timeline to adjust start and end points. Use the <strong>Preview</strong> button to hear exactly what you've selected before cutting.
                            </p>
                        </div>

                        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {outputUrl ? (
                                <a
                                    href={outputUrl}
                                    download={`trimmed_${audioFile?.name}`}
                                    className="btn-primary"
                                    style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', background: '#16a34a' }}
                                >
                                    <Download size={16} /> Save Trimmed Track
                                </a>
                            ) : (
                                <button className="btn-primary" onClick={handleProcess} disabled={isProcessing} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                                    {isProcessing ? <><Loader2 size={16} className="spin" /> Finalizing...</> : <><Scissors size={16} /> Perform Cut</>}
                                </button>
                            )}
                            <button className="btn-secondary" onClick={() => { setAudioUrl(null); setAudioFile(null); setOutputUrl(null); setIsPlayingSelection(false); }} disabled={isProcessing} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                                <RotateCcw size={16} /> Reset
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

// Internal icons helper
function MusicIcon({ size, color, style }: any) {
    return <Music size={size} color={color} style={style} />;
}

function SettingsIcon({ size }: any) {
    return <Settings2 size={size} />;
}
