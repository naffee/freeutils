import{r as i,j as t,am as N,a4 as M,a3 as G}from"./react-vendor-52AJFgJq.js";import{D as B}from"./Dropzone-Ci9pT7s1.js";const O=`
  attribute vec2 a_position;
  attribute vec2 a_texCoord;
  varying vec2 v_texCoord;
  void main() {
    // Map screen coordinates from [0, resolution] to [-1, 1] internally handles by viewport
    // actually, simpler: just draw a full screen quad mapping [-1, 1] directly
    gl_Position = vec4(a_position, 0.0, 1.0);
    v_texCoord = a_texCoord;
  }
`,X=`
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
`;function j(o,d,u){const r=o.createShader(d);return r?(o.shaderSource(r,u),o.compileShader(r),o.getShaderParameter(r,o.COMPILE_STATUS)?r:(console.error(o.getShaderInfoLog(r)),o.deleteShader(r),null)):null}function W(o,d,u){const r=o.createProgram();return r?(o.attachShader(r,d),o.attachShader(r,u),o.linkProgram(r),o.getProgramParameter(r,o.LINK_STATUS)?r:(console.error(o.getProgramInfoLog(r)),o.deleteProgram(r),null)):null}function $(){const[o,d]=i.useState(null),[u,r]=i.useState(null),[n,h]=i.useState(null),[l,x]=i.useState("cartoon"),[g,E]=i.useState(1.5),[f,w]=i.useState(6),[v,y]=i.useState(50),p=i.useRef(null),[c,T]=i.useState(null),D=a=>{d(a);const e=URL.createObjectURL(a);r(e),h(null),y(50);const m=new Image;m.onload=()=>{T(m)},m.src=e};i.useEffect(()=>{if(!c||!p.current)return;const a=p.current,e=a.getContext("webgl",{preserveDrawingBuffer:!0});if(!e){console.error("WebGL not supported");return}a.width=c.width,a.height=c.height,e.viewport(0,0,e.canvas.width,e.canvas.height);const m=j(e,e.VERTEX_SHADER,O),_=j(e,e.FRAGMENT_SHADER,X);if(!m||!_)return;const s=W(e,m,_);if(!s)return;e.useProgram(s);const R=new Float32Array([-1,-1,0,0,1,-1,1,0,-1,1,0,1,1,1,1,1]),k=e.createBuffer();e.bindBuffer(e.ARRAY_BUFFER,k),e.bufferData(e.ARRAY_BUFFER,R,e.STATIC_DRAW);const C=e.getAttribLocation(s,"a_position"),S=e.getAttribLocation(s,"a_texCoord");e.enableVertexAttribArray(C),e.vertexAttribPointer(C,2,e.FLOAT,!1,16,0),e.enableVertexAttribArray(S),e.vertexAttribPointer(S,2,e.FLOAT,!1,16,8);const A=e.createTexture();e.bindTexture(e.TEXTURE_2D,A),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.NEAREST),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.NEAREST),e.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,!0),e.texImage2D(e.TEXTURE_2D,0,e.RGBA,e.RGBA,e.UNSIGNED_BYTE,c);const P=e.getUniformLocation(s,"u_resolution");e.uniform2f(P,c.width,c.height);const L=e.getUniformLocation(s,"u_edgeIntensity");e.uniform1f(L,g);const U=e.getUniformLocation(s,"u_colorLevels");e.uniform1f(U,f);const z=e.getUniformLocation(s,"u_styleMode");let b=0;l==="sketch"&&(b=1),l==="neon"&&(b=2),l==="emboss"&&(b=3),e.uniform1f(z,b),e.drawArrays(e.TRIANGLE_STRIP,0,4);const F=a.toDataURL("image/png");h(F)},[c,l,g,f]);const I=()=>{if(!n)return;const a=document.createElement("a");a.href=n,a.download=`styled_${l}_${o?.name||"image.png"}`,a.click()};return u?t.jsxs("div",{className:"watermark-remover",children:[t.jsxs("div",{className:"seo-writeup",children:[t.jsx("h2",{children:"Image Stylizer (GPU)"}),t.jsx("p",{children:"Apply stunning artistic styles and effects to your photos using blazing-fast GPU processing."})]}),t.jsx("canvas",{ref:p,style:{display:"none"}}),t.jsx("div",{className:"editor-container",style:{maxWidth:"1000px",margin:"0 auto"},children:t.jsxs("div",{style:{display:"flex",gap:"2rem",width:"100%",alignItems:"stretch"},children:[t.jsx("div",{style:{flex:1.5,display:"flex",flexDirection:"column",background:"#f8fafc",padding:"1.5rem",borderRadius:"16px",border:"1px solid #e2e8f0"},children:t.jsx("div",{style:{flex:1,display:"flex",alignItems:"center",justifyContent:"center",minHeight:"400px",position:"relative"},children:t.jsxs("div",{style:{position:"relative",display:"inline-block",maxWidth:"100%",maxHeight:"600px",borderRadius:"12px",overflow:"hidden",boxShadow:"0 10px 30px rgba(0,0,0,0.1)"},children:[n?t.jsx("img",{src:n,alt:"Styled Preview",style:{maxWidth:"100%",maxHeight:"600px",display:"block",position:"relative",zIndex:1}}):void 0,t.jsx("img",{src:u,alt:"Original Preview",style:{position:n?"absolute":"relative",top:0,left:0,maxWidth:"100%",maxHeight:"600px",display:"block",clipPath:n?`polygon(0 0, ${v}% 0, ${v}% 100%, 0 100%)`:"none",zIndex:2}}),n&&t.jsx("div",{style:{position:"absolute",top:0,bottom:0,left:`${v}%`,width:"2px",background:"white",transform:"translateX(-50%)",pointerEvents:"none",boxShadow:"0 0 10px rgba(0,0,0,0.3)",zIndex:5,display:"flex",alignItems:"center",justifyContent:"center"},children:t.jsx("div",{style:{width:"28px",height:"28px",background:"white",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 2px 6px rgba(0,0,0,0.3)",color:"#8b5cf6"},children:t.jsx(N,{size:14})})}),n&&t.jsx("input",{type:"range",min:"0",max:"100",value:v,onChange:a=>y(parseInt(a.target.value)),style:{position:"absolute",top:0,left:0,width:"100%",height:"100%",opacity:0,cursor:"ew-resize",zIndex:10,margin:0}})]})})}),t.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",gap:"1.5rem"},children:[t.jsxs("div",{style:{background:"#ffffff",padding:"1.25rem",borderRadius:"12px",border:"1px solid #e2e8f0",display:"flex",flexDirection:"column",gap:"1.25rem"},children:[t.jsx("h4",{style:{margin:0,color:"#0f172a",display:"flex",alignItems:"center",gap:"0.5rem"},children:"GPU Shader Settings"}),t.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.5rem"},children:[t.jsx("button",{className:`btn-secondary ${l==="cartoon"?"active":""}`,onClick:()=>x("cartoon"),style:{borderColor:l==="cartoon"?"#8b5cf6":"",background:l==="cartoon"?"#f5f3ff":""},children:"Cartoon"}),t.jsx("button",{className:`btn-secondary ${l==="sketch"?"active":""}`,onClick:()=>x("sketch"),style:{borderColor:l==="sketch"?"#8b5cf6":"",background:l==="sketch"?"#f5f3ff":""},children:"Sketch"}),t.jsx("button",{className:`btn-secondary ${l==="neon"?"active":""}`,onClick:()=>x("neon"),style:{borderColor:l==="neon"?"#8b5cf6":"",background:l==="neon"?"#f5f3ff":""},children:"Neon Edge"}),t.jsx("button",{className:`btn-secondary ${l==="emboss"?"active":""}`,onClick:()=>x("emboss"),style:{borderColor:l==="emboss"?"#8b5cf6":"",background:l==="emboss"?"#f5f3ff":""},children:"Emboss"})]}),t.jsxs("div",{children:[t.jsxs("label",{style:{display:"flex",justifyContent:"space-between",fontSize:"0.85rem",fontWeight:600,color:"#64748b",marginBottom:"0.5rem"},children:[t.jsx("span",{children:"Edge Outline Intensity"}),t.jsx("span",{children:g.toFixed(1)})]}),t.jsx("input",{type:"range",min:"0.5",max:"3.0",step:"0.1",value:g,onChange:a=>E(parseFloat(a.target.value)),style:{width:"100%",accentColor:"#8b5cf6"}})]}),l==="cartoon"&&t.jsxs("div",{children:[t.jsxs("label",{style:{display:"flex",justifyContent:"space-between",fontSize:"0.85rem",fontWeight:600,color:"#64748b",marginBottom:"0.5rem"},children:[t.jsx("span",{children:"Color Detail Levels"}),t.jsx("span",{children:f})]}),t.jsx("input",{type:"range",min:"2",max:"12",step:"1",value:f,onChange:a=>w(parseFloat(a.target.value)),style:{width:"100%",accentColor:"#8b5cf6"}}),t.jsx("div",{style:{fontSize:"0.75rem",color:"#94a3b8",marginTop:"0.5rem",lineHeight:1.4},children:"Lower values create flat comic-book colors. Higher values preserve gradients."})]}),t.jsx("div",{style:{fontSize:"0.75rem",color:"#10b981",marginTop:"0.5rem",display:"flex",alignItems:"center",gap:"0.25rem",padding:"0.5rem",background:"#ecfdf5",borderRadius:"6px",border:"1px solid #d1fae5"},children:"✨ Hardware Accelerated (60fps)"})]}),t.jsxs("div",{style:{marginTop:"auto",display:"flex",flexDirection:"column",gap:"0.75rem"},children:[t.jsxs("button",{className:"btn-secondary",onClick:()=>{r(null),d(null),h(null)},style:{width:"100%",display:"flex",justifyContent:"center",alignItems:"center",gap:"0.5rem"},children:[t.jsx(M,{size:16})," Choose New Image"]}),t.jsxs("button",{className:"btn-primary",onClick:I,disabled:!n,style:{background:"#22c55e",color:"#000",boxShadow:"none",opacity:n?1:.5,width:"100%",display:"flex",justifyContent:"center",alignItems:"center",gap:"0.5rem"},children:[t.jsx(G,{size:16})," Save Graphic"]})]})]})]})})]}):t.jsxs("div",{className:"watermark-remover",children:[t.jsxs("div",{className:"seo-writeup",children:[t.jsx("h2",{children:"Image Stylizer (GPU)"}),t.jsx("p",{children:"Apply stunning artistic styles and effects to your photos using blazing-fast GPU processing."})]}),t.jsx(B,{onFileSelect:D,accept:"image/*",title:"Drop an image to Cartoonize it"})]})}export{$ as ImageStylizer};
