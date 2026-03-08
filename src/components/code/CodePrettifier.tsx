import { useState } from 'react';
import { Wand2, Copy, Trash2, Check, Download, Info, AlignLeft } from 'lucide-react';

type Language = 'javascript' | 'css' | 'html';

export function CodePrettifier() {
    const [input, setInput] = useState('');
    const [output, setOutput] = useState('');
    const [language, setLanguage] = useState<Language>('javascript');
    const [indentSize, setIndentSize] = useState(2);
    const [isProcessing, setIsProcessing] = useState(false);
    const [copied, setCopied] = useState(false);

    const formatJS = (code: string, indent: number) => {
        let formatted = '';
        let pad = 0;
        const padStr = ' '.repeat(indent);

        // Basic cleaning
        let tokens = code
            .replace(/\s*([\(\)\[\]\{\}\:\;\,\=])\s*/g, ' $1 ') // Space around operators/delimiters
            .replace(/\s+/g, ' ')
            .trim()
            .split(' ');

        tokens.forEach((token) => {
            if (token === '{') {
                formatted += ' {\n' + padStr.repeat(++pad);
            } else if (token === '}') {
                formatted = formatted.trimEnd() + '\n' + padStr.repeat(--pad) + '} \n' + padStr.repeat(pad);
            } else if (token === ';') {
                formatted += ';\n' + padStr.repeat(pad);
            } else {
                formatted += token + ' ';
            }
        });

        return formatted.replace(/\n\s*\n/g, '\n').trim();
    };

    const formatCSS = (code: string, indent: number) => {
        let formatted = '';
        let pad = 0;
        const padStr = ' '.repeat(indent);

        const clean = code
            .replace(/\s*([\{\}\:\;\,])\s*/g, '$1')
            .replace(/\{/g, ' {\n')
            .replace(/\}/g, '\n}\n')
            .replace(/\;/g, ';\n')
            .replace(/\,/g, ', ');

        const lines = clean.split('\n');
        lines.forEach((line) => {
            line = line.trim();
            if (line.endsWith('{')) {
                formatted += padStr.repeat(pad++) + line + '\n';
            } else if (line === '}') {
                formatted += padStr.repeat(--pad) + line + '\n';
            } else if (line !== '') {
                formatted += padStr.repeat(pad) + line + '\n';
            }
        });

        return formatted.trim();
    };

    const formatHTML = (code: string, indent: number) => {
        let formatted = '';
        let pad = 0;
        const padStr = ' '.repeat(indent);

        const clean = code
            .replace(/>\s+</g, '><')
            .replace(/(<[^>]+>)/g, '$1\n')
            .trim();

        const lines = clean.split('\n');
        lines.forEach((line) => {
            line = line.trim();
            if (line.match(/^<\/\w/)) { // End tag
                pad--;
            }

            formatted += padStr.repeat(Math.max(0, pad)) + line + '\n';

            if (line.match(/^<\w([^>]*[^/])?>/) && !line.match(/<(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)/)) { // Start tag
                pad++;
            }
        });

        return formatted.trim();
    };

    const handleFormat = () => {
        if (!input.trim()) return;

        setIsProcessing(true);
        setTimeout(() => {
            let result = '';
            try {
                switch (language) {
                    case 'javascript':
                        result = formatJS(input, indentSize);
                        break;
                    case 'css':
                        result = formatCSS(input, indentSize);
                        break;
                    case 'html':
                        result = formatHTML(input, indentSize);
                        break;
                }
                setOutput(result);
            } catch (e) {
                setOutput('Error formatting code. Please check your syntax.');
            }
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
        a.download = `formatted.${extensions[language]}`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleClear = () => {
        setInput('');
        setOutput('');
    };

    return (
        <div className="watermark-remover">
            <div className="editor-container" style={{ maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '1rem 1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <AlignLeft size={20} color="#6366f1" />
                            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Code Prettifier</h3>
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#fff', padding: '0.25rem 0.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Indent:</span>
                                <select
                                    value={indentSize}
                                    onChange={(e) => setIndentSize(Number(e.target.value))}
                                    style={{ border: 'none', background: 'none', fontSize: '0.8rem', fontWeight: 700, outline: 'none' }}
                                >
                                    <option value={2}>2</option>
                                    <option value={4}>4</option>
                                    <option value={8}>8</option>
                                </select>
                            </div>
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
                            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>MESSY CODE</label>
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder={`Paste messy ${language} code here...`}
                                style={{
                                    height: '300px',
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
                                onClick={handleFormat}
                                disabled={isProcessing || !input.trim()}
                                style={{ background: '#6366f1', color: '#fff', height: '48px' }}
                            >
                                {isProcessing ? 'Prettifying...' : (
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                        <Wand2 size={18} /> Prettify Code
                                    </div>
                                )}
                            </button>
                        </div>

                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>BEAUTIFUL OUTPUT</label>
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
                                    height: '360px',
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
                        </div>
                    </div>

                    <div style={{ background: '#eff6ff', padding: '1rem', borderRadius: '12px', border: '1px solid #bfdbfe', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                        <Info size={16} style={{ marginTop: '0.2rem', color: '#3b82f6' }} />
                        <p style={{ margin: 0, fontSize: '0.8rem', color: '#1e40af', lineHeight: 1.5 }}>
                            The Prettifier reconstructs your code structure by balancing braces and tags, ensuring consistent indentation and spacing. It's a great way to make legacy or minified code readable again.
                        </p>
                    </div>

                </div>
            </div>
        </div>
    );
}
