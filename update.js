const fs = require('fs');
const file = 'src/App.tsx';
let content = fs.readFileSync(file, 'utf8');

const mapping = {
    'frames': 'extract-frames-from-video',
    'trim': 'trim-video',
    'resize': 'resize-video',
    'convert': 'convert-video',
    'compress': 'compress-video',
    'thumbnail': 'extract-video-thumbnail',
    'speed': 'change-video-speed',
    'mute': 'mute-video',
    'audio': 'add-audio-to-video',
    'gif': 'convert-video-to-gif',
    'rotate': 'rotate-or-flip-video',
    'reverse': 'reverse-video',
    'merge': 'merge-videos',
    'watermark': 'add-watermark-to-video',
    'volume': 'change-video-volume',
    'extractAudio': 'extract-audio-from-video',
    'filter': 'add-filter-to-video',
    'subtitles': 'add-subtitles-to-video',
    'stabilize': 'stabilize-video',
    'noiseReducer': 'reduce-video-noise',
    'interpolate': 'smooth-video-motion',
    'sceneSplitter': 'split-video-scenes',
    'deflicker': 'deflicker-video',
    'autocrop': 'auto-crop-video',
    'crop': 'crop-video',
    'karaoke': 'create-karaoke-video',
    'faceSwap': 'swap-face-in-video',
    'removeSubtitles': 'remove-subtitles-from-video',
    'translate': 'translate-video',
    'enhanceSpeech': 'enhance-video-speech'
};

content = content.replace(
  "const activeTool = tool || 'frames';",
  "const activeTool = tool || 'extract-frames-from-video';"
);

content = content.replace(
  `  const titleStr = activeTool\n    .replace(/([A-Z])/g, ' $1')\n    .trim();`,
  `  const titleStr = activeTool\n    .replace(/-/g, ' ')\n    .replace(/([A-Z])/g, ' $1')\n    .trim();`
);

let videoBlockStart = content.indexOf('activeDomain === \\'videos\\' && (');
let audioBlockStart = content.indexOf('activeDomain === \\'audio\\' && (');

let beforeVideo = content.substring(0, videoBlockStart);
let videoBlock = content.substring(videoBlockStart, audioBlockStart);
let afterVideo = content.substring(audioBlockStart);

for (const [oldKey, newKey] of Object.entries(mapping)) {
    videoBlock = videoBlock.replace(
        new RegExp(`activeTool === '${oldKey}'`, 'g'),
        `activeTool === '${newKey}'`
    );
    videoBlock = videoBlock.replace(
        new RegExp(`navigate\\('/app/videos/${oldKey}'\\)`, 'g'),
        `navigate('/app/videos/${newKey}')`
    );
}

fs.writeFileSync(file, beforeVideo + videoBlock + afterVideo, 'utf8');
console.log('App.tsx Updated in nodeJS!');
