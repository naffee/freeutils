import { useState } from 'react';
import { Braces, Copy, Trash2, Check, AlertCircle, Download } from 'lucide-react';

export function JsonFormatter() {
    const [input, setInput] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const formatJson = (indent: number) => {
        try {
            setError(null);
            if (!input.trim()) return;
            const parsed = JSON.parse(input);
            const formatted = JSON.stringify(parsed, null, indent);
            setInput(formatted);
        } catch (e: any) {
            setError(e.message);
        }
    };

    const minifyJson = () => {
        try {
            setError(null);
            if (!input.trim()) return;
            const parsed = JSON.parse(input);
            const minified = JSON.stringify(parsed);
            setInput(minified);
        } catch (e: any) {
            setError(e.message);
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
        const blob = new Blob([input], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'data.json';
        link.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="watermark-remover">
            <div className="seo-writeup">
                <h2>JSON Formatter</h2>
                <p>Format, validate, minify, and prettify raw JSON data easily and securely online.</p>
            </div>
            <div className="editor-container" style={{ maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    {/* Header Controls */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '1rem 1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <Braces size={20} color="#3b82f6" />
                            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>JSON Formatter & Validator</h3>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className="btn-secondary" onClick={handleClear} title="Clear">
                                <Trash2 size={16} />
                            </button>
                            <button className="btn-secondary" onClick={handleCopy} title="Copy to Clipboard">
                                {copied ? <Check size={16} color="#16a34a" /> : <Copy size={16} />}
                            </button>
                            <button className="btn-secondary" onClick={handleDownload} title="Download JSON">
                                <Download size={16} />
                            </button>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1.5rem', minHeight: '500px' }}>
                        {/* Input Area */}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Paste your JSON here..."
                                style={{
                                    flex: 1,
                                    width: '100%',
                                    padding: '1.25rem',
                                    borderRadius: '12px',
                                    border: `2px solid ${error ? '#ef4444' : '#e2e8f0'}`,
                                    fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                                    fontSize: '0.9rem',
                                    lineHeight: 1.6,
                                    resize: 'none',
                                    outline: 'none',
                                    transition: 'border-color 0.2s',
                                    background: '#1e293b',
                                    color: '#f8fafc'
                                }}
                            />
                            {error && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444', fontSize: '0.85rem', padding: '0.5rem', background: '#fef2f2', borderRadius: '8px', border: '1px solid #fee2e2' }}>
                                    <AlertCircle size={14} />
                                    <span>Invalid JSON: {error}</span>
                                </div>
                            )}
                        </div>

                        {/* Sidebar Controls */}
                        <div style={{ width: '220px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Formatting</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    <button className="btn-primary" onClick={() => formatJson(2)} style={{ justifyContent: 'center', fontSize: '0.9rem' }}>
                                        Pretty (2 spaces)
                                    </button>
                                    <button className="btn-primary" onClick={() => formatJson(4)} style={{ justifyContent: 'center', fontSize: '0.9rem' }}>
                                        Pretty (4 spaces)
                                    </button>
                                    <button className="btn-secondary" onClick={minifyJson} style={{ justifyContent: 'center', fontSize: '0.9rem' }}>
                                        Minify JSON
                                    </button>
                                </div>
                            </div>

                            <div style={{ background: '#eff6ff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #bfdbfe' }}>
                                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: '#1e40af' }}>Tip</h4>
                                <p style={{ margin: 0, fontSize: '0.8rem', color: '#1e40af', lineHeight: 1.5 }}>
                                    Formatting also validates your JSON. If there's an error, we'll highlight the specific problem.
                                </p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
