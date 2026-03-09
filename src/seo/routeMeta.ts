type Domain = 'videos' | 'audio' | 'code' | 'text' | 'images';

type RouteMeta = {
  title: string;
  description: string;
};

type ToolMetaMap = Record<string, RouteMeta>;

const siteName = 'freeutils';

export const defaultMeta: RouteMeta = {
  title: `${siteName} | Free Online Media and Developer Tools`,
  description:
    'Free online video, image, audio, code, and text utilities with no signup required. Compress files, convert formats, edit media, and use developer tools in your browser.',
};

export const homeMeta: RouteMeta = {
  title: `${siteName} | Free Online Media, Code, and Text Tools`,
  description:
    'Use free online tools for video editing, image processing, audio conversion, subtitle work, and developer tasks directly in your browser with no signup required.',
};

export const domainMeta: Record<Domain, RouteMeta> = {
  videos: {
    title: `Video Tools | ${siteName}`,
    description:
      'Free online video tools with no signup required. Trim, compress, resize, convert, crop, subtitle, and edit videos in your browser.',
  },
  audio: {
    title: `Audio Tools | ${siteName}`,
    description:
      'Free online audio tools with no signup required. Convert, trim, merge, and improve audio files quickly in your browser.',
  },
  code: {
    title: `Code Tools | ${siteName}`,
    description:
      'Free online developer utilities with no signup required for formatting JSON, decoding JWTs, testing regex, generating hashes, and more.',
  },
  text: {
    title: `Text Tools | ${siteName}`,
    description:
      'Free online text utilities with no signup required for subtitle conversion and related browser-based text workflows.',
  },
  images: {
    title: `Image Tools | ${siteName}`,
    description:
      'Free online image tools with no signup required. Crop, resize, compress, convert, remove backgrounds, extract colors, and edit images in your browser.',
  },
};

export const domainLabels: Record<Domain, string> = {
  videos: 'Video',
  audio: 'Audio',
  code: 'Code',
  text: 'Text',
  images: 'Image',
};

