import { Upload } from 'lucide-react';
import React, { useState } from 'react';

interface DropzoneProps {
    onFileSelect: (file: File) => void;
    accept?: string;
    title?: string;
}

export function Dropzone({ onFileSelect, accept = "video/*", title = "Drag & Drop your video here" }: DropzoneProps) {
    const [isDragOver, setIsDragOver] = useState(false);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            const fileType = accept.split('/')[0];
            if (file.type.startsWith(`${fileType}/`) || accept === "*/*") {
                onFileSelect(file);
            } else {
                alert(`Please upload a valid ${fileType} file.`);
            }
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            onFileSelect(e.target.files[0]);
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
                hidden
            />
            <label htmlFor="file-upload" className="dropzone-label">
                <Upload className="upload-icon" size={48} />
                <span className="upload-title">{title}</span>
                <span className="upload-subtitle">or click to browse</span>
            </label>
        </div>
    );
}
