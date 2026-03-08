import { useState } from 'react';
import { Globe, Download, FileVideo, FileAudio, CheckCircle2, AlertCircle, Settings2, FileText } from 'lucide-react';
import { Dropzone } from '../shared/Dropzone.tsx';

export function MediaTranslator() {
    const [file, setFile] = useState<File | null>(null);
    const [sourceLang, setSourceLang] = useState('auto');
    const [targetLang, setTargetLang] = useState('en');
    const [burnSubtitles, setBurnSubtitles] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
    const [outputFileName, setOutputFileName] = useState<string>('');
    const [srtPreview, setSrtPreview] = useState<string | null>(null);

    const SUPPORTED_LANGUAGES = [
        { code: 'af', name: 'Afrikaans' },
        { code: 'sq', name: 'Albanian' },
        { code: 'am', name: 'Amharic' },
        { code: 'ar', name: 'Arabic' },
        { code: 'hy', name: 'Armenian' },
        { code: 'az', name: 'Azerbaijani' },
        { code: 'eu', name: 'Basque' },
        { code: 'be', name: 'Belarusian' },
        { code: 'bn', name: 'Bengali' },
        { code: 'bs', name: 'Bosnian' },
        { code: 'bg', name: 'Bulgarian' },
        { code: 'ca', name: 'Catalan' },
        { code: 'ceb', name: 'Cebuano' },
        { code: 'ny', name: 'Chichewa' },
        { code: 'zh-CN', name: 'Chinese (Simplified)' },
        { code: 'zh-TW', name: 'Chinese (Traditional)' },
        { code: 'co', name: 'Corsican' },
        { code: 'hr', name: 'Croatian' },
        { code: 'cs', name: 'Czech' },
        { code: 'da', name: 'Danish' },
        { code: 'nl', name: 'Dutch' },
        { code: 'en', name: 'English' },
        { code: 'eo', name: 'Esperanto' },
        { code: 'et', name: 'Estonian' },
        { code: 'tl', name: 'Filipino' },
        { code: 'fi', name: 'Finnish' },
        { code: 'fr', name: 'French' },
        { code: 'fy', name: 'Frisian' },
        { code: 'gl', name: 'Galician' },
        { code: 'ka', name: 'Georgian' },
        { code: 'de', name: 'German' },
        { code: 'el', name: 'Greek' },
        { code: 'gu', name: 'Gujarati' },
        { code: 'ht', name: 'Haitian Creole' },
        { code: 'ha', name: 'Hausa' },
        { code: 'haw', name: 'Hawaiian' },
        { code: 'iw', name: 'Hebrew' },
        { code: 'hi', name: 'Hindi' },
        { code: 'hmn', name: 'Hmong' },
        { code: 'hu', name: 'Hungarian' },
        { code: 'is', name: 'Icelandic' },
        { code: 'ig', name: 'Igbo' },
        { code: 'id', name: 'Indonesian' },
        { code: 'ga', name: 'Irish' },
        { code: 'it', name: 'Italian' },
        { code: 'ja', name: 'Japanese' },
        { code: 'jw', name: 'Javanese' },
        { code: 'kn', name: 'Kannada' },
        { code: 'kk', name: 'Kazakh' },
        { code: 'km', name: 'Khmer' },
        { code: 'ko', name: 'Korean' },
        { code: 'ku', name: 'Kurdish (Kurmanji)' },
        { code: 'ky', name: 'Kyrgyz' },
        { code: 'lo', name: 'Lao' },
        { code: 'la', name: 'Latin' },
        { code: 'lv', name: 'Latvian' },
        { code: 'lt', name: 'Lithuanian' },
        { code: 'lb', name: 'Luxembourgish' },
        { code: 'mk', name: 'Macedonian' },
        { code: 'mg', name: 'Malagasy' },
        { code: 'ms', name: 'Malay' },
        { code: 'ml', name: 'Malayalam' },
        { code: 'mt', name: 'Maltese' },
        { code: 'mi', name: 'Maori' },
        { code: 'mr', name: 'Marathi' },
        { code: 'mn', name: 'Mongolian' },
        { code: 'my', name: 'Myanmar (Burmese)' },
        { code: 'ne', name: 'Nepali' },
        { code: 'no', name: 'Norwegian' },
        { code: 'ps', name: 'Pashto' },
        { code: 'fa', name: 'Persian' },
        { code: 'pl', name: 'Polish' },
        { code: 'pt', name: 'Portuguese' },
        { code: 'pa', name: 'Punjabi' },
        { code: 'ro', name: 'Romanian' },
        { code: 'ru', name: 'Russian' },
        { code: 'sm', name: 'Samoan' },
        { code: 'gd', name: 'Scots Gaelic' },
        { code: 'sr', name: 'Serbian' },
        { code: 'st', name: 'Sesotho' },
        { code: 'sn', name: 'Shona' },
        { code: 'sd', name: 'Sindhi' },
        { code: 'si', name: 'Sinhala' },
        { code: 'sk', name: 'Slovak' },
        { code: 'sl', name: 'Slovenian' },
        { code: 'so', name: 'Somali' },
        { code: 'es', name: 'Spanish' },
        { code: 'su', name: 'Sundanese' },
        { code: 'sw', name: 'Swahili' },
        { code: 'sv', name: 'Swedish' },
        { code: 'tg', name: 'Tajik' },
        { code: 'ta', name: 'Tamil' },
        { code: 'te', name: 'Telugu' },
        { code: 'th', name: 'Thai' },
        { code: 'tr', name: 'Turkish' },
        { code: 'uk', name: 'Ukrainian' },
        { code: 'ur', name: 'Urdu' },
        { code: 'uz', name: 'Uzbek' },
        { code: 'vi', name: 'Vietnamese' },
        { code: 'cy', name: 'Welsh' },
        { code: 'xh', name: 'Xhosa' },
        { code: 'yi', name: 'Yiddish' },
        { code: 'yo', name: 'Yoruba' },
        { code: 'zu', name: 'Zulu' }
    ];

    const handleFileSelect = (file: File) => {
        setFile(file);
        setError(null);
        setDownloadUrl(null);
    };

    const handleTranslate = async () => {
        if (!file) {
            setError('Please select a media file to translate.');
            return;
        }

        setIsProcessing(true);
        setError(null);
        setDownloadUrl(null);
        setSrtPreview(null);

        const formData = new FormData();
        formData.append('media', file);
        formData.append('sourceLang', sourceLang);
        formData.append('targetLang', targetLang);
        formData.append('burnSubtitles', burnSubtitles.toString());

        try {
            const response = await fetch('/api/translate-media', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Translation failed');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            setDownloadUrl(url);

            // Determine output extension based on file type and burning preference
            const isVideo = file.type.startsWith('video/');
            const ext = (isVideo && burnSubtitles) ? `.${file.name.split('.').pop()}` : '.srt';
            setOutputFileName(`translated-${file.name.split('.')[0]}${ext}`);

            // If we generated an SRT, let's fetch its content to show a preview
            if (ext === '.srt') {
                const text = await blob.text();
                setSrtPreview(text);
            }

        } catch (err: any) {
            console.error(err);
            setError(err.message || 'An error occurred during translation');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="tool-container">
            <h2><Globe className="inline-icon" /> Video / Audio Translator</h2>
            <p className="tool-description">
                Transcribe any video or audio file, translate it into your target language, and download an SRT subtitle file or burn the subtitles directly into the video!
            </p>

            {!file ? (
                <Dropzone onFileSelect={handleFileSelect} accept="video/*,audio/*" title="Drop Video or Audio to Translate" />
            ) : (
                <div className="processing-container">
                    <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '8px', borderLeft: '4px solid #8b5cf6', textAlign: 'left' }}>
                        <p style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1e293b', fontWeight: 600 }}>
                            {file.type.startsWith('video/') ? <FileVideo size={18} color="#8b5cf6" /> : <FileAudio size={18} color="#ec4899" />}
                            Selected Media
                        </p>
                        <p className="instruction" style={{ wordBreak: 'break-all', marginTop: '0.25rem' }}>{file.name}</p>
                        <p className="instruction" style={{ marginTop: '0.25rem' }}>Size: {(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                        <button className="btn-secondary" style={{ marginTop: '0.75rem', padding: '0.25rem 0.75rem', fontSize: '0.8rem' }} onClick={() => { setFile(null); setDownloadUrl(null); }} disabled={isProcessing}>Change Media</button>
                    </div>

                    <div className="settings-panel">
                        <h3><Settings2 size={18} /> Translation Options</h3>

                        <div className="setting-group">
                            <label>Source Language:</label>
                            <select
                                value={sourceLang}
                                onChange={(e) => setSourceLang(e.target.value)}
                                disabled={isProcessing}
                            >
                                <option value="auto">Auto-Detect</option>
                                {SUPPORTED_LANGUAGES.map(lang => (
                                    <option key={lang.code} value={lang.code}>{lang.name}</option>
                                ))}
                            </select>
                            <p className="setting-hint">The spoken language in the media. Leave as Auto-Detect if unsure.</p>
                        </div>

                        <div className="setting-group">
                            <label>Target Language:</label>
                            <select
                                value={targetLang}
                                onChange={(e) => setTargetLang(e.target.value)}
                                disabled={isProcessing}
                            >
                                <option value="original">Original Language (Transcribe Only)</option>
                                {SUPPORTED_LANGUAGES.map(lang => (
                                    <option key={lang.code} value={lang.code}>{lang.name}</option>
                                ))}
                            </select>
                            <p className="setting-hint">The language you want the subtitles to be in.</p>
                        </div>

                        {file.type.startsWith('video/') && (
                            <div className="setting-group checkbox-group">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={burnSubtitles}
                                        onChange={(e) => setBurnSubtitles(e.target.checked)}
                                        disabled={isProcessing}
                                    />
                                    Burn subtitles into video frame
                                </label>
                                <p className="setting-hint">
                                    If checked, outputs a new video file with permanent subtitles. If unchecked, outputs a standalone .srt subtitle file.
                                </p>
                            </div>
                        )}

                        {(!file.type.startsWith('video/') || !burnSubtitles) && (
                            <div className="info-message" style={{ marginTop: '1rem', background: 'rgba(139, 92, 246, 0.1)', padding: '0.75rem', borderRadius: '8px', borderLeft: '3px solid #8b5cf6' }}>
                                <FileText size={16} /> Output will be a <strong>.srt</strong> subtitle file that you can use in any media player.
                            </div>
                        )}

                        <div className="action-row">
                            <button
                                className="primary-btn"
                                onClick={handleTranslate}
                                disabled={isProcessing}
                            >
                                {isProcessing ? (
                                    <>
                                        <div className="spinner"></div> Processing Media...
                                    </>
                                ) : (
                                    <>
                                        <Globe size={18} /> Translate Media
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="error-message">
                            <AlertCircle size={20} />
                            <span>{error}</span>
                        </div>
                    )}

                    {downloadUrl && !isProcessing && (
                        <div className="success-panel" style={{ marginTop: '2rem' }}>
                            <CheckCircle2 size={32} color="#10b981" />
                            <h3>Translation Complete!</h3>
                            <p>Your media has been successfully transcribed and translated.</p>

                            <div className="preview-container" style={{ margin: '1.5rem 0', padding: '1.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
                                <h4 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
                                    {file?.type.startsWith('video/') ? <FileVideo size={20} /> : <FileAudio size={20} />} Preview Result
                                </h4>

                                {/* Generated Video Preview */}
                                {file && file.type.startsWith('video/') && burnSubtitles && (
                                    <video controls src={downloadUrl} style={{ width: '100%', borderRadius: '8px', background: '#000', maxHeight: '400px' }} />
                                )}

                                {/* Original Video Preview (for SRT only output) */}
                                {file && file.type.startsWith('video/') && !burnSubtitles && (
                                    <video controls src={URL.createObjectURL(file)} style={{ width: '100%', borderRadius: '8px', background: '#000', maxHeight: '400px' }} />
                                )}

                                {/* Audio Preview */}
                                {file && file.type.startsWith('audio/') && (
                                    <audio controls src={URL.createObjectURL(file)} style={{ width: '100%' }} />
                                )}

                                {/* SRT Content Preview */}
                                {srtPreview && (
                                    <div className="srt-text-preview" style={{ marginTop: '1rem', background: '#1e1e2e', padding: '1rem', borderRadius: '8px', maxHeight: '250px', overflowY: 'auto', fontSize: '0.9rem', color: '#a6accd', textAlign: 'left', whiteSpace: 'pre-wrap', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        {srtPreview}
                                    </div>
                                )}
                            </div>

                            <div className="action-row" style={{ display: 'flex', justifyContent: 'center' }}>
                                <a href={downloadUrl} download={outputFileName} className="download-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#8b5cf6', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '8px', fontWeight: 'bold', textDecoration: 'none', transition: 'background 0.2s' }}>
                                    <Download size={20} /> Download {outputFileName.endsWith('.srt') ? 'Subtitles (SRT)' : 'Video'}
                                </a>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
