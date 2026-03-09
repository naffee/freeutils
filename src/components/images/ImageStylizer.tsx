import { useState, useRef, useEffect } from 'react';
import { Dropzone } from '../shared/Dropzone.tsx';
import { Download, SlidersHorizontal, RotateCcw } from 'lucide-react';

// --- GLSL Shaders ---

const vertexShaderSource = `
  attribute vec2 a_position;
  attribute vec2 a_texCoord;
  varying vec2 v_texCoord;
  void main() {
    // Map screen coordinates from [0, resolution] to [-1, 1] internally handles by viewport
    // actually, simpler: just draw a full screen quad mapping [-1, 1] directly
    gl_Position = vec4(a_position, 0.0, 1.0);
    v_texCoord = a_texCoord;
  }
`;

const fragmentShaderSource = `
  precision mediump float;
  uniform sampler2D u_image;
  uniform vec2 u_resolution; // texture size (w, h)
  
  // User controlled uniforms
  uniform float u_edgeIntensity; // 0.0 to 2.0+
  uniform float u_colorLevels;   // 2.0 to 16.0
  uniform float u_styleMode;     // 0.0 = Cartoon, 1.0 = Sketch, 2.0 = Neon, 3.0 = Emboss

  varying vec2 v_texCoord;

  void main() {
    vec2 texel = vec2(1.0 / u_resolution.x, 1.0 / u_resolution.y);
    
    // Sample a 3x3 grid around the current pixel for Sobel edge detection
    vec3 tl = texture2D(u_image, v_texCoord + vec2(-texel.x, -texel.y)).rgb;
    vec3 tc = texture2D(u_image, v_texCoord + vec2(0.0, -texel.y)).rgb;
    vec3 tr = texture2D(u_image, v_texCoord + vec2(texel.x, -texel.y)).rgb;
    
    vec3 cl = texture2D(u_image, v_texCoord + vec2(-texel.x, 0.0)).rgb;
    vec3 cc = texture2D(u_image, v_texCoord).rgb;
    vec3 cr = texture2D(u_image, v_texCoord + vec2(texel.x, 0.0)).rgb;
    
    vec3 bl = texture2D(u_image, v_texCoord + vec2(-texel.x, texel.y)).rgb;
    vec3 bc = texture2D(u_image, v_texCoord + vec2(0.0, texel.y)).rgb;
    vec3 br = texture2D(u_image, v_texCoord + vec2(texel.x, texel.y)).rgb;

    // Convert to grayscale for edge detection (Luma)
    vec3 luma = vec3(0.299, 0.587, 0.114);
    float l_tl = dot(tl, luma);
    float l_tc = dot(tc, luma);
    float l_tr = dot(tr, luma);
    float l_cl = dot(cl, luma);
    float l_cc = dot(cc, luma);
    float l_cr = dot(cr, luma);
    float l_bl = dot(bl, luma);
    float l_bc = dot(bc, luma);
    float l_br = dot(br, luma);

    // Sobel filters
    float dx = (l_tr + 2.0 * l_cr + l_br) - (l_tl + 2.0 * l_cl + l_bl);
    float dy = (l_bl + 2.0 * l_bc + l_br) - (l_tl + 2.0 * l_tc + l_tr);
    float mag = length(vec2(dx, dy));
    
    // Threshold edge
    float edge = 1.0 - smoothstep(0.1, 0.5, mag * u_edgeIntensity);

    if (u_styleMode > 2.5) {
        // --- Emboss Mode ---
        vec3 diff = bl - tr; // Diagonal difference
        float emboss = dot(diff, vec3(0.333)) * u_edgeIntensity + 0.5;
        // Mix base color slightly to retain a subtle tint
        vec3 embossColor = vec3(emboss) + (cc * 0.2);
        gl_FragColor = vec4(embossColor, 1.0);
    } else if (u_styleMode > 1.5) {
        // --- Neon Edge Mode ---
        // Bright saturated true-color outline on dark background
        vec3 neonColor = cc * (mag * u_edgeIntensity * 3.0);
        gl_FragColor = vec4(neonColor, 1.0);
    } else if (u_styleMode > 0.5) {
        // --- Sketch Mode ---
        // Black lines on white background
        vec3 sketchColor = vec3(edge);
        gl_FragColor = vec4(sketchColor, 1.0);
    } else {
        // --- Cartoon Mode (Kuwahara-like Painterly Effect) ---
        // Instead of just quantizing a single pixel, we sample a slightly wider area 
        // to flatten textures and remove noise while preserving hard edges.
        
        // Sample surrounding pixels for smoothing
        vec3 tll = texture2D(u_image, v_texCoord + vec2(-texel.x*2.0, -texel.y*2.0)).rgb;
        vec3 ttt = texture2D(u_image, v_texCoord + vec2(0.0, -texel.y*2.0)).rgb;
        vec3 trr = texture2D(u_image, v_texCoord + vec2(texel.x*2.0, -texel.y*2.0)).rgb;
        
        vec3 lll = texture2D(u_image, v_texCoord + vec2(-texel.x*2.0, 0.0)).rgb;
        vec3 rrr = texture2D(u_image, v_texCoord + vec2(texel.x*2.0, 0.0)).rgb;
        
        vec3 bll = texture2D(u_image, v_texCoord + vec2(-texel.x*2.0, texel.y*2.0)).rgb;
        vec3 bbb = texture2D(u_image, v_texCoord + vec2(0.0, texel.y*2.0)).rgb;
        vec3 brr = texture2D(u_image, v_texCoord + vec2(texel.x*2.0, texel.y*2.0)).rgb;

        // Calculate regional means
        vec3 mean1 = (tl + tc + cl + cc + tll + ttt + lll) / 7.0;
        vec3 mean2 = (tc + tr + cc + cr + ttt + trr + rrr) / 7.0;
        vec3 mean3 = (cl + cc + bl + bc + lll + bll + bbb) / 7.0;
        vec3 mean4 = (cc + cr + bc + br + rrr + brr + bbb) / 7.0;

        // Calculate regional variances (simplified as absolute difference from center)
        float var1 = length(tl - cc) + length(tc - cc) + length(cl - cc);
        float var2 = length(tc - cc) + length(tr - cc) + length(cr - cc);
        float var3 = length(cl - cc) + length(bl - cc) + length(bc - cc);
        float var4 = length(cr - cc) + length(bc - cc) + length(br - cc);

        // Select the mean of the region with the lowest variance (flattest area)
        vec3 flatColor = mean1;
        float minVar = var1;

        if (var2 < minVar) { flatColor = mean2; minVar = var2; }
        if (var3 < minVar) { flatColor = mean3; minVar = var3; }
        if (var4 < minVar) { flatColor = mean4; minVar = var4; }

        // Boost saturation slightly on the flattened color
        float lumaFlat = dot(flatColor, luma);
        flatColor = mix(vec3(lumaFlat), flatColor, 1.2); 

        // Quantize the flattened color
        vec3 quantized = floor(flatColor * u_colorLevels) / u_colorLevels;
        
        // Multiply by edge
        vec3 cartoonColor = quantized * edge;
        gl_FragColor = vec4(cartoonColor, 1.0);
    }
  }
`;

