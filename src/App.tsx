import { lazy, Suspense, useEffect, type ComponentType } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Home } from './components/home/Home.tsx';
import { Film, Image as ImageIcon, Scissors, Music as MusicIcon, Code as CodeIcon } from 'lucide-react';
import './index.css';
import { SeoHead } from './seo/SeoHead';
import { SeoContent } from './seo/SeoContent';
import { NotFoundPage } from './components/shared/NotFoundPage';
import { BrandLogo } from './components/shared/BrandLogo';
import { domainLabels, getRouteMeta, getToolDisplayName, isDomain, toolMetaByDomain } from './seo/routeMeta';
import { ArrowRightLeft, Maximize, Zap, Repeat, RefreshCw, Layers, Tag, Sliders, Palette, Eraser, Sparkles, Brush, Smile, LayoutTemplate, ImagePlus, FastForward, VolumeX, Music, FileImage, RotateCw, History, Merge, Stamp, Volume2, FileAudio, Wand2, Type as TypeIcon, ScissorsSquare, Crop, Braces, Fingerprint, Search, Columns, Minimize2, ShieldCheck, Clock, Globe, Shield } from 'lucide-react';

type Domain = 'videos' | 'images' | 'audio' | 'code' | 'text';

const lazyNamed = <T extends Record<string, ComponentType<any>>>(
  loader: () => Promise<T>,
  key: keyof T,
) => lazy(async () => ({ default: (await loader())[key] }));

const VideoProcessor = lazyNamed(() => import('./components/videos/VideoProcessor'), 'VideoProcessor');
const VideoCompressor = lazyNamed(() => import('./components/videos/VideoCompressor.tsx'), 'VideoCompressor');
const VideoTrimmer = lazyNamed(() => import('./components/videos/VideoTrimmer.tsx'), 'VideoTrimmer');
const VideoResizer = lazyNamed(() => import('./components/videos/VideoResizer.tsx'), 'VideoResizer');
const VideoConverter = lazyNamed(() => import('./components/videos/VideoConverter.tsx'), 'VideoConverter');
const VideoThumbnailMaker = lazyNamed(() => import('./components/videos/VideoThumbnailMaker.tsx'), 'VideoThumbnailMaker');
const VideoSpeedChanger = lazyNamed(() => import('./components/videos/VideoSpeedChanger.tsx'), 'VideoSpeedChanger');
const VideoMuter = lazyNamed(() => import('./components/videos/VideoMuter.tsx'), 'VideoMuter');
const VideoAudioAdder = lazyNamed(() => import('./components/videos/VideoAudioAdder.tsx'), 'VideoAudioAdder');
const VideoToGif = lazyNamed(() => import('./components/videos/VideoToGif.tsx'), 'VideoToGif');
const VideoRotator = lazyNamed(() => import('./components/videos/VideoRotator.tsx'), 'VideoRotator');
const VideoReverser = lazyNamed(() => import('./components/videos/VideoReverser.tsx'), 'VideoReverser');
const VideoMerger = lazyNamed(() => import('./components/videos/VideoMerger.tsx'), 'VideoMerger');
const VideoSplitScreen = lazyNamed(() => import('./components/videos/VideoSplitScreen.tsx'), 'VideoSplitScreen');
const VideoWatermarkAdder = lazyNamed(() => import('./components/videos/VideoWatermarkAdder.tsx'), 'VideoWatermarkAdder');
const VideoVolumeChanger = lazyNamed(() => import('./components/videos/VideoVolumeChanger.tsx'), 'VideoVolumeChanger');
const AudioExtractor = lazyNamed(() => import('./components/videos/AudioExtractor.tsx'), 'AudioExtractor');
const VideoFilterAdder = lazyNamed(() => import('./components/videos/VideoFilterAdder.tsx'), 'VideoFilterAdder');
const VideoSubtitleBurner = lazyNamed(() => import('./components/videos/VideoSubtitleBurner.tsx'), 'VideoSubtitleBurner');
const VideoCropper = lazyNamed(() => import('./components/videos/VideoCropper.tsx'), 'VideoCropper');
const AudioConverter = lazyNamed(() => import('./components/audio/AudioConverter.tsx'), 'AudioConverter');
const AudioTrimmer = lazyNamed(() => import('./components/audio/AudioTrimmer.tsx'), 'AudioTrimmer');
const AudioMerger = lazyNamed(() => import('./components/audio/AudioMerger.tsx'), 'AudioMerger');
const JsonFormatter = lazyNamed(() => import('./components/code/JsonFormatter.tsx'), 'JsonFormatter');
const Base64Tool = lazyNamed(() => import('./components/code/Base64Tool.tsx'), 'Base64Tool');
const HashGenerator = lazyNamed(() => import('./components/code/HashGenerator.tsx'), 'HashGenerator');
const UuidGenerator = lazyNamed(() => import('./components/code/UuidGenerator.tsx'), 'UuidGenerator');
const RegexTester = lazyNamed(() => import('./components/code/RegexTester.tsx'), 'RegexTester');
const DiffChecker = lazyNamed(() => import('./components/code/DiffChecker.tsx'), 'DiffChecker');
const CodeMinifier = lazyNamed(() => import('./components/code/CodeMinifier.tsx'), 'CodeMinifier');
const CodePrettifier = lazyNamed(() => import('./components/code/CodePrettifier.tsx'), 'CodePrettifier');
const JwtDecoder = lazyNamed(() => import('./components/code/JwtDecoder.tsx'), 'JwtDecoder');
const TimestampConverter = lazyNamed(() => import('./components/code/TimestampConverter.tsx'), 'TimestampConverter');
const UrlTool = lazyNamed(() => import('./components/code/UrlTool.tsx'), 'UrlTool');
const CodeLinter = lazyNamed(() => import('./components/code/CodeLinter.tsx'), 'CodeLinter');
const SubtitleConverter = lazyNamed(() => import('./components/text/SubtitleConverter.tsx'), 'SubtitleConverter');
const ImageWatermarkRemover = lazyNamed(() => import('./components/images/ImageWatermarkRemover.tsx'), 'ImageWatermarkRemover');
const ImageCropper = lazyNamed(() => import('./components/images/ImageCropper.tsx'), 'ImageCropper');
const ImageResizer = lazyNamed(() => import('./components/images/ImageResizer.tsx'), 'ImageResizer');
const ImageCompressor = lazyNamed(() => import('./components/images/ImageCompressor.tsx'), 'ImageCompressor');
const ImageConverter = lazyNamed(() => import('./components/images/ImageConverter.tsx'), 'ImageConverter');
const ImageRotator = lazyNamed(() => import('./components/images/ImageRotator.tsx'), 'ImageRotator');
const ImageWatermarkAdder = lazyNamed(() => import('./components/images/ImageWatermarkAdder.tsx'), 'ImageWatermarkAdder');
const ImageMetadataEditor = lazyNamed(() => import('./components/images/ImageMetadataEditor.tsx'), 'ImageMetadataEditor');
const ImageFilters = lazyNamed(() => import('./components/images/ImageFilters.tsx'), 'ImageFilters');
const ImageAsciiArt = lazyNamed(() => import('./components/images/ImageAsciiArt.tsx'), 'ImageAsciiArt');
const ImageColorExtractor = lazyNamed(() => import('./components/images/ImageColorExtractor.tsx'), 'ImageColorExtractor');
const ImageBackgroundRemover = lazyNamed(() => import('./components/images/ImageBackgroundRemover.tsx'), 'ImageBackgroundRemover');
const ImageUpscaler = lazyNamed(() => import('./components/images/ImageUpscaler.tsx'), 'ImageUpscaler');
const ImageStylizer = lazyNamed(() => import('./components/images/ImageStylizer.tsx'), 'ImageStylizer');
const ImageMemeGenerator = lazyNamed(() => import('./components/images/ImageMemeGenerator.tsx'), 'ImageMemeGenerator');
const ImageScreenshotBeautifier = lazyNamed(() => import('./components/images/ImageScreenshotBeautifier.tsx'), 'ImageScreenshotBeautifier');


