#!/usr/bin/env node
/**
 * Render marketing/hero-video.html to a 1080x1920 MP4.
 *
 * Real-time screenshot loop in headless Chrome. Each frame is forced via
 * page.screenshot() so static periods (locked phrase) still produce frames.
 * ffmpeg encodes at the *actual* capture rate, then normalises to 30 fps,
 * so playback always matches live-page speed regardless of machine speed.
 *
 * Output: marketing/exports/fitz-hr-reel.mp4
 * Requires: node, puppeteer (auto-installed via npm), ffmpeg on PATH.
 */
const puppeteer = require('puppeteer');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { pathToFileURL } = require('url');
const { spawn } = require('child_process');

const STAGE_W = 1080;
const STAGE_H = 1920;
const TARGET_FPS = 24;          // realistic capture rate; output is normalised to 30
const OUTPUT_FPS = 30;
const DURATION_S = 14;          // matches the slot-machine loop interval
const FRAME_MS = 1000 / TARGET_FPS;

// CLI flags: --html=path, --out=path, --width=N, --height=N, --duration=N
const opts = {};
process.argv.slice(2).forEach(a => {
    const m = a.match(/^--([^=]+)=(.*)$/);
    if (m) opts[m[1]] = m[2];
});

const W = parseInt(opts.width)  || STAGE_W;
const H = parseInt(opts.height) || STAGE_H;
const D = parseInt(opts.duration) || DURATION_S;

const OUT_DIR    = path.join(__dirname, 'exports');
// Frames go to OS temp (not the project) so OneDrive / cloud-sync doesn't
// throttle every disk write. Only the final MP4 lands in the project.
const FRAMES_DIR = path.join(os.tmpdir(), `fitz-reel-frames-${process.pid}`);
const OUT_FILE   = path.resolve(opts.out  || path.join(OUT_DIR, 'fitz-hr-reel.mp4'));
const HTML_FILE  = path.resolve(opts.html || path.join(__dirname, 'hero-video.html'));

async function ensureFfmpeg() {
    return new Promise((resolve, reject) => {
        const test = spawn('ffmpeg', ['-version']);
        test.on('error', () => reject(new Error(
            'ffmpeg not found on PATH. Install it: https://ffmpeg.org/download.html ' +
            '(Windows: `winget install Gyan.FFmpeg`; macOS: `brew install ffmpeg`).'
        )));
        test.on('exit', code => code === 0 ? resolve() : reject(new Error('ffmpeg exited ' + code)));
    });
}

async function main() {
    await ensureFfmpeg();

    fs.rmSync(FRAMES_DIR, { recursive: true, force: true });
    fs.mkdirSync(FRAMES_DIR, { recursive: true });
    fs.mkdirSync(OUT_DIR, { recursive: true });
    console.log(`Frames staged in ${FRAMES_DIR}`);

    const browser = await puppeteer.launch({
        headless: 'new',
        protocolTimeout: 300000,
        args: [
            '--font-render-hinting=none',
            '--disable-web-security',
            '--disable-background-timer-throttling',
            '--disable-renderer-backgrounding',
            '--disable-backgrounding-occluded-windows',
            '--no-sandbox'
        ]
    });
    const page = await browser.newPage();
    await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
    page.setDefaultNavigationTimeout(120000);

    const url = pathToFileURL(HTML_FILE).href;
    console.log(`Loading ${url}`);
    await page.goto(url, { waitUntil: 'load' });
    await page.evaluateHandle('document.fonts.ready');
    await new Promise(r => setTimeout(r, 300));

    // Reload so animations restart at t=0 right before we start recording.
    await page.reload({ waitUntil: 'load' });
    await page.evaluateHandle('document.fonts.ready');

    console.log(`Recording ${W}x${H} for ${D}s at up to ${TARGET_FPS} fps…`);
    const recordingStart = Date.now();
    let i = 0;
    while (Date.now() - recordingStart < D * 1000) {
        const targetMs = i * FRAME_MS;
        const elapsed = Date.now() - recordingStart;
        const wait = targetMs - elapsed;
        if (wait > 0) await new Promise(r => setTimeout(r, wait));

        const filePath = path.join(FRAMES_DIR, `frame-${String(i).padStart(5, '0')}.jpg`);
        await page.screenshot({
            path: filePath,
            type: 'jpeg',
            quality: 95,
            captureBeyondViewport: false
        });
        i++;

        if (i % 10 === 0) {
            const secs = ((Date.now() - recordingStart) / 1000).toFixed(1);
            process.stdout.write(`\r  frame ${i} (${secs}s)`);
        }
    }
    const elapsed = (Date.now() - recordingStart) / 1000;
    const actualFps = i / elapsed;
    process.stdout.write('\n');
    console.log(`Captured ${i} frames in ${elapsed.toFixed(1)}s (${actualFps.toFixed(1)} fps)`);

    await browser.close();

    if (i < 30) {
        throw new Error(`Only ${i} frames captured — something went wrong.`);
    }

    console.log(`Encoding MP4 (input ${actualFps.toFixed(2)} fps → output ${OUTPUT_FPS} fps)…`);
    await new Promise((resolve, reject) => {
        const ff = spawn('ffmpeg', [
            '-y',
            '-framerate', actualFps.toFixed(3),
            '-i', path.join(FRAMES_DIR, 'frame-%05d.jpg'),
            '-vf', `fps=${OUTPUT_FPS}`,
            '-c:v', 'libx264',
            '-pix_fmt', 'yuv420p',
            '-crf', '18',
            '-preset', 'slow',
            '-movflags', '+faststart',
            OUT_FILE
        ], { stdio: 'inherit' });
        ff.on('exit', code => code === 0 ? resolve() : reject(new Error('ffmpeg exited ' + code)));
    });

    fs.rmSync(FRAMES_DIR, { recursive: true, force: true });

    const sizeMb = (fs.statSync(OUT_FILE).size / 1024 / 1024).toFixed(1);
    console.log(`\n✓ Wrote ${path.relative(process.cwd(), OUT_FILE)} (${sizeMb} MB)`);
}

main().catch(err => {
    console.error('\nRender failed:', err.message);
    process.exit(1);
});
