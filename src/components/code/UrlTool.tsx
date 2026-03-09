import { useState } from 'react';
import { Copy, Trash2, Check, ArrowRightLeft, Info, Globe } from 'lucide-react';

export function UrlTool() {
    const [input, setInput] = useState('');
    const [output, setOutput] = useState('');
    const [copied, setCopied] = useState(false);

    const handleEncode = () => {
        try {
            setOutput(encodeURIComponent(input));
        } catch (e) {
            setOutput('Error: Invalid input for encoding');
        }
    };

    const handleDecode = () => {
        try {
            setOutput(decodeURIComponent(input));
        } catch (e) {
            setOutput('Error: Malformed URL or invalid encoding');
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(output);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleClear = () => {
        setInput('');
        setOutput('');
    };

    return (
        <div className="watermark-remover">
            <div className="seo-writeup">
                <h2>URL Encoder / Decoder</h2>
                <p>Safely encode and decode URL strings and query parameters to generate valid web links.</p>
            </div>
            <div className="editor-container" style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '1rem 1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <Globe size={20} color="#6366f1" />
                            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>URL Encoder / Decoder</h3>
                        </div>
                        <button className="btn-secondary" onClick={handleClear} title="Clear All">
                            <Trash2 size={16} />
                        </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>INPUT TEXT</label>
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Enter URL or text to encode/decode..."
                            style={{
                                height: '150px',
                                padding: '1rem',
                                borderRadius: '12px',
                                border: '2px solid #e2e8f0',
                                fontFamily: '"JetBrains Mono", monospace',
                                fontSize: '0.9rem',
                                resize: 'none',
                                outline: 'none'
                            }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button
                            className="btn-primary"
                            onClick={handleEncode}
                            style={{ flex: 1, height: '48px', background: '#6366f1' }}
                        >
                            <ArrowRightLeft size={18} style={{ marginRight: '8px' }} /> Encode URL
                        </button>
                        <button
                            className="btn-primary"
                            onClick={handleDecode}
                            style={{ flex: 1, height: '48px', background: '#4f46e5' }}
                        >
                            <ArrowRightLeft size={18} style={{ marginRight: '8px', transform: 'scaleX(-1)' }} /> Decode URL
                        </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>RESULT</label>
                            {output && (
                                <button onClick={handleCopy} className="btn-secondary" style={{ padding: '4px 8px' }}>
                                    {copied ? <Check size={14} color="#16a34a" /> : <Copy size={14} />}
                                </button>
                            )}
                        </div>
                        <textarea
                            value={output}
                            readOnly
                            placeholder="Output will appear here..."
                            style={{
                                height: '150px',
                                padding: '1rem',
                                borderRadius: '12px',
                                border: '2px solid #e2e8f0',
                                background: '#f8fafc',
                                fontFamily: '"JetBrains Mono", monospace',
                                fontSize: '0.9rem',
                                resize: 'none',
                                outline: 'none',
                                wordBreak: 'break-all'
                            }}
                        />
                    </div>

                    <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                        <Info size={16} style={{ marginTop: '0.2rem', color: '#64748b' }} />
                        <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b', lineHeight: 1.5 }}>
                            <b>Encoder:</b> Uses <code>encodeURIComponent</code> to safely escape characters for query parameters. <br />
                            <b>Decoder:</b> Uses <code>decodeURIComponent</code> to revert percent-encoding.
                        </p>
                    </div>

                </div>
            </div>
        </div>
    );
}
