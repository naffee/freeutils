import { Link } from 'react-router-dom';
import { Film, Music, Image as ImageIcon, Code, Type, ArrowRight, Sparkles } from 'lucide-react';
import './Home.css';
import { BrandLogo } from '../shared/BrandLogo';

export function Home() {
    return (
        <div className="home-container">
            <nav className="home-navbar">
                <BrandLogo className="home-logo" />
                <Link to="/app" className="home-nav-launch">
                    Launch App
                </Link>
            </nav>

            <section className="hero-section">
                <div className="hero-bg-blob"></div>
                <div className="hero-content">
                    <h1 className="hero-title">
                        Free Online Tools for <br />
                        <span className="hero-title-highlight">Media, Code, and Text</span>
                    </h1>
                    <p className="hero-subtitle">
                        Use free video, image, audio, code, and text utilities directly in your browser. No signup, no install, and privacy-first workflows for quick everyday tasks.
                    </p>
                    <Link to="/app" className="hero-cta">
                        <Sparkles size={20} />
                        Start Free
                        <ArrowRight size={20} />
                    </Link>
                </div>
            </section>

            <section className="features-section">
                <h2 className="section-title">Everything you need in one place</h2>
                <div className="features-grid">
                    <Link to="/app/videos" className="feature-card video">
                        <div className="feature-icon-wrapper">
                            <Film size={30} />
                        </div>
                        <h3>Video Tools</h3>
                        <p>Compress, trim, crop, extract frames, burn subtitles, stabilize, create karaoke, and more without sending your files to a server.</p>
                        <div className="feature-tools-list">
                            <span className="feature-tool-tag">Trim</span>
                            <span className="feature-tool-tag">Crop</span>
                            <span className="feature-tool-tag">Subtitles</span>
                            <span className="feature-tool-tag">Convert</span>
                            <span className="feature-tool-tag">+25 more</span>
                        </div>
                    </Link>

                    <Link to="/app/audio" className="feature-card audio">
                        <div className="feature-icon-wrapper">
                            <Music size={30} />
                        </div>
                        <h3>Audio Tools</h3>
                        <p>Convert audio formats, trim sound clips, merge tracks, and clean up speech directly in your browser without extra software.</p>
                        <div className="feature-tools-list">
                            <span className="feature-tool-tag">Convert</span>
                            <span className="feature-tool-tag">Merge</span>
                            <span className="feature-tool-tag">Speech</span>
                        </div>
                    </Link>

                    <Link to="/app/images" className="feature-card image">
                        <div className="feature-icon-wrapper">
                            <ImageIcon size={30} />
                        </div>
                        <h3>Image Tools</h3>
                        <p>Remove backgrounds, apply filters, upscale resolution, extract colors, crop, compress, and edit metadata with free browser-based tools.</p>
                        <div className="feature-tools-list">
                            <span className="feature-tool-tag">BG Remover</span>
                            <span className="feature-tool-tag">Upscale</span>
                            <span className="feature-tool-tag">Compress</span>
                            <span className="feature-tool-tag">+12 more</span>
                        </div>
                    </Link>

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

                    <Link to="/app/text" className="feature-card text">
                        <div className="feature-icon-wrapper">
                            <Type size={30} />
                        </div>
                        <h3>Text Tools</h3>
                        <p>Convert subtitle formats quickly between SRT, VTT, SUB, and ASS without breaking timings.</p>
                        <div className="feature-tools-list">
                            <span className="feature-tool-tag">VTT to SRT</span>
                            <span className="feature-tool-tag">Subtitle format</span>
                        </div>
                    </Link>
                </div>
            </section>

            <footer className="home-footer">
                <p>Free to use, browser-based, and no signup required.</p>
                <p style={{ marginTop: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>freeutils © {new Date().getFullYear()}</p>
            </footer>
        </div>
    );
}
