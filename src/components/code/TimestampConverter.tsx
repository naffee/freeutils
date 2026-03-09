import { useState } from 'react';
import { Clock, Copy, Trash2, Check, Calendar, ArrowRightLeft, Zap } from 'lucide-react';

export function TimestampConverter() {
    const [timestamp, setTimestamp] = useState(Math.floor(Date.now() / 1000).toString());
    const [dateStr, setDateStr] = useState(new Date().toISOString());
    const [unit, setUnit] = useState<'s' | 'ms'>('s');
    const [copied, setCopied] = useState<{ [key: string]: boolean }>({});

    const handleTimestampChange = (val: string) => {
        setTimestamp(val);
        const ts = parseInt(val);
        if (!isNaN(ts)) {
            const date = new Date(unit === 's' ? ts * 1000 : ts);
            if (!isNaN(date.getTime())) {
                setDateStr(date.toISOString());
            }
        }
    };

    const handleDateChange = (val: string) => {
        setDateStr(val);
        const date = new Date(val);
        if (!isNaN(date.getTime())) {
            const ts = unit === 's' ? Math.floor(date.getTime() / 1000) : date.getTime();
            setTimestamp(ts.toString());
        }
    };

    const getNow = () => {
        const now = Date.now();
        const ts = unit === 's' ? Math.floor(now / 1000) : now;
        setTimestamp(ts.toString());
        setDateStr(new Date(now).toISOString());
    };

    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopied({ ...copied, [id]: true });
        setTimeout(() => setCopied({ ...copied, [id]: false }), 2000);
    };

    const getRelativeTime = (tsStr: string) => {
        const ts = parseInt(tsStr);
        if (isNaN(ts)) return '';
        const date = new Date(unit === 's' ? ts * 1000 : ts);
        if (isNaN(date.getTime())) return '';

        const now = Date.now();
        const diff = date.getTime() - now;
        const isPast = diff < 0;
        const absDiff = Math.abs(diff);

        const seconds = Math.floor(absDiff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days} day${days > 1 ? 's' : ''} ${isPast ? 'ago' : 'from now'}`;
        if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ${isPast ? 'ago' : 'from now'}`;
        if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ${isPast ? 'ago' : 'from now'}`;
        return `${seconds} second${seconds > 1 ? 's' : ''} ${isPast ? 'ago' : 'from now'}`;
    };

    const clear = () => {
        setTimestamp('');
        setDateStr('');
    };

    return (
        <div className="watermark-remover">
            <div className="seo-writeup">
                <h2>Timestamp Converter</h2>
                <p>Convert Unix epoch timestamps to human-readable dates, times, and multiple common formats instantly.</p>
            </div>
            <div className="editor-container" style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '1rem 1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <Clock size={20} color="#0ea5e9" />
                            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Timestamp Converter</h3>
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button className="btn-secondary" onClick={getNow} style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                                <Zap size={14} style={{ marginRight: '4px' }} /> Now
                            </button>
                            <button className="btn-secondary" onClick={clear}>
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 40px 1fr', gap: '1rem', alignItems: 'center' }}>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>UNIX TIMESTAMP</label>
                                <div style={{ display: 'flex', background: '#e2e8f0', borderRadius: '4px', padding: '2px' }}>
                                    <button
                                        onClick={() => setUnit('s')}
                                        style={{ border: 'none', background: unit === 's' ? '#fff' : 'transparent', padding: '2px 8px', fontSize: '0.7rem', fontWeight: 700, borderRadius: '2px', cursor: 'pointer' }}
                                    >S</button>
                                    <button
                                        onClick={() => setUnit('ms')}
                                        style={{ border: 'none', background: unit === 'ms' ? '#fff' : 'transparent', padding: '2px 8px', fontSize: '0.7rem', fontWeight: 700, borderRadius: '2px', cursor: 'pointer' }}
                                    >MS</button>
                                </div>
                            </div>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="text"
                                    value={timestamp}
                                    onChange={(e) => handleTimestampChange(e.target.value)}
                                    placeholder="Enter timestamp..."
                                    style={{
                                        width: '100%',
                                        padding: '1rem',
                                        borderRadius: '12px',
                                        border: '2px solid #e2e8f0',
                                        fontSize: '1.25rem',
                                        fontWeight: 700,
                                        fontFamily: '"JetBrains Mono", monospace',
                                        outline: 'none',
                                        textAlign: 'center'
                                    }}
                                />
                                <button
                                    onClick={() => handleCopy(timestamp, 'ts')}
                                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
                                >
                                    {copied.ts ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
                                </button>
                            </div>
                            <div style={{ textAlign: 'center', fontSize: '0.8rem', color: '#64748b' }}>
                                {timestamp ? `Unix time in ${unit === 's' ? 'seconds' : 'milliseconds'}` : 'Waiting for input...'}
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '2rem' }}>
                            <ArrowRightLeft size={20} color="#94a3b8" />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>HUMAN READABLE DATE</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="text"
                                    value={dateStr}
                                    onChange={(e) => handleDateChange(e.target.value)}
                                    placeholder="ISO Date string..."
                                    style={{
                                        width: '100%',
                                        padding: '1rem',
                                        borderRadius: '12px',
                                        border: '2px solid #e2e8f0',
                                        fontSize: '1rem',
                                        fontWeight: 600,
                                        fontFamily: '"JetBrains Mono", monospace',
                                        outline: 'none',
                                        textAlign: 'center'
                                    }}
                                />
                                <button
                                    onClick={() => handleCopy(dateStr, 'date')}
                                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
                                >
                                    {copied.date ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
                                </button>
                            </div>
                            <div style={{ textAlign: 'center', fontSize: '0.8rem', color: '#64748b' }}>
                                {dateStr ? getRelativeTime(timestamp) : 'Invalid date format'}
                            </div>
                        </div>

                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                        {[
                            { label: 'Local Time', value: dateStr ? new Date(dateStr).toLocaleString() : 'N/A' },
                            { label: 'UTC Time', value: dateStr ? new Date(dateStr).toUTCString() : 'N/A' },
                            { label: 'Date Only', value: dateStr ? new Date(dateStr).toLocaleDateString() : 'N/A' },
                            { label: 'Time Only', value: dateStr ? new Date(dateStr).toLocaleTimeString() : 'N/A' },
                        ].map((item, idx) => (
                            <div key={idx} style={{ padding: '1rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, marginBottom: '0.25rem' }}>{item.label}</div>
                                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b' }}>{item.value}</div>
                            </div>
                        ))}
                    </div>

                    <div style={{ background: '#f0f9ff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #bae6fd', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                        <Calendar size={18} style={{ marginTop: '0.2rem', color: '#0ea5e9' }} />
                        <div>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: '#0369a1', fontWeight: 600 }}>Pro Tip</p>
                            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: '#0c4a6e', lineHeight: 1.5 }}>
                                You can enter Unix timestamps in either seconds or milliseconds. The tool automatically handles common ISO formats and provides instant relative time (e.g. "2 days ago").
                            </p>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
