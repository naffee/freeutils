import { useState } from 'react';
import { Download, Trash2, ArrowRightLeft, FileUp, Info, Check, Copy } from 'lucide-react';

type SubtitleFormat = 'srt' | 'vtt';

export function SubtitleConverter() {
    const [input, setInput] = useState('');
    const [output, setOutput] = useState('');
    const [fromFormat, setFromFormat] = useState<SubtitleFormat>('srt');
    const [toFormat, setToFormat] = useState<SubtitleFormat>('vtt');
    const [isCopied, setIsCopied] = useState(false);

    const convertSrtToVtt = (srt: string) => {
        let vtt = 'WEBVTT\n\n' + srt.replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2');
        return vtt;
    };

    const convertVttToSrt = (vtt: string) => {
        let srt = vtt.replace(/^WEBVTT\s*/i, '').replace(/(\d{2}:\d{2}:\d{2})\.(\d{3})/g, '$1,$2');
        return srt.trim();
    };

    const handleConvert = () => {
        if (fromFormat === 'srt' && toFormat === 'vtt') {
            setOutput(convertSrtToVtt(input));
        } else if (fromFormat === 'vtt' && toFormat === 'srt') {
            setOutput(convertVttToSrt(input));
        } else {
            setOutput(input);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const text = event.target?.result as string;
                setInput(text);
                // Auto-detect format
                if (text.trim().startsWith('WEBVTT')) {
                    setFromFormat('vtt');
                    setToFormat('srt');
                } else {
                    setFromFormat('srt');
                    setToFormat('vtt');
                }
            };
            reader.readAsText(file);
        }
    };

    const handleDownload = () => {
        const blob = new Blob([output], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `subtitle.${toFormat}`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(output);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    const handleClear = () => {
        setInput('');
        setOutput('');
    };

    return (
        <div className="watermark-remover">
            <div className="editor-container" style={{ maxWidth: '900px', margin: '0 auto', width: '100%' }}>
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '1rem 1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <FileUp size={20} color="#8b5cf6" />
                            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Subtitle Converter</h3>
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <label className="btn-secondary" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <FileUp size={16} /> Import
                                <input type="file" accept=".srt,.vtt,.txt" onChange={handleFileUpload} style={{ display: 'none' }} />
                            </label>
                            <button className="btn-secondary" onClick={handleClear}>
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>FROM</label>
                                <select
                                    value={fromFormat}
                                    onChange={(e) => setFromFormat(e.target.value as SubtitleFormat)}
                                    style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '0.75rem', fontWeight: 600 }}
                                >
                                    <option value="srt">SRT</option>
                                    <option value="vtt">VTT</option>
                                </select>
                            </div>
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Paste subtitle content here..."
                                style={{
                                    height: '300px',
                                    padding: '1rem',
                                    borderRadius: '12px',
                                    border: '2px solid #e2e8f0',
                                    fontFamily: '"JetBrains Mono", monospace',
                                    fontSize: '0.85rem',
                                    resize: 'none',
                                    outline: 'none'
                                }}
                            />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>TO</label>
                                <select
                                    value={toFormat}
                                    onChange={(e) => setToFormat(e.target.value as SubtitleFormat)}
                                    style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '0.75rem', fontWeight: 600 }}
                                >
                                    <option value="srt">SRT</option>
                                    <option value="vtt">VTT</option>
                                </select>
                            </div>
                            <textarea
                                value={output}
                                readOnly
                                placeholder="Converted output will appear here..."
                                style={{
                                    height: '300px',
                                    padding: '1rem',
                                    borderRadius: '12px',
                                    border: '2px solid #e2e8f0',
                                    background: '#f8fafc',
                                    fontFamily: '"JetBrains Mono", monospace',
                                    fontSize: '0.85rem',
                                    resize: 'none',
                                    outline: 'none'
                                }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button
                            className="btn-primary"
                            onClick={handleConvert}
                            style={{ flex: 1, height: '48px', gap: '0.75rem' }}
                        >
                            <ArrowRightLeft size={18} /> Convert Format
                        </button>
                        {output && (
                            <>
                                <button
                                    className="btn-secondary"
                                    onClick={handleCopy}
                                    style={{ height: '48px', minWidth: '120px' }}
                                >
                                    {isCopied ? <Check size={18} color="#10b981" /> : <><Copy size={18} style={{ marginRight: '8px' }} /> Copy</>}
                                </button>
                                <button
                                    className="btn-secondary"
                                    onClick={handleDownload}
                                    style={{ height: '48px', minWidth: '140px' }}
                                >
                                    <Download size={18} style={{ marginRight: '8px' }} /> Download
                                </button>
                            </>
                        )}
                    </div>

                    <div style={{ background: '#f5f3ff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #ddd6fe', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                        <Info size={18} style={{ marginTop: '0.2rem', color: '#8b5cf6' }} />
                        <div>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: '#5b21b6', fontWeight: 600 }}>About Subtitle Formats</p>
                            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: '#6d28d9', lineHeight: 1.5 }}>
                                <b>SRT (SubRip):</b> Uses sequence numbers and commas for fractional seconds. <br />
                                <b>VTT (WebVTT):</b> Starts with <code>WEBVTT</code> and uses dots for fractional seconds. Widely used for web video players.
                            </p>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
