import { useState, useMemo } from 'react';
import { ShieldCheck, Copy, Trash2, Check, AlertCircle, Info, Key, Layout, Lock } from 'lucide-react';

export function JwtDecoder() {
    const [token, setToken] = useState('');
    const [copied, setCopied] = useState(false);

    const decoded = useMemo(() => {
        if (!token.trim()) return null;

        try {
            const parts = token.split('.');
            if (parts.length !== 3) {
                throw new Error('Invalid JWT format. A JWT must have 3 parts separated by dots.');
            }

            const decodePart = (str: string) => {
                try {
                    // Add padding if necessary
                    const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
                    const json = decodeURIComponent(
                        atob(base64)
                            .split('')
                            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                            .join('')
                    );
                    return JSON.parse(json);
                } catch (e) {
                    return null;
                }
            };

            const header = decodePart(parts[0]);
            const payload = decodePart(parts[1]);
            const signature = parts[2];

            if (!header || !payload) {
                throw new Error('Failed to decode JWT parts. The token may be malformed.');
            }

            return { header, payload, signature };
        } catch (e: any) {
            return { error: e.message };
        }
    }, [token]);

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(JSON.stringify(text, null, 2));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleClear = () => {
        setToken('');
    };

    const formatTimestamp = (ts: number) => {
        if (!ts) return 'N/A';
        return new Date(ts * 1000).toLocaleString();
    };

    const isExpired = (exp: number) => {
        if (!exp) return false;
        return exp < Date.now() / 1000;
    };

    return (
        <div className="watermark-remover">
            <div className="editor-container" style={{ maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '1rem 1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <ShieldCheck size={20} color="#10b981" />
                            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>JWT Decoder</h3>
                        </div>
                        <button className="btn-secondary" onClick={handleClear} title="Clear Token">
                            <Trash2 size={16} />
                        </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>PASTE YOUR TOKEN</label>
                        <textarea
                            value={token}
                            onChange={(e) => setToken(e.target.value)}
                            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                            style={{
                                height: '120px',
                                padding: '1rem',
                                borderRadius: '12px',
                                border: '2px solid #e2e8f0',
                                fontFamily: '"JetBrains Mono", monospace',
                                fontSize: '0.9rem',
                                resize: 'none',
                                outline: 'none',
                                wordBreak: 'break-all'
                            }}
                        />
                    </div>

                    {decoded && !('error' in decoded) ? (
                        <div style={{ display: 'flex', gap: '1.5rem' }}>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                                {/* Header */}
                                <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                                    <div style={{ background: '#f8fafc', padding: '0.75rem 1.25rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', fontWeight: 700, color: '#ef4444' }}>
                                            <Layout size={16} /> HEADER: <span style={{ color: '#64748b' }}>Algorithm & Token Type</span>
                                        </div>
                                        <button onClick={() => handleCopy(decoded.header)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                                            {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                                        </button>
                                    </div>
                                    <pre style={{ margin: 0, padding: '1.25rem', color: '#ef4444', background: '#fff1f2', fontSize: '0.85rem', overflowX: 'auto' }}>
                                        {JSON.stringify(decoded.header, null, 2)}
                                    </pre>
                                </div>

                                {/* Payload */}
                                <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                                    <div style={{ background: '#f8fafc', padding: '0.75rem 1.25rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', fontWeight: 700, color: '#a855f7' }}>
                                            <Key size={16} /> PAYLOAD: <span style={{ color: '#64748b' }}>Data / Claims</span>
                                        </div>
                                        <button onClick={() => handleCopy(decoded.payload)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                                            {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                                        </button>
                                    </div>
                                    <pre style={{ margin: 0, padding: '1.25rem', color: '#a855f7', background: '#f3e8ff', fontSize: '0.85rem', overflowX: 'auto' }}>
                                        {JSON.stringify(decoded.payload, null, 2)}
                                    </pre>
                                </div>

                                {/* Signature */}
                                <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                                    <div style={{ background: '#f8fafc', padding: '0.75rem 1.25rem', borderBottom: '1px solid #e2e8f0' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', fontWeight: 700, color: '#6366f1' }}>
                                            <Lock size={16} /> SIGNATURE: <span style={{ color: '#64748b' }}>Verification String</span>
                                        </div>
                                    </div>
                                    <div style={{ padding: '1.25rem', color: '#6366f1', background: '#eef2ff', fontSize: '0.85rem', wordBreak: 'break-all', fontFamily: '"JetBrains Mono", monospace' }}>
                                        {decoded.signature}
                                    </div>
                                </div>
                            </div>

                            {/* Sidebar Info */}
                            <div style={{ width: '300px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div style={{ background: '#f0fdfa', padding: '1.25rem', borderRadius: '12px', border: '1px solid #ccfbf1' }}>
                                    <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: '#0f766e', borderBottom: '1px solid #99f6e4', paddingBottom: '0.5rem' }}>Token Status</h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        <div>
                                            <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700 }}>ISSUED AT</div>
                                            <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{formatTimestamp(decoded.payload.iat)}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700 }}>EXPIRES AT</div>
                                            <div style={{
                                                fontSize: '0.85rem',
                                                fontWeight: 600,
                                                color: isExpired(decoded.payload.exp) ? '#ef4444' : '#059669'
                                            }}>
                                                {formatTimestamp(decoded.payload.exp)}
                                                {isExpired(decoded.payload.exp) && ' (Expired)'}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                                    <Info size={16} style={{ marginTop: '0.2rem', color: '#64748b' }} />
                                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b', lineHeight: 1.5 }}>
                                        <b>Note:</b> This tool only decodes the token payload for inspection. It does <b>not</b> verify the signature against any secret key. Always verify tokens on your server.
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : decoded && 'error' in decoded ? (
                        <div style={{ padding: '1.25rem', background: '#fff1f2', border: '1px solid #fecaca', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#ef4444' }}>
                            <AlertCircle size={20} />
                            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{decoded.error}</span>
                        </div>
                    ) : (
                        <div style={{ height: '200px', display: 'flex', flexWrap: 'wrap', alignContent: 'center', justifyContent: 'center', background: '#f8fafc', borderRadius: '12px', border: '2px dashed #e2e8f0', color: '#94a3b8' }}>
                            Enter a JWT to inspect its contents across Header, Payload, and Signature.
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
