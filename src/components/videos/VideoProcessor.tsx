import { useState, useRef, useEffect } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import JSZip from 'jszip';
import { Dropzone } from '../shared/Dropzone.tsx';
import { FrameGrid } from './FrameGrid.tsx';

export interface FrameData {
    url: string;
    timestamp: number;
}

export function VideoProcessor() {
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [frames, setFrames] = useState<FrameData[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [loadingMsg, setLoadingMsg] = useState('Loading FFmpeg core...');
    const ffmpegRef = useRef<FFmpeg | null>(null);

    useEffect(() => {
        // Load FFMPEG on mount
        const loadFFmpeg = async () => {
            const ffmpeg = new FFmpeg();
            ffmpeg.on('log', ({ message }) => {
                console.log(message);
            });
            // Progress from FFMPEG
            ffmpeg.on('progress', ({ progress }) => {
                setProgress(Math.max(0, Math.min(1, progress)));
                setLoadingMsg(`Extracting frames... ${Math.round(progress * 100)}%`);
            });

            try {
                await ffmpeg.load({
                    coreURL: "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.js",
                    wasmURL: "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.wasm",
                });
                ffmpegRef.current = ffmpeg;
            } catch (e) {
                console.error("Error loading FFmpeg:", e);
                setLoadingMsg("Error loading Video Processor. Please check console.");
            }
        };
        loadFFmpeg();
    }, []);

    const handleVideoSelect = async (file: File) => {
        if (!ffmpegRef.current || !ffmpegRef.current.loaded) {
            alert("Please wait for the processor to finish loading.");
            return;
        }
        setVideoFile(file);
        setIsProcessing(true);
        setFrames([]);
        setProgress(0);
        setLoadingMsg('Preparing video...');

        const ffmpeg = ffmpegRef.current;
        const inputName = 'input.video';

        try {
            await ffmpeg.writeFile(inputName, await fetchFile(file));

            // Extract 1 frame per second (fps=1). You can adjust this rule.
            setLoadingMsg('Extracting frames (1 fps)...');
            await ffmpeg.exec([
                '-i', inputName,
                '-vf', 'fps=1',
                'frame_%04d.png'
            ]);

            setLoadingMsg('Processing extracted images...');

            // Read files from FFmpeg memory
            const listDir = await ffmpeg.listDir('/');
            const frameFiles = listDir.filter(f => f.name.startsWith('frame_') && f.name.endsWith('.png'));

            const extractedFrames: FrameData[] = [];
            for (let i = 0; i < frameFiles.length; i++) {
                const frameName = frameFiles[i].name;
                const fileData = await ffmpeg.readFile(frameName);
                const blob = new Blob([fileData as any], { type: 'image/png' });
                const url = URL.createObjectURL(blob);
                extractedFrames.push({
                    url,
                    timestamp: i // Assuming 1 fps, index = timestamp
                });
                // We can delete the file from memory to free up space
                await ffmpeg.deleteFile(frameName);
            }

            await ffmpeg.deleteFile(inputName);
            setFrames(extractedFrames);

        } catch (e) {
            console.error(e);
            alert('Error extracting frames from video.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownloadAll = async () => {
        if (frames.length === 0) return;

        const zip = new JSZip();

        for (let i = 0; i < frames.length; i++) {
            const response = await fetch(frames[i].url);
            const blob = await response.blob();
            zip.file(`frame_${i}.png`, blob);
        }

        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(zipBlob);
        link.download = `extraced_frames_${Date.now()}.zip`;
        document.body.appendChild(link);
        link.click();
        link.remove();
    };

    return (
        <div className="video-processor">
            {!videoFile || (!isProcessing && frames.length === 0) ? (
                <Dropzone onFileSelect={handleVideoSelect} />
            ) : (
                <div className="processing-container">
                    {isProcessing ? (
                        <div className="loading-state">
                            <p>{loadingMsg}</p>
                            <div className="progress-bar">
                                <div
                                    className="progress-fill"
                                    style={{ width: `${progress * 100}%` }}
                                />
                            </div>
                        </div>
                    ) : (
                        <FrameGrid frames={frames} onDownloadAll={handleDownloadAll} />
                    )}
                </div>
            )}
        </div>
    );
}
