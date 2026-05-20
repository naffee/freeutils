import { NextStepSuggestions } from '../shared/NextStepSuggestions.tsx';
import { useState, useRef, useEffect } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import { Merge, Loader2, Download, RotateCcw, Plus, GripVertical, Trash2, Video } from 'lucide-react';

export function VideoMerger() {
    const [videoFiles, setVideoFiles] = useState<{ id: string; file: File; url: string }[]>([]);

    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [outputUrl, setOutputUrl] = useState<string | null>(null);
    const [resolution, setResolution] = useState('1280x720');

    const ffmpegRef = useRef(new FFmpeg());
    const fileInputRef = useRef<HTMLInputElement>(null);

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

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files).map(file => ({
                id: Math.random().toString(36).substring(7),
                file,
                url: URL.createObjectURL(file)
            }));
            setVideoFiles(prev => [...prev, ...newFiles]);
            setOutputUrl(null);
            setProgress(0);
        }
        // Reset input so the same files can be selected again if removed
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const removeFile = (idToRemove: string) => {
        setVideoFiles(prev => prev.filter(v => v.id !== idToRemove));
        setOutputUrl(null);
    };

    const moveFile = (index: number, direction: 'up' | 'down') => {
        const newFiles = [...videoFiles];
        if (direction === 'up' && index > 0) {
            [newFiles[index - 1], newFiles[index]] = [newFiles[index], newFiles[index - 1]];
        } else if (direction === 'down' && index < newFiles.length - 1) {
            [newFiles[index + 1], newFiles[index]] = [newFiles[index], newFiles[index + 1]];
        }
        setVideoFiles(newFiles);
    };

    const handleProcess = async () => {
        if (videoFiles.length < 2 || !ffmpegRef.current.loaded) return;

        setIsProcessing(true);
        setProgress(0);
        setOutputUrl(null);

        const ffmpeg = ffmpegRef.current;
        // Always standardizing around MP4 for safest browser playback when re-encoding
        const outputExt = 'mp4';
        const outputName = `merged_output.${outputExt}`;
        const filesToCleanup: string[] = [];

        try {
            // Write all files to FFmpeg FS and build command arrays
            const inputs: string[] = [];
            const filters: string[] = [];
            let concatStr = '';

            for (let i = 0; i < videoFiles.length; i++) {
                const extension = videoFiles[i].file.name.split('.').pop() || 'mp4';
                const safeName = `input_${i}.${extension}`;
                await ffmpeg.writeFile(safeName, await fetchFile(videoFiles[i].file));
                filesToCleanup.push(safeName);

                // Check if this input has audio by listening to FFmpeg log output during a quick probe
                let hasAudio = false;
                const logHandler = ({ message }: { message: string }) => {
                    if (message.toLowerCase().includes('audio:')) {
                        hasAudio = true;
                    }
                };
                ffmpeg.on('log', logHandler);
                try {
                    // Running a basic info command will print stream info to logs
                    await ffmpeg.exec(['-i', safeName]);
                } catch (e) {
                    // ffmpeg -i always exits with an error because no output is specified, which is expected
                } finally {
                    ffmpeg.off('log', logHandler);
                }

                let inputToUse = safeName;
                if (!hasAudio) {
                    const silentName = `silent_${i}.${extension}`;
                    // Add silent audio track matching video duration
                    await ffmpeg.exec([
                        '-i', safeName,
                        '-f', 'lavfi', '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100',
                        '-c:v', 'copy',
                        '-c:a', 'aac',
                        '-shortest',
                        silentName
                    ]);
                    inputToUse = silentName;
                    filesToCleanup.push(silentName);
                }

                inputs.push('-i', inputToUse);

                // Parse chosen resolution
                const [w, h] = resolution.split('x');

                // Ensure all videos are exactly the same size, framerate, and aspect ratio via scaling and padding
                filters.push(`[${i}:v]scale=${w}:${h}:force_original_aspect_ratio=decrease,pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30[v${i}];`);

                // Resample all audio to a standard frequency so concat doesn't fail on mixed sample rates
                filters.push(`[${i}:a]aresample=44100[a${i}];`);

                concatStr += `[v${i}][a${i}]`;
            }

            // Bring them all together!
            filters.push(`${concatStr}concat=n=${videoFiles.length}:v=1:a=1[v][a]`);

            const args = [
                ...inputs,
                '-filter_complex', filters.join(''),
                '-map', '[v]',
                '-map', '[a]',
                '-c:v', 'libx264',
                '-preset', 'fast',
                '-crf', '26', // Slightly compressed to save memory during heavy WASM workloads
                '-c:a', 'aac',
                outputName
            ];

            await ffmpeg.exec(args);

            const outputData = await ffmpeg.readFile(outputName);
            const dataArray = new Uint8Array(outputData as any);

            const blob = new Blob([dataArray], { type: 'video/mp4' });
            const url = URL.createObjectURL(blob);
            setOutputUrl(url);

        } catch (error) {
            console.error("Merge failed:", error);
            alert("Failed to merge videos. Please check that none of the files are corrupted and watch the memory limits.");
        } finally {
            setIsProcessing(false);
            try {
                await ffmpeg.deleteFile(outputName);
            } catch (e) { }
            for (const file of filesToCleanup) {
                try {
                    await ffmpeg.deleteFile(file);
                } catch (e) { }
            }
        }
    };

    if (videoFiles.length === 0) {
        return (
            <div className="watermark-remover">
            <div className="seo-writeup">
                <h2>Merge Videos</h2>
                <p>Combine multiple video clips into one continuous movie. A simple, fast way to join your favorite moments together.</p>
            </div>
                <div style={{ padding: '3rem', border: '2px dashed #cbd5e1', borderRadius: '16px', textAlign: 'center', background: '#f8fafc', cursor: 'pointer', maxWidth: '600px', margin: '0 auto' }} onClick={() => fileInputRef.current?.click()}>
                    <Merge size={48} color="#94a3b8" style={{ margin: '0 auto', marginBottom: '1rem' }} />
                    <h3 style={{ margin: 0, color: '#0f172a', marginBottom: '0.5rem' }}>Drop videos to Merge</h3>
                    <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>Select multiple files to concatenate them together flawlessly.</p>
                    <input type="file" multiple accept="video/*" ref={fileInputRef} onChange={handleFileSelect} style={{ display: 'none' }} />
                </div>
            </div>
        );
    }

    return (
        <div className="watermark-remover">
            <div className="seo-writeup">
                <h2>Merge Videos</h2>
                <p>Combine multiple video clips into one continuous movie. A simple, fast way to join your favorite moments together.</p>
            </div>
            <div className="editor-container" style={{ maxWidth: '1000px', margin: '0 auto' }}>
                <div style={{ display: 'flex', gap: '2rem', width: '100%', alignItems: 'flex-start' }}>

                    {/* Left Column: Input List & Order */}
                    <div style={{ flex: 1.5, display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0' }}>
                            <h3 style={{ margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Video size={20} /> Video Sequence
                            </h3>
                            <button className="btn-secondary" onClick={() => fileInputRef.current?.click()} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <Plus size={14} /> Add More
                            </button>
                            <input type="file" multiple accept="video/*" ref={fileInputRef} onChange={handleFileSelect} style={{ display: 'none' }} />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {videoFiles.map((v, index) => (
                                <div key={v.id} style={{ display: 'flex', alignItems: 'center', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.5rem', gap: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                        <button onClick={() => moveFile(index, 'up')} disabled={index === 0} style={{ background: 'none', border: 'none', cursor: index === 0 ? 'default' : 'pointer', color: index === 0 ? '#cbd5e1' : '#64748b', padding: '2px' }}>
                                            <GripVertical size={16} />
                                        </button>
                                        <button onClick={() => moveFile(index, 'down')} disabled={index === videoFiles.length - 1} style={{ background: 'none', border: 'none', cursor: index === videoFiles.length - 1 ? 'default' : 'pointer', color: index === videoFiles.length - 1 ? '#cbd5e1' : '#64748b', padding: '2px' }}>
                                            <GripVertical size={16} />
                                        </button>
                                    </div>
                                    <video src={v.url} style={{ width: '80px', height: '45px', objectFit: 'cover', borderRadius: '4px', background: '#000' }} />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#1e293b', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {v.file.name}
                                        </p>
                                        <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8' }}>
                                            {(v.file.size / 1024 / 1024).toFixed(2)} MB
                                        </p>
                                    </div>
                                    <button onClick={() => removeFile(v.id)} style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#ef4444', borderRadius: '6px', padding: '0.4rem', cursor: 'pointer' }}>
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>

                    </div>

                    {/* Right Column: Player & Actions */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'sticky', top: '2rem' }}>

                        {outputUrl && (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#000', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
                                <video
                                    src={outputUrl}
                                    controls
                                    style={{ maxWidth: '100%', maxHeight: '300px', display: 'block' }}
                                />
                            </div>
                        )}

                        <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <h4 style={{ margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                Universal Render Engine
                            </h4>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', lineHeight: 1.5 }}>
                                The video files will be rescaled, padded, and normalized to ensure a perfect stitch. Because they are being re-rendered, it will take a moment depending on length.
                            </p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Output Resolution</label>
                                <select
                                    value={resolution}
                                    onChange={(e) => setResolution(e.target.value)}
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
                                    <option value="1920x1080">1080p (FHD)</option>
                                    <option value="1280x720">720p (HD)</option>
                                    <option value="854x480">480p (SD)</option>
                                </select>
                            </div>

                            {outputUrl && (
                                <div style={{ background: '#ecfdf5', padding: '1rem', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
                                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#047857', fontWeight: 500 }}>
                                        Merged successfully!
                                    </p>
                                </div>
                            )}

                        </div>

                        {/* Core Actions */}
                        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {outputUrl ? (
                                <>
                                <a
                                    href={outputUrl}
                                    download={`merged_video_${Date.now()}.mp4`}
                                    className="btn-primary"
                                    style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}
                                >
                                    <Download size={16} /> Save Merged Video
                                </a>
                                <div style={{ fontSize: '0.8rem', color: '#b91c1c', textAlign: 'center', marginTop: '0.5rem', background: '#fef2f2', padding: '0.5rem', borderRadius: '4px', border: '1px solid #fecaca', lineHeight: 1.4 }}>
                                   ⚠️ <strong>Warning:</strong> Files are not saved on our servers. Please download your work now or it will be lost forever.
                                
                                </div>
                                <NextStepSuggestions 
                                    fileUrl={outputUrl || ''} 
                                    fileName={'processed_file'} 
                                    fileType="video"
                                />
                                </>
                            ) : (
                                <button className="btn-primary" onClick={handleProcess} disabled={isProcessing || videoFiles.length < 2} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                                    {isProcessing ? <><Loader2 size={16} className="spin" /> Linking ({progress}%)...</> : <><Merge size={16} /> Merge Videos</>}
                                </button>
                            )}
                            <button className="btn-secondary" onClick={() => { setVideoFiles([]); setOutputUrl(null); }} disabled={isProcessing} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                                <RotateCcw size={16} /> Start Over
                            </button>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}