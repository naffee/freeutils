import { useState, useRef, useEffect } from 'react';
import { Dropzone } from '../shared/Dropzone.tsx';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import exifr from 'exifr';
import { Download, FileWarning, Search, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';

interface MetadataEntry {
    key: string;
    value: string;
}

export function ImageMetadataEditor() {
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imageUrl, setImageUrl] = useState<string | null>(null);

    const [metadata, setMetadata] = useState<MetadataEntry[]>([]);
    const [originalMetadataCount, setOriginalMetadataCount] = useState(0);

    const [isProcessing, setIsProcessing] = useState(false);
    const [outputUrl, setOutputUrl] = useState<string | null>(null);
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

    const handleFileSelect = async (file: File) => {
        if (!ffmpegRef.current || !ffmpegRef.current.loaded) {
            alert("FFmpeg is still loading. Please try again in a moment.");
            return;
        }

        setImageFile(file);
        setImageUrl(URL.createObjectURL(file));
        setOutputUrl(null);
        await extractMetadata(file);
    };

    const extractMetadata = async (file: File) => {
        setIsProcessing(true);
        setLoadingMsg('Scanning file for deep EXIF metadata...');

        try {
            // exifr parses actual EXIF, XMP, IPTC, ICC tags from the file blob directly
            const output = await exifr.parse(file, true); // true = get everything

            const entries: MetadataEntry[] = [];

            if (output) {
                // Flatten the object into key-value pairs
                for (const [key, value] of Object.entries(output)) {
                    // Skip complex nested objects for a simple UI, or stringify them
                    if (typeof value === 'object' && value !== null) {
                        try {
                            entries.push({ key, value: JSON.stringify(value) });
                        } catch (e) { /* ignore circular */ }
                    } else {
                        entries.push({ key, value: String(value) });
                    }
                }
            }

            setMetadata(entries);
            setOriginalMetadataCount(entries.length);
        } catch (e) {
            console.error('Metadata extraction failed', e);
            // Fallback to empty if it fails to parse
            setMetadata([]);
            setOriginalMetadataCount(0);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleProcess = async (action: 'strip' | 'save') => {
        if (!ffmpegRef.current || !ffmpegRef.current.loaded || !imageFile) return;

        setIsProcessing(true);
        setLoadingMsg(action === 'strip' ? 'Sanitizing Image...' : 'Baking new metadata...');

        const ffmpeg = ffmpegRef.current;
        const ext = imageFile.name.split('.').pop() || 'tmp';
        const inputName = `input_${Date.now()}.${ext}`;
        const outputName = `output_${Date.now()}.${ext}`;
        const metaFile = 'new_metadata.txt';

        try {
            await ffmpeg.writeFile(inputName, await fetchFile(imageFile));

            if (action === 'strip') {
                // -map_metadata -1 removes all global metadata
                await ffmpeg.exec(['-i', inputName, '-map_metadata', '-1', '-c:v', 'copy', outputName]);
            } else {
                // Build new metadata file
                let newMetaText = `;FFMETADATA1\n`;
                for (const m of metadata) {
                    if (m.value.trim() !== '') {
                        // ffmetadata escapes =, ;, #, and \ with \
                        const escape = (str: string) => str.replace(/([=;#\\])/g, '\\$1');
                        newMetaText += `${escape(m.key)}=${escape(m.value)}\n`;
                    }
                }

                await ffmpeg.writeFile(metaFile, new TextEncoder().encode(newMetaText));

                // Note: ffmetadata muxer typically only writes a standard subset of tags (like Title, Author) 
                // into video/image containers. Deep EXIF/XMP rewriting in WASM requires piexifjs or similar, 
                // which is out of scope for a simple tool. This saves standard container tags.
                await ffmpeg.exec([
                    '-i', inputName,
                    '-i', metaFile,
                    '-map_metadata', '1', // map from the metadata file (input index 1)
                    '-codec', 'copy',
                    outputName
                ]);
            }

            const outputData = await ffmpeg.readFile(outputName);
            const blob = new Blob([outputData as any], { type: imageFile.type });
            const url = URL.createObjectURL(blob);

            setOutputUrl(url);

            await ffmpeg.deleteFile(inputName);
            await ffmpeg.deleteFile(outputName);
            if (action === 'save') await ffmpeg.deleteFile(metaFile);
        } catch (e) {
            console.error(e);
            alert('Failed to process image metadata.');
        } finally {
            setIsProcessing(false);
        }
    };

    if (!imageUrl) {
        return (
            <div className="watermark-remover">
                <Dropzone onFileSelect={handleFileSelect} accept="image/*" title="Drop an image to scan for metadata" />
            </div>
        );
    }

    return (
        <div className="watermark-remover">
            <div className="editor-container" style={{ maxWidth: '900px', margin: '0 auto' }}>
                <div style={{ display: 'flex', gap: '2rem', width: '100%' }}>

                    {/* Left Column: Image Preview */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                        <img
                            src={outputUrl || imageUrl}
                            alt="Preview"
                            style={{
                                maxWidth: '100%',
                                maxHeight: '350px',
                                borderRadius: '12px',
                                boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                                objectFit: 'contain'
                            }}
                        />
                        <div style={{ marginTop: '1rem', color: '#64748b', fontSize: '0.9rem', fontWeight: 500 }}>
                            {imageFile?.name}
                        </div>
                    </div>

                    {/* Right Column: Controls & Metadata */}
                    <div style={{ flex: 1.5, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                        {!outputUrl ? (
                            <>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', background: originalMetadataCount > 0 ? '#fff1f2' : '#f0fdf4', borderRadius: '12px', border: `1px solid ${originalMetadataCount > 0 ? '#fecdd3' : '#bbf7d0'}` }}>
                                    {originalMetadataCount > 0 ? (
                                        <>
                                            <FileWarning color="#e11d48" size={24} />
                                            <div>
                                                <h4 style={{ margin: 0, color: '#9f1239' }}>Found {originalMetadataCount} metadata entries.</h4>
                                                <p style={{ margin: 0, fontSize: '0.85rem', color: '#be123c' }}>This file contains hidden tracking data (EXIF/GPS/Tags).</p>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <ShieldAlert color="#16a34a" size={24} />
                                            <div>
                                                <h4 style={{ margin: 0, color: '#166534' }}>File is Clean</h4>
                                                <p style={{ margin: 0, fontSize: '0.85rem', color: '#16a34a' }}>No standard embedded tracking data was found.</p>
                                            </div>
                                        </>
                                    )}
                                </div>

                                <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column', maxHeight: '300px' }}>
                                    <div style={{ background: '#f8fafc', padding: '0.75rem 1rem', borderBottom: '1px solid #e2e8f0', fontWeight: 600, color: '#0f172a', fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span>Editable Properties</span>
                                        <Search size={14} color="#64748b" />
                                    </div>
                                    <div style={{ overflowY: 'auto', flex: 1, padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        {metadata.length === 0 ? (
                                            <div style={{ color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', marginTop: '2rem' }}>No readable metadata. Add custom tags below if needed!</div>
                                        ) : (
                                            metadata.map((m, i) => (
                                                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>{m.key}</label>
                                                    <input
                                                        type="text"
                                                        value={m.value}
                                                        readOnly
                                                        style={{
                                                            width: '100%',
                                                            padding: '0.5rem',
                                                            borderRadius: '6px',
                                                            border: `1px solid #cbd5e1`,
                                                            background: '#f8fafc',
                                                            color: '#64748b',
                                                            fontSize: '0.9rem'
                                                        }}
                                                    />
                                                </div>
                                            ))
                                        )}
                                        {/* Optional: Add custom field button here */}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '1rem', marginTop: 'auto' }}>
                                    <button
                                        className="btn-primary"
                                        disabled={isProcessing || originalMetadataCount === 0}
                                        onClick={() => handleProcess('strip')}
                                        style={{ flex: 1, justifyContent: 'center', background: '#ef4444', borderColor: '#ef4444' }}
                                    >
                                        {isProcessing ? loadingMsg : <><Sparkles size={18} /> Strip All PII & EXIF Data</>}
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                                    <CheckCircle2 color="#10b981" size={48} style={{ marginBottom: '1rem' }} />
                                    <h3 style={{ margin: 0, color: '#10b981', fontSize: '1.5rem' }}>
                                        Metadata Processed
                                    </h3>
                                    <p style={{ color: '#64748b', marginTop: '0.5rem' }}>Your new safe file is ready for download.</p>
                                </div>

                                <div className="actions" style={{ flexDirection: 'column', gap: '0.75rem' }}>
                                    <a href={outputUrl} download={`safe_${imageFile?.name || 'image.png'}`} className="btn-primary" style={{ textDecoration: 'none', justifyContent: 'center', padding: '1rem' }}>
                                        <Download size={18} /> Download Safe Image
                                    </a>
                                    <button className="btn-secondary" onClick={() => { setOutputUrl(null); }} style={{ width: '100%', padding: '1rem' }}>
                                        Back to Editor
                                    </button>
                                    <button className="btn-secondary" onClick={() => { setOutputUrl(null); setImageUrl(null); }} style={{ width: '100%', border: 'none', background: 'transparent' }}>
                                        Scan Another Image
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
