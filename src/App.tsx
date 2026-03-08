import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom';
import { Home } from './components/home/Home.tsx';
import { Film, Image as ImageIcon, Server, Scissors, Music as MusicIcon, Code as CodeIcon } from 'lucide-react';
import './index.css';
import { VideoProcessor } from './components/videos/VideoProcessor';
import { VideoCompressor } from './components/videos/VideoCompressor.tsx';
import { VideoTrimmer } from './components/videos/VideoTrimmer.tsx';
import { VideoResizer } from './components/videos/VideoResizer.tsx';
import { VideoConverter } from './components/videos/VideoConverter.tsx';
import { VideoThumbnailMaker } from './components/videos/VideoThumbnailMaker.tsx';
import { VideoSpeedChanger } from './components/videos/VideoSpeedChanger.tsx';
import { VideoMuter } from './components/videos/VideoMuter.tsx';
import { VideoAudioAdder } from './components/videos/VideoAudioAdder.tsx';
import { VideoToGif } from './components/videos/VideoToGif.tsx';
import { VideoRotator } from './components/videos/VideoRotator.tsx';
import { VideoReverser } from './components/videos/VideoReverser.tsx';
import { VideoMerger } from './components/videos/VideoMerger.tsx';
import { VideoWatermarkAdder } from './components/videos/VideoWatermarkAdder.tsx';
import { VideoVolumeChanger } from './components/videos/VideoVolumeChanger.tsx';
import { AudioExtractor } from './components/videos/AudioExtractor.tsx';
import { VideoFilterAdder } from './components/videos/VideoFilterAdder.tsx';
import { VideoSubtitleBurner } from './components/videos/VideoSubtitleBurner.tsx';
import { VideoStabilizer } from './components/videos/VideoStabilizer.tsx';
import { VideoNoiseReducer } from './components/videos/VideoNoiseReducer.tsx';
import { VideoInterpolator } from './components/videos/VideoInterpolator.tsx';
import { VideoSceneSplitter } from './components/videos/VideoSceneSplitter.tsx';
import { VideoDeflicker } from './components/videos/VideoDeflicker.tsx';
import { VideoAutoCrop } from './components/videos/VideoAutoCrop.tsx';
import { VideoCropper } from './components/videos/VideoCropper.tsx';
import { VideoKaraokeMaker } from './components/videos/VideoKaraokeMaker.tsx';
import { VideoFaceSwapper } from './components/videos/VideoFaceSwapper.tsx';
import { VideoSubtitleRemover } from './components/videos/VideoSubtitleRemover.tsx';
import { MediaTranslator } from './components/videos/MediaTranslator.tsx';
import { VideoSpeechEnhancer } from './components/videos/VideoSpeechEnhancer.tsx';
import { AudioConverter } from './components/audio/AudioConverter.tsx';
import { AudioTrimmer } from './components/audio/AudioTrimmer.tsx';
import { AudioMerger } from './components/audio/AudioMerger.tsx';
import { JsonFormatter } from './components/code/JsonFormatter.tsx';
import { Base64Tool } from './components/code/Base64Tool.tsx';
import { HashGenerator } from './components/code/HashGenerator.tsx';
import { UuidGenerator } from './components/code/UuidGenerator.tsx';
import { RegexTester } from './components/code/RegexTester.tsx';
import { DiffChecker } from './components/code/DiffChecker.tsx';
import { CodeMinifier } from './components/code/CodeMinifier.tsx';
import { CodePrettifier } from './components/code/CodePrettifier.tsx';
import { JwtDecoder } from './components/code/JwtDecoder.tsx';
import { TimestampConverter } from './components/code/TimestampConverter.tsx';
import { UrlTool } from './components/code/UrlTool.tsx';
import { CodeLinter } from './components/code/CodeLinter.tsx';
import { SubtitleConverter } from './components/text/SubtitleConverter.tsx';
import { ImageWatermarkRemover } from './components/images/ImageWatermarkRemover.tsx';
import { ImageCropper } from './components/images/ImageCropper.tsx';
import { ImageResizer } from './components/images/ImageResizer.tsx';
import { ImageCompressor } from './components/images/ImageCompressor.tsx';
import { ImageConverter } from './components/images/ImageConverter.tsx';
import { ImageRotator } from './components/images/ImageRotator.tsx';
import { ImageWatermarkAdder } from './components/images/ImageWatermarkAdder.tsx';
import { ImageMetadataEditor } from './components/images/ImageMetadataEditor.tsx';
import { ImageFilters } from './components/images/ImageFilters.tsx';
import { ImageAsciiArt } from './components/images/ImageAsciiArt.tsx';
import { ImageColorExtractor } from './components/images/ImageColorExtractor.tsx';
import { ImageBackgroundRemover } from './components/images/ImageBackgroundRemover.tsx';
import { ImageUpscaler } from './components/images/ImageUpscaler.tsx';
import { ImageStylizer } from './components/images/ImageStylizer.tsx';
import { ImageMemeGenerator } from './components/images/ImageMemeGenerator.tsx';
import { ImageScreenshotBeautifier } from './components/images/ImageScreenshotBeautifier.tsx';
import { ArrowRightLeft, Maximize, Zap, Repeat, RefreshCw, Layers, Tag, Sliders, Palette, Eraser, Sparkles, Brush, Smile, LayoutTemplate, ImagePlus, FastForward, VolumeX, Music, FileImage, RotateCw, History, Merge, Stamp, Volume2, FileAudio, Wand2, Type as TypeIcon, Waves, MicOff, Zap as ZapIcon, ScissorsSquare, LightbulbOff, Crop, Mic2, Braces, Fingerprint, Search, Columns, Minimize2, ShieldCheck, Clock, Globe, Shield } from 'lucide-react';

