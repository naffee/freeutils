import { useNavigate } from 'react-router-dom';
import { Scissors, FileImage, FastForward, Maximize, Crop, RefreshCcw } from 'lucide-react';

interface NextStepSuggestionsProps {
    fileUrl: string;
    fileName: string;
    fileType: 'video' | 'image' | 'audio' | 'text' | 'code';
}

export function NextStepSuggestions({ fileUrl, fileName, fileType }: NextStepSuggestionsProps) {
    const navigate = useNavigate();

    const handleSuggestionClick = async (route: string) => {
        try {
            // We need to fetch the blob from the URL to recreate a valid File object to pass
            const response = await fetch(fileUrl);
            const blob = await response.blob();

            // Reconstruct the file object
            const passedFile = new File([blob], fileName, { type: blob.type });

            // Navigate to the next route and pass the file securely via router state
            navigate(route, { state: { incomingFile: passedFile } });
        } catch (error) {
            console.error("Failed to prepare file for next step:", error);
            alert("Could not load file for the next step. Please download and upload manually.");
        }
    };

    if (fileType === 'video') {
        return (
            <div style={{ marginTop: '1.5rem', borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem' }}>
                <h4 style={{ margin: '0 0 1rem 0', color: '#0f172a', fontSize: '0.95rem' }}>Next Steps</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>

                    <button onClick={() => handleSuggestionClick('/app/videos/trim-video')} className="btn-secondary" style={{ padding: '0.5rem', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center', justifyContent: 'center', height: 'auto' }}>
                        <Scissors size={20} color="#3b82f6" />
                        Trim Video
                    </button>

                    <button onClick={() => handleSuggestionClick('/app/videos/compress-video')} className="btn-secondary" style={{ padding: '0.5rem', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center', justifyContent: 'center', height: 'auto' }}>
                        <RefreshCcw size={20} color="#10b981" />
                        Compress
                    </button>

                    <button onClick={() => handleSuggestionClick('/app/videos/change-video-speed')} className="btn-secondary" style={{ padding: '0.5rem', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center', justifyContent: 'center', height: 'auto' }}>
                        <FastForward size={20} color="#8b5cf6" />
                        Change Speed
                    </button>

                </div>
            </div>
        );
    }

    if (fileType === 'image') {
        return (
            <div style={{ marginTop: '1.5rem', borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem' }}>
                <h4 style={{ margin: '0 0 1rem 0', color: '#0f172a', fontSize: '0.95rem' }}>Next Steps</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>

                    <button onClick={() => handleSuggestionClick('/app/images/resize-image')} className="btn-secondary" style={{ padding: '0.5rem', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center', justifyContent: 'center', height: 'auto' }}>
                        <Maximize size={20} color="#3b82f6" />
                        Resize Image
                    </button>

                    <button onClick={() => handleSuggestionClick('/app/images/crop-image')} className="btn-secondary" style={{ padding: '0.5rem', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center', justifyContent: 'center', height: 'auto' }}>
                        <Crop size={20} color="#10b981" />
                        Crop Image
                    </button>

                    <button onClick={() => handleSuggestionClick('/app/images/compress-image')} className="btn-secondary" style={{ padding: '0.5rem', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center', justifyContent: 'center', height: 'auto' }}>
                        <FileImage size={20} color="#8b5cf6" />
                        Compress
                    </button>

                </div>
            </div>
        );
    }

    // Default empty return for other types for now
    return null;
}
