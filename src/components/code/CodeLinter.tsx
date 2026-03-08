import { useState, useMemo } from 'react';
import { Shield, AlertTriangle, AlertCircle, CheckCircle2, Trash2, Info, Code2 } from 'lucide-react';

type Language = 'javascript' | 'css' | 'html';

interface LintIssue {
    line: number;
    message: string;
    type: 'error' | 'warning';
    rule: string;
}

export function CodeLinter() {
    const [input, setInput] = useState('');
    const [language, setLanguage] = useState<Language>('javascript');

    const issues = useMemo(() => {
        if (!input.trim()) return [];

        const lines = input.split('\n');
        const result: LintIssue[] = [];

        if (language === 'javascript') {
            lines.forEach((line, i) => {
                const lineNum = i + 1;

                // Semicolon check
                if (line.trim() && !line.trim().endsWith('{') && !line.trim().endsWith('}') && !line.trim().endsWith(';') && !line.trim().startsWith('//') && !line.trim().startsWith('/*') && !line.includes('if (') && !line.includes('for (') && !line.includes('while (')) {
                    result.push({ line: lineNum, message: 'Missing semicolon at end of line', type: 'warning', rule: 'semi' });
                }

                // Console log
                if (line.includes('console.log')) {
                    result.push({ line: lineNum, message: 'Unexpected console.log statement', type: 'warning', rule: 'no-console' });
                }

                // Eval usage
                if (line.includes('eval(')) {
                    result.push({ line: lineNum, message: 'Avoid using eval() for security reasons', type: 'error', rule: 'no-eval' });
                }

                // var usage
                if (line.match(/\bvar\b/)) {
                    result.push({ line: lineNum, message: 'Unexpected var, use let or const instead', type: 'warning', rule: 'no-var' });
                }
            });
        } else if (language === 'css') {
            lines.forEach((line, i) => {
                const lineNum = i + 1;

                // ID Selector
                if (line.trim().startsWith('#') && !line.trim().includes('{') && !line.trim().includes('}')) {
                    result.push({ line: lineNum, message: 'Avoid ID selectors for styling; use classes instead', type: 'warning', rule: 'no-id-selector' });
                }

                // !important
                if (line.includes('!important')) {
                    result.push({ line: lineNum, message: 'Avoid using !important', type: 'warning', rule: 'no-important' });
                }

                // Empty rules
                if (line.trim().endsWith('{}')) {
                    result.push({ line: lineNum, message: 'Empty rule set', type: 'warning', rule: 'no-empty-block' });
                }
            });
        } else if (language === 'html') {
            lines.forEach((line, i) => {
                const lineNum = i + 1;

                // Missing alt on img
                if (line.includes('<img') && !line.includes('alt=')) {
                    result.push({ line: lineNum, message: 'Missing alt attribute for <img> tag', type: 'error', rule: 'accessibility-alt' });
                }

                // Inline styles
                if (line.includes('style=')) {
                    result.push({ line: lineNum, message: 'Avoid using inline styles', type: 'warning', rule: 'no-inline-style' });
                }

                // Obsolete tags
                if (line.match(/<(font|center|big|strike|tt)/)) {
                    result.push({ line: lineNum, message: 'Using obsolete or deprecated HTML tag', type: 'warning', rule: 'no-obsolete-tags' });
                }
            });
        }

        return result;
    }, [input, language]);

    const stats = useMemo(() => {
        return {
            errors: issues.filter(i => i.type === 'error').length,
            warnings: issues.filter(i => i.type === 'warning').length,
            total: issues.length
        };
    }, [issues]);

    const handleClear = () => {
        setInput('');
    };

    return (
        <div className="watermark-remover">
            <div className="editor-container" style={{ maxWidth: '1100px', margin: '0 auto', width: '100%' }}>
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '1rem 1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <Shield size={20} color="#f43f5e" />
                            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Basic Code Linter</h3>
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <select
                                value={language}
                                onChange={(e) => setLanguage(e.target.value as Language)}
                                style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', fontSize: '0.85rem', fontWeight: 600 }}
                            >
                                <option value="javascript">JavaScript</option>
                                <option value="css">CSS</option>
                                <option value="html">HTML</option>
                            </select>
                            <button className="btn-secondary" onClick={handleClear} title="Clear All">
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1.5rem' }}>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>SOURCE CODE</label>
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder={`Paste your ${language} code here to analyze...`}
                                style={{
                                    height: '400px',
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

                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>ANALYSIS RESULTS</label>

                            <div style={{ height: '400px', borderRadius: '12px', border: '2px solid #e2e8f0', background: '#f8fafc', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                                <div style={{ padding: '0.75rem 1rem', background: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '1.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
                                        <AlertCircle size={16} color="#ef4444" />
                                        <strong>{stats.errors}</strong> <span style={{ color: '#64748b' }}>Errors</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
                                        <AlertTriangle size={16} color="#f59e0b" />
                                        <strong>{stats.warnings}</strong> <span style={{ color: '#64748b' }}>Warnings</span>
                                    </div>
                                </div>

                                <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
                                    {issues.length > 0 ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                            {issues.map((issue, idx) => (
                                                <div
                                                    key={idx}
                                                    style={{
                                                        padding: '0.75rem',
                                                        borderRadius: '8px',
                                                        background: '#fff',
                                                        border: `1px solid ${issue.type === 'error' ? '#fecaca' : '#fde68a'}`,
                                                        borderLeft: `4px solid ${issue.type === 'error' ? '#ef4444' : '#f59e0b'}`,
                                                        display: 'flex',
                                                        gap: '0.75rem',
                                                        alignItems: 'flex-start'
                                                    }}
                                                >
                                                    <div style={{
                                                        background: issue.type === 'error' ? '#fee2e2' : '#fef3c7',
                                                        padding: '0.2rem 0.5rem',
                                                        borderRadius: '4px',
                                                        fontSize: '0.7rem',
                                                        fontWeight: 800,
                                                        color: issue.type === 'error' ? '#ef4444' : '#d97706',
                                                        minWidth: '60px',
                                                        textAlign: 'center'
                                                    }}>
                                                        LINE {issue.line}
                                                    </div>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b', marginBottom: '0.25rem' }}>{issue.message}</div>
                                                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontFamily: '"JetBrains Mono", monospace' }}>Rule: {issue.rule}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : input.trim() ? (
                                        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#059669', gap: '1rem' }}>
                                            <CheckCircle2 size={48} />
                                            <div style={{ fontWeight: 700 }}>No issues found! Your code looks clean.</div>
                                        </div>
                                    ) : (
                                        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', gap: '1rem' }}>
                                            <Code2 size={48} />
                                            <div style={{ fontSize: '0.9rem' }}>Paste code to see linting results.</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                        <Info size={16} style={{ marginTop: '0.2rem', color: '#64748b' }} />
                        <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b', lineHeight: 1.5 }}>
                            This basic linter provides real-time static analysis for common coding mistakes and best practices. It's powered by lightweight pattern matching for instant results without the overhead of full parsers.
                        </p>
                    </div>

                </div>
            </div>
        </div>
    );
}
