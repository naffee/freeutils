import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Setup directories for robust file handling on a VPS
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const OUTPUT_DIR = path.join(__dirname, 'output');

[UPLOADS_DIR, OUTPUT_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Multer DiskStorage is better for VPS RAM than memory storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOADS_DIR);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

app.use(cors());
app.use(express.json());

// API Status
app.get('/api/status', (req, res) => {
    res.json({ status: 'online', processingTasks: 0 }); // Placeholder for queue stats
});

import { spawn } from 'child_process';

const PYTHON_SCRIPT = path.join(__dirname, 'python', 'compress.py');

// Modern hybrid route taking advantage of backend CPU
app.post('/api/compress-video', upload.single('video'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No video file provided' });
        }

        const inputPath = req.file.path;
        const outputPath = path.join(OUTPUT_DIR, `compressed-${req.file.filename}`);

        console.log(`Starting compression for ${req.file.originalname}`);

        // Spawn Python process
        const pythonProcess = spawn('python', [PYTHON_SCRIPT, inputPath, outputPath, '28']);

        let outputData = '';

        pythonProcess.stdout.on('data', (data) => {
            outputData += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            // FFmpeg prints progress to stderr
            console.log(`FFMPEG: ${data}`);
        });

        pythonProcess.on('close', (code) => {
            console.log(`Python script exited with code ${code}`);

            // Clean up original upload to save VPS disk space
            fs.unlink(inputPath, (err) => {
                if (err) console.error("Error deleting input file:", err);
            });

            if (code !== 0) {
                return res.status(500).json({ error: 'Video compression failed' });
            }

            try {
                // Parse the final JSON output from our python script
                const result = JSON.parse(outputData);
                if (result.success) {
                    // Send file back to the client
                    res.download(result.output_path, `compressed-${req.file.originalname}`, (err) => {
                        if (err) console.error("Error sending file:", err);
                        // Clean up output file after sending
                        fs.unlink(result.output_path, (e) => {
                            if (e) console.error("Error deleting output file:", e);
                        });
                    });
                } else {
                    res.status(500).json(result);
                }
            } catch (e) {
                res.status(500).json({ error: 'Failed to parse python output: ' + outputData });
            }
        });

    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// --- NEW API ENDPOINT: Format Conversion ---
app.post('/api/convert-video', upload.single('video'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No video file provided' });
        }

        const targetFormat = req.body.format || 'mp4';
        const quality = req.body.quality || 'balanced';

        const inputPath = req.file.path;
        const outputPath = path.join(OUTPUT_DIR, `converted-${Date.now()}.${targetFormat}`);

        console.log(`Starting conversion to ${targetFormat} for ${req.file.originalname}`);

        const CONVERT_SCRIPT = path.join(__dirname, 'python', 'convert_video.py');
        const pythonProcess = spawn('python', [CONVERT_SCRIPT, inputPath, outputPath, targetFormat, quality]);

        let outputData = '';

        pythonProcess.stdout.on('data', (data) => {
            outputData += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            // FFmpeg logs go to stderr
            // console.log(`FFMPEG: ${data}`); // Un-comment to see raw logs
        });

        pythonProcess.on('close', (code) => {
            console.log(`Conversion script exited with code ${code}`);

            // Clean up original upload
            fs.unlink(inputPath, (err) => {
                if (err) console.error("Error deleting input file:", err);
            });

            if (code !== 0) {
                return res.status(500).json({ error: 'Video conversion failed' });
            }

            try {
                const result = JSON.parse(outputData);
                if (result.success) {
                    res.download(result.output_path, `converted-${req.file.originalname.replace(/\\.[^/.]+$/, "")}.${targetFormat}`, (err) => {
                        if (err) console.error("Error sending converted file:", err);
                        fs.unlink(result.output_path, (e) => {
                            if (e) console.error("Error deleting output file:", e);
                        });
                    });
                } else {
                    res.status(500).json(result);
                }
            } catch (e) {
                res.status(500).json({ error: 'Failed to parse conversion output: ' + outputData });
            }
        });

    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// --- NEW API ENDPOINT: Hardcode Subtitles ---
app.post('/api/burn-subtitles', upload.fields([{ name: 'video', maxCount: 1 }, { name: 'srt', maxCount: 1 }]), async (req, res) => {
    try {
        if (!req.files || !req.files['video'] || !req.files['srt']) {
            return res.status(400).json({ error: 'Both video and srt files are required' });
        }

        const videoFile = req.files['video'][0];
        const srtFile = req.files['srt'][0];

        const outputExt = path.extname(videoFile.originalname) || '.mp4';
        const outputPath = path.join(OUTPUT_DIR, `subtitled-${Date.now()}${outputExt}`);

        console.log(`Starting subtitle burn for ${videoFile.originalname} with ${srtFile.originalname}`);

        const BURN_SCRIPT = path.join(__dirname, 'python', 'burn_subtitles.py');
        const pythonProcess = spawn('python', [BURN_SCRIPT, videoFile.path, srtFile.path, outputPath]);

        let outputData = '';

        pythonProcess.stdout.on('data', (data) => {
            outputData += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            // FFmpeg logs go to stderr
            console.log(`FFMPEG: ${data}`); // Un-comment to see raw logs
        });

        pythonProcess.on('close', (code) => {
            console.log(`Subtitle script exited with code ${code}`);

            // Clean up original uploads
            fs.unlink(videoFile.path, () => { });
            fs.unlink(srtFile.path, () => { });

            if (code !== 0) {
                return res.status(500).json({ error: 'Subtitle process failed' });
            }

            try {
                const result = JSON.parse(outputData);
                if (result.success) {
                    res.download(result.output_path, `subtitled-${videoFile.originalname}`, (err) => {
                        if (err) console.error("Error sending subtitled file:", err);
                        fs.unlink(result.output_path, () => { });
                    });
                } else {
                    res.status(500).json(result);
                }
            } catch (e) {
                res.status(500).json({ error: 'Failed to parse script output: ' + outputData });
            }
        });

    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// --- NEW API ENDPOINT: Stabilize Video ---
app.post('/api/stabilize-video', upload.single('video'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No video file provided' });
        }

        const inputPath = req.file.path;
        const outputExt = path.extname(req.file.originalname) || '.mp4';
        const outputPath = path.join(OUTPUT_DIR, `stabilized-${Date.now()}${outputExt}`);

        console.log(`Starting stabilization for ${req.file.originalname}`);

        const STABILIZE_SCRIPT = path.join(__dirname, 'python', 'stabilize_video.py');
        const pythonProcess = spawn('python', [STABILIZE_SCRIPT, inputPath, outputPath]);

        let outputData = '';

        pythonProcess.stdout.on('data', (data) => {
            outputData += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            // FFmpeg logs go to stderr
            console.log(`FFMPEG (Stabilize): ${data}`);
        });

        pythonProcess.on('close', (code) => {
            console.log(`Stabilize script exited with code ${code}`);

            // Clean up original upload
            fs.unlink(inputPath, () => { });

            if (code !== 0) {
                return res.status(500).json({ error: 'Video stabilization failed' });
            }

            try {
                const result = JSON.parse(outputData);
                if (result.success) {
                    res.download(result.output_path, `stabilized-${req.file.originalname}`, (err) => {
                        if (err) console.error("Error sending stabilized file:", err);
                        fs.unlink(result.output_path, () => { });
                    });
                } else {
                    res.status(500).json(result);
                }
            } catch (e) {
                res.status(500).json({ error: 'Failed to parse script output: ' + outputData });
            }
        });

    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// --- NEW API ENDPOINT: Reduce Noise ---
app.post('/api/reduce-noise', upload.single('video'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No video file provided' });
        }

        const inputPath = req.file.path;
        const noiseType = req.body.noiseType || 'both'; // 'audio', 'video', 'both'
        const outputExt = path.extname(req.file.originalname) || '.mp4';
        const outputPath = path.join(OUTPUT_DIR, `denoised-${Date.now()}${outputExt}`);

        console.log(`Starting noise reduction (${noiseType}) for ${req.file.originalname}`);

        const REDUCE_NOISE_SCRIPT = path.join(__dirname, 'python', 'reduce_noise.py');
        const pythonProcess = spawn('python', [REDUCE_NOISE_SCRIPT, inputPath, outputPath, noiseType]);

        let outputData = '';

        pythonProcess.stdout.on('data', (data) => {
            outputData += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            // FFmpeg logs go to stderr
            console.log(`FFMPEG (Reduce Noise): ${data}`);
        });

        pythonProcess.on('close', (code) => {
            console.log(`Reduce noise script exited with code ${code}`);

            // Clean up original upload
            fs.unlink(inputPath, () => { });

            if (code !== 0) {
                return res.status(500).json({ error: 'Video noise reduction failed' });
            }

            try {
                const result = JSON.parse(outputData);
                if (result.success) {
                    res.download(result.output_path, `denoised-${req.file.originalname}`, (err) => {
                        if (err) console.error("Error sending denoised file:", err);
                        fs.unlink(result.output_path, () => { });
                    });
                } else {
                    res.status(500).json(result);
                }
            } catch (e) {
                res.status(500).json({ error: 'Failed to parse script output: ' + outputData });
            }
        });

    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// --- NEW API ENDPOINT: Smooth Motion (Interpolation) ---
app.post('/api/interpolate-video', upload.single('video'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No video file provided' });
        }

        const inputPath = req.file.path;
        const targetFps = req.body.fps || '60';
        const outputExt = path.extname(req.file.originalname) || '.mp4';
        const outputPath = path.join(OUTPUT_DIR, `smooth-${Date.now()}${outputExt}`);

        console.log(`Starting frame interpolation (${targetFps}fps) for ${req.file.originalname}`);

        const INTERPOLATE_SCRIPT = path.join(__dirname, 'python', 'interpolate_video.py');
        const pythonProcess = spawn('python', [INTERPOLATE_SCRIPT, inputPath, outputPath, targetFps]);

        let outputData = '';

        pythonProcess.stdout.on('data', (data) => {
            outputData += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            // FFmpeg logs go to stderr
            console.log(`FFMPEG (Interpolate): ${data}`);
        });

        pythonProcess.on('close', (code) => {
            console.log(`Interpolation script exited with code ${code}`);

            // Clean up original upload
            fs.unlink(inputPath, () => { });

            if (code !== 0) {
                return res.status(500).json({ error: 'Video interpolation failed' });
            }

            try {
                const result = JSON.parse(outputData);
                if (result.success) {
                    res.download(result.output_path, `smooth-${req.file.originalname}`, (err) => {
                        if (err) console.error("Error sending interpolated file:", err);
                        fs.unlink(result.output_path, () => { });
                    });
                } else {
                    res.status(500).json(result);
                }
            } catch (e) {
                res.status(500).json({ error: 'Failed to parse script output: ' + outputData });
            }
        });

    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// --- NEW API ENDPOINT: Auto Scene Detection & Splitting ---
app.post('/api/split-scenes', upload.single('video'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No video file provided' });
        }

        const inputPath = req.file.path;
        const outputPath = path.join(OUTPUT_DIR, `scenes-${Date.now()}.zip`);

        console.log(`Starting scene splitting for ${req.file.originalname}`);

        const SPLIT_SCRIPT = path.join(__dirname, 'python', 'split_scenes.py');
        const pythonProcess = spawn('python', [SPLIT_SCRIPT, inputPath, outputPath]);

        let outputData = '';

        pythonProcess.stdout.on('data', (data) => {
            outputData += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            // FFmpeg logs go to stderr
            console.log(`FFMPEG (Split Scenes): ${data}`);
        });

        pythonProcess.on('close', (code) => {
            console.log(`Split scenes script exited with code ${code}`);

            // Clean up original upload
            fs.unlink(inputPath, () => { });

            if (code !== 0) {
                return res.status(500).json({ error: 'Video scene split failed' });
            }

            try {
                const result = JSON.parse(outputData);
                if (result.success) {
                    res.download(result.output_path, `scenes-${req.file.originalname.replace(/\\.[^/.]+$/, "")}.zip`, (err) => {
                        if (err) console.error("Error sending zip file:", err);
                        fs.unlink(result.output_path, () => { });
                    });
                } else {
                    res.status(500).json(result);
                }
            } catch (e) {
                res.status(500).json({ error: 'Failed to parse script output: ' + outputData });
            }
        });

    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// --- NEW API ENDPOINT: Video Deflicker ---
app.post('/api/deflicker-video', upload.single('video'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No video file provided' });
        }

        const inputPath = req.file.path;
        const outputExt = path.extname(req.file.originalname) || '.mp4';
        const outputPath = path.join(OUTPUT_DIR, `deflickered-${Date.now()}${outputExt}`);

        console.log(`Starting video deflicker for ${req.file.originalname}`);

        const DEFLICKER_SCRIPT = path.join(__dirname, 'python', 'deflicker_video.py');
        const pythonProcess = spawn('python', [DEFLICKER_SCRIPT, inputPath, outputPath]);

        let outputData = '';

        pythonProcess.stdout.on('data', (data) => {
            outputData += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            // FFmpeg logs go to stderr
            console.log(`FFMPEG (Deflicker): ${data}`);
        });

        pythonProcess.on('close', (code) => {
            console.log(`Deflicker script exited with code ${code}`);

            // Clean up original upload
            fs.unlink(inputPath, () => { });

            if (code !== 0) {
                return res.status(500).json({ error: 'Video deflicker failed' });
            }

            try {
                const result = JSON.parse(outputData);
                if (result.success) {
                    res.download(result.output_path, `deflickered-${req.file.originalname}`, (err) => {
                        if (err) console.error("Error sending deflickered file:", err);
                        fs.unlink(result.output_path, () => { });
                    });
                } else {
                    res.status(500).json(result);
                }
            } catch (e) {
                res.status(500).json({ error: 'Failed to parse script output: ' + outputData });
            }
        });

    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// --- NEW API ENDPOINT: Smart Auto Crop ---
app.post('/api/auto-crop-video', upload.single('video'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No video file provided' });
        }

        const inputPath = req.file.path;
        const outputExt = path.extname(req.file.originalname) || '.mp4';
        const outputPath = path.join(OUTPUT_DIR, `autocrop-${Date.now()}${outputExt}`);

        console.log(`Starting auto-crop for ${req.file.originalname}`);

        const AUTOCROP_SCRIPT = path.join(__dirname, 'python', 'auto_crop_video.py');
        const pythonProcess = spawn('python', [AUTOCROP_SCRIPT, inputPath, outputPath]);

        let outputData = '';

        pythonProcess.stdout.on('data', (data) => {
            outputData += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            // FFmpeg logs go to stderr
            console.log(`FFMPEG (AutoCrop): ${data}`);
        });

        pythonProcess.on('close', (code) => {
            console.log(`Auto crop script exited with code ${code}`);

            // Clean up original upload
            fs.unlink(inputPath, () => { });

            if (code !== 0) {
                return res.status(500).json({ error: 'Video auto-crop failed' });
            }

            try {
                const result = JSON.parse(outputData);
                if (result.success) {
                    res.download(result.output_path, `cropped-${req.file.originalname}`, (err) => {
                        if (err) console.error("Error sending cropped file:", err);
                        fs.unlink(result.output_path, () => { });
                    });
                } else {
                    res.status(500).json(result);
                }
            } catch (e) {
                res.status(500).json({ error: 'Failed to parse script output: ' + outputData });
            }
        });

    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// --- NEW API ENDPOINT: Audio Vocal Isolation (Karaoke) ---
app.post('/api/isolate-vocals', upload.single('media'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No media file provided' });
        }

        const inputPath = req.file.path;
        const outputExt = path.extname(req.file.originalname) || '.mp4';
        const outputPath = path.join(OUTPUT_DIR, `karaoke-${Date.now()}${outputExt}`);

        console.log(`Starting vocal isolation for ${req.file.originalname}`);

        const ISOLATE_SCRIPT = path.join(__dirname, 'python', 'isolate_vocals.py');
        const pythonProcess = spawn('python', [ISOLATE_SCRIPT, inputPath, outputPath]);

        let outputData = '';

        pythonProcess.stdout.on('data', (data) => {
            outputData += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            // FFmpeg logs go to stderr
            console.log(`FFMPEG (Isolate Vocals): ${data}`);
        });

        pythonProcess.on('close', (code) => {
            console.log(`Isolate vocals script exited with code ${code}`);

            // Clean up original upload
            fs.unlink(inputPath, () => { });

            if (code !== 0) {
                return res.status(500).json({ error: 'Vocal isolation failed' });
            }

            try {
                const result = JSON.parse(outputData);
                if (result.success) {
                    res.download(result.output_path, `karaoke-${req.file.originalname}`, (err) => {
                        if (err) console.error("Error sending isolated file:", err);
                        fs.unlink(result.output_path, () => { });
                    });
                } else {
                    res.status(500).json(result);
                }
            } catch (e) {
                res.status(500).json({ error: 'Failed to parse script output: ' + outputData });
            }
        });

    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// --- NEW API ENDPOINT: AI Speech Enhancer (LavaSR) ---
app.post('/api/enhance-speech', upload.single('media'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No media file provided' });
        }

        const inputPath = req.file.path;
        const outputExt = path.extname(req.file.originalname) || '.mp4';
        const outputPath = path.join(OUTPUT_DIR, `enhanced-${Date.now()}${outputExt}`);

        console.log(`Starting AI Speech Enhancement for ${req.file.originalname}`);

        const ENHANCE_SCRIPT = path.join(__dirname, 'python', 'lavasr_enhance.py');
        const pythonProcess = spawn('python', [ENHANCE_SCRIPT, inputPath, outputPath]);

        let outputData = '';

        pythonProcess.stdout.on('data', (data) => {
            outputData += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            // Important for AI models as they log progress to stderr
            console.log(`LavaSR Log: ${data}`);
        });

        pythonProcess.on('close', (code) => {
            console.log(`AI Speech Enhancer script exited with code ${code}`);

            // Clean up original upload
            fs.unlink(inputPath, () => { });

            if (code !== 0) {
                return res.status(500).json({ error: 'Speech enhancement failed', logs: outputData });
            }

            try {
                // Find the JSON block. Sometimes PyTorch prints warnings before the final JSON output.
                const jsonStartIdx = outputData.lastIndexOf('{"success"');
                const jsonEndIdx = outputData.lastIndexOf('}');

                let jsonStr = outputData;
                if (jsonStartIdx !== -1 && jsonEndIdx !== -1 && jsonEndIdx >= jsonStartIdx) {
                    jsonStr = outputData.substring(jsonStartIdx, jsonEndIdx + 1);
                }

                const result = JSON.parse(jsonStr);
                if (result.success) {
                    res.download(result.output_path, `enhanced-${req.file.originalname}`, (err) => {
                        if (err) console.error("Error sending enhanced file:", err);
                        fs.unlink(result.output_path, () => { });
                    });
                } else {
                    res.status(500).json(result);
                }
            } catch (e) {
                res.status(500).json({ error: 'Failed to parse script output: ' + outputData });
            }
        });

    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// --- NEW API ENDPOINT: Video Face Swap ---
app.post('/api/face-swap-video', upload.fields([{ name: 'video', maxCount: 1 }, { name: 'image', maxCount: 1 }]), async (req, res) => {
    try {
        if (!req.files || !req.files['video'] || !req.files['image']) {
            return res.status(400).json({ error: 'Both video and image files are required' });
        }

        const videoFile = req.files['video'][0];
        const imageFile = req.files['image'][0];

        const outputExt = path.extname(videoFile.originalname) || '.mp4';
        const outputPath = path.join(OUTPUT_DIR, `faceswapped-${Date.now()}${outputExt}`);

        console.log(`Starting face swap for ${videoFile.originalname} with face from ${imageFile.originalname}`);

        const FACE_SWAP_SCRIPT = path.join(__dirname, 'python', 'face_swap_video.py');
        const pythonProcess = spawn('python', [FACE_SWAP_SCRIPT, videoFile.path, imageFile.path, outputPath]);

        let outputData = '';

        pythonProcess.stdout.on('data', (data) => {
            outputData += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            // Python script and FFmpeg logs go to stderr
            console.log(`FaceSwap Log: ${data}`);
        });

        pythonProcess.on('close', (code) => {
            console.log(`Face Swap script exited with code ${code}`);

            // Clean up original uploads
            fs.unlink(videoFile.path, () => { });
            fs.unlink(imageFile.path, () => { });

            let jsonOutput = outputData;
            // Attempt to extract JSON if insightface outputs extra logs to stdout
            // Look specifically for the start of our JSON payload
            const jsonStartIdx = outputData.lastIndexOf('{"success"');
            const jsonEndIdx = outputData.lastIndexOf('}');
            if (jsonStartIdx !== -1 && jsonEndIdx !== -1 && jsonEndIdx >= jsonStartIdx) {
                jsonOutput = outputData.substring(jsonStartIdx, jsonEndIdx + 1);
            }

            if (code !== 0) {
                // If python script output a JSON error, try to parse and return it
                try {
                    const result = JSON.parse(jsonOutput);
                    return res.status(500).json(result);
                } catch (e) {
                    return res.status(500).json({ error: 'Video face swap failed', details: outputData });
                }
            }

            try {
                const result = JSON.parse(jsonOutput);
                if (result.success) {
                    res.download(result.output_path, `faceswapped-${videoFile.originalname}`, (err) => {
                        if (err) console.error("Error sending face swapped file:", err);
                        fs.unlink(result.output_path, () => { });
                    });
                } else {
                    res.status(500).json(result);
                }
            } catch (e) {
                res.status(500).json({ error: 'Failed to parse script output: ' + outputData });
            }
        });

    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// --- NEW API ENDPOINT: Subtitle Remover ---
app.post('/api/remove-subtitles', upload.single('video'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No video file provided' });
        }

        const inputPath = req.file.path;
        const outputExt = path.extname(req.file.originalname) || '.mp4';
        const outputPath = path.join(OUTPUT_DIR, `nosubs-${Date.now()}${outputExt}`);

        console.log(`Starting subtitle removal for ${req.file.originalname}`);

        const REMOVE_SUB_SCRIPT = path.join(__dirname, 'python', 'remove_subtitles.py');
        const pythonProcess = spawn('python', [REMOVE_SUB_SCRIPT, inputPath, outputPath]);

        let outputData = '';

        pythonProcess.stdout.on('data', (data) => {
            outputData += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            // FFmpeg logs go to stderr
            console.log(`FFMPEG (Remove Subtitles): ${data}`);
        });

        pythonProcess.on('close', (code) => {
            console.log(`Remove subtitles script exited with code ${code}`);

            // Clean up original upload
            fs.unlink(inputPath, () => { });

            if (code !== 0) {
                return res.status(500).json({ error: 'Video subtitle removal failed' });
            }

            try {
                const result = JSON.parse(outputData);
                if (result.success) {
                    res.download(result.output_path, `nosubs-${req.file.originalname}`, (err) => {
                        if (err) console.error("Error sending file:", err);
                        fs.unlink(result.output_path, () => { });
                    });
                } else {
                    res.status(500).json(result);
                }
            } catch (e) {
                res.status(500).json({ error: 'Failed to parse script output: ' + outputData });
            }
        });

    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// --- NEW API ENDPOINT: Media Translator ---
app.post('/api/translate-media', upload.single('media'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No media file provided' });
        }

        const sourceLang = req.body.sourceLang || 'auto';
        const targetLang = req.body.targetLang || 'en';
        const burnSubtitles = req.body.burnSubtitles === 'true' ? 'true' : 'false';

        const inputPathWithoutExt = req.file.path;
        const originalExt = path.extname(req.file.originalname);
        const inputPath = inputPathWithoutExt + originalExt;

        // Rename the uploaded file so the python script can detect its format via extension
        fs.renameSync(inputPathWithoutExt, inputPath);

        // Output extension depends on whether we are burning subtitles into a video or just returning SRT
        let outputExt = originalExt;
        if (burnSubtitles === 'false') {
            outputExt = '.srt';
        }

        const outputPath = path.join(OUTPUT_DIR, `translated-${Date.now()}${outputExt}`);

        console.log(`Starting translation mapping for ${req.file.originalname} from ${sourceLang} to ${targetLang}`);

        const TRANSLATE_SCRIPT = path.join(__dirname, 'python', 'translate_media.py');
        const pythonProcess = spawn('python', [TRANSLATE_SCRIPT, inputPath, sourceLang, targetLang, burnSubtitles, outputPath]);

        let outputData = '';

        pythonProcess.stdout.on('data', (data) => {
            outputData += data.toString();
        });

        // Whisper and FFmpeg logs go here
        pythonProcess.stderr.on('data', (data) => {
            console.log(`Translation logs: ${data}`);
        });

        pythonProcess.on('close', (code) => {
            console.log(`Translate script exited with code ${code}`);

            // Clean up original upload
            fs.unlink(inputPath, () => { });

            let jsonOutput = outputData;
            // Attempt to extract JSON if whisper outputs extra logs to stdout
            const jsonStartIdx = outputData.lastIndexOf('{"success"');
            const jsonEndIdx = outputData.lastIndexOf('}');
            if (jsonStartIdx !== -1 && jsonEndIdx !== -1 && jsonEndIdx >= jsonStartIdx) {
                jsonOutput = outputData.substring(jsonStartIdx, jsonEndIdx + 1);
            }

            if (code !== 0) {
                try {
                    const result = JSON.parse(jsonOutput);
                    return res.status(500).json(result);
                } catch (e) {
                    return res.status(500).json({ error: 'Translation failed', details: outputData });
                }
            }

            try {
                const result = JSON.parse(jsonOutput);
                if (result.success) {
                    res.download(result.output_path, `translated-${req.file.originalname}${outputExt === '.srt' ? '.srt' : ''}`, (err) => {
                        if (err) console.error("Error sending file:", err);
                        fs.unlink(result.output_path, () => { });
                    });
                } else {
                    res.status(500).json(result);
                }
            } catch (e) {
                res.status(500).json({ error: 'Failed to parse script output: ' + outputData });
            }
        });

    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.listen(PORT, () => {
    console.log(`Backend API Gateway running on http://localhost:${PORT}`);
});
