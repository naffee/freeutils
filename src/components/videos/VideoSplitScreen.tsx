import { useMemo, useRef, useState, useEffect } from 'react';
import { Download, Image as ImageIcon, LayoutPanelTop, Loader2, PlaySquare, RotateCcw, Upload, Video, Code as CodeIcon, Type, Smartphone, Monitor, Palette } from 'lucide-react';
import { NextStepSuggestions } from '../shared/NextStepSuggestions.tsx';
import { renderCodeToBlob } from '../../utils/CodeToImage';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

type MediaType = 'video' | 'image' | 'code';

type MediaSlot = {
    file: File | null;
    url: string | null;
    type: MediaType;
    code?: string;
    language?: string;
};

type DurationMode = 'shortest' | 'first' | 'second';
type AudioSource = 'first' | 'second' | 'none';
type Layout = 'side-by-side' | 'top-bottom';

const acceptedTypes = 'video/*,image/*';

function getMediaKind(file: File | null): MediaType | null {
    if (!file) return null;
    if (file.type.startsWith('video/')) return 'video';
    if (file.type.startsWith('image/')) return 'image';
    return null;
}

function SlotPreview({ slot, label, onCodeChange }: { slot: MediaSlot; label: string; onCodeChange?: (code: string) => void }) {
    return (
        <div className="slot-card" style={{ background: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(10px)', border: '1px solid rgba(226, 232, 240, 0.8)', borderRadius: '20px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', transition: 'all 0.3s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
                <div>
                    <p style={{ margin: 0, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', fontWeight: 800 }}>{label}</p>
                    <p style={{ margin: '0.2rem 0 0 0', color: '#0f172a', fontWeight: 600, fontSize: '0.95rem' }}>
                        {slot.type === 'code' ? 'Code Snippet' : (slot.file ? slot.file.name : 'No media selected')}
                    </p>
                </div>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: slot.type === 'video' ? '#eff6ff' : slot.type === 'image' ? '#fdf2f8' : '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {slot.type === 'video' ? <Video size={18} color="#2563eb" /> : slot.type === 'image' ? <ImageIcon size={18} color="#db2777" /> : <CodeIcon size={18} color="#16a34a" />}
                </div>
            </div>

            <div style={{ height: '220px', borderRadius: '14px', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)', boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.2)' }}>
                {slot.type === 'code' ? (
                    <div style={{ width: '100%', height: '100%', padding: '0.5rem' }}>
                        <textarea
                            value={slot.code}
                            onChange={(e) => onCodeChange?.(e.target.value)}
                            placeholder="// Enter code here..."
                            style={{
                                width: '100%',
                                height: '100%',
                                background: 'transparent',
                                border: 'none',
                                color: '#f8fafc',
                                fontFamily: '"JetBrains Mono", monospace',
                                fontSize: '0.85rem',
                                resize: 'none',
                                outline: 'none',
                                padding: '0.5rem'
                            }}
                        />
                    </div>
                ) : !slot.url ? (
                    <div style={{ color: '#94a3b8', textAlign: 'center', padding: '1rem' }}>
                        <Upload size={32} style={{ margin: '0 auto 1rem auto', opacity: 0.5 }} />
                        <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 500 }}>Upload media file</p>
                    </div>
                ) : slot.type === 'video' ? (
                    <video src={slot.url} controls style={{ width: '100%', maxHeight: '100%', display: 'block' }} />
                ) : (
                    <img src={slot.url} alt={slot.file?.name || label} style={{ width: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block' }} />
                )}
            </div>
        </div>
    );
}

function getVideoDuration(file: File): Promise<number> {
    return new Promise((resolve) => {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.src = URL.createObjectURL(file);
        video.onloadedmetadata = () => {
            URL.revokeObjectURL(video.src);
            resolve(video.duration);
        };
        video.onerror = () => {
            resolve(5.0); // Fallback
        };
    });
}

export function VideoSplitScreen() {
    const [mediaA, setMediaA] = useState<MediaSlot>({ file: null, url: null, type: 'video' });
    const [mediaB, setMediaB] = useState<MediaSlot>({ file: null, url: null, type: 'code', code: '<p id="instruction">Swipe fast to strike</p>\n\n<div class="scene">\n  <div class="match" id="match">\n    <div id="smoke-container"></div>\n    <div class="match-head" id="match-head"></div>\n    <div class="match-stick"></div>\n  </div>\n</div>' });
    const [title, setTitle] = useState('Animated Match Stick Using HTML CSS JS');
    const [layout, setLayout] = useState<Layout>('top-bottom');
    const [resolution, setResolution] = useState('1080x1920');
    const [durationMode, setDurationMode] = useState<DurationMode>('first');
    const [audioSource, setAudioSource] = useState<AudioSource>('first');

    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [progressMsg, setProgressMsg] = useState('');
    const [outputUrl, setOutputUrl] = useState<string | null>(null);

    const inputARef = useRef<HTMLInputElement>(null);
    const inputBRef = useRef<HTMLInputElement>(null);
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

    const durationOptions = useMemo(() => [
        { value: 'shortest', label: 'Match the shorter media', disabled: false },
        { value: 'first', label: 'Use first media duration', disabled: mediaA.type !== 'video' },
        { value: 'second', label: 'Use second media duration', disabled: mediaB.type !== 'video' },
    ], [mediaA.type, mediaB.type]);

    const audioOptions = useMemo(() => [
        { value: 'first', label: 'Use first media audio', disabled: mediaA.type !== 'video' },
        { value: 'second', label: 'Use second media audio', disabled: mediaB.type !== 'video' },
        { value: 'none', label: 'No audio', disabled: false },
    ], [mediaA.type, mediaB.type]);

    const updateSlotMedia = (slot: 'A' | 'B', file: File | null) => {
        if (!file) return;
        const kind = getMediaKind(file);
        if (!kind) {
            alert('Please select a valid video or image file.');
            return;
        }

        const next = { file, url: URL.createObjectURL(file), type: kind };
        setOutputUrl(null);
        setProgress(0);

        if (slot === 'A') setMediaA(prev => ({ ...prev, ...next }));
        else setMediaB(prev => ({ ...prev, ...next }));
    };

    const toggleSlotType = (slot: 'A' | 'B') => {
        if (slot === 'A') setMediaA(prev => ({ ...prev, type: prev.type === 'code' ? 'video' : 'code', file: null, url: null }));
        else setMediaB(prev => ({ ...prev, type: prev.type === 'code' ? 'video' : 'code', file: null, url: null }));
    };

    const resetAll = () => {
        setMediaA({ file: null, url: null, type: 'video' });
        setMediaB({ file: null, url: null, type: 'code', code: '' });
        setOutputUrl(null);
        setTitle('');
        setProgress(0);
    };

    const handleProcess = async () => {
        setIsProcessing(true);
        setProgress(0);
        setProgressMsg('Preparing media panels...');
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

            // Convert Code slots to Images if necessary
            let fileA = mediaA.file;
            let fileB = mediaB.file;

            const [width, height] = resolution.split('x').map(Number);

            if (mediaA.type === 'code') {
                const blob = await renderCodeToBlob(mediaA.code || '', 'index.html', width, height);
                fileA = new File([blob], 'code-a.png', { type: 'image/png' });
            }

            if (mediaB.type === 'code') {
                const blob = await renderCodeToBlob(mediaB.code || '', 'style.css', width, height);
                fileB = new File([blob], 'code-b.png', { type: 'image/png' });
            }

            if (!fileA || !fileB) {
                alert('Please upload media or enter code for both panels.');
                setIsProcessing(false);
                return;
            }

            setProgressMsg('Downloading text fonts...');
            const fontUrl = 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxK.ttf';
            const fontResponse = await fetch(fontUrl);
            const fontBlob = await fontResponse.blob();

            setProgressMsg('Writing media assets to memory...');
            const extA = fileA.name.split('.').pop() || 'png';
            const extB = fileB.name.split('.').pop() || 'png';
            const nameA = `media_a.${extA}`;
            const nameB = `media_b.${extB}`;
            const outName = `split_screen_${Date.now()}.mp4`;

            await ffmpeg.writeFile('font.ttf', await fetchFile(fontBlob));
            await ffmpeg.writeFile(nameA, await fetchFile(fileA));
            await ffmpeg.writeFile(nameB, await fetchFile(fileB));

            setProgressMsg('Building split screen workspace...');
            const first_kind = mediaA.type === 'video' ? 'video' : 'image';
            const second_kind = mediaB.type === 'video' ? 'video' : 'image';

            // Filtergraph construction mirroring split_screen_media.py
            let left_chain = '';
            let right_chain = '';
            let stack = '';

            if (layout === 'side-by-side') {
                const left_w = Math.floor(width / 2);
                const right_w = width - left_w;
                left_chain = `[0:v]scale=${left_w}:${height}:force_original_aspect_ratio=decrease,pad=${left_w}:${height}:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1[left]`;
                right_chain = `[1:v]scale=${right_w}:${height}:force_original_aspect_ratio=decrease,pad=${right_w}:${height}:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1[right]`;
                stack = '[left][right]hstack=inputs=2[v_stacked]';
            } else {
                const top_h = Math.floor(height / 2);
                const bottom_h = height - top_h;
                left_chain = `[0:v]scale=${width}:${top_h}:force_original_aspect_ratio=decrease,pad=${width}:${top_h}:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1[top]`;
                right_chain = `[1:v]scale=${width}:${bottom_h}:force_original_aspect_ratio=decrease,pad=${width}:${bottom_h}:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1[bottom]`;
                stack = '[top][bottom]vstack=inputs=2[v_stacked]';
            }

            let text_filter = '';
            if (title) {
                const safeTitle = title.replace(/'/g, "'\\\\''").replace(/:/g, '\\\\:');
                text_filter = `[v_stacked]drawtext=text='${safeTitle}':fontfile=/font.ttf:fontcolor=white:fontsize=48:x=(w-text_w)/2:y=80:box=1:boxcolor=black@0.5:boxborderw=20[v]`;
            } else {
                text_filter = '[v_stacked]copy[v]';
            }

            const filter_complex = `${left_chain};${right_chain};${stack};${text_filter}`;

            const args = ['-y'];

            if (first_kind === 'image') args.push('-loop', '1');
            args.push('-i', nameA);

            if (second_kind === 'image') args.push('-loop', '1');
            args.push('-i', nameB);

            args.push('-filter_complex', filter_complex, '-map', '[v]');

            // Audio mapping
            if (audioSource === 'first' && first_kind === 'video') {
                args.push('-map', '0:a?');
            } else if (audioSource === 'second' && second_kind === 'video') {
                args.push('-map', '1:a?');
            }

            // Duration calculation
            let duration = 10.0;
            const durA = first_kind === 'video' ? await getVideoDuration(fileA) : 10.0;
            const durB = second_kind === 'video' ? await getVideoDuration(fileB) : 10.0;

            if (durationMode === 'first') {
                duration = durA;
            } else if (durationMode === 'second') {
                duration = durB;
            } else { // shortest
                duration = Math.min(durA, durB);
            }

            args.push('-t', duration.toFixed(3));

            args.push(
                '-c:v', 'libx264',
                '-preset', 'veryfast',
                '-crf', '23',
                '-pix_fmt', 'yuv420p'
            );

            if (audioSource !== 'none') {
                args.push('-c:a', 'aac', '-b:a', '128k');
            }

            args.push(outName);

            setProgressMsg('Rendering video collage (this may take a few minutes)...');
            await ffmpeg.exec(args);

            setProgressMsg('Reading final render...');
            const outputData = await ffmpeg.readFile(outName);
            const dataArray = new Uint8Array(outputData as any);
            const blob = new Blob([dataArray], { type: 'video/mp4' });

            setOutputUrl(URL.createObjectURL(blob));

            // clean up
            try {
                await ffmpeg.deleteFile('font.ttf');
                await ffmpeg.deleteFile(nameA);
                await ffmpeg.deleteFile(nameB);
                await ffmpeg.deleteFile(outName);
            } catch (cleanupErr) {
                console.error("Cleanup error:", cleanupErr);
            }

        } catch (error: any) {
            console.error("Split Screen render failed:", error);
            alert(`Failed: ${error.message}`);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="premium-editor" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)', minHeight: '80vh', borderRadius: '32px', padding: '2rem' }}>
            <div className="seo-writeup" style={{ textAlign: 'center', marginBottom: '3rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.2em' }}>Premium Creator Tools</span>
                <h2 style={{ fontSize: '2.5rem', fontWeight: 900, marginTop: '0.5rem', color: '#0f172a' }}>Split Screen Studio</h2>
                <p style={{ color: '#64748b', fontSize: '1.1rem', maxWidth: '600px', margin: '1rem auto' }}>Create professional tutorial videos with side-by-side or stacked views of code and media.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div>
                            <SlotPreview
                                slot={mediaA}
                                label="Top / Left Panel"
                                onCodeChange={(c) => setMediaA(p => ({ ...p, code: c }))}
                            />
                            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                                <button onClick={() => toggleSlotType('A')} className="btn-secondary" style={{ flex: 1, padding: '0.6rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                    {mediaA.type === 'code' ? <Video size={14} /> : <CodeIcon size={14} />} {mediaA.type === 'code' ? 'Switch to Media' : 'Switch to Code'}
                                </button>
                                {mediaA.type !== 'code' && (
                                    <label className="btn-secondary" style={{ padding: '0.6rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Upload size={14} />
                                        <input ref={inputARef} type="file" accept={acceptedTypes} style={{ display: 'none' }} onChange={(e) => updateSlotMedia('A', e.target.files?.[0] || null)} />
                                    </label>
                                )}
                            </div>
                        </div>
                        <div>
                            <SlotPreview
                                slot={mediaB}
                                label="Bottom / Right Panel"
                                onCodeChange={(c) => setMediaB(p => ({ ...p, code: c }))}
                            />
                            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                                <button onClick={() => toggleSlotType('B')} className="btn-secondary" style={{ flex: 1, padding: '0.6rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                    {mediaB.type === 'code' ? <Video size={14} /> : <CodeIcon size={14} />} {mediaB.type === 'code' ? 'Switch to Media' : 'Switch to Code'}
                                </button>
                                {mediaB.type !== 'code' && (
                                    <label className="btn-secondary" style={{ padding: '0.6rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Upload size={14} />
                                        <input ref={inputBRef} type="file" accept={acceptedTypes} style={{ display: 'none' }} onChange={(e) => updateSlotMedia('B', e.target.files?.[0] || null)} />
                                    </label>
                                )}
                            </div>
                        </div>
                    </div>

                    {outputUrl && (
                        <div className="output-preview" style={{ background: '#000', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '4px solid #fff' }}>
                            <video src={outputUrl} controls style={{ width: '100%', maxHeight: '540px', display: 'block' }} />
                        </div>
                    )}
                </div>

                <aside style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ background: '#fff', borderRadius: '24px', padding: '1.5rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                        <h4 style={{ margin: '0 0 1.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}>
                            <LayoutPanelTop size={20} color="#2563eb" /> Studio Controls
                        </h4>

                        <div className="control-group" style={{ marginBottom: '1.25rem' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                                <Type size={14} /> Video Title
                            </label>
                            <input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Enter title overlay..."
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1.5px solid #e2e8f0', background: '#f8fafc', outline: 'none', transition: 'all 0.2s' }}
                            />
                        </div>

                        <div className="control-group" style={{ marginBottom: '1.25rem' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                                <Smartphone size={14} /> Layout
                            </label>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                    onClick={() => setLayout('top-bottom')}
                                    style={{ flex: 1, padding: '0.75rem', borderRadius: '12px', border: '1.5px solid', borderColor: layout === 'top-bottom' ? '#2563eb' : '#e2e8f0', background: layout === 'top-bottom' ? '#eff6ff' : '#fff', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
                                >
                                    Stacked
                                </button>
                                <button
                                    onClick={() => setLayout('side-by-side')}
                                    style={{ flex: 1, padding: '0.75rem', borderRadius: '12px', border: '1.5px solid', borderColor: layout === 'side-by-side' ? '#2563eb' : '#e2e8f0', background: layout === 'side-by-side' ? '#eff6ff' : '#fff', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
                                >
                                    Side
                                </button>
                            </div>
                        </div>

                        <div className="control-group" style={{ marginBottom: '1.25rem' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                                <Monitor size={14} /> Resolution
                            </label>
                            <select value={resolution} onChange={(e) => setResolution(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1.5px solid #e2e8f0', background: '#f8fafc', outline: 'none' }}>
                                <option value="1080x1920">TikTok/Reels (9:16)</option>
                                <option value="1920x1080">Landscape (16:9)</option>
                                <option value="1080x1080">Square (1:1)</option>
                            </select>
                        </div>

                        <div className="control-group" style={{ marginBottom: '1.25rem' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                                <Palette size={14} /> Audio & Time
                            </label>
                            <select value={audioSource} onChange={(e) => setAudioSource(e.target.value as AudioSource)} style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1.5px solid #e2e8f0', background: '#f8fafc', marginBottom: '0.5rem', outline: 'none' }}>
                                {audioOptions.map(opt => <option key={opt.value} value={opt.value} disabled={opt.disabled}>{opt.label}</option>)}
                            </select>
                            <select value={durationMode} onChange={(e) => setDurationMode(e.target.value as DurationMode)} style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1.5px solid #e2e8f0', background: '#f8fafc', outline: 'none' }}>
                                {durationOptions.map(opt => <option key={opt.value} value={opt.value} disabled={opt.disabled}>{opt.label}</option>)}
                            </select>
                        </div>

                        {/* Progress Bar */}
                        {isProcessing && (
                            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '1rem', borderRadius: '12px', marginBottom: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem', color: '#166534', fontWeight: 600 }}>
                                    <span>{progressMsg}</span>
                                    <span>{progress}%</span>
                                </div>
                                <div style={{ width: '100%', background: '#dcfce7', borderRadius: '4px', overflow: 'hidden', height: '6px' }}>
                                    <div style={{ width: `${progress}%`, background: '#22c55e', height: '100%', transition: 'width 0.1s' }} />
                                </div>
                            </div>
                        )}

                        <button
                            className="btn-primary"
                            onClick={handleProcess}
                            disabled={isProcessing}
                            style={{ width: '100%', padding: '1rem', borderRadius: '16px', fontSize: '1rem', justifyContent: 'center', background: 'linear-gradient(to right, #2563eb, #7c3aed)', display: 'flex', alignItems: 'center', gap: '0.5rem', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 600 }}
                        >
                            {isProcessing ? <><Loader2 size={20} className="spin" /> Rendering...</> : <><PlaySquare size={20} /> Create Video</>}
                        </button>
                    </div>

                    {outputUrl && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <a href={outputUrl} download={`split-screen-${Date.now()}.mp4`} className="btn-primary" style={{ justifyContent: 'center', padding: '1rem', borderRadius: '16px', textDecoration: 'none', background: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fff' }}>
                                <Download size={20} /> Download Result
                            </a>
                            <button onClick={resetAll} className="btn-secondary" style={{ padding: '0.75rem', borderRadius: '16px', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <RotateCcw size={18} /> Start New
                            </button>
                            <NextStepSuggestions fileUrl={outputUrl} fileName="split-screen" fileType="video" />
                        </div>
                    )}
                </aside>
            </div>
        </div>
    );
}
