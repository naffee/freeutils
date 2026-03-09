import { Link } from 'react-router-dom';
import { Film, Music, Image as ImageIcon, Code, Type, ArrowRight, Sparkles } from 'lucide-react';
import './Home.css';
import { BrandLogo } from '../shared/BrandLogo';

export function Home() {
    return (
        <div className="home-container">
            {/* Navigation */}
            <nav className="home-navbar">
                <BrandLogo className="home-logo" />
                <Link to="/app" className="home-nav-launch">
                    Launch App
                </Link>
            </nav>

            {/* Hero Section */}
            <section className="hero-section">
                <div className="hero-bg-blob"></div>
                <div className="hero-content">
                    <h1 className="hero-title">
                        The Ultimate AI-Powered <br />
                        <span className="hero-title-highlight">Media Toolkit</span>
                    </h1>
                    <p className="hero-subtitle">
                        Edit videos, manipulate audio, enhance images, format code, and process text entirely in your browser. Blazing fast, secure, and privacy-first FFmpeg WASM processing.
                    </p>
                    <Link to="/app" className="hero-cta">
                        <Sparkles size={20} />
                        Start Creating Now
                        <ArrowRight size={20} />
                    </Link>
                </div>
            </section>

            {/* Features Overview */}
            <section className="features-section">
                <h2 className="section-title">Everything you need in one place</h2>
                <div className="features-grid">

                    {/* Video Card */}
                    <Link to="/app/videos" className="feature-card video">
                        <div className="feature-icon-wrapper">
                            <Film size={30} />
                        </div>
                        <h3>Video processing</h3>
                        <p>Compress, trim, crop, extract frames, burn subtitles, stabilize, create karaoke, and much more without uploading files to a server.</p>
                        <div className="feature-tools-list">
                            <span className="feature-tool-tag">Trim</span>
                            <span className="feature-tool-tag">Crop</span>
                            <span className="feature-tool-tag">Subtitles</span>
                            <span className="feature-tool-tag">Convert</span>
                            <span className="feature-tool-tag">+25 more</span>
                        </div>
                    </Link>

                    {/* Audio Card */}
                    <Link to="/app/audio" className="feature-card audio">
                        <div className="feature-icon-wrapper">
                            <Music size={30} />
                        </div>
                        <h3>Audio Engineering</h3>
                        <p>Convert audio formats, trim sound clips, merge multitrack audio, and enhance speech quality using AI models.</p>
                        <div className="feature-tools-list">
                            <span className="feature-tool-tag">Convert</span>
                            <span className="feature-tool-tag">Merge</span>
                            <span className="feature-tool-tag">Speech Enhancer</span>
                        </div>
                    </Link>

                    {/* Image Card */}
                    <Link to="/app/images" className="feature-card image">
                        <div className="feature-icon-wrapper">
                            <ImageIcon size={30} />
                        </div>
                        <h3>Image Manipulation</h3>
                        <p>Remove backgrounds, apply filters, upscale resolution, extract colors, crop, compress, and edit metadata seamlessly.</p>
                        <div className="feature-tools-list">
                            <span className="feature-tool-tag">BG Remover</span>
                            <span className="feature-tool-tag">Upscale</span>
                            <span className="feature-tool-tag">Compress</span>
                            <span className="feature-tool-tag">+12 more</span>
                        </div>
                    </Link>

                    {/* Code Card */}
                    <Link to="/app/code" className="feature-card code">
                        <div className="feature-icon-wrapper">
                            <Code size={30} />
                        </div>
                        <h3>Developer Utilities</h3>
                        <p>Format JSON, decode JWTs, test regex, minify code, generate hashes, convert timestamps, and parse URLs instantly.</p>
                        <div className="feature-tools-list">
                            <span className="feature-tool-tag">JSON Formatter</span>
                            <span className="feature-tool-tag">JWT</span>
                            <span className="feature-tool-tag">Regex</span>
                            <span className="feature-tool-tag">+8 more</span>
                        </div>
                    </Link>

                    {/* Text Card */}
                    <Link to="/app/text" className="feature-card text">
                        <div className="feature-icon-wrapper">
                            <Type size={30} />
                        </div>
                        <h3>Text Tools</h3>
                        <p>Convert subtitle formats quickly between SRT, VTT, SUB, and ASS without breaking timings.</p>
                        <div className="feature-tools-list">
                            <span className="feature-tool-tag">VTT ↔ SRT</span>
                            <span className="feature-tool-tag">Subtitle format</span>
                        </div>
                    </Link>

                </div>
            </section>

            <footer className="home-footer">
                <p>Built with <Sparkles size={16} color="#38bdf8" fill="#38bdf8" /> natively in the browser.</p>
                <p style={{ marginTop: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>freeutils © {new Date().getFullYear()}</p>
            </footer>
        </div>
    );
}
