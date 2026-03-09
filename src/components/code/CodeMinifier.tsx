import { useState } from 'react';
import { Minimize2, Copy, Trash2, Check, Download, Info, Zap } from 'lucide-react';

type Language = 'javascript' | 'css' | 'html';

export function CodeMinifier() {
    const [input, setInput] = useState('');
    const [output, setOutput] = useState('');
    const [language, setLanguage] = useState<Language>('javascript');
    const [isProcessing, setIsProcessing] = useState(false);
    const [copied, setCopied] = useState(false);
    const [stats, setStats] = useState<{ original: number; minified: number; savings: number } | null>(null);

    const minifyJS = (js: string) => {
        return js
            .replace(/\/\*[\s\S]*?\*\/|([^:]|^)\/\/.*$/gm, '$1') // Remove comments
            .replace(/\s+/g, ' ') // Collapse whitespace
            .replace(/\s*([\{\}\(\)\[\]\:\;\,\=\+\-\*\/])\s*/g, '$1') // Remove spaces around operators
            .trim();
    };

    const minifyCSS = (css: string) => {
        return css
            .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
            .replace(/\s+/g, ' ') // Collapse whitespace
            .replace(/\s*([\{\}\:\;\,\>])\s*/g, '$1') // Remove spaces around delimiters
            .replace(/;}/g, '}') // Remove trailing semicolon in blocks
            .trim();
    };

    const minifyHTML = (html: string) => {
        return html
            .replace(/<!--[\s\S]*?-->/g, '') // Remove comments
            .replace(/\s+/g, ' ') // Collapse whitespace
            .replace(/>\s+</g, '><') // Remove space between tags
            .trim();
    };

    const handleMinify = () => {
        if (!input.trim()) return;

        setIsProcessing(true);
        setTimeout(() => {
            let minified = '';
            switch (language) {
                case 'javascript':
                    minified = minifyJS(input);
                    break;
                case 'css':
                    minified = minifyCSS(input);
                    break;
                case 'html':
                    minified = minifyHTML(input);
                    break;
            }

            setOutput(minified);

            const originalSize = new Blob([input]).size;
            const minifiedSize = new Blob([minified]).size;
            const savings = originalSize > 0 ? Math.round(((originalSize - minifiedSize) / originalSize) * 100) : 0;

            setStats({
                original: originalSize,
                minified: minifiedSize,
                savings: savings
            });

            setIsProcessing(false);
        }, 300);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(output);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = () => {
        const extensions = { javascript: 'js', css: 'css', html: 'html' };
        const blob = new Blob([output], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `minified.${extensions[language]}`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleClear = () => {
        setInput('');
        setOutput('');
        setStats(null);
    };

    return (
        <div className="watermark-remover">
            <div className="seo-writeup">
                <h2>Code Minifier</h2>
                <p>Compress HTML, CSS, and JavaScript code to reduce file sizes and dramatically improve loading times.</p>
            </div>
            <div className="editor-container" style={{ maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '1rem 1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <Minimize2 size={20} color="#f59e0b" />
                            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Code Minifier</h3>
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
                                placeholder={`Paste your ${language} code here...`}
                                style={{
                                    height: '250px',
                                    padding: '1rem',
                                    borderRadius: '12px',
                                    border: '2px solid #e2e8f0',
                                    fontFamily: '"JetBrains Mono", monospace',
                                    fontSize: '0.9rem',
                                    resize: 'none',
                                    outline: 'none'
                                }}
                            />
                            <button
                                className="btn-primary"
                                onClick={handleMinify}
                                disabled={isProcessing || !input.trim()}
                                style={{ background: '#f59e0b', color: '#fff', height: '48px' }}
                            >
                                {isProcessing ? 'Minifying...' : (
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                        <Zap size={18} /> Minify Code
                                    </div>
                                )}
                            </button>
                        </div>

                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>MINIFIED OUTPUT</label>
                                {output && (
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button onClick={handleCopy} className="btn-secondary" style={{ padding: '4px 8px' }}>
                                            {copied ? <Check size={14} color="#16a34a" /> : <Copy size={14} />}
                                        </button>
                                        <button onClick={handleDownload} className="btn-secondary" style={{ padding: '4px 8px' }}>
                                            <Download size={14} />
                                        </button>
                                    </div>
                                )}
                            </div>
                            <textarea
                                value={output}
                                readOnly
                                placeholder="Result will appear here..."
                                style={{
                                    height: '250px',
                                    padding: '1rem',
                                    borderRadius: '12px',
                                    border: '2px solid #e2e8f0',
                                    background: '#f8fafc',
                                    fontFamily: '"JetBrains Mono", monospace',
                                    fontSize: '0.9rem',
                                    resize: 'none',
                                    outline: 'none'
                                }}
                            />

                            {stats && (
                                <div style={{ padding: '1rem', borderRadius: '12px', border: '1px solid #fde68a', background: '#fffbeb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontSize: '0.75rem', color: '#92400e', fontWeight: 700 }}>REDUCTION</span>
                                        <span style={{ fontSize: '1.25rem', color: '#b45309', fontWeight: 800 }}>{stats.savings}%</span>
                                    </div>
                                    <div style={{ textAlign: 'right', fontSize: '0.8rem', color: '#92400e' }}>
                                        <div>Original: <b>{stats.original} B</b></div>
                                        <div>Minified: <b>{stats.minified} B</b></div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                        <Info size={16} style={{ marginTop: '0.2rem', color: '#64748b' }} />
                        <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b', lineHeight: 1.5 }}>
                            This tool performs basic minification by removing comments, stripping whitespace, and optimizing structure. It's suitable for quick performance gains without external dependencies. Processing is entirely client-side for maximum privacy.
                        </p>
                    </div>

                </div>
            </div>
        </div>
    );
}