export const toolMetaByDomain: Record<Domain, ToolMetaMap> = {
  videos: {
    'extract-frames-from-video': {
      title: `Extract Frames From Video | ${siteName}`,
      description: 'Extract high-quality frames and still images from video files online for thumbnails, previews, or editing.',
    },
    'trim-video': {
      title: `Trim Video | ${siteName}`,
      description: 'Cut video files to the exact section you need with a fast online video trimmer.',
    },
    'resize-video': {
      title: `Resize Video | ${siteName}`,
      description: 'Resize video dimensions and aspect ratio online for social platforms, web, or mobile playback.',
    },
    'convert-video': {
      title: `Convert Video | ${siteName}`,
      description: 'Convert video files between popular formats online with a simple browser-based workflow.',
    },
    'compress-video': {
      title: `Compress Video | ${siteName}`,
      description: 'Reduce video file size online while keeping strong visual quality for sharing and upload.',
    },
    'extract-video-thumbnail': {
      title: `Extract Video Thumbnail | ${siteName}`,
      description: 'Capture and export the best thumbnail frame from a video online.',
    },
    'change-video-speed': {
      title: `Change Video Speed | ${siteName}`,
      description: 'Speed up or slow down videos online to create timelapse, slow motion, or faster playback.',
    },
    'mute-video': {
      title: `Mute Video | ${siteName}`,
      description: 'Remove audio from video files online with a quick mute video tool.',
    },
    'add-audio-to-video': {
      title: `Add Audio To Video | ${siteName}`,
      description: 'Add background music or voice audio to a video online in a few steps.',
    },
    'convert-video-to-gif': {
      title: `Convert Video To GIF | ${siteName}`,
      description: 'Turn short video clips into GIFs online for social posts, memes, and quick sharing.',
    },
    'rotate-or-flip-video': {
      title: `Rotate Or Flip Video | ${siteName}`,
      description: 'Rotate or mirror video files online to fix orientation issues fast.',
    },
    'reverse-video': {
      title: `Reverse Video | ${siteName}`,
      description: 'Play video clips backwards online to create rewind effects and creative edits.',
    },
    'merge-videos': {
      title: `Merge Videos | ${siteName}`,
      description: 'Combine multiple video clips into one file online with a simple merge tool.',
    },
    'add-watermark-to-video': {
      title: `Add Watermark To Video | ${siteName}`,
      description: 'Add text or image watermarks to videos online to protect your content and branding.',
    },
    'change-video-volume': {
      title: `Change Video Volume | ${siteName}`,
      description: 'Increase or reduce video volume online for clearer playback and sharing.',
    },
    'extract-audio-from-video': {
      title: `Extract Audio From Video | ${siteName}`,
      description: 'Extract audio tracks from video files online and save them for reuse.',
    },
    'add-filter-to-video': {
      title: `Add Filter To Video | ${siteName}`,
      description: 'Apply visual filters and color effects to video files online.',
    },
    'add-subtitles-to-video': {
      title: `Add Subtitles To Video | ${siteName}`,
      description: 'Burn subtitles into video files online using subtitle files such as SRT and VTT.',
    },
    'stabilize-video': {
      title: `Stabilize Video | ${siteName}`,
      description: 'Reduce camera shake and smooth footage online with a video stabilization tool.',
    },
    'reduce-video-noise': {
      title: `Reduce Video Noise | ${siteName}`,
      description: 'Clean up noisy video audio and improve clarity online.',
    },
    'smooth-video-motion': {
      title: `Smooth Video Motion | ${siteName}`,
      description: 'Create smoother motion by interpolating video frames online.',
    },
    'split-video-scenes': {
      title: `Split Video Scenes | ${siteName}`,
      description: 'Detect scene changes and split videos into separate segments online.',
    },
    'deflicker-video': {
      title: `Deflicker Video | ${siteName}`,
      description: 'Reduce flicker in video footage online for cleaner and more consistent visuals.',
    },
    'auto-crop-video': {
      title: `Auto Crop Video | ${siteName}`,
      description: 'Automatically crop videos to keep the main subject centered online.',
    },
    'crop-video': {
      title: `Crop Video | ${siteName}`,
      description: 'Crop video frames online to focus on the exact area you want.',
    },
    'create-karaoke-video': {
      title: `Create Karaoke Video | ${siteName}`,
      description: 'Create karaoke-style videos online by isolating instrumentals and preparing sing-along media.',
    },
    'swap-face-in-video': {
      title: `Swap Face In Video | ${siteName}`,
      description: 'Swap faces in videos online with an AI-powered face swap workflow.',
    },
    'remove-subtitles-from-video': {
      title: `Remove Subtitles From Video | ${siteName}`,
      description: 'Remove hardcoded subtitles from video online to clean up your footage.',
    },
    'translate-video': {
      title: `Translate Video | ${siteName}`,
      description: 'Translate, transcribe, and rework video audio online for multilingual content.',
    },
    'enhance-video-speech': {
      title: `Enhance Video Speech | ${siteName}`,
      description: 'Improve voice clarity in videos online for cleaner speech and better listening.',
    },
  },
  audio: {
    'convert-audio': {
      title: `Convert Audio | ${siteName}`,
      description: 'Convert audio files between common formats online with a simple browser tool.',
    },
    'trim-audio': {
      title: `Trim Audio | ${siteName}`,
      description: 'Cut audio files to the exact segment you need online.',
    },
    'merge-audio': {
      title: `Merge Audio | ${siteName}`,
      description: 'Combine multiple audio clips into one track online.',
    },
    'enhance-audio-speech': {
      title: `Enhance Audio Speech | ${siteName}`,
      description: 'Improve speech quality in audio files online for clearer listening.',
    },
  },
  code: {
    'format-json': {
      title: `Format JSON | ${siteName}`,
      description: 'Format, validate, and beautify JSON online with a clean developer utility.',
    },
    'base64-encode-decode': {
      title: `Base64 Encode Decode | ${siteName}`,
      description: 'Encode or decode Base64 strings online for quick developer workflows.',
    },
    'generate-hash': {
      title: `Generate Hash | ${siteName}`,
      description: 'Generate hashes online for text using common hashing algorithms.',
    },
    'generate-uuid': {
      title: `Generate UUID | ${siteName}`,
      description: 'Generate UUID values online instantly for development and testing.',
    },
    'test-regex': {
      title: `Test Regex | ${siteName}`,
      description: 'Test regular expressions online against sample text with instant feedback.',
    },
    'check-code-diff': {
      title: `Check Code Diff | ${siteName}`,
      description: 'Compare code snippets online to inspect differences quickly.',
    },
    'minify-code': {
      title: `Minify Code | ${siteName}`,
      description: 'Minify HTML, CSS, and JavaScript online to reduce code size.',
    },
    'prettify-code': {
      title: `Prettify Code | ${siteName}`,
      description: 'Prettify source code online for better readability and cleaner formatting.',
    },
    'decode-jwt': {
      title: `Decode JWT | ${siteName}`,
      description: 'Decode JSON Web Tokens online to inspect headers and payloads quickly.',
    },
    'convert-timestamp': {
      title: `Convert Timestamp | ${siteName}`,
      description: 'Convert Unix and epoch timestamps online into readable dates and times.',
    },
    'encode-decode-url': {
      title: `Encode Decode URL | ${siteName}`,
      description: 'Encode or decode URL strings and parameters online.',
    },
    'lint-code': {
      title: `Lint Code | ${siteName}`,
      description: 'Analyze code online for issues and style problems with a browser-based linter.',
    },
  },
  text: {
    'convert-subtitles': {
      title: `Convert Subtitles | ${siteName}`,
      description: 'Convert subtitle files between formats such as SRT, VTT, and ASS online.',
    },
  },
  images: {
    'remove-image-watermark': {
      title: `Remove Image Watermark | ${siteName}`,
      description: 'Remove watermarks from images online with a fast cleanup workflow.',
    },
    'add-image-watermark': {
      title: `Add Image Watermark | ${siteName}`,
      description: 'Add text or logo watermarks to images online to protect your work.',
    },
    'crop-image': {
      title: `Crop Image | ${siteName}`,
      description: 'Crop images online to a custom area or aspect ratio.',
    },
    'resize-image': {
      title: `Resize Image | ${siteName}`,
      description: 'Resize images online for web, social media, or printing.',
    },
    'compress-image': {
      title: `Compress Image | ${siteName}`,
      description: 'Reduce image file size online while preserving visual quality.',
    },
    'convert-image': {
      title: `Convert Image | ${siteName}`,
      description: 'Convert images between popular formats online with ease.',
    },
    'rotate-or-flip-image': {
      title: `Rotate Or Flip Image | ${siteName}`,
      description: 'Rotate or flip images online to fix orientation fast.',
    },
    'edit-image-metadata': {
      title: `Edit Image Metadata | ${siteName}`,
      description: 'View, edit, or remove image metadata online.',
    },
    'add-image-filters': {
      title: `Add Image Filters | ${siteName}`,
      description: 'Apply filters and color adjustments to images online.',
    },
    'convert-image-to-ascii': {
      title: `Convert Image To ASCII | ${siteName}`,
      description: 'Turn images into ASCII art online in a few steps.',
    },
    'extract-image-colors': {
      title: `Extract Image Colors | ${siteName}`,
      description: 'Extract dominant colors from images online for palettes and design work.',
    },
    'remove-image-background': {
      title: `Remove Image Background | ${siteName}`,
      description: 'Remove image backgrounds online for product photos, portraits, and graphics.',
    },
    'upscale-image': {
      title: `Upscale Image | ${siteName}`,
      description: 'Upscale images online to improve size and clarity.',
    },
    'stylize-image': {
      title: `Stylize Image | ${siteName}`,
      description: 'Apply artistic styles and effects to images online.',
    },
    'generate-image-meme': {
      title: `Generate Image Meme | ${siteName}`,
      description: 'Create custom image memes online with fast text overlay tools.',
    },
    'beautify-screenshot': {
      title: `Beautify Screenshot | ${siteName}`,
      description: 'Enhance screenshots online with polished presentation effects.',
    },
  },
};

