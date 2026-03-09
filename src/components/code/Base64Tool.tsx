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
            <div className="seo-writeup">
                <h2>Base64 Encoder / Decoder</h2>
                <p>Encode or decode text and files to and from Base64 format securely in your browser.</p>
            </div>
            <div className="editor-container" style={{ maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
                <div className="tool-stack">
                    <div className="tool-topbar">
                        <div className="tool-topbar-left">
                            <span className="tool-icon-badge">
                                <ArrowRightLeft size={20} />
                            </span>
                            <h3>Base64 Encoder & Decoder</h3>
                        </div>
                        <div className="tool-actions-row">
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

                    <div className="tool-two-column">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Enter text to encode or Base64 to decode..."
                                className="tool-textarea-dark"
                                style={error ? { borderColor: '#ef4444' } : undefined}
                            />
                            {error && (
                                <div className="tool-error">
                                    <AlertCircle size={14} />
                                    <span>{error}</span>
                                </div>
                            )}
                        </div>

                        <div className="tool-side-panel">
                            <div className="tool-soft-panel">
                                <h4>Actions</h4>
                                <div className="tool-button-stack">
                                    <button className="btn-primary" onClick={encodeBase64} style={{ justifyContent: 'center', fontSize: '0.9rem' }}>
                                        Encode to Base64
                                    </button>
                                    <button className="btn-secondary" onClick={decodeBase64} style={{ justifyContent: 'center', fontSize: '0.9rem' }}>
                                        Decode from Base64
                                    </button>
                                </div>
                            </div>

                            <div className="tool-note-card">
                                <h4>Note</h4>
                                <p>
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
