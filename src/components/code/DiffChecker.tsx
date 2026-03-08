import React, { useState, useMemo } from 'react';
import { Columns, Trash2 } from 'lucide-react';

export function DiffChecker() {
    const [text1, setText1] = useState('Hello World\nThis is the original text.\nSome lines stay the same.\nOld content here.');
    const [text2, setText2] = useState('Hello World\nThis is the modified text!\nSome lines stay the same.\nNew content added.');
    const [viewMode, setViewMode] = useState<'sideBySide' | 'inline'>('sideBySide');

    // Simple line-based diff implementation
    const diff = useMemo(() => {
        const lines1 = text1.split('\n');
        const lines2 = text2.split('\n');

        let i = 0, j = 0;
        const result: { line1?: string; line2?: string; type: 'equal' | 'added' | 'removed' | 'changed' }[] = [];

        while (i < lines1.length || j < lines2.length) {
            if (i < lines1.length && j < lines2.length && lines1[i] === lines2[j]) {
                result.push({ line1: lines1[i], line2: lines2[j], type: 'equal' });
                i++;
                j++;
            } else if (i < lines1.length && j < lines2.length) {
                let foundMatch = false;
                for (let k = 1; k < 5; k++) {
                    if (i + k < lines1.length && lines1[i + k] === lines2[j]) {
                        for (let l = 0; l < k; l++) {
                            result.push({ line1: lines1[i + l], type: 'removed' });
                        }
                        i += k;
                        foundMatch = true;
                        break;
                    }
                    if (j + k < lines2.length && lines1[i] === lines2[j + k]) {
                        for (let l = 0; l < k; l++) {
                            result.push({ line2: lines2[j + l], type: 'added' });
                        }
                        j += k;
                        foundMatch = true;
                        break;
                    }
                }

                if (!foundMatch) {
                    result.push({ line1: lines1[i], line2: lines2[j], type: 'changed' });
                    i++;
                    j++;
                }
            } else if (i < lines1.length) {
                result.push({ line1: lines1[i], type: 'removed' });
                i++;
            } else {
                result.push({ line2: lines2[j], type: 'added' });
                j++;
            }
        }

        return result;
    }, [text1, text2]);

    const handleClear = () => {
        setText1('');
        setText2('');
    };

    return (
        <div className="watermark-remover">
            <div className="editor-container" style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '1rem 1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <Columns size={20} color="#6366f1" />
                            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Text Diff Checker</h3>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <div style={{ display: 'flex', background: '#e2e8f0', padding: '0.25rem', borderRadius: '8px' }}>
                                <button
                                    onClick={() => setViewMode('sideBySide')}
                                    style={{
                                        padding: '0.4rem 0.8rem',
                                        borderRadius: '6px',
                                        border: 'none',
                                        background: viewMode === 'sideBySide' ? '#fff' : 'transparent',
                                        boxShadow: viewMode === 'sideBySide' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                        fontSize: '0.8rem',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        color: viewMode === 'sideBySide' ? '#1e293b' : '#64748b'
                                    }}
                                >
                                    Side by Side
                                </button>
                                <button
                                    onClick={() => setViewMode('inline')}
                                    style={{
                                        padding: '0.4rem 0.8rem',
                                        borderRadius: '6px',
                                        border: 'none',
                                        background: viewMode === 'inline' ? '#fff' : 'transparent',
                                        boxShadow: viewMode === 'inline' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                        fontSize: '0.8rem',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        color: viewMode === 'inline' ? '#1e293b' : '#64748b'
                                    }}
                                >
                                    Inline
                                </button>
                            </div>
                            <button className="btn-secondary" onClick={handleClear} title="Clear All">
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>ORIGINAL TEXT</label>
                            <textarea
                                value={text1}
                                onChange={(e) => setText1(e.target.value)}
                                placeholder="Paste original text..."
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
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>MODIFIED TEXT</label>
                            <textarea
                                value={text2}
                                onChange={(e) => setText2(e.target.value)}
                                placeholder="Paste modified text..."
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
                    </div>

                    <div style={{
                        background: '#fff',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        overflow: 'hidden',
                        fontFamily: '"JetBrains Mono", monospace',
                        fontSize: '0.85rem'
                    }}>
                        <div style={{ background: '#f8fafc', padding: '0.75rem 1.25rem', borderBottom: '1px solid #e2e8f0', fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>
                            DIFFERENCES
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            {viewMode === 'sideBySide' ? (
                                <div style={{ display: 'flex', minHeight: '300px' }}>
                                    <div style={{ flex: 1, borderRight: '1px solid #e2e8f0' }}>
                                        {diff.map((item, idx) => (
                                            <div key={`left-${idx}`} style={{
                                                display: 'flex',
                                                background: item.type === 'removed' ? '#fee2e2' : item.type === 'changed' ? '#fef3c7' : 'transparent',
                                                padding: '0.25rem 0.5rem',
                                                minHeight: '1.5rem',
                                                borderLeft: `3px solid ${item.type === 'removed' ? '#ef4444' : item.type === 'changed' ? '#f59e0b' : 'transparent'}`
                                            }}>
                                                <span style={{ color: '#94a3b8', width: '2rem', textAlign: 'right', marginRight: '1rem', userSelect: 'none' }}>{item.line1 !== undefined ? idx + 1 : ''}</span>
                                                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all', color: item.type === 'removed' ? '#991b1b' : 'inherit' }}>{item.line1}</pre>
                                            </div>
                                        ))}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        {diff.map((item, idx) => (
                                            <div key={`right-${idx}`} style={{
                                                display: 'flex',
                                                background: item.type === 'added' ? '#dcfce7' : item.type === 'changed' ? '#fef3c7' : 'transparent',
                                                padding: '0.25rem 0.5rem',
                                                minHeight: '1.5rem',
                                                borderLeft: `3px solid ${item.type === 'added' ? '#22c55e' : item.type === 'changed' ? '#f59e0b' : 'transparent'}`
                                            }}>
                                                <span style={{ color: '#94a3b8', width: '2rem', textAlign: 'right', marginRight: '1rem', userSelect: 'none' }}>{item.line2 !== undefined ? idx + 1 : ''}</span>
                                                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all', color: item.type === 'added' ? '#166534' : 'inherit' }}>{item.line2}</pre>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div style={{ minHeight: '300px' }}>
                                    {diff.map((item, idx) => (
                                        <React.Fragment key={`inline-${idx}`}>
                                            {(item.type === 'removed' || item.type === 'changed' || item.type === 'equal') && item.line1 !== undefined && (
                                                <div style={{
                                                    display: 'flex',
                                                    background: item.type === 'removed' || item.type === 'changed' ? '#fee2e2' : 'transparent',
                                                    padding: '0.25rem 0.5rem',
                                                    minHeight: '1.5rem',
                                                    borderLeft: `3px solid ${item.type === 'removed' || item.type === 'changed' ? '#ef4444' : 'transparent'}`
                                                }}>
                                                    <span style={{ color: '#94a3b8', width: '1.5rem', textAlign: 'center', marginRight: '0.5rem', userSelect: 'none' }}>-</span>
                                                    <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all', color: item.type === 'removed' || item.type === 'changed' ? '#991b1b' : 'inherit' }}>{item.line1}</pre>
                                                </div>
                                            )}
                                            {(item.type === 'added' || item.type === 'changed') && item.line2 !== undefined && (
                                                <div style={{
                                                    display: 'flex',
                                                    background: '#dcfce7',
                                                    padding: '0.25rem 0.5rem',
                                                    minHeight: '1.5rem',
                                                    borderLeft: '3px solid #22c55e'
                                                }}>
                                                    <span style={{ color: '#94a3b8', width: '1.5rem', textAlign: 'center', marginRight: '0.5rem', userSelect: 'none' }}>+</span>
                                                    <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all', color: '#166534' }}>{item.line2}</pre>
                                                </div>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.8rem', color: '#64748b' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: '12px', height: '12px', background: '#dcfce7', border: '1px solid #22c55e', borderRadius: '2px' }}></div>
                            <span>Added</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: '12px', height: '12px', background: '#fee2e2', border: '1px solid #ef4444', borderRadius: '2px' }}></div>
                            <span>Removed</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: '12px', height: '12px', background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: '2px' }}></div>
                            <span>Changed</span>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