function withAccessQualifier(meta: RouteMeta): RouteMeta {
  const qualifier = ' Free online, no signup required.';

  if (meta.description.includes('no signup required')) {
    return meta;
  }

  const trimmed = meta.description.trim().replace(/[.]+$/, '');

  return {
    ...meta,
    description: `${trimmed}.${qualifier}`,
  };
}

export function getRouteMeta(pathname: string): RouteMeta {
  if (pathname === '/') {
    return withAccessQualifier(homeMeta);
  }

  const [appSegment, domain, tool] = pathname.split('/').filter(Boolean);

  if (appSegment !== 'app' || !domain) {
    return withAccessQualifier(defaultMeta);
  }

  if (domain in domainMeta) {
    const typedDomain = domain as Domain;

    if (tool && toolMetaByDomain[typedDomain][tool]) {
      return withAccessQualifier(toolMetaByDomain[typedDomain][tool]);
    }

    return withAccessQualifier(domainMeta[typedDomain]);
  }

  return withAccessQualifier(defaultMeta);
}

export function getToolDisplayName(toolSlug: string): string {
  return toolSlug
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function isDomain(value: string): value is Domain {
  return value in domainMeta;
}

export function isKnownRoute(pathname: string): boolean {
  if (pathname === '/' || pathname === '/app') {
    return true;
  }

  const [appSegment, domain, tool] = pathname.split('/').filter(Boolean);

  if (appSegment !== 'app' || !domain || !isDomain(domain)) {
    return false;
  }

  if (!tool) {
    return true;
  }

  return tool in toolMetaByDomain[domain];
}