// Helper WebGL Functions
function createShader(gl: WebGLRenderingContext, type: number, source: string) {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

function createProgram(gl: WebGLRenderingContext, vertexShader: WebGLShader, fragmentShader: WebGLShader) {
    const program = gl.createProgram();
    if (!program) return null;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error(gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
        return null;
    }
    return program;
}

export function ImageStylizer() {
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [originalUrl, setOriginalUrl] = useState<string | null>(null);
    const [outputUrl, setOutputUrl] = useState<string | null>(null);

    // Filter State
    const [styleMode, setStyleMode] = useState<'cartoon' | 'sketch' | 'neon' | 'emboss'>('cartoon');
    const [edgeIntensity, setEdgeIntensity] = useState(1.5);
    const [colorLevels, setColorLevels] = useState(6.0);

    // UI State
    const [comparePosition, setComparePosition] = useState<number>(50);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [imageObj, setImageObj] = useState<HTMLImageElement | null>(null);

    const handleFileSelect = (file: File) => {
        setImageFile(file);
        const url = URL.createObjectURL(file);
        setOriginalUrl(url);
        setOutputUrl(null);
        setComparePosition(50);

        const img = new Image();
        img.onload = () => {
            setImageObj(img);
        };
        img.src = url;
    };

    // Main WebGL rendering loop
    useEffect(() => {
        if (!imageObj || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const gl = canvas.getContext('webgl', { preserveDrawingBuffer: true });
        if (!gl) {
            console.error("WebGL not supported");
            return;
        }

        // 1. Setup Canvas Size
        canvas.width = imageObj.width;
        canvas.height = imageObj.height;
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        // 2. Compile Shaders
        const vert = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
        const frag = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
        if (!vert || !frag) return;
        const program = createProgram(gl, vert, frag);
        if (!program) return;
        gl.useProgram(program);

        // 3. Setup Geometry (Full Screen Quad)
        const vertices = new Float32Array([
            -1, -1, 0, 0, // Bottom Left (x: -1, y: -1), (u: 0, v: 0)
            1, -1, 1, 0, // Bottom Right
            -1, 1, 0, 1, // Top Left
            1, 1, 1, 1, // Top Right
        ]);

        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

        const a_position = gl.getAttribLocation(program, "a_position");
        const a_texCoord = gl.getAttribLocation(program, "a_texCoord");

        // Stride is 4 floats (16 bytes)
        gl.enableVertexAttribArray(a_position);
        gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 16, 0);

        gl.enableVertexAttribArray(a_texCoord);
        gl.vertexAttribPointer(a_texCoord, 2, gl.FLOAT, false, 16, 8); // offset by 2 floats (8 bytes)

        // 4. Setup Texture
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);

        // Disable mipmaps and set wrapping to clamp to edge so texture sizes don't need to be powers of 2
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

        // Fix upside down images (WebGL texture origin is bottom-left, but image origin is top-left)
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

        // Upload image to GPU
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imageObj);

        // 5. Setup Uniforms
        const u_resolution = gl.getUniformLocation(program, "u_resolution");
        gl.uniform2f(u_resolution, imageObj.width, imageObj.height);

        const u_edgeIntensity = gl.getUniformLocation(program, "u_edgeIntensity");
        gl.uniform1f(u_edgeIntensity, edgeIntensity);

        const u_colorLevels = gl.getUniformLocation(program, "u_colorLevels");
        gl.uniform1f(u_colorLevels, colorLevels);

        const u_styleMode = gl.getUniformLocation(program, "u_styleMode");
        let styleModeFloat = 0.0;
        if (styleMode === 'sketch') styleModeFloat = 1.0;
        if (styleMode === 'neon') styleModeFloat = 2.0;
        if (styleMode === 'emboss') styleModeFloat = 3.0;
        gl.uniform1f(u_styleMode, styleModeFloat);

        // 6. Draw
        // A full screen quad is rendered using a TRIANGLE_STRIP
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        // 7. Extract Data URI for preview layer masking
        // We use preserveDrawingBuffer: true so we can extract it cleanly
        const upscaledSrc = canvas.toDataURL('image/png');
        setOutputUrl(upscaledSrc);

    }, [imageObj, styleMode, edgeIntensity, colorLevels]);


    const handleDownload = () => {
        if (!outputUrl) return;
        const link = document.createElement('a');
        link.href = outputUrl;
        link.download = `styled_${styleMode}_${imageFile?.name || 'image.png'}`;
        link.click();
    };

    if (!originalUrl) {
        return (
            <div className="watermark-remover">
            <div className="seo-writeup">
                <h2>Image Stylizer (GPU)</h2>
                <p>Apply stunning artistic styles and effects to your photos using blazing-fast GPU processing.</p>
            </div>
                <Dropzone onFileSelect={handleFileSelect} accept="image/*" title="Drop an image to Cartoonize it" />
            </div>
        );
    }

    return (
        <div className="watermark-remover">
            <div className="seo-writeup">
                <h2>Image Stylizer (GPU)</h2>
                <p>Apply stunning artistic styles and effects to your photos using blazing-fast GPU processing.</p>
            </div>
            {/* Hidden actual drawing canvas */}
            <canvas ref={canvasRef} style={{ display: 'none' }} />

            <div className="editor-container" style={{ maxWidth: '1000px', margin: '0 auto' }}>
                <div style={{ display: 'flex', gap: '2rem', width: '100%', alignItems: 'stretch' }}>

                    {/* Left Column: Image Preview */}
                    <div style={{ flex: 1.5, display: 'flex', flexDirection: 'column', background: '#f8fafc', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>

                        {/* Interactive Preview Layer */}
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px', position: 'relative' }}>
                            <div style={{ position: 'relative', display: 'inline-block', maxWidth: '100%', maxHeight: '600px', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>

                                {/* Bottom Image (Styled Result) */}
                                {outputUrl ? (
                                    <img
                                        src={outputUrl}
                                        alt="Styled Preview"
                                        style={{
                                            maxWidth: '100%',
                                            maxHeight: '600px',
                                            display: 'block',
                                            position: 'relative',
                                            zIndex: 1
                                        }}
                                    />
                                ) : undefined}

                                {/* Top Image (Original Image) masked by comparePosition */}
                                <img
                                    src={originalUrl}
                                    alt="Original Preview"
                                    style={{
                                        position: outputUrl ? 'absolute' : 'relative',
                                        top: 0,
                                        left: 0,
                                        maxWidth: '100%',
                                        maxHeight: '600px',
                                        display: 'block',
                                        clipPath: outputUrl ? `polygon(0 0, ${comparePosition}% 0, ${comparePosition}% 100%, 0 100%)` : 'none',
                                        zIndex: 2
                                    }}
                                />

                                {/* Compare Slider Line & Handle */}
                                {outputUrl && (
                                    <div style={{
                                        position: 'absolute',
                                        top: 0,
                                        bottom: 0,
                                        left: `${comparePosition}%`,
                                        width: '2px',
                                        background: 'white',
                                        transform: 'translateX(-50%)',
                                        pointerEvents: 'none',
                                        boxShadow: '0 0 10px rgba(0,0,0,0.3)',
                                        zIndex: 5,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        <div style={{ width: '28px', height: '28px', background: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.3)', color: '#8b5cf6' }}>
                                            <SlidersHorizontal size={14} />
                                        </div>
                                    </div>
                                )}

                                {/* Invisible Slider Input for Interaction */}
                                {outputUrl && (
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={comparePosition}
                                        onChange={(e) => setComparePosition(parseInt(e.target.value))}
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: '100%',
                                            height: '100%',
                                            opacity: 0,
                                            cursor: 'ew-resize',
                                            zIndex: 10,
                                            margin: 0
                                        }}
                                    />
                                )}
                            </div>
                        </div>

                    </div>

                    {/* Right Column: Controls */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                        <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <h4 style={{ margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                GPU Shader Settings
                            </h4>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                <button
                                    className={`btn-secondary ${styleMode === 'cartoon' ? 'active' : ''}`}
                                    onClick={() => setStyleMode('cartoon')}
                                    style={{ borderColor: styleMode === 'cartoon' ? '#8b5cf6' : '', background: styleMode === 'cartoon' ? '#f5f3ff' : '' }}
                                >
                                    Cartoon
                                </button>
                                <button
                                    className={`btn-secondary ${styleMode === 'sketch' ? 'active' : ''}`}
                                    onClick={() => setStyleMode('sketch')}
                                    style={{ borderColor: styleMode === 'sketch' ? '#8b5cf6' : '', background: styleMode === 'sketch' ? '#f5f3ff' : '' }}
                                >
                                    Sketch
                                </button>
                                <button
                                    className={`btn-secondary ${styleMode === 'neon' ? 'active' : ''}`}
                                    onClick={() => setStyleMode('neon')}
                                    style={{ borderColor: styleMode === 'neon' ? '#8b5cf6' : '', background: styleMode === 'neon' ? '#f5f3ff' : '' }}
                                >
                                    Neon Edge
                                </button>
                                <button
                                    className={`btn-secondary ${styleMode === 'emboss' ? 'active' : ''}`}
                                    onClick={() => setStyleMode('emboss')}
                                    style={{ borderColor: styleMode === 'emboss' ? '#8b5cf6' : '', background: styleMode === 'emboss' ? '#f5f3ff' : '' }}
                                >
                                    Emboss
                                </button>
                            </div>

                            <div>
                                <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600, color: '#64748b', marginBottom: '0.5rem' }}>
                                    <span>Edge Outline Intensity</span>
                                    <span>{edgeIntensity.toFixed(1)}</span>
                                </label>
                                <input
                                    type="range" min="0.5" max="3.0" step="0.1"
                                    value={edgeIntensity}
                                    onChange={(e) => setEdgeIntensity(parseFloat(e.target.value))}
                                    style={{ width: '100%', accentColor: '#8b5cf6' }}
                                />
                            </div>

                            {styleMode === 'cartoon' && (
                                <div>
                                    <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600, color: '#64748b', marginBottom: '0.5rem' }}>
                                        <span>Color Detail Levels</span>
                                        <span>{colorLevels}</span>
                                    </label>
                                    <input
                                        type="range" min="2" max="12" step="1"
                                        value={colorLevels}
                                        onChange={(e) => setColorLevels(parseFloat(e.target.value))}
                                        style={{ width: '100%', accentColor: '#8b5cf6' }}
                                    />
                                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.5rem', lineHeight: 1.4 }}>
                                        Lower values create flat comic-book colors. Higher values preserve gradients.
                                    </div>
                                </div>
                            )}

                            <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.5rem', background: '#ecfdf5', borderRadius: '6px', border: '1px solid #d1fae5' }}>
                                ✨ Hardware Accelerated (60fps)
                            </div>
                        </div>


                        {/* Action Buttons */}
                        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <button className="btn-secondary" onClick={() => { setOriginalUrl(null); setImageFile(null); setOutputUrl(null); }} style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                                <RotateCcw size={16} /> Choose New Image
                            </button>
                            <button className="btn-primary" onClick={handleDownload} disabled={!outputUrl} style={{ background: '#22c55e', color: '#000', boxShadow: 'none', opacity: (!outputUrl) ? 0.5 : 1, width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                                <Download size={16} /> Save Graphic
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
