#!/usr/bin/env node
/**
 * Render marketing/hero-video.html to a 1080x1920 MP4.
 *
 * Uses Puppeteer's CDP screencast to stream frames from headless Chrome at
 * the compositor's native rate, then ffmpeg encodes the JPEG sequence to MP4
 * at the actual capture FPS so playback speed matches the live page.
 *
 * Output: marketing/exports/fitz-hr-reel.mp4
 * Requires: node, puppeteer (auto-installed via npm), ffmpeg on PATH.
 */
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const { spawn } = require('child_process');

const STAGE_W = 1080;
const STAGE_H = 1920;
const TARGET_FPS = 30;          // output framerate
const DURATION_S = 14;          // matches the slot-machine loop interval

const OUT_DIR    = path.join(__dirname, 'exports');
const FRAMES_DIR = path.join(OUT_DIR, 'frames');
const OUT_FILE   = path.join(OUT_DIR, 'fitz-hr-reel.mp4');
const HTML_FILE  = path.join(__dirname, 'hero-video.html');

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

    const browser = await puppeteer.launch({
        headless: 'new',
        protocolTimeout: 300000,
        args: ['--font-render-hinting=none', '--disable-web-security']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: STAGE_W, height: STAGE_H, deviceScaleFactor: 1 });
    page.setDefaultNavigationTimeout(120000);

    const cdp = await page.createCDPSession();

    const url = pathToFileURL(HTML_FILE).href;
    console.log(`Loading ${url}`);
    await page.goto(url, { waitUntil: 'load' });
    await page.evaluateHandle('document.fonts.ready');
    await new Promise(r => setTimeout(r, 300));

    // Reload so animations restart at t=0 right before we start recording.
    await page.reload({ waitUntil: 'load' });
    await page.evaluateHandle('document.fonts.ready');

    let frameIndex = 0;
    cdp.on('Page.screencastFrame', async ({ data, sessionId }) => {
        const filePath = path.join(FRAMES_DIR, `frame-${String(frameIndex).padStart(5, '0')}.jpg`);
        fs.writeFileSync(filePath, Buffer.from(data, 'base64'));
        frameIndex++;
        if (frameIndex % 10 === 0) {
            process.stdout.write(`\r  frame ${frameIndex}`);
        }
        try {
            await cdp.send('Page.screencastFrameAck', { sessionId });
        } catch (_) { /* session may be closing */ }
    });

    console.log(`Recording for ${DURATION_S}s…`);
    const recordingStart = Date.now();
    await cdp.send('Page.startScreencast', {
        format: 'jpeg',
        quality: 95,
        everyNthFrame: 1
    });

    await new Promise(r => setTimeout(r, DURATION_S * 1000));

    await cdp.send('Page.stopScreencast');
    // Give pending frame acks a moment to drain.
    await new Promise(r => setTimeout(r, 250));
    const elapsed = (Date.now() - recordingStart) / 1000;
    const actualFps = frameIndex / elapsed;
    process.stdout.write('\n');
    console.log(`Captured ${frameIndex} frames in ${elapsed.toFixed(1)}s (${actualFps.toFixed(1)} fps)`);

    await browser.close();

    if (frameIndex < 30) {
        throw new Error(`Only ${frameIndex} frames captured — something went wrong.`);
    }

    console.log(`Encoding MP4 (input ${actualFps.toFixed(2)} fps, output ${TARGET_FPS} fps)…`);
    await new Promise((resolve, reject) => {
        const ff = spawn('ffmpeg', [
            '-y',
            // input frame rate matches actual capture rate so timing is real
            '-framerate', actualFps.toFixed(3),
            '-i', path.join(FRAMES_DIR, 'frame-%05d.jpg'),
            '-vf', `fps=${TARGET_FPS}`,
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
