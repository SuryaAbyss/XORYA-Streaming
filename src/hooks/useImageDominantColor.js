/**
 * useImageDominantColor
 * Extracts the dominant color from a movie poster/backdrop image
 * by sampling a small canvas. Used to drive the hover glow effect on cards.
 */

const colorCache = new Map();

/**
 * Extracts the dominant RGB color from an image via canvas sampling.
 * Returns a CSS rgb() string, or null on failure.
 */
export async function extractDominantColor(src) {
    if (!src) return null;
    if (colorCache.has(src)) return colorCache.get(src);

    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';

        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                canvas.width = 16;
                canvas.height = 9;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, 16, 9);

                const data = ctx.getImageData(0, 0, 16, 9).data;
                let r = 0, g = 0, b = 0, count = 0;

                for (let i = 0; i < data.length; i += 4) {
                    const pr = data[i], pg = data[i + 1], pb = data[i + 2];
                    const brightness = (pr + pg + pb) / 3;
                    if (brightness < 30 || brightness > 220) continue;
                    r += pr; g += pg; b += pb;
                    count++;
                }

                if (count === 0) { colorCache.set(src, null); resolve(null); return; }

                r = Math.round(r / count);
                g = Math.round(g / count);
                b = Math.round(b / count);

                // Boost saturation so muted images still glow
                const max = Math.max(r, g, b);
                const min = Math.min(r, g, b);
                const satBoost = 1.5;
                const mid = (max + min) / 2;
                r = Math.min(255, Math.round(mid + (r - mid) * satBoost));
                g = Math.min(255, Math.round(mid + (g - mid) * satBoost));
                b = Math.min(255, Math.round(mid + (b - mid) * satBoost));

                const color = `rgb(${r}, ${g}, ${b})`;
                colorCache.set(src, color);
                resolve(color);
            } catch {
                colorCache.set(src, null);
                resolve(null);
            }
        };

        img.onerror = () => { colorCache.set(src, null); resolve(null); };
        img.src = src;
    });
}
