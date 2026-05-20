import { useState, useRef, useEffect } from 'react';
import { Dropzone } from '../shared/Dropzone.tsx';
import { NextStepSuggestions } from '../shared/NextStepSuggestions.tsx';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import { Download, Zap, Plus, Trash2, Image as ImageIcon, FolderPlus, RefreshCw } from 'lucide-react';

type ProcessItem = {
    id: string;
    file: File;
    originalUrl: string;
    originalSize: number;
    targetSize: number;
    compressedSize: number;
    outputUrl: string | null;
    status: 'pending' | 'processing' | 'done' | 'error';
};

export function ImageCompressor() {
    const [items, setItems] = useState<ProcessItem[]>([]);
    const [globalTargetSize, setGlobalTargetSize] = useState<number>(500);
    const [isProcessing, setIsProcessing] = useState(false);
    const [loadingMsg, setLoadingMsg] = useState('Loading FFMPEG...');

    const ffmpegRef = useRef<FFmpeg | null>(null);

    useEffect(() => {
        const loadFFmpeg = async () => {
            const ffmpeg = new FFmpeg();
            ffmpeg.on('log', ({ message }) => console.log(message));
            try {
                await ffmpeg.load({
                    coreURL: "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.js",
                    wasmURL: "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.wasm",
                });
                ffmpegRef.current = ffmpeg;
            } catch (e) {
                console.error("Error loading FFmpeg:", e);
            }
        };
        loadFFmpeg();
    }, []);

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const handleFilesSelect = (files: File[]) => {
        const newItems = files.map(file => ({
            id: crypto.randomUUID(),
            file,
            originalUrl: URL.createObjectURL(file),
            originalSize: file.size,
            targetSize: globalTargetSize || Math.max(1, Math.floor((file.size / 1024) * 0.8)),
            compressedSize: 0,
            outputUrl: null,
            status: 'pending' as const
        }));
        setItems(prev => [...prev, ...newItems]);
    };

    const applyGlobalSizeToAll = () => {
        if (!globalTargetSize) return;
        setItems(prev => prev.map(item => 
            item.status === 'pending' || item.status === 'error' ? { ...item, targetSize: globalTargetSize } : item
        ));
    };

    const handleProcessAll = async () => {
        if (!ffmpegRef.current || !ffmpegRef.current.loaded) return;

        setIsProcessing(true);
        setLoadingMsg('Compressing images...');

        const pendingItems = items.filter(i => i.status === 'pending' || i.status === 'error');

        for (const item of pendingItems) {
            setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'processing' } : i));

            try {
                let ffmpeg = ffmpegRef.current;
                
                if (!ffmpeg || !ffmpeg.loaded) {
                    ffmpeg = new FFmpeg();
                    ffmpeg.on('log', ({ message }) => console.log(message));
                    await ffmpeg.load({
                        coreURL: "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.js",
                        wasmURL: "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.wasm",
                    });
                }

                const extension = item.file.name.split('.').pop() || 'png';
                const inputName = `input_${item.id}.${extension}`;
                const outputName = `output_${item.id}.${extension}`;

                await ffmpeg.writeFile(inputName, await fetchFile(item.file));

                const targetBytes = item.targetSize * 1024;
                let low = 1;
                let high = 100;
                let bestOutputData: any = null;
                let bestSize = Infinity;

                for (let i = 0; i < 7; i++) {
                    if (low > high) break;

                    const mid = Math.floor((low + high) / 2);
                    const qValue = mid <= 31 ? mid : 31;
                    const scaleFactor = mid <= 31 ? 1 : 1 - ((mid - 31) / 69) * 0.9;
                    const scaleFilter = `scale=trunc(iw*${scaleFactor}):trunc(ih*${scaleFactor})`;

                    await ffmpeg.exec([
                        '-i', inputName,
                        '-vf', scaleFilter,
                        '-update', '1',
                        '-frames:v', '1',
                        '-qscale:v', qValue.toString(),
                        outputName
                    ]);

                    const outputData = await ffmpeg.readFile(outputName);
                    const size = (outputData as Uint8Array).length;

                    if (bestOutputData === null) {
                        bestOutputData = outputData;
                        bestSize = size;
                    } else if (size <= targetBytes) {
                        if (bestSize > targetBytes || size > bestSize) {
                            bestOutputData = outputData;
                            bestSize = size;
                        }
                    } else if (size > targetBytes && bestSize > targetBytes) {
                        if (size < bestSize) {
                            bestOutputData = outputData;
                            bestSize = size;
                        }
                    }

                    if (size === targetBytes) {
                        break;
                    } else if (size > targetBytes) {
                        low = mid + 1;
                    } else {
                        high = mid - 1;
                    }

                    try {
                        await ffmpeg.deleteFile(outputName);
                    } catch (e) { }
                }

                const blob = new Blob([bestOutputData], { type: item.file.type });
                const url = URL.createObjectURL(blob);

                setItems(prev => prev.map(i => i.id === item.id ? {
                    ...i,
                    status: 'done',
                    outputUrl: url,
                    compressedSize: blob.size
                } : i));

                try {
                    await ffmpeg.deleteFile(inputName);
                } catch(e) {}
                
                // Prevent memory leak OOM
                ffmpeg.terminate();
                ffmpegRef.current = null;
            } catch (e) {
                console.error(e);
                setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'error' } : i));
                
                // Attempt recovery if error occurred
                try {
                    if (ffmpegRef.current) {
                        ffmpegRef.current.terminate();
                        ffmpegRef.current = null;
                    }
                } catch(err) {}
            }
        }

        setIsProcessing(false);
    };

    const handleDownloadAll = async () => {
        const doneItems = items.filter(i => i.status === 'done' && i.outputUrl);
        if (doneItems.length === 0) return;

        try {
            const JSZip = (await import('jszip')).default;
            const zip = new JSZip();

            for (const item of doneItems) {
                const response = await fetch(item.outputUrl!);
                const blob = await response.blob();
                zip.file(`compressed_${item.file.name}`, blob);
            }

            const zipBlob = await zip.generateAsync({ type: 'blob' });
            const url = URL.createObjectURL(zipBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `compressed_images.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        } catch (e) {
            console.error("Failed to create zip", e);
            alert("Failed to create zip file");
        }
    };

    if (items.length === 0) {
        return (
            <div className="watermark-remover">
                <div className="seo-writeup">
                    <h2>Compress Images in Bulk</h2>
                    <p>Reduce the file size of your images significantly while preserving high visual quality. Upload multiple images at once.</p>
                </div>
                <Dropzone onFilesSelect={handleFilesSelect} accept="image/*" title="Drag & Drop images to compress" multiple={true} allowFolder={true} />
            </div>
        );
    }

    const pendingCount = items.filter(i => i.status === 'pending' || i.status === 'error').length;
    const doneCount = items.filter(i => i.status === 'done').length;

    return (
        <div className="watermark-remover">
            <div className="seo-writeup">
                <h2>Compress Images in Bulk</h2>
                <p>Reduce the file size of your images significantly while preserving high visual quality.</p>
            </div>
            
            <div className="editor-container" style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <h3 style={{ margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <ImageIcon size={24} /> Selected Images ({items.length})
                    </h3>
                    
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        <label className="btn-secondary" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                            <Plus size={18} /> Add More
                            <input type="file" accept="image/*" multiple hidden onChange={(e) => {
                                if (e.target.files && e.target.files.length > 0) {
                                    handleFilesSelect(Array.from(e.target.files));
                                }
                            }} />
                        </label>
                        
                        <label className="btn-secondary" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                            <FolderPlus size={18} /> Add Folder
                            <input 
                                type="file" 
                                accept="image/*" 
                                multiple 
                                hidden 
                                {...({ webkitdirectory: "", directory: "" } as any)} 
                                onChange={(e) => {
                                    if (e.target.files && e.target.files.length > 0) {
                                        handleFilesSelect(Array.from(e.target.files));
                                    }
                                }} 
                            />
                        </label>
                        
                        <button className="btn-secondary" onClick={() => setItems([])} disabled={isProcessing}>
                            Clear All
                        </button>
                        
                        {doneCount > 0 && (
                            <button className="btn-primary" onClick={handleDownloadAll} style={{ background: '#10b981', border: 'none' }}>
                                <Download size={18} /> Download All Done
                            </button>
                        )}
                        
                        {pendingCount > 0 && (
                            <button className="btn-primary" onClick={handleProcessAll} disabled={isProcessing || !ffmpegRef.current?.loaded}>
                                {isProcessing ? loadingMsg : <><Zap size={18} /> Compress {pendingCount} Pending</>}
                            </button>
                        )}
                    </div>
                </div>

                {pendingCount > 0 && (
                    <div style={{ padding: '1rem', background: '#f1f5f9', borderRadius: '12px', border: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                        <label style={{ fontWeight: 600, color: '#334155' }}>Global Target Size Limit (KB):</label>
                        <input 
                            type="number" 
                            min="1"
                            value={globalTargetSize || ''} 
                            onChange={(e) => setGlobalTargetSize(Number(e.target.value) || 0)}
                            style={{ width: '100px', padding: '0.5rem', borderRadius: '6px', border: '1px solid #94a3b8' }}
                        />
                        <button className="btn-secondary" onClick={applyGlobalSizeToAll} style={{ padding: '0.5rem 1rem' }}>
                            Apply to Pending
                        </button>
                    </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {items.map((item) => (
                        <div key={item.id} style={{ 
                            display: 'flex', 
                            gap: '1.5rem', 
                            padding: '1rem', 
                            background: '#f8fafc', 
                            borderRadius: '12px', 
                            border: '1px solid #e2e8f0', 
                            alignItems: 'center',
                            flexWrap: 'wrap'
                        }}>
                            <img 
                                src={item.outputUrl || item.originalUrl} 
                                alt={item.file.name}
                                style={{ 
                                    width: '80px', 
                                    height: '80px', 
                                    objectFit: 'cover', 
                                    borderRadius: '8px',
                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                }} 
                            />
                            
                            <div style={{ flex: 1, minWidth: '200px' }}>
                                <div style={{ fontWeight: 600, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {item.file.name}
                                </div>
                                <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.25rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <span>{formatBytes(item.originalSize)}</span>
                                    {item.outputUrl && (
                                        <>
                                            <span>→</span>
                                            <span style={{ color: '#10b981', fontWeight: 600 }}>{formatBytes(item.compressedSize)}</span>
                                            <span style={{ color: '#8b5cf6', marginLeft: '0.5rem', fontWeight: 600 }}>
                                                (-{Math.round(((item.originalSize - item.compressedSize) / item.originalSize) * 100)}%)
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>
                            
                            {!item.outputUrl && item.status !== 'processing' && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#fff', padding: '0.5rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                                    <label style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>Target Limit:</label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                        <input 
                                            type="number" 
                                            min="1"
                                            value={item.targetSize} 
                                            onChange={(e) => {
                                                const val = Number(e.target.value);
                                                setItems(prev => prev.map(i => i.id === item.id ? { ...i, targetSize: val || 1 } : i));
                                            }}
                                            style={{ 
                                                width: '70px', 
                                                padding: '0.25rem 0.5rem', 
                                                borderRadius: '4px', 
                                                border: '1px solid #cbd5e1',
                                                outline: 'none'
                                            }}
                                        />
                                        <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>KB</span>
                                    </div>
                                </div>
                            )}
                            
                            <div style={{ width: '130px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '1rem' }}>
                                {item.status === 'pending' && <span style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: 500 }}>Pending</span>}
                                {item.status === 'processing' && <span style={{ color: '#eab308', fontSize: '0.9rem', fontWeight: 500 }}>Processing...</span>}
                                {item.status === 'error' && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span style={{ color: '#ef4444', fontSize: '0.9rem', fontWeight: 500 }}>Error</span>
                                        <button 
                                            onClick={() => setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'pending' } : i))} 
                                            className="btn-secondary" 
                                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                                        >
                                            <RefreshCw size={12} /> Retry
                                        </button>
                                    </div>
                                )}
                                {item.status === 'done' && item.outputUrl && (
                                    <a href={item.outputUrl} download={`compressed_${item.file.name}`} className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', textDecoration: 'none' }}>
                                        <Download size={16} /> Save
                                    </a>
                                )}
                                
                                <button 
                                    onClick={() => setItems(prev => prev.filter(i => i.id !== item.id))} 
                                    disabled={item.status === 'processing' || isProcessing}
                                    style={{ 
                                        background: 'none', 
                                        border: 'none', 
                                        color: '#ef4444', 
                                        cursor: (item.status === 'processing' || isProcessing) ? 'not-allowed' : 'pointer', 
                                        padding: '0.5rem',
                                        opacity: (item.status === 'processing' || isProcessing) ? 0.5 : 1,
                                        display: 'flex'
                                    }}
                                    title="Remove image"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {doneCount > 0 && (
                    <div style={{ marginTop: '1rem' }}>
                        <div style={{ fontSize: '0.85rem', color: '#b91c1c', textAlign: 'center', marginBottom: '1rem', background: '#fef2f2', padding: '0.75rem', borderRadius: '8px', border: '1px solid #fecaca', lineHeight: 1.4 }}>
                            ⚠️ <strong>Warning:</strong> Files are not saved on our servers. Please download your work now or it will be lost forever.
                        </div>
                        <NextStepSuggestions 
                            fileUrl={items.find(i => i.status === 'done')?.outputUrl || ''} 
                            fileName={items.find(i => i.status === 'done')?.file.name || 'processed_files'} 
                            fileType="image" 
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
