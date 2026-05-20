import { Upload } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface DropzoneProps {
    onFileSelect?: (file: File) => void;
    onFilesSelect?: (files: File[]) => void;
    accept?: string;
    title?: string;
    multiple?: boolean;
    allowFolder?: boolean;
}

export function Dropzone({ onFileSelect, onFilesSelect, accept = "video/*", title = "Drag & Drop your video here", multiple = false, allowFolder = false }: DropzoneProps) {
    const [isDragOver, setIsDragOver] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        // Check if a file was passed via router navigation
        if (location.state && location.state.incomingFile) {
            const passedFile = location.state.incomingFile;
            if (onFileSelect) onFileSelect(passedFile);
            if (onFilesSelect) onFilesSelect([passedFile]);

            // Clear the state so refreshing doesn't trigger it again
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location.state, navigate, location.pathname, onFileSelect, onFilesSelect]);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024; // 2GB

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const files = Array.from(e.dataTransfer.files);
            const fileType = accept.split('/')[0];
            
            const validFiles = files.filter(file => file.size <= MAX_FILE_SIZE && (file.type.startsWith(`${fileType}/`) || accept === "*/*"));
            
            if (validFiles.length < files.length) {
                alert(`Some files were skipped due to size limit (2GB) or invalid type.`);
            }

            if (validFiles.length > 0) {
                 if (multiple && onFilesSelect) {
                     onFilesSelect(validFiles);
                 } else if (onFileSelect) {
                     onFileSelect(validFiles[0]);
                 }
            }
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const files = Array.from(e.target.files);
            const fileType = accept.split('/')[0];
            
            const validFiles = files.filter(file => file.size <= MAX_FILE_SIZE && (file.type.startsWith(`${fileType}/`) || accept === "*/*"));

            if (validFiles.length < files.length) {
                alert(`Some files were skipped due to size limit (2GB) or invalid type.`);
            }

            if (validFiles.length > 0) {
                if (multiple && onFilesSelect) {
                    onFilesSelect(validFiles);
                } else if (onFileSelect) {
                    onFileSelect(validFiles[0]);
                }
            }
        }
    };

    return (
        <div
            className={`dropzone ${isDragOver ? 'drag-over' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <input
                type="file"
                accept={accept}
                id="file-upload"
                onChange={handleChange}
                multiple={multiple}
                hidden
            />
            <label htmlFor="file-upload" className="dropzone-label">
                <Upload className="upload-icon" size={48} />
                <span className="upload-title">{title}</span>
                <span className="upload-subtitle" style={{ display: 'flex', gap: '1rem', marginTop: '1rem', justifyContent: 'center' }}>
                    <span style={{ padding: '0.5rem 1rem', background: '#f1f5f9', borderRadius: '8px', border: '1px solid #cbd5e1', cursor: 'pointer', color: '#334155', fontWeight: 500 }}>
                        Browse Files
                    </span>
                    {allowFolder && (
                        <label className="btn-secondary" style={{ padding: '0.5rem 1rem', margin: 0, cursor: 'pointer', background: '#f1f5f9', borderRadius: '8px', border: '1px solid #cbd5e1', color: '#334155', fontWeight: 500 }}>
                            Browse Folder
                            <input
                                type="file"
                                accept={accept}
                                onChange={handleChange}
                                multiple
                                {...({ webkitdirectory: "", directory: "" } as any)}
                                hidden
                            />
                        </label>
                    )}
                </span>
            </label>
        </div>
    );
}