function ToolCatalog() {
  const { domain } = useParams<{ domain: string }>();
  const navigate = useNavigate();

  const activeDomain = domain as Domain || 'videos';
  const activeTool: string = '';

  return (
    <div className="app-container tool-catalog-page">
      <header className="header">
        <BrandLogo className="header-title" />

        {/* Domain Navigation */}
        <div className="tabs">
          <button
            className={`tab-btn ${activeDomain === 'videos' ? 'active' : ''}`}
            onClick={() => navigate('/app/videos')}
          >
            <Film size={18} /> Videos
          </button>
          <button
            className={`tab-btn ${activeDomain === 'audio' ? 'active' : ''}`}
            onClick={() => navigate('/app/audio')}
          >
            <MusicIcon size={18} /> Audio
          </button>
          <button
            className={`tab-btn ${activeDomain === 'code' ? 'active' : ''}`}
            onClick={() => navigate('/app/code')}
          >
            <CodeIcon size={18} /> Code
          </button>
          <button
            className={`tab-btn ${activeDomain === 'text' ? 'active' : ''}`}
            onClick={() => navigate('/app/text')}
          >
            <TypeIcon size={18} /> Text
          </button>
          <button
            className={`tab-btn ${activeDomain === 'images' ? 'active' : ''}`}
            onClick={() => navigate('/app/images')}
          >
            <ImageIcon size={18} /> Images
          </button>
        </div>
        <p>Select a utility from the {activeDomain} category</p>
      </header>

      <SeoContent domain={activeDomain} />

      <div className="sub-tools-nav">
        {activeDomain === 'videos' && (
          <div className="catalog-grid">
            <button
              className={`catalog-card ${activeTool === 'extract-frames-from-video' ? 'active' : ''}`}
              onClick={() => navigate('/app/videos/extract-frames-from-video')}
            >
              <div className="card-header"><ScissorsSquare size={16} /> <span>Extractor</span></div>
              <p className="card-desc">Extract high-quality images and frames from any video file instantly.</p>
            </button>
            <button
              className={`catalog-card ${activeTool === 'trim-video' ? 'active' : ''}`}
              onClick={() => navigate('/app/videos/trim-video')}
            >
              <div className="card-header"><Scissors size={16} /> <span>Trim Video</span></div>
              <p className="card-desc">Cut and trim video files precisely without losing original quality.</p>
            </button>
            <button
              className={`catalog-card ${activeTool === 'resize-video' ? 'active' : ''}`}
              onClick={() => navigate('/app/videos/resize-video')}
            >
              <div className="card-header"><Maximize size={16} /> <span>Resize</span></div>
              <p className="card-desc">Change video dimensions, resolution, and aspect ratio for any platform.</p>
            </button>
            <button
              className={`catalog-card ${activeTool === 'convert-video' ? 'active' : ''}`}
              onClick={() => navigate('/app/videos/convert-video')}
            >
              <div className="card-header"><ArrowRightLeft size={16} /> <span>Convert</span></div>
              <p className="card-desc">Convert videos between popular formats like MP4, WebM, and MOV.</p>
            </button>
            <button
              className={`catalog-card ${activeTool === 'compress-video' ? 'active' : ''}`}
              onClick={() => navigate('/app/videos/compress-video')}
            >
              <div className="card-header"><Minimize2 size={16} /> <span>Compress Video</span></div>
              <p className="card-desc">Reduce video file size online using efficient browser-based compression.</p>
            </button>
            <button
              className={`catalog-card ${activeTool === 'extract-video-thumbnail' ? 'active' : ''}`}
              onClick={() => navigate('/app/videos/extract-video-thumbnail')}
            >
              <div className="card-header"><ImagePlus size={16} /> <span>Extract Thumbnail</span></div>
              <p className="card-desc">Capture the perfect poster frame or thumbnail from your video content.</p>
            </button>
            <button
              className={`catalog-card ${activeTool === 'change-video-speed' ? 'active' : ''}`}
              onClick={() => navigate('/app/videos/change-video-speed')}
            >
              <div className="card-header"><FastForward size={16} /> <span>Change Speed</span></div>
              <p className="card-desc">Speed up or slow down videos to create timelapses or slow-motion effects.</p>
            </button>
            <button
              className={`catalog-card ${activeTool === 'mute-video' ? 'active' : ''}`}
              onClick={() => navigate('/app/videos/mute-video')}
            >
              <div className="card-header"><VolumeX size={16} /> <span>Mute Audio</span></div>
              <p className="card-desc">Remove the audio track from a video completely with one click.</p>
            </button>
            <button
              className={`catalog-card ${activeTool === 'add-audio-to-video' ? 'active' : ''}`}
              onClick={() => navigate('/app/videos/add-audio-to-video')}
            >
              <div className="card-header"><Music size={16} /> <span>Add Audio</span></div>
              <p className="card-desc">Overlay custom background music or sound effects onto your videos.</p>
            </button>
            <button
              className={`catalog-card ${activeTool === 'convert-video-to-gif' ? 'active' : ''}`}
              onClick={() => navigate('/app/videos/convert-video-to-gif')}
            >
              <div className="card-header"><FileImage size={16} /> <span>To GIF</span></div>
              <p className="card-desc">Turn any video clip into a looping animated GIF for easy sharing.</p>
            </button>
            <button
              className={`catalog-card ${activeTool === 'rotate-or-flip-video' ? 'active' : ''}`}
              onClick={() => navigate('/app/videos/rotate-or-flip-video')}
            >
              <div className="card-header"><RotateCw size={16} /> <span>Rotate / Flip</span></div>
              <p className="card-desc">Fix orientation issues by rotating or mirroring your video footage.</p>
            </button>
            <button
              className={`catalog-card ${activeTool === 'reverse-video' ? 'active' : ''}`}
              onClick={() => navigate('/app/videos/reverse-video')}
            >
              <div className="card-header"><History size={16} /> <span>Reverse</span></div>
              <p className="card-desc">Play your video backwards to create fun and engaging rewind effects.</p>
            </button>
            <button
              className={`catalog-card ${activeTool === 'merge-videos' ? 'active' : ''}`}
              onClick={() => navigate('/app/videos/merge-videos')}
            >
              <div className="card-header"><Merge size={16} /> <span>Merge</span></div>
              <p className="card-desc">Combine multiple video clips into a single continuous video effortlessly.</p>
            </button>
            <button
              className={`catalog-card ${activeTool === 'create-split-screen-video' ? 'active' : ''}`}
              onClick={() => navigate('/app/videos/create-split-screen-video')}
            >
              <div className="card-header"><Columns size={16} /> <span>Split Screen</span></div>
              <p className="card-desc">Place two videos or images side by side or stacked into one split-screen export.</p>
            </button>
            <button
              className={`catalog-card ${activeTool === 'add-watermark-to-video' ? 'active' : ''}`}
              onClick={() => navigate('/app/videos/add-watermark-to-video')}
            >
              <div className="card-header"><Stamp size={16} /> <span>Watermark</span></div>
              <p className="card-desc">Protect your content by adding custom image or text watermarks.</p>
            </button>
            <button
              className={`catalog-card ${activeTool === 'change-video-volume' ? 'active' : ''}`}
              onClick={() => navigate('/app/videos/change-video-volume')}
            >
              <div className="card-header"><Volume2 size={16} /> <span>Volume</span></div>
              <p className="card-desc">Increase or decrease the audio volume level of your video easily.</p>
            </button>
            <button
              className={`catalog-card ${activeTool === 'extract-audio-from-video' ? 'active' : ''}`}
              onClick={() => navigate('/app/videos/extract-audio-from-video')}
            >
              <div className="card-header"><FileAudio size={16} /> <span>Extract Audio</span></div>
              <p className="card-desc">Rip the audio track from any video and save it as an MP3 or WAV file.</p>
            </button>
            <button
              className={`catalog-card ${activeTool === 'add-filter-to-video' ? 'active' : ''}`}
              onClick={() => navigate('/app/videos/add-filter-to-video')}
            >
              <div className="card-header"><Wand2 size={16} /> <span>Add Filter</span></div>
              <p className="card-desc">Apply cinematic filters and color grading to your video instantly.</p>
            </button>
            <button
              className={`catalog-card ${activeTool === 'add-subtitles-to-video' ? 'active' : ''}`}
              onClick={() => navigate('/app/videos/add-subtitles-to-video')}
            >
              <div className="card-header"><TypeIcon size={16} /> <span>Add Subtitles</span></div>
              <p className="card-desc">Hardcode or burn SRT and VTT subtitles directly into your video.</p>
            </button>
            <button
              className={`catalog-card ${activeTool === 'crop-video' ? 'active' : ''}`}
              onClick={() => navigate('/app/videos/crop-video')}
            >
              <div className="card-header"><Crop size={16} /> <span>Crop Video</span></div>
              <p className="card-desc">Manually select and crop a specific region of your video frame.</p>
            </button>
          </div >
        )
        }

        {
          activeDomain === 'audio' && (
            <div className="catalog-grid">
              <button
                className={`catalog-card ${activeTool === 'convert-audio' ? 'active' : ''}`}
              onClick={() => navigate('/app/audio/convert-audio')}
              >
                <div className="card-header"><ArrowRightLeft size={16} /> <span>Audio Converter</span></div>
                <p className="card-desc">Convert audio files between various popular formats like MP3, WAV, and OGG instantly.</p>
              </button>
              <button
                className={`catalog-card ${activeTool === 'trim-audio' ? 'active' : ''}`}
              onClick={() => navigate('/app/audio/trim-audio')}
              >
                <div className="card-header"><Scissors size={16} /> <span>Audio Trimmer</span></div>
                <p className="card-desc">Cut and trim audio files with precision for ringtones, podcasts, or music loops.</p>
              </button>
              <button
                className={`catalog-card ${activeTool === 'merge-audio' ? 'active' : ''}`}
              onClick={() => navigate('/app/audio/merge-audio')}
              >
                <div className="card-header"><Layers size={16} /> <span>Merge Audio</span></div>
                <p className="card-desc">Combine multiple audio tracks seamlessly into a single continuous file.</p>
              </button>
            </div>
          )
        }

        {
          activeDomain === 'code' && (
            <div className="catalog-grid">
              <button
                className={`catalog-card ${activeTool === 'format-json' ? 'active' : ''}`}
              onClick={() => navigate('/app/code/format-json')}
              >
                <div className="card-header"><Braces size={16} /> <span>JSON Formatter</span></div>
                <p className="card-desc">Format, validate, minfy, and prettify JSON data easily.</p>
              </button>
              <button
                className={`catalog-card ${activeTool === 'base64-encode-decode' ? 'active' : ''}`}
              onClick={() => navigate('/app/code/base64-encode-decode')}
              >
                <div className="card-header"><ArrowRightLeft size={16} /> <span>Base64</span></div>
                <p className="card-desc">Encode and decode text or files to and from Base64 format.</p>
              </button>
              <button
                className={`catalog-card ${activeTool === 'generate-hash' ? 'active' : ''}`}
              onClick={() => navigate('/app/code/generate-hash')}
              >
                <div className="card-header"><Fingerprint size={16} /> <span>Hash Generator</span></div>
                <p className="card-desc">Generate secure cryptographic hashes like MD5, SHA-1, and SHA-256.</p>
              </button>
              <button
                className={`catalog-card ${activeTool === 'generate-uuid' ? 'active' : ''}`}
              onClick={() => navigate('/app/code/generate-uuid')}
              >
                <div className="card-header"><RefreshCw size={16} /> <span>UUID Generator</span></div>
                <p className="card-desc">Quickly generate bulk version 4 UUIDs (Universally Unique Identifiers).</p>
              </button>
              <button
                className={`catalog-card ${activeTool === 'test-regex' ? 'active' : ''}`}
              onClick={() => navigate('/app/code/test-regex')}
              >
                <div className="card-header"><Search size={16} /> <span>Regex Tester</span></div>
                <p className="card-desc">Test and debug your regular expressions against sample text data.</p>
              </button>
              <button
                className={`catalog-card ${activeTool === 'check-code-diff' ? 'active' : ''}`}
              onClick={() => navigate('/app/code/check-code-diff')}
              >
                <div className="card-header"><Columns size={16} /> <span>Diff Checker</span></div>
                <p className="card-desc">Compare two text documents or code snippets to find differences.</p>
              </button>
              <button
                className={`catalog-card ${activeTool === 'minify-code' ? 'active' : ''}`}
              onClick={() => navigate('/app/code/minify-code')}
              >
                <div className="card-header"><Minimize2 size={16} /> <span>Minifier</span></div>
                <p className="card-desc">Compress HTML, CSS, and JS code to reduce file size and loading times.</p>
              </button>
              <button
                className={`catalog-card ${activeTool === 'prettify-code' ? 'active' : ''}`}
              onClick={() => navigate('/app/code/prettify-code')}
              >
                <div className="card-header"><Wand2 size={16} /> <span>Code Prettifier</span></div>
                <p className="card-desc">Format unreadable source code into neat, correctly indented output.</p>
              </button>
              <button
                className={`catalog-card ${activeTool === 'decode-jwt' ? 'active' : ''}`}
              onClick={() => navigate('/app/code/decode-jwt')}
              >
                <div className="card-header"><ShieldCheck size={16} /> <span>JWT Decoder</span></div>
                <p className="card-desc">Decode, verify, and generate JSON Web Tokens securely locally.</p>
              </button>
              <button
                className={`catalog-card ${activeTool === 'convert-timestamp' ? 'active' : ''}`}
              onClick={() => navigate('/app/code/convert-timestamp')}
              >
                <div className="card-header"><Clock size={16} /> <span>Timestamp</span></div>
                <p className="card-desc">Convert epoch/Unix timestamps to human-readable dates and formats.</p>
              </button>
              <button
                className={`catalog-card ${activeTool === 'encode-decode-url' ? 'active' : ''}`}
              onClick={() => navigate('/app/code/encode-decode-url')}
              >
                <div className="card-header"><Globe size={16} /> <span>URL Tool</span></div>
                <p className="card-desc">Safely encode and decode URL strings and query parameters.</p>
              </button>
              <button
                className={`catalog-card ${activeTool === 'lint-code' ? 'active' : ''}`}
              onClick={() => navigate('/app/code/lint-code')}
              >
                <div className="card-header"><Shield size={16} /> <span>Linter</span></div>
                <p className="card-desc">Analyze your code for potential errors, bugs, and stylistic issues.</p>
              </button>
            </div >
          )
        }

        {
          activeDomain === 'text' && (
            <div className="domain-tools">
              <button
                className={`catalog-card ${activeTool === 'convert-subtitles' ? 'active' : ''}`}
              onClick={() => navigate('/app/text/convert-subtitles')}
              >
                <div className="card-header"><ArrowRightLeft size={16} /> <span>Subtitle Converter</span></div>
                <p className="card-desc">Convert subtitles between SRT, VTT, and ASS formats effortlessly.</p>
              </button>
            </div>
          )
        }

        {
          activeDomain === 'images' && (
            <div className="catalog-grid">
              <button
                className={`catalog-card ${activeTool === 'remove-image-watermark' ? 'active' : ''}`}
              onClick={() => navigate('/app/images/remove-image-watermark')}
              >
                <div className="card-header"><ImageIcon size={16} /> <span>Remove Watermark</span></div>
                <p className="card-desc">Automatically detect and remove distracting watermarks from any image.</p>
              </button>
              <button
                className={`catalog-card ${activeTool === 'add-image-watermark' ? 'active' : ''}`}
              onClick={() => navigate('/app/images/add-image-watermark')}
              >
                <div className="card-header"><Layers size={16} /> <span>Add Watermark</span></div>
                <p className="card-desc">Protect your photography with custom text or logo watermarks.</p>
              </button>
              <button
                className={`catalog-card ${activeTool === 'crop-image' ? 'active' : ''}`}
              onClick={() => navigate('/app/images/crop-image')}
              >
                <div className="card-header"><Crop size={16} /> <span>Crop Image</span></div>
                <p className="card-desc">Crop your photos to specific aspect ratios for social media platforms.</p>
              </button >
              <button
                className={`catalog-card ${activeTool === 'resize-image' ? 'active' : ''}`}
              onClick={() => navigate('/app/images/resize-image')}
              >
                <div className="card-header"><Maximize size={16} /> <span>Resize Image</span></div>
                <p className="card-desc">Change image dimensions quickly without distorting the original aspect ratio.</p>
              </button >
              <button
                className={`catalog-card ${activeTool === 'compress-image' ? 'active' : ''}`}
              onClick={() => navigate('/app/images/compress-image')}
              >
                <div className="card-header"><Zap size={16} /> <span>Compress Image</span></div>
                <p className="card-desc">Reduce image file size significantly while preserving visual quality.</p>
              </button >
              <button
                className={`catalog-card ${activeTool === 'convert-image' ? 'active' : ''}`}
              onClick={() => navigate('/app/images/convert-image')}
              >
                <div className="card-header"><Repeat size={16} /> <span>Convert Format</span></div>
                <p className="card-desc">Convert images between modern web formats like WebP, JPEG, and PNG.</p>
              </button >
              <button
                className={`catalog-card ${activeTool === 'rotate-or-flip-image' ? 'active' : ''}`}
              onClick={() => navigate('/app/images/rotate-or-flip-image')}
              >
                <div className="card-header"><RefreshCw size={16} /> <span>Rotate / Flip</span></div>
                <p className="card-desc">Fix incorrect image orientation by rotating or mirroring the picture.</p>
              </button >
              <button
                className={`catalog-card ${activeTool === 'edit-image-metadata' ? 'active' : ''}`}
              onClick={() => navigate('/app/images/edit-image-metadata')}
              >
                <div className="card-header"><Tag size={16} /> <span>Edit Metadata</span></div>
                <p className="card-desc">View, edit, or strip EXIF metadata from your digital photographs.</p>
              </button >
              <button
                className={`catalog-card ${activeTool === 'add-image-filters' ? 'active' : ''}`}
              onClick={() => navigate('/app/images/add-image-filters')}
              >
                <div className="card-header"><Sliders size={16} /> <span>Filters & Colors</span></div>
                <p className="card-desc">Apply beautiful photo filters and adjust brightness, contrast, and saturation.</p>
              </button >
              <button
                className={`catalog-card ${activeTool === 'convert-image-to-ascii' ? 'active' : ''}`}
              onClick={() => navigate('/app/images/convert-image-to-ascii')}
              >
                <div className="card-header"><TypeIcon size={16} /> <span>To ASCII Art</span></div>
                <p className="card-desc">Transform any colorful image into retro-style text-based ASCII art.</p>
              </button >
              <button
                className={`catalog-card ${activeTool === 'extract-image-colors' ? 'active' : ''}`}
              onClick={() => navigate('/app/images/extract-image-colors')}
              >
                <div className="card-header"><Palette size={16} /> <span>Color Extractor</span></div>
                <p className="card-desc">Extract the dominant color palette and hex codes from any image.</p>
              </button >
              <button
                className={`catalog-card ${activeTool === 'remove-image-background' ? 'active' : ''}`}
              onClick={() => navigate('/app/images/remove-image-background')}
              >
                <div className="card-header"><Eraser size={16} /> <span>Remove Background</span></div>
                <p className="card-desc">Instantly remove image backgrounds with a fast browser-based workflow.</p>
              </button >
              <button
                className={`catalog-card ${activeTool === 'upscale-image' ? 'active' : ''}`}
              onClick={() => navigate('/app/images/upscale-image')}
              >
                <div className="card-header"><Sparkles size={16} /> <span>Image Upscaler</span></div>
                <p className="card-desc">Upscale low-resolution images to crystal clear 4K without losing quality.</p>
              </button >
              <button
                className={`catalog-card ${activeTool === 'stylize-image' ? 'active' : ''}`}
              onClick={() => navigate('/app/images/stylize-image')}
              >
                <div className="card-header"><Brush size={16} /> <span>Stylizer (GPU)</span></div>
                <p className="card-desc">Apply stunning artistic styles to your photos using fast GPU processing.</p>
              </button >
              <button
                className={`catalog-card ${activeTool === 'generate-image-meme' ? 'active' : ''}`}
              onClick={() => navigate('/app/images/generate-image-meme')}
              >
                <div className="card-header"><Smile size={16} /> <span>Meme Generator</span></div>
                <p className="card-desc">Create hilarious custom memes by adding bold impact text to images.</p>
              </button >
              <button
                className={`catalog-card ${activeTool === 'beautify-screenshot' ? 'active' : ''}`}
              onClick={() => navigate('/app/images/beautify-screenshot')}
              >
                <div className="card-header"><LayoutTemplate size={16} /> <span>Beautifier</span></div>
                <p className="card-desc">Enhance your screenshots with beautiful backgrounds, shadows, and mockups.</p>
              </button>
            </div >
          )
        }
      </div >


    </div >
  );
}