type Domain = 'videos' | 'images' | 'audio' | 'code' | 'text';


function ToolCatalog() {
  const { domain } = useParams<{ domain: string }>();
  const navigate = useNavigate();

  const activeDomain = domain as Domain || 'videos';
  const activeTool: string = '';

  return (
    <div className="app-container tool-catalog-page">
      <header className="header">
        <div className="header-title">
          <Film size={32} color="#8b5cf6" />
          <h1>freeutils</h1>
        </div>

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

      <div className="sub-tools-nav">
        {activeDomain === 'videos' && (
          <div className="catalog-grid">
            <button
              className={`catalog-card ${activeTool === 'frames' ? 'active' : ''}`}
              onClick={() => navigate('/app/videos/frames')}
            >
              <div className="card-header"><ScissorsSquare size={16} /> <span>Extractor</span></div>
              <p className="card-desc">Extract high-quality images and frames from any video file instantly.</p>
            </button>
            <button
              className={`catalog-card ${activeTool === 'trim' ? 'active' : ''}`}
              onClick={() => navigate('/app/videos/trim')}
            >
              <div className="card-header"><Scissors size={16} /> <span>Trim Video</span></div>
              <p className="card-desc">Cut and trim video files precisely without losing original quality.</p>
            </button>
            <button
              className={`catalog-card ${activeTool === 'resize' ? 'active' : ''}`}
              onClick={() => navigate('/app/videos/resize')}
            >
              <div className="card-header"><Maximize size={16} /> <span>Resize</span></div>
              <p className="card-desc">Change video dimensions, resolution, and aspect ratio for any platform.</p>
            </button>
            <button
              className={`catalog-card ${activeTool === 'convert' ? 'active' : ''}`}
              onClick={() => navigate('/app/videos/convert')}
            >
              <div className="card-header"><ArrowRightLeft size={16} /> <span>Convert</span></div>
              <p className="card-desc">Convert videos between popular formats like MP4, WebM, and MOV.</p>
            </button>
            <button
              className={`catalog-card ${activeTool === 'compress' ? 'active' : ''}`}
              onClick={() => navigate('/app/videos/compress')}
            >
              <div className="card-header"><Server size={16} /> <span>Server Compression</span></div>
              <p className="card-desc">Reduce video file size significantly using advanced server-side algorithms.</p>
            </button>
            <button
              className={`catalog-card ${activeTool === 'thumbnail' ? 'active' : ''}`}
              onClick={() => navigate('/app/videos/thumbnail')}
            >
              <div className="card-header"><ImagePlus size={16} /> <span>Extract Thumbnail</span></div>
              <p className="card-desc">Capture the perfect poster frame or thumbnail from your video content.</p>
            </button>
            <button
              className={`catalog-card ${activeTool === 'speed' ? 'active' : ''}`}
              onClick={() => navigate('/app/videos/speed')}
            >
              <div className="card-header"><FastForward size={16} /> <span>Change Speed</span></div>
              <p className="card-desc">Speed up or slow down videos to create timelapses or slow-motion effects.</p>
            </button>
            <button
              className={`catalog-card ${activeTool === 'mute' ? 'active' : ''}`}
              onClick={() => navigate('/app/videos/mute')}
            >
              <div className="card-header"><VolumeX size={16} /> <span>Mute Audio</span></div>
              <p className="card-desc">Remove the audio track from a video completely with one click.</p>
            </button>
            <button
              className={`catalog-card ${activeTool === 'audio' ? 'active' : ''}`}
              onClick={() => navigate('/app/videos/audio')}
            >
              <div className="card-header"><Music size={16} /> <span>Add Audio</span></div>
              <p className="card-desc">Overlay custom background music or sound effects onto your videos.</p>
            </button>
            <button
              className={`catalog-card ${activeTool === 'gif' ? 'active' : ''}`}
              onClick={() => navigate('/app/videos/gif')}
            >
              <div className="card-header"><FileImage size={16} /> <span>To GIF</span></div>
              <p className="card-desc">Turn any video clip into a looping animated GIF for easy sharing.</p>
            </button>
            <button
              className={`catalog-card ${activeTool === 'rotate' ? 'active' : ''}`}
              onClick={() => navigate('/app/videos/rotate')}
            >
              <div className="card-header"><RotateCw size={16} /> <span>Rotate / Flip</span></div>
              <p className="card-desc">Fix orientation issues by rotating or mirroring your video footage.</p>
            </button>
            <button
              className={`catalog-card ${activeTool === 'reverse' ? 'active' : ''}`}
              onClick={() => navigate('/app/videos/reverse')}
            >
              <div className="card-header"><History size={16} /> <span>Reverse</span></div>
              <p className="card-desc">Play your video backwards to create fun and engaging rewind effects.</p>
            </button>
            <button
              className={`catalog-card ${activeTool === 'merge' ? 'active' : ''}`}
              onClick={() => navigate('/app/videos/merge')}
            >
              <div className="card-header"><Merge size={16} /> <span>Merge</span></div>
              <p className="card-desc">Combine multiple video clips into a single continuous video effortlessly.</p>
            </button>
            <button
              className={`catalog-card ${activeTool === 'watermark' ? 'active' : ''}`}
              onClick={() => navigate('/app/videos/watermark')}
            >
              <div className="card-header"><Stamp size={16} /> <span>Watermark</span></div>
              <p className="card-desc">Protect your content by adding custom image or text watermarks.</p>
            </button>
            <button
              className={`catalog-card ${activeTool === 'volume' ? 'active' : ''}`}
              onClick={() => navigate('/app/videos/volume')}
            >
              <div className="card-header"><Volume2 size={16} /> <span>Volume</span></div>
              <p className="card-desc">Increase or decrease the audio volume level of your video easily.</p>
            </button>
            <button
              className={`catalog-card ${activeTool === 'extractAudio' ? 'active' : ''}`}
              onClick={() => navigate('/app/videos/extractAudio')}
            >
              <div className="card-header"><FileAudio size={16} /> <span>Extract Audio</span></div>
              <p className="card-desc">Rip the audio track from any video and save it as an MP3 or WAV file.</p>
            </button>
            <button
              className={`catalog-card ${activeTool === 'filter' ? 'active' : ''}`}
              onClick={() => navigate('/app/videos/filter')}
            >
              <div className="card-header"><Wand2 size={16} /> <span>Add Filter</span></div>
              <p className="card-desc">Apply cinematic filters and color grading to your video instantly.</p>
            </button>
            <button
              className={`catalog-card ${activeTool === 'subtitles' ? 'active' : ''}`}
              onClick={() => navigate('/app/videos/subtitles')}
            >
              <div className="card-header"><TypeIcon size={16} /> <span>Add Subtitles</span></div>
              <p className="card-desc">Hardcode or burn SRT and VTT subtitles directly into your video.</p>
            </button>
            <button
              className={`catalog-card ${activeTool === 'stabilize' ? 'active' : ''}`}
              onClick={() => navigate('/app/videos/stabilize')}
            >
              <div className="card-header"><Waves size={16} /> <span>Stabilize</span></div>
              <p className="card-desc">Fix shaky camera movements and smooth out unstable video footage.</p>
            </button>
            <button
              className={`catalog-card ${activeTool === 'noiseReducer' ? 'active' : ''}`}
              onClick={() => navigate('/app/videos/noiseReducer')}
            >
              <div className="card-header"><MicOff size={16} /> <span>Noise Reduction</span></div>
              <p className="card-desc">Clean up background noise and isolate vocals using advanced AI.</p>
            </button>
            <button
              className={`catalog-card ${activeTool === 'interpolate' ? 'active' : ''}`}
              onClick={() => navigate('/app/videos/interpolate')}
            >
              <div className="card-header"><ZapIcon size={16} /> <span>Smooth Motion</span></div>
              <p className="card-desc">Interpolate frames to convert 30fps video into ultra-smooth 60fps.</p>
            </button>
            <button
              className={`catalog-card ${activeTool === 'sceneSplitter' ? 'active' : ''}`}
              onClick={() => navigate('/app/videos/sceneSplitter')}
            >
              <div className="card-header"><ScissorsSquare size={16} /> <span>Auto Scene Split</span></div>
              <p className="card-desc">Automatically detect scene changes and split your video into parts.</p>
            </button>
            <button
              className={`catalog-card ${activeTool === 'deflicker' ? 'active' : ''}`}
              onClick={() => navigate('/app/videos/deflicker')}
            >
              <div className="card-header"><LightbulbOff size={16} /> <span>Antiflicker</span></div>
              <p className="card-desc">Remove lighting flicker and strobe effects from your slow-motion footage.</p>
            </button>
            <button
              className={`catalog-card ${activeTool === 'autocrop' ? 'active' : ''}`}
              onClick={() => navigate('/app/videos/autocrop')}
            >
              <div className="card-header"><Crop size={16} /> <span>Auto-Crop</span></div>
              <p className="card-desc">Use AI tracking to automatically keep the main subject in frame.</p>
            </button>
            <button
              className={`catalog-card ${activeTool === 'crop' ? 'active' : ''}`}
              onClick={() => navigate('/app/videos/crop')}
            >
              <div className="card-header"><Crop size={16} /> <span>Crop Video</span></div>
              <p className="card-desc">Manually select and crop a specific region of your video frame.</p>
            </button>
            <button
              className={`catalog-card ${activeTool === 'karaoke' ? 'active' : ''}`}
              onClick={() => navigate('/app/videos/karaoke')}
            >
              <div className="card-header"><Mic2 size={16} /> <span>Karaoke Maker</span></div>
              <p className="card-desc">Remove vocals from music videos to create custom karaoke tracks.</p>
            </button>
            <button
              className={`catalog-card ${activeTool === 'faceSwap' ? 'active' : ''}`}
              onClick={() => navigate('/app/videos/faceSwap')}
            >
              <div className="card-header"><Sparkles size={16} /> <span>Face Swapper</span></div>
              <p className="card-desc">Seamlessly swap faces in any video using state-of-the-art AI technology.</p>
            </button>
            <button
              className={`catalog-card ${activeTool === 'removeSubtitles' ? 'active' : ''}`}
              onClick={() => navigate('/app/videos/removeSubtitles')}
            >
              <div className="card-header"><Eraser size={16} /> <span>Remove Subtitles</span></div>
              <p className="card-desc">Erase hardcoded subtitles and watermarks from your videos cleanly.</p>
            </button>
            <button
              className={`catalog-card ${activeTool === 'translate' ? 'active' : ''}`}
              onClick={() => navigate('/app/videos/translate')}
            >
              <div className="card-header"><Globe size={16} /> <span>Translate Media</span></div>
              <p className="card-desc">Transcribe, translate, and re-dub your videos in over 50 languages.</p>
            </button>
            <button
              className={`catalog-card ${activeTool === 'enhanceSpeech' ? 'active' : ''}`}
              onClick={() => navigate('/app/videos/enhanceSpeech')}
            >
              <div className="card-header"><Sparkles size={16} /> <span>AI Speech Enhancer</span></div>
              <p className="card-desc">Restore poor audio quality and enhance voices to studio grade.</p>
            </button>
          </div >
        )
        }

        {
          activeDomain === 'audio' && (
            <div className="catalog-grid">
              <button
                className={`catalog-card ${activeTool === 'convert' ? 'active' : ''}`}
                onClick={() => navigate('/app/audio/convert')}
              >
                <div className="card-header"><ArrowRightLeft size={16} /> <span>Audio Converter</span></div>
                <p className="card-desc">Convert audio files between various popular formats like MP3, WAV, and OGG instantly.</p>
              </button>
              <button
                className={`catalog-card ${activeTool === 'trim' ? 'active' : ''}`}
                onClick={() => navigate('/app/audio/trim')}
              >
                <div className="card-header"><Scissors size={16} /> <span>Audio Trimmer</span></div>
                <p className="card-desc">Cut and trim audio files with precision for ringtones, podcasts, or music loops.</p>
              </button>
              <button
                className={`catalog-card ${activeTool === 'merge' ? 'active' : ''}`}
                onClick={() => navigate('/app/audio/merge')}
              >
                <div className="card-header"><Layers size={16} /> <span>Merge Audio</span></div>
                <p className="card-desc">Combine multiple audio tracks seamlessly into a single continuous file.</p>
              </button>
              <button
                className={`catalog-card ${activeTool === 'enhanceSpeech' ? 'active' : ''}`}
                onClick={() => navigate('/app/audio/enhanceSpeech')}
              >
                <div className="card-header"><Sparkles size={16} /> <span>AI Restore Speech</span></div>
                <p className="card-desc">Enhance voice clarity and remove background noise for professional audio quality.</p>
              </button>
            </div >
          )
        }

        {
          activeDomain === 'code' && (
            <div className="catalog-grid">
              <button
                className={`catalog-card ${activeTool === 'jsonFormatter' ? 'active' : ''}`}
                onClick={() => navigate('/app/code/jsonFormatter')}
              >
                <div className="card-header"><Braces size={16} /> <span>JSON Formatter</span></div>
                <p className="card-desc">Format, validate, minfy, and prettify JSON data easily.</p>
              </button>
              <button
                className={`catalog-card ${activeTool === 'base64' ? 'active' : ''}`}
                onClick={() => navigate('/app/code/base64')}
              >
                <div className="card-header"><ArrowRightLeft size={16} /> <span>Base64</span></div>
                <p className="card-desc">Encode and decode text or files to and from Base64 format.</p>
              </button>
              <button
                className={`catalog-card ${activeTool === 'hashGenerator' ? 'active' : ''}`}
                onClick={() => navigate('/app/code/hashGenerator')}
              >
                <div className="card-header"><Fingerprint size={16} /> <span>Hash Generator</span></div>
                <p className="card-desc">Generate secure cryptographic hashes like MD5, SHA-1, and SHA-256.</p>
              </button>
              <button
                className={`catalog-card ${activeTool === 'uuid' ? 'active' : ''}`}
                onClick={() => navigate('/app/code/uuid')}
              >
                <div className="card-header"><RefreshCw size={16} /> <span>UUID Generator</span></div>
                <p className="card-desc">Quickly generate bulk version 4 UUIDs (Universally Unique Identifiers).</p>
              </button>
              <button
                className={`catalog-card ${activeTool === 'regex' ? 'active' : ''}`}
                onClick={() => navigate('/app/code/regex')}
              >
                <div className="card-header"><Search size={16} /> <span>Regex Tester</span></div>
                <p className="card-desc">Test and debug your regular expressions against sample text data.</p>
              </button>
              <button
                className={`catalog-card ${activeTool === 'diff' ? 'active' : ''}`}
                onClick={() => navigate('/app/code/diff')}
              >
                <div className="card-header"><Columns size={16} /> <span>Diff Checker</span></div>
                <p className="card-desc">Compare two text documents or code snippets to find differences.</p>
              </button>
              <button
                className={`catalog-card ${activeTool === 'minifier' ? 'active' : ''}`}
                onClick={() => navigate('/app/code/minifier')}
              >
                <div className="card-header"><Minimize2 size={16} /> <span>Minifier</span></div>
                <p className="card-desc">Compress HTML, CSS, and JS code to reduce file size and loading times.</p>
              </button>
              <button
                className={`catalog-card ${activeTool === 'prettifier' ? 'active' : ''}`}
                onClick={() => navigate('/app/code/prettifier')}
              >
                <div className="card-header"><Wand2 size={16} /> <span>Code Prettifier</span></div>
                <p className="card-desc">Format unreadable source code into neat, correctly indented output.</p>
              </button>
              <button
                className={`catalog-card ${activeTool === 'jwt' ? 'active' : ''}`}
                onClick={() => navigate('/app/code/jwt')}
              >
                <div className="card-header"><ShieldCheck size={16} /> <span>JWT Decoder</span></div>
                <p className="card-desc">Decode, verify, and generate JSON Web Tokens securely locally.</p>
              </button>
              <button
                className={`catalog-card ${activeTool === 'timestamp' ? 'active' : ''}`}
                onClick={() => navigate('/app/code/timestamp')}
              >
                <div className="card-header"><Clock size={16} /> <span>Timestamp</span></div>
                <p className="card-desc">Convert epoch/Unix timestamps to human-readable dates and formats.</p>
              </button>
              <button
                className={`catalog-card ${activeTool === 'url' ? 'active' : ''}`}
                onClick={() => navigate('/app/code/url')}
              >
                <div className="card-header"><Globe size={16} /> <span>URL Tool</span></div>
                <p className="card-desc">Safely encode and decode URL strings and query parameters.</p>
              </button>
              <button
                className={`catalog-card ${activeTool === 'linter' ? 'active' : ''}`}
                onClick={() => navigate('/app/code/linter')}
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
                className={`catalog-card ${activeTool === 'subtitleConverter' ? 'active' : ''}`}
                onClick={() => navigate('/app/text/subtitleConverter')}
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
                className={`catalog-card ${activeTool === 'watermarkRemover' ? 'active' : ''}`}
                onClick={() => navigate('/app/images/watermarkRemover')}
              >
                <div className="card-header"><ImageIcon size={16} /> <span>Remove Watermark</span></div>
                <p className="card-desc">Automatically detect and remove distracting watermarks from any image.</p>
              </button>
              <button
                className={`catalog-card ${activeTool === 'watermarkAdder' ? 'active' : ''}`}
                onClick={() => navigate('/app/images/watermarkAdder')}
              >
                <div className="card-header"><Layers size={16} /> <span>Add Watermark</span></div>
                <p className="card-desc">Protect your photography with custom text or logo watermarks.</p>
              </button>
              <button
                className={`catalog-card ${activeTool === 'crop' ? 'active' : ''}`}
                onClick={() => navigate('/app/images/crop')}
              >
                <div className="card-header"><Crop size={16} /> <span>Crop Image</span></div>
                <p className="card-desc">Crop your photos to specific aspect ratios for social media platforms.</p>
              </button >
              <button
                className={`catalog-card ${activeTool === 'resize' ? 'active' : ''}`}
                onClick={() => navigate('/app/images/resize')}
              >
                <div className="card-header"><Maximize size={16} /> <span>Resize Image</span></div>
                <p className="card-desc">Change image dimensions quickly without distorting the original aspect ratio.</p>
              </button >
              <button
                className={`catalog-card ${activeTool === 'compress' ? 'active' : ''}`}
                onClick={() => navigate('/app/images/compress')}
              >
                <div className="card-header"><Zap size={16} /> <span>Compress Image</span></div>
                <p className="card-desc">Reduce image file size significantly while preserving visual quality.</p>
              </button >
              <button
                className={`catalog-card ${activeTool === 'convert' ? 'active' : ''}`}
                onClick={() => navigate('/app/images/convert')}
              >
                <div className="card-header"><Repeat size={16} /> <span>Convert Format</span></div>
                <p className="card-desc">Convert images between modern web formats like WebP, JPEG, and PNG.</p>
              </button >
              <button
                className={`catalog-card ${activeTool === 'rotate' ? 'active' : ''}`}
                onClick={() => navigate('/app/images/rotate')}
              >
                <div className="card-header"><RefreshCw size={16} /> <span>Rotate / Flip</span></div>
                <p className="card-desc">Fix incorrect image orientation by rotating or mirroring the picture.</p>
              </button >
              <button
                className={`catalog-card ${activeTool === 'metadata' ? 'active' : ''}`}
                onClick={() => navigate('/app/images/metadata')}
              >
                <div className="card-header"><Tag size={16} /> <span>Edit Metadata</span></div>
                <p className="card-desc">View, edit, or strip EXIF metadata from your digital photographs.</p>
              </button >
              <button
                className={`catalog-card ${activeTool === 'filters' ? 'active' : ''}`}
                onClick={() => navigate('/app/images/filters')}
              >
                <div className="card-header"><Sliders size={16} /> <span>Filters & Colors</span></div>
                <p className="card-desc">Apply beautiful photo filters and adjust brightness, contrast, and saturation.</p>
              </button >
              <button
                className={`catalog-card ${activeTool === 'ascii' ? 'active' : ''}`}
                onClick={() => navigate('/app/images/ascii')}
              >
                <div className="card-header"><TypeIcon size={16} /> <span>To ASCII Art</span></div>
                <p className="card-desc">Transform any colorful image into retro-style text-based ASCII art.</p>
              </button >
              <button
                className={`catalog-card ${activeTool === 'colors' ? 'active' : ''}`}
                onClick={() => navigate('/app/images/colors')}
              >
                <div className="card-header"><Palette size={16} /> <span>Color Extractor</span></div>
                <p className="card-desc">Extract the dominant color palette and hex codes from any image.</p>
              </button >
              <button
                className={`catalog-card ${activeTool === 'bgremover' ? 'active' : ''}`}
                onClick={() => navigate('/app/images/bgremover')}
              >
                <div className="card-header"><Eraser size={16} /> <span>Remove Background</span></div>
                <p className="card-desc">Instantly remove image backgrounds using advanced AI segmentation.</p>
              </button >
              <button
                className={`catalog-card ${activeTool === 'upscale' ? 'active' : ''}`}
                onClick={() => navigate('/app/images/upscale')}
              >
                <div className="card-header"><Sparkles size={16} /> <span>AI Upscaler</span></div>
                <p className="card-desc">Upscale low-resolution images to crystal clear 4K without losing quality.</p>
              </button >
              <button
                className={`catalog-card ${activeTool === 'stylize' ? 'active' : ''}`}
                onClick={() => navigate('/app/images/stylize')}
              >
                <div className="card-header"><Brush size={16} /> <span>Stylizer (GPU)</span></div>
                <p className="card-desc">Apply stunning artistic styles to your photos using fast GPU processing.</p>
              </button >
              <button
                className={`catalog-card ${activeTool === 'meme' ? 'active' : ''}`}
                onClick={() => navigate('/app/images/meme')}
              >
                <div className="card-header"><Smile size={16} /> <span>Meme Generator</span></div>
                <p className="card-desc">Create hilarious custom memes by adding bold impact text to images.</p>
              </button >
              <button
                className={`catalog-card ${activeTool === 'beautify' ? 'active' : ''}`}
                onClick={() => navigate('/app/images/beautify')}
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
  const activeTool = tool || 'frames';

  // Make a nice readable title from the tool slug
  const titleStr = activeTool
    .replace(/([A-Z])/g, ' $1')
    .trim();

  const toolTitle = titleStr.charAt(0).toUpperCase() + titleStr.slice(1);

  return (
    <div className="app-container dedicated-tool-page">
      <header className="dedicated-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 2rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }} className="dedicated-header-left">
          <button
            className="tab-btn"
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.9rem' }}
            onClick={() => navigate(`/app/${activeDomain}`)}
          >
            ← Back to Catalog
          </button>
          <div className="header-title" style={{ margin: 0 }}>
            <Film size={20} color="#8b5cf6" />
            <h2 style={{ fontSize: '1.1rem', margin: 0, marginLeft: '0.5rem' }}>freeutils - {toolTitle}</h2>
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

      <main style={{ marginTop: '2rem' }}>
        {activeDomain === 'videos' && activeTool === 'frames' && <VideoProcessor />}
        {activeDomain === 'videos' && activeTool === 'compress' && <VideoCompressor />}
        {activeDomain === 'videos' && activeTool === 'trim' && <VideoTrimmer />}
        {activeDomain === 'videos' && activeTool === 'resize' && <VideoResizer />}
        {activeDomain === 'videos' && activeTool === 'convert' && <VideoConverter />}
        {activeDomain === 'videos' && activeTool === 'thumbnail' && <VideoThumbnailMaker />}
        {activeDomain === 'videos' && activeTool === 'speed' && <VideoSpeedChanger />}
        {activeDomain === 'videos' && activeTool === 'mute' && <VideoMuter />}
        {activeDomain === 'videos' && activeTool === 'audio' && <VideoAudioAdder />}
        {activeDomain === 'videos' && activeTool === 'gif' && <VideoToGif />}
        {activeDomain === 'videos' && activeTool === 'rotate' && <VideoRotator />}
        {activeDomain === 'videos' && activeTool === 'reverse' && <VideoReverser />}
        {activeDomain === 'videos' && activeTool === 'merge' && <VideoMerger />}
        {activeDomain === 'videos' && activeTool === 'watermark' && <VideoWatermarkAdder />}
        {activeDomain === 'videos' && activeTool === 'volume' && <VideoVolumeChanger />}
        {activeDomain === 'videos' && activeTool === 'extractAudio' && <AudioExtractor />}
        {activeDomain === 'videos' && activeTool === 'filter' && <VideoFilterAdder />}
        {activeDomain === 'videos' && activeTool === 'subtitles' && <VideoSubtitleBurner />}
        {activeDomain === 'videos' && activeTool === 'stabilize' && <VideoStabilizer />}
        {activeDomain === 'videos' && activeTool === 'noiseReducer' && <VideoNoiseReducer />}
        {activeDomain === 'videos' && activeTool === 'interpolate' && <VideoInterpolator />}
        {activeDomain === 'videos' && activeTool === 'sceneSplitter' && <VideoSceneSplitter />}
        {activeDomain === 'videos' && activeTool === 'deflicker' && <VideoDeflicker />}
        {activeDomain === 'videos' && activeTool === 'autocrop' && <VideoAutoCrop />}
        {activeDomain === 'videos' && activeTool === 'crop' && <VideoCropper />}
        {activeDomain === 'videos' && activeTool === 'karaoke' && <VideoKaraokeMaker />}
        {activeDomain === 'videos' && activeTool === 'faceSwap' && <VideoFaceSwapper />}
        {activeDomain === 'videos' && activeTool === 'removeSubtitles' && <VideoSubtitleRemover />}
        {activeDomain === 'videos' && activeTool === 'translate' && <MediaTranslator />}
        {activeDomain === 'videos' && activeTool === 'enhanceSpeech' && <VideoSpeechEnhancer />}

        {activeDomain === 'audio' && activeTool === 'convert' && <AudioConverter />}
        {activeDomain === 'audio' && activeTool === 'trim' && <AudioTrimmer />}
        {activeDomain === 'audio' && activeTool === 'merge' && <AudioMerger />}
        {activeDomain === 'audio' && activeTool === 'enhanceSpeech' && <VideoSpeechEnhancer />}

        {activeDomain === 'code' && activeTool === 'jsonFormatter' && <JsonFormatter />}
        {activeDomain === 'code' && activeTool === 'base64' && <Base64Tool />}
        {activeDomain === 'code' && activeTool === 'hashGenerator' && <HashGenerator />}
        {activeDomain === 'code' && activeTool === 'uuid' && <UuidGenerator />}
        {activeDomain === 'code' && activeTool === 'regex' && <RegexTester />}
        {activeDomain === 'code' && activeTool === 'diff' && <DiffChecker />}
        {activeDomain === 'code' && activeTool === 'minifier' && <CodeMinifier />}
        {activeDomain === 'code' && activeTool === 'prettifier' && <CodePrettifier />}
        {activeDomain === 'code' && activeTool === 'jwt' && <JwtDecoder />}
        {activeDomain === 'code' && activeTool === 'timestamp' && <TimestampConverter />}
        {activeDomain === 'code' && activeTool === 'url' && <UrlTool />}
        {activeDomain === 'code' && activeTool === 'linter' && <CodeLinter />}

        {activeDomain === 'text' && activeTool === 'subtitleConverter' && <SubtitleConverter />}

        {activeDomain === 'images' && activeTool === 'watermarkRemover' && <ImageWatermarkRemover />}
        {activeDomain === 'images' && activeTool === 'watermarkAdder' && <ImageWatermarkAdder />}
        {activeDomain === 'images' && activeTool === 'crop' && <ImageCropper />}
        {activeDomain === 'images' && activeTool === 'resize' && <ImageResizer />}
        {activeDomain === 'images' && activeTool === 'compress' && <ImageCompressor />}
        {activeDomain === 'images' && activeTool === 'convert' && <ImageConverter />}
        {activeDomain === 'images' && activeTool === 'rotate' && <ImageRotator />}
        {activeDomain === 'images' && activeTool === 'metadata' && <ImageMetadataEditor />}
        {activeDomain === 'images' && activeTool === 'filters' && <ImageFilters />}
        {activeDomain === 'images' && activeTool === 'ascii' && <ImageAsciiArt />}
        {activeDomain === 'images' && activeTool === 'colors' && <ImageColorExtractor />}
        {activeDomain === 'images' && activeTool === 'bgremover' && <ImageBackgroundRemover />}
        {activeDomain === 'images' && activeTool === 'upscale' && <ImageUpscaler />}
        {activeDomain === 'images' && activeTool === 'stylize' && <ImageStylizer />}
        {activeDomain === 'images' && activeTool === 'meme' && <ImageMemeGenerator />}
        {activeDomain === 'images' && activeTool === 'beautify' && <ImageScreenshotBeautifier />}
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

  // If there's no tool, show the catalog for the domain
  if (!tool) {
    return <ToolCatalog />;
  }

  return <DedicatedToolPage />;
}

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/app" element={<RouteHandler />} />
        <Route path="/app/:domain" element={<RouteHandler />} />
        <Route path="/app/:domain/:tool" element={<RouteHandler />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;
