/**
 * Utility to render a code snippet into an image using Canvas API.
 */

interface CodeTheme {
    background: string;
    text: string;
    comment: string;
    keyword: string;
    string: string;
    function: string;
    variable: string;
    fontFamily: string;
}

const defaultTheme: CodeTheme = {
    background: '#0f172a',
    text: '#f8fafc',
    comment: '#64748b',
    keyword: '#38bdf8',
    string: '#22c55e',
    function: '#fbbf24',
    variable: '#f472b6',
    fontFamily: '"JetBrains Mono", "Fira Code", monospace'
};

function tokenize(code: string): { type: keyof CodeTheme | 'text'; value: string }[] {
    const tokens: { type: keyof CodeTheme | 'text'; value: string }[] = [];
    const patterns = [
        { type: 'comment' as const, regex: /\/\/.*|\/\*[\s\S]*?\*\// },
        { type: 'string' as const, regex: /(["'])(?:(?=(\\?))\2.)*?\1/ },
        { type: 'keyword' as const, regex: /\b(const|let|var|function|return|if|else|for|while|import|from|export|default|class|extends|new|try|catch|async|await|type|interface|enum)\b/ },
        { type: 'function' as const, regex: /\b[a-zA-Z_]\w*(?=\()/ },
        { type: 'variable' as const, regex: /\b[a-zA-Z_]\w*\b/ },
    ];

    let remaining = code;
    while (remaining) {
        let matched = false;
        for (const pattern of patterns) {
            const match = pattern.regex.exec(remaining);
            if (match && match.index === 0) {
                tokens.push({ type: pattern.type, value: match[0] });
                remaining = remaining.slice(match[0].length);
                matched = true;
                break;
            }
        }

        if (!matched) {
            tokens.push({ type: 'text', value: remaining[0] });
            remaining = remaining.slice(1);
        }
    }

    return tokens;
}

export async function renderCodeToBlob(
    code: string, 
    fileName: string = 'index.js',
    width: number = 1080, 
    height: number = 1080
): Promise<Blob> {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');

    const theme = defaultTheme;
    const padding = 60;
    const borderRadius = 24;
    const headerHeight = 60;

    // Fill background
    ctx.fillStyle = '#1e293b'; // Outer background
    ctx.fillRect(0, 0, width, height);

    // Draw Editor Window
    const winX = padding;
    const winY = padding;
    const winW = width - padding * 2;
    const winH = height - padding * 2;

    // Window Shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowBlur = 40;
    ctx.shadowOffsetY = 20;

    ctx.fillStyle = theme.background;
    ctx.beginPath();
    ctx.roundRect(winX, winY, winW, winH, borderRadius);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // Header / Title Bar
    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.beginPath();
    ctx.roundRect(winX, winY, winW, headerHeight, [borderRadius, borderRadius, 0, 0]);
    ctx.fill();

    // Window Controls (dots)
    const dotRadius = 6;
    const dotGap = 20;
    const dotStartX = winX + 25;
    const dotY = winY + headerHeight / 2;

    ['#ff5f56', '#ffbd2e', '#27c93f'].forEach((color, i) => {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(dotStartX + i * dotGap, dotY, dotRadius, 0, Math.PI * 2);
        ctx.fill();
    });

    // Filename
    ctx.fillStyle = theme.comment;
    ctx.font = `500 16px ${theme.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.fillText(fileName, winX + winW / 2, dotY + 6);

    // Render Code
    ctx.textAlign = 'left';
    ctx.font = `18px ${theme.fontFamily}`;
    const lineHeight = 28;
    const startX = winX + 30;
    const startY = winY + headerHeight + 40;

    const tokens = tokenize(code);
    let curX = startX;
    let curY = startY;

    for (const token of tokens) {
        if (token.value === '\n') {
            curX = startX;
            curY += lineHeight;
            continue;
        }

        ctx.fillStyle = theme[token.type as keyof CodeTheme] || theme.text;
        ctx.fillText(token.value, curX, curY);
        curX += ctx.measureText(token.value).width;

        // Wrap lines if they exceed window width (optional, basic)
        if (curX > winX + winW - 30) {
            curX = startX;
            curY += lineHeight;
        }
    }

    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Canvas toBlob failed'));
        }, 'image/png');
    });
}
