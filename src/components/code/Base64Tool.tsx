import { useState } from 'react';
import { ArrowRightLeft, Copy, Trash2, Check, AlertCircle, Download } from 'lucide-react';

export function Base64Tool() {
    const [input, setInput] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const encodeBase64 = () => {
        try {
            setError(null);
            if (!input.trim()) return;
            // btoa handles Latin1 characters. For Unicode, we use a trick.
            const encoded = btoa(unescape(encodeURIComponent(input)));
            setInput(encoded);
        } catch (e: any) {
            setError("Failed to encode: " + e.message);
        }
    };

    const decodeBase64 = () => {
        try {
            setError(null);
            if (!input.trim()) return;
            // atob handles Latin1 characters. For Unicode, we use a trick.
            const decoded = decodeURIComponent(escape(atob(input)));
            setInput(decoded);
        } catch (e: any) {
            setError("Failed to decode: Invalid Base64 string");
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(input);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleClear = () => {
        setInput('');
        setError(null);
    };

    const handleDownload = () => {
        const blob = new Blob([input], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'data.txt';
        link.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="watermark-remover">
            <div className="editor-container" style={{ maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    {/* Header Controls */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '1rem 1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <ArrowRightLeft size={20} color="#8b5cf6" />
                            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Base64 Encoder & Decoder</h3>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className="btn-secondary" onClick={handleClear} title="Clear">
                                <Trash2 size={16} />
                            </button>
                            <button className="btn-secondary" onClick={handleCopy} title="Copy to Clipboard">
                                {copied ? <Check size={16} color="#16a34a" /> : <Copy size={16} />}
                            </button>
                            <button className="btn-secondary" onClick={handleDownload} title="Download Result">
                                <Download size={16} />
                            </button>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1.5rem', minHeight: '400px' }}>
                        {/* Input/Output Area */}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Enter text to encode or Base64 to decode..."
                                style={{
                                    flex: 1,
                                    width: '100%',
                                    padding: '1.25rem',
                                    borderRadius: '12px',
                                    border: `2px solid ${error ? '#ef4444' : '#e2e8f0'}`,
                                    fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                                    fontSize: '0.95rem',
                                    lineHeight: 1.6,
                                    resize: 'none',
                                    outline: 'none',
                                    transition: 'border-color 0.2s',
                                    background: '#0f172a',
                                    color: '#f8fafc'
                                }}
                            />
                            {error && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444', fontSize: '0.85rem', padding: '0.5rem', background: '#fef2f2', borderRadius: '8px', border: '1px solid #fee2e2' }}>
                                    <AlertCircle size={14} />
                                    <span>{error}</span>
                                </div>
                            )}
                        </div>

                        {/* Sidebar Controls */}
                        <div style={{ width: '220px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actions</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    <button className="btn-primary" onClick={encodeBase64} style={{ justifyContent: 'center', fontSize: '0.9rem', background: '#8b5cf6' }}>
                                        Encode to Base64
                                    </button>
                                    <button className="btn-primary" onClick={decodeBase64} style={{ justifyContent: 'center', fontSize: '0.9rem', background: '#7c3aed' }}>
                                        Decode from Base64
                                    </button>
                                </div>
                            </div>

                            <div style={{ background: '#f5f3ff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #ddd6fe' }}>
                                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: '#5b21b6' }}>Note</h4>
                                <p style={{ margin: 0, fontSize: '0.8rem', color: '#5b21b6', lineHeight: 1.5 }}>
                                    This tool safely handles Unicode (UTF-8) characters when encoding and decoding.
                                </p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
