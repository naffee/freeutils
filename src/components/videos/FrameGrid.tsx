import { Download, DownloadCloud } from 'lucide-react';
import type { FrameData } from './VideoProcessor';

interface FrameGridProps {
    frames: FrameData[];
    onDownloadAll: () => void;
}

export function FrameGrid({ frames, onDownloadAll }: FrameGridProps) {
    if (frames.length === 0) return null;

    return (
        <div className="frame-grid-container">
            <div className="frame-grid-header">
                <h2>Extracted Frames ({frames.length})</h2>
                <button className="btn-primary" onClick={onDownloadAll}>
                    <DownloadCloud size={18} />
                    Download All as ZIP
                </button>
            </div>

            <div className="frame-grid">
                {frames.map((frame, index) => (
                    <div key={index} className="frame-item">
                        <img src={frame.url} alt={`Frame at ${frame.timestamp}s`} loading="lazy" />
                        <div className="frame-overlay">
                            <span className="frame-timestamp">{frame.timestamp.toFixed(2)}s</span>
                            <a href={frame.url} download={`frame_${index}.png`} className="btn-icon">
                                <Download size={20} />
                            </a>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