function DedicatedToolPage() {
  const { domain, tool } = useParams<{ domain: string, tool: string }>();
  const navigate = useNavigate();

  const activeDomain = domain as Domain || 'videos';
  const activeTool = tool || 'extract-frames-from-video';
  const toolTitle = getToolDisplayName(activeTool);
  const routeMeta = getRouteMeta(`/app/${activeDomain}/${activeTool}`);
  const domainLabel = domainLabels[activeDomain];

  return (
    <div className="app-container dedicated-tool-page">
      <header className="dedicated-header">
        <div className="dedicated-header-left">
          <button
            className="tab-btn"
            style={{ padding: '0.5rem 0.9rem', fontSize: '0.9rem' }}
            onClick={() => navigate(`/app/${activeDomain}`)}
          >
            Back to Catalog
          </button>
          <div className="tool-brand-lockup">
            <BrandLogo className="header-title" size="sm" />
            <span className="tool-brand-divider" />
            <h2 style={{ fontSize: '1.1rem', margin: 0 }}>{toolTitle}</h2>
          </div>
        </div>

        <div className="tabs dedicated-header-right" style={{ margin: 0 }}>
          <button
            className={`tab-btn ${activeDomain === 'videos' ? 'active' : ''}`}
            onClick={() => navigate('/app/videos')}
          >
            <Film size={16} />
          </button>
          <button className={`tab-btn ${activeDomain === 'audio' ? 'active' : ''}`} onClick={() => navigate('/app/audio')}><MusicIcon size={16} /></button>
          <button className={`tab-btn ${activeDomain === 'code' ? 'active' : ''}`} onClick={() => navigate('/app/code')}><CodeIcon size={16} /></button>
          <button className={`tab-btn ${activeDomain === 'text' ? 'active' : ''}`} onClick={() => navigate('/app/text')}><TypeIcon size={16} /></button>
          <button className={`tab-btn ${activeDomain === 'images' ? 'active' : ''}`} onClick={() => navigate('/app/images')}><ImageIcon size={16} /></button>
        </div>
      </header>

      <main className="tool-page-main">
        <section className="dedicated-hero">
          <div className="dedicated-hero-copy">
            <p className="seo-eyebrow">{domainLabel} utility</p>
            <h1>{toolTitle}</h1>
            <p>{routeMeta.description}</p>
          </div>
          <div className="dedicated-hero-meta">
            <div className="tool-meta-card">
              <span className="tool-meta-label">Category</span>
              <strong>{domainLabel}</strong>
            </div>
            <div className="tool-meta-card">
              <span className="tool-meta-label">Workflow</span>
              <strong>Browser-based</strong>
            </div>
            <div className="tool-meta-card">
              <span className="tool-meta-label">Access</span>
              <strong>Free</strong>
            </div>
          </div>
        </section>

        <section className="tool-workspace">
          <div className="tool-workspace-header">
            <div>
              <p className="tool-workspace-kicker">Workspace</p>
              <h2>Use the tool</h2>
            </div>
            <button className="btn-secondary" onClick={() => navigate(`/app/${activeDomain}`)}>
              More {domainLabel} Tools
            </button>
          </div>

          <Suspense
            fallback={
              <div className="processing-container">
                <div className="loading-state">
                  <p>Loading tool workspace...</p>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: '100%' }} />
                  </div>
                </div>
              </div>
            }
          >
            {activeDomain === 'videos' && activeTool === 'extract-frames-from-video' && <VideoProcessor />}
            {activeDomain === 'videos' && activeTool === 'compress-video' && <VideoCompressor />}
            {activeDomain === 'videos' && activeTool === 'trim-video' && <VideoTrimmer />}
            {activeDomain === 'videos' && activeTool === 'resize-video' && <VideoResizer />}
            {activeDomain === 'videos' && activeTool === 'convert-video' && <VideoConverter />}
            {activeDomain === 'videos' && activeTool === 'extract-video-thumbnail' && <VideoThumbnailMaker />}
            {activeDomain === 'videos' && activeTool === 'change-video-speed' && <VideoSpeedChanger />}
            {activeDomain === 'videos' && activeTool === 'mute-video' && <VideoMuter />}
            {activeDomain === 'videos' && activeTool === 'add-audio-to-video' && <VideoAudioAdder />}
            {activeDomain === 'videos' && activeTool === 'convert-video-to-gif' && <VideoToGif />}
            {activeDomain === 'videos' && activeTool === 'rotate-or-flip-video' && <VideoRotator />}
            {activeDomain === 'videos' && activeTool === 'reverse-video' && <VideoReverser />}
            {activeDomain === 'videos' && activeTool === 'merge-videos' && <VideoMerger />}
            {activeDomain === 'videos' && activeTool === 'create-split-screen-video' && <VideoSplitScreen />}
            {activeDomain === 'videos' && activeTool === 'add-watermark-to-video' && <VideoWatermarkAdder />}
            {activeDomain === 'videos' && activeTool === 'change-video-volume' && <VideoVolumeChanger />}
            {activeDomain === 'videos' && activeTool === 'extract-audio-from-video' && <AudioExtractor />}
            {activeDomain === 'videos' && activeTool === 'add-filter-to-video' && <VideoFilterAdder />}
            {activeDomain === 'videos' && activeTool === 'add-subtitles-to-video' && <VideoSubtitleBurner />}
            {activeDomain === 'videos' && activeTool === 'crop-video' && <VideoCropper />}

            {activeDomain === 'audio' && activeTool === 'convert-audio' && <AudioConverter />}
            {activeDomain === 'audio' && activeTool === 'trim-audio' && <AudioTrimmer />}
            {activeDomain === 'audio' && activeTool === 'merge-audio' && <AudioMerger />}

            {activeDomain === 'code' && activeTool === 'format-json' && <JsonFormatter />}
            {activeDomain === 'code' && activeTool === 'base64-encode-decode' && <Base64Tool />}
            {activeDomain === 'code' && activeTool === 'generate-hash' && <HashGenerator />}
            {activeDomain === 'code' && activeTool === 'generate-uuid' && <UuidGenerator />}
            {activeDomain === 'code' && activeTool === 'test-regex' && <RegexTester />}
            {activeDomain === 'code' && activeTool === 'check-code-diff' && <DiffChecker />}
            {activeDomain === 'code' && activeTool === 'minify-code' && <CodeMinifier />}
            {activeDomain === 'code' && activeTool === 'prettify-code' && <CodePrettifier />}
            {activeDomain === 'code' && activeTool === 'decode-jwt' && <JwtDecoder />}
            {activeDomain === 'code' && activeTool === 'convert-timestamp' && <TimestampConverter />}
            {activeDomain === 'code' && activeTool === 'encode-decode-url' && <UrlTool />}
            {activeDomain === 'code' && activeTool === 'lint-code' && <CodeLinter />}

            {activeDomain === 'text' && activeTool === 'convert-subtitles' && <SubtitleConverter />}

            {activeDomain === 'images' && activeTool === 'remove-image-watermark' && <ImageWatermarkRemover />}
            {activeDomain === 'images' && activeTool === 'add-image-watermark' && <ImageWatermarkAdder />}
            {activeDomain === 'images' && activeTool === 'crop-image' && <ImageCropper />}
            {activeDomain === 'images' && activeTool === 'resize-image' && <ImageResizer />}
            {activeDomain === 'images' && activeTool === 'compress-image' && <ImageCompressor />}
            {activeDomain === 'images' && activeTool === 'convert-image' && <ImageConverter />}
            {activeDomain === 'images' && activeTool === 'rotate-or-flip-image' && <ImageRotator />}
            {activeDomain === 'images' && activeTool === 'edit-image-metadata' && <ImageMetadataEditor />}
            {activeDomain === 'images' && activeTool === 'add-image-filters' && <ImageFilters />}
            {activeDomain === 'images' && activeTool === 'convert-image-to-ascii' && <ImageAsciiArt />}
            {activeDomain === 'images' && activeTool === 'extract-image-colors' && <ImageColorExtractor />}
            {activeDomain === 'images' && activeTool === 'remove-image-background' && <ImageBackgroundRemover />}
            {activeDomain === 'images' && activeTool === 'upscale-image' && <ImageUpscaler />}
            {activeDomain === 'images' && activeTool === 'stylize-image' && <ImageStylizer />}
            {activeDomain === 'images' && activeTool === 'generate-image-meme' && <ImageMemeGenerator />}
            {activeDomain === 'images' && activeTool === 'beautify-screenshot' && <ImageScreenshotBeautifier />}
          </Suspense>

        </section>

        <SeoContent domain={activeDomain} tool={activeTool} />
      </main>
    </div>
  );
}


// Intercept routing logic
function RouteHandler() {
  const { domain, tool } = useParams();

  if (!domain) {
    return <Navigate to="/app/videos" replace />;
  }

  if (!isDomain(domain)) {
    return <NotFoundPage />;
  }

  // If there's no tool, show the catalog for the domain
  if (!tool) {
    return <ToolCatalog />;
  }

  if (!(tool in toolMetaByDomain[domain])) {
    return <NotFoundPage />;
  }

  return <DedicatedToolPage />;
}

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    const scrollToStart = () => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };

    scrollToStart();

    const frame = window.requestAnimationFrame(scrollToStart);

    return () => window.cancelAnimationFrame(frame);
  }, [pathname]);

  return null;
}

function AppRouter() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <SeoHead />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/app" element={<RouteHandler />} />
        <Route path="/app/:domain" element={<RouteHandler />} />
        <Route path="/app/:domain/:tool" element={<RouteHandler />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;
