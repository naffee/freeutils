import React, { useState, useMemo } from 'react';
import { Search, Info, Copy, Trash2, Check, AlertCircle, Sparkles } from 'lucide-react';

export function RegexTester() {
    const [pattern, setPattern] = useState('[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}');
    const [flags, setFlags] = useState('g');
    const [testString, setTestString] = useState('Contact us at support@example.com or info@test-site.org today!');
    const [copied, setCopied] = useState(false);

    const { matches, error, highlightedText } = useMemo(() => {
        try {
            if (!pattern) return { matches: [], error: null, highlightedText: testString };

            const regex = new RegExp(pattern.trim(), flags);
            const allMatches = Array.from(testString.matchAll(regex));

            if (allMatches.length === 0) return { matches: [], error: null, highlightedText: testString };

            // Generate highlighted HTML
            let lastIndex = 0;
            const fragments: React.ReactNode[] = [];

            const sortedMatches = [...allMatches].sort((a, b) => a.index! - b.index!);

            sortedMatches.forEach((match, i) => {
                const start = match.index!;
                const end = start + match[0].length;

                if (start < lastIndex) return; // Skip overlapping for simple viz

                // Add text before match
                fragments.push(testString.substring(lastIndex, start));

                // Add highlighted match
                fragments.push(
                    <span key={i} style={{
                        background: 'rgba(59, 130, 246, 0.2)',
                        borderBottom: '2px solid #3b82f6',
                        color: '#1e40af',
                        fontWeight: 500,
                        borderRadius: '2px',
                        padding: '0 1px'
                    }}>
                        {match[0]}
                    </span>
                );

                lastIndex = end;
            });

            fragments.push(testString.substring(lastIndex));

            return {
                matches: allMatches,
                error: null,
                highlightedText: <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{fragments}</div>
            };
        } catch (e: any) {
            return { matches: [], error: e.message, highlightedText: testString };
        }
    }, [pattern, flags, testString]);

    const handleCopyPattern = () => {
        navigator.clipboard.writeText(`/${pattern}/${flags}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleClear = () => {
        setPattern('');
        setTestString('');
    };

    return (
        <div className="watermark-remover">
            <div className="seo-writeup">
                <h2>Regex Tester</h2>
                <p>Test, build, and debug complex Regular Expressions (RegEx) interactively against sample text data.</p>
            </div>
            <div className="editor-container" style={{ maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '1rem 1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <Search size={20} color="#3b82f6" />
                            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Regex Tester & Debugger</h3>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className="btn-secondary" onClick={handleClear} title="Clear All">
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1.5rem' }}>
                        {/* Main Area */}
                        <div style={{ flex: 1.5, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                            {/* Regex Input */}
                            <div style={{ background: '#fff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>REGULAR EXPRESSION</label>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button onClick={handleCopyPattern} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                            {copied ? <Check size={12} color="#16a34a" /> : <Copy size={12} />} Copy Regex
                                        </button>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', background: '#f1f5f9', padding: '0.5rem 1rem', borderRadius: '8px', border: `2px solid ${error ? '#ef4444' : '#cbd5e1'}` }}>
                                    <span style={{ color: '#94a3b8', fontSize: '1.2rem', fontWeight: 700 }}>/</span>
                                    <input
                                        value={pattern}
                                        onChange={(e) => setPattern(e.target.value)}
                                        placeholder="Enter your pattern here..."
                                        style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontFamily: '"JetBrains Mono", monospace', fontSize: '1rem' }}
                                    />
                                    <span style={{ color: '#94a3b8', fontSize: '1.2rem', fontWeight: 700 }}>/</span>
                                    <input
                                        value={flags}
                                        onChange={(e) => setFlags(e.target.value)}
                                        placeholder="flags"
                                        style={{ width: '60px', background: 'none', border: 'none', outline: 'none', fontFamily: '"JetBrains Mono", monospace', fontSize: '1rem', color: '#3b82f6', fontWeight: 700 }}
                                    />
                                </div>
                                {error && (
                                    <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444', fontSize: '0.8rem' }}>
                                        <AlertCircle size={14} />
                                        <span>{error}</span>
                                    </div>
                                )}
                            </div>

                            {/* Test String Input */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>TEST STRING</label>
                                <textarea
                                    value={testString}
                                    onChange={(e) => setTestString(e.target.value)}
                                    placeholder="Paste text to test against the regex..."
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

                            {/* Match Visualization */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#3b82f6' }}>MATCH HIGHLIGHTS</label>
                                    <span style={{ fontSize: '0.8rem', background: '#3b82f6', color: 'white', padding: '2px 8px', borderRadius: '12px' }}>
                                        {matches.length} matches
                                    </span>
                                </div>
                                <div style={{
                                    flex: 1,
                                    padding: '1.25rem',
                                    background: '#f8fafc',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '12px',
                                    minHeight: '100px',
                                    lineHeight: 1.6
                                }}>
                                    {highlightedText}
                                </div>
                            </div>
                        </div>

                        {/* Sidebar Details */}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ background: '#f0fdf4', padding: '1.25rem', borderRadius: '12px', border: '1px solid #bcf0da' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: '#059669' }}>
                                    <Sparkles size={18} />
                                    <h4 style={{ margin: 0, fontSize: '0.9rem' }}>Match Info</h4>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {matches.slice(0, 5).map((match, i) => (
                                        <div key={i} style={{ fontSize: '0.8rem', borderBottom: '1px solid #d1fae5', paddingBottom: '0.25rem' }}>
                                            <span style={{ color: '#059669', fontWeight: 700 }}>#{i + 1}:</span> "{match[0]}"
                                            <span style={{ color: '#64748b', fontSize: '0.7rem' }}> (index {match.index})</span>
                                        </div>
                                    ))}
                                    {matches.length > 5 && (
                                        <span style={{ fontSize: '0.75rem', color: '#64748b', textAlign: 'center' }}>
                                            + {matches.length - 5} more matches
                                        </span>
                                    )}
                                    {matches.length === 0 && (
                                        <span style={{ fontSize: '0.8rem', color: '#64748b', fontStyle: 'italic' }}>No matches found</span>
                                    )}
                                </div>
                            </div>

                            <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: '#1e40af', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                    <Info size={14} /> Global Flag (g)
                                </h4>
                                <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b', lineHeight: 1.5 }}>
                                    The 'g' flag ensures that all matches in the text are found, instead of just the first one.
                                </p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
