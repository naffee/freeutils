import { useState } from 'react';
import { Fingerprint, Copy, Trash2, Check, ShieldCheck } from 'lucide-react';

export function HashGenerator() {
    const [input, setInput] = useState('');
    const [algorithm, setAlgorithm] = useState<'SHA-1' | 'SHA-256' | 'SHA-512'>('SHA-256');
    const [hash, setHash] = useState('');
    const [copied, setCopied] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const generateHash = async () => {
        if (!input.trim()) {
            setHash('');
            return;
        }

        setIsProcessing(true);
        try {
            const msgUint8 = new TextEncoder().encode(input);
            const hashBuffer = await crypto.subtle.digest(algorithm, msgUint8);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            setHash(hashHex);
        } catch (e) {
            console.error("Hashing failed:", e);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(hash);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleClear = () => {
        setInput('');
        setHash('');
    };

    return (
        <div className="watermark-remover">
            <div className="editor-container" style={{ maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '1rem 1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <Fingerprint size={20} color="#059669" />
                            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Cryptographic Hash Generator</h3>
                        </div>
                        <button className="btn-secondary" onClick={handleClear} title="Clear All">
                            <Trash2 size={16} />
                        </button>
                    </div>

                    <div style={{ display: 'flex', gap: '1.5rem' }}>
                        {/* Input & Algorithm Select */}
                        <div style={{ flex: 1.5, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>INPUT DATA</label>
                                <textarea
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Enter text to hash..."
                                    style={{
                                        height: '150px',
                                        padding: '1rem',
                                        borderRadius: '12px',
                                        border: '2px solid #e2e8f0',
                                        fontFamily: 'inherit',
                                        fontSize: '1rem',
                                        resize: 'none',
                                        outline: 'none'
                                    }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '0.5rem' }}>ALGORITHM</label>
                                    <select
                                        value={algorithm}
                                        onChange={(e) => setAlgorithm(e.target.value as any)}
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', fontWeight: 600 }}
                                    >
                                        <option value="SHA-256">SHA-256 (Recommended)</option>
                                        <option value="SHA-512">SHA-512 (Secure)</option>
                                        <option value="SHA-1">SHA-1 (Legacy)</option>
                                    </select>
                                </div>
                                <button
                                    className="btn-primary"
                                    onClick={generateHash}
                                    disabled={isProcessing || !input.trim()}
                                    style={{ alignSelf: 'flex-end', height: '48px', padding: '0 2rem', background: '#059669' }}
                                >
                                    Generate Hash
                                </button>
                            </div>

                            {hash && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#059669' }}>RESULTING HASH ({algorithm})</label>
                                        <button onClick={handleCopy} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                            {copied ? <><Check size={14} color="#059669" /> Copied</> : <><Copy size={14} /> Copy</>}
                                        </button>
                                    </div>
                                    <div style={{
                                        padding: '1.25rem',
                                        background: '#f0fdf4',
                                        border: '1px solid #bcf0da',
                                        borderRadius: '12px',
                                        wordBreak: 'break-all',
                                        fontFamily: '"JetBrains Mono", monospace',
                                        fontSize: '0.95rem',
                                        color: '#065f46',
                                        boxShadow: 'inset 0 2px 4px rgba(5, 150, 105, 0.05)'
                                    }}>
                                        {hash}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Sidebar Info */}
                        <div style={{ flex: 0.8, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: '#059669' }}>
                                    <ShieldCheck size={18} />
                                    <h4 style={{ margin: 0, fontSize: '0.9rem' }}>Secure & Private</h4>
                                </div>
                                <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b', lineHeight: 1.5 }}>
                                    All hashing is performed locally in your browser using the **Web Crypto API**. Your sensitive data never leaves your computer.
                                </p>
                            </div>

                            <div style={{ background: '#ecfdf5', padding: '1.25rem', borderRadius: '12px', border: '1px solid #a7f3d0' }}>
                                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: '#065f46' }}>What's a Hash?</h4>
                                <p style={{ margin: 0, fontSize: '0.8rem', color: '#065f46', lineHeight: 1.5 }}>
                                    A cryptographic hash is a unique digital fingerprint of your data. Even a tiny change in the input results in a completely different hash.
                                </p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
