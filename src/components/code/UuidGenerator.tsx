import { useState, useEffect } from 'react';
import { Copy, Trash2, Check, RefreshCw, ShieldCheck } from 'lucide-react';

export function UuidGenerator() {
    const [uuids, setUuids] = useState<string[]>([]);
    const [quantity, setQuantity] = useState(1);
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
    const [copiedAll, setCopiedAll] = useState(false);

    const generateUuid = () => {
        return crypto.randomUUID();
    };

    const generateBatch = () => {
        const newUuids = Array.from({ length: quantity }, () => generateUuid());
        setUuids(newUuids);
    };

    // Generate one by default on mount
    useEffect(() => {
        generateBatch();
    }, []);

    const handleCopyOne = (text: string, index: number) => {
        navigator.clipboard.writeText(text);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    const handleCopyAll = () => {
        navigator.clipboard.writeText(uuids.join('\n'));
        setCopiedAll(true);
        setTimeout(() => setCopiedAll(false), 2000);
    };

    const handleClear = () => {
        setUuids([]);
    };

    return (
        <div className="watermark-remover">
            <div className="seo-writeup">
                <h2>UUID Generator</h2>
                <p>Quickly generate cryptographically secure, random bulk version 4 UUIDs (Universally Unique Identifiers).</p>
            </div>
            <div className="editor-container" style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '1rem 1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <RefreshCw size={20} color="#3b82f6" />
                            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>UUID V4 Generator</h3>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className="btn-secondary" onClick={handleClear} title="Clear All">
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1.5rem' }}>
                        {/* Main Content */}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                            {/* Controls */}
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', background: '#fff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '0.5rem' }}>QUANTITY (Max 100)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="100"
                                        value={quantity}
                                        onChange={(e) => setQuantity(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))}
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '1rem' }}
                                    />
                                </div>
                                <button
                                    className="btn-primary"
                                    onClick={generateBatch}
                                    style={{ height: '48px', padding: '0 2rem', background: '#3b82f6' }}
                                >
                                    Generate New
                                </button>
                                {uuids.length > 1 && (
                                    <button className="btn-secondary" onClick={handleCopyAll} style={{ height: '48px' }}>
                                        {copiedAll ? <Check size={18} color="#16a34a" /> : <Copy size={18} />}
                                        Copy All
                                    </button>
                                )}
                            </div>

                            {/* UUID List */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {uuids.map((uuid: string, index: number) => (
                                    <div key={index} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '0.875rem 1.25rem',
                                        background: '#f8fafc',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '10px',
                                        fontFamily: '"JetBrains Mono", monospace',
                                        fontSize: '1rem',
                                        color: '#1e293b'
                                    }}>
                                        <span>{uuid}</span>
                                        <button
                                            onClick={() => handleCopyOne(uuid, index)}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
                                        >
                                            {copiedIndex === index ? <Check size={18} color="#16a34a" /> : <Copy size={18} />}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Sidebar Info */}
                        <div style={{ width: '220px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ background: '#f0f9ff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #bae6fd' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: '#0369a1' }}>
                                    <ShieldCheck size={18} />
                                    <h4 style={{ margin: 0, fontSize: '0.9rem' }}>Secure V4</h4>
                                </div>
                                <p style={{ margin: 0, fontSize: '0.8rem', color: '#0369a1', lineHeight: 1.5 }}>
                                    Generates cryptographically strong random Version 4 UUIDs using `crypto.randomUUID()`.
                                </p>
                            </div>

                            <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: '#64748b' }}>Usage</h4>
                                <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b', lineHeight: 1.5 }}>
                                    Perfect for database keys, session IDs, or any application where a unique identifier is required.
                                </p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
