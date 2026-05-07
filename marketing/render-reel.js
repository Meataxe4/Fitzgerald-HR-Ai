#!/usr/bin/env node
/**
 * Render marketing/hero-video.html to a 1080x1920 MP4.
 *
 * Uses Puppeteer with Chrome's virtual-time control so animations advance
 * deterministically (one frame == one tick), then ffmpeg encodes the PNG
 * sequence to MP4. Output: marketing/exports/fitz-hr-reel.mp4
 *
 * Requires: node, puppeteer (auto-installed via npm), and ffmpeg on PATH.
 */
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const STAGE_W = 1080;
const STAGE_H = 1920;
const FPS = 30;
const DURATION_S = 14;          // matches the slot-machine loop interval
const FRAME_MS = 1000 / FPS;
const TOTAL_FRAMES = FPS * DURATION_S;

const OUT_DIR    = path.join(__dirname, 'exports');
const FRAMES_DIR = path.join(OUT_DIR, 'frames');
const OUT_FILE   = path.join(OUT_DIR, 'fitz-hr-reel.mp4');
const HTML_FILE  = path.join(__dirname, 'hero-video.html');

async function ensureFfmpeg() {
    return new Promise((resolve, reject) => {
        const test = spawn('ffmpeg', ['-version']);
        test.on('error', () => reject(new Error(
            'ffmpeg not found on PATH. Install it: https://ffmpeg.org/download.html ' +
            '(Windows: `winget install ffmpeg`; macOS: `brew install ffmpeg`).'
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
        args: ['--font-render-hinting=none', '--disable-web-security']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: STAGE_W, height: STAGE_H, deviceScaleFactor: 1 });
    page.setDefaultNavigationTimeout(120000);

    const cdp = await page.createCDPSession();

    // Navigate FIRST under normal real time so the load event + webfonts can
    // resolve. Pausing virtual time before navigation deadlocks the load.
    const url = 'file://' + HTML_FILE.replace(/\\/g, '/');
    await page.goto(url, { waitUntil: 'load', timeout: 120000 });
    await page.evaluateHandle('document.fonts.ready');

    // Reload with virtual time paused so animations restart at t=0 and we can
    // step through them deterministically. We use 'advance' with a budget per
    // step; when the budget expires the policy auto-pauses again.
    await cdp.send('Emulation.setVirtualTimePolicy', {
        policy: 'advance',
        budget: 5000
    });
    await page.reload({ waitUntil: 'load', timeout: 120000 });
    await new Promise(r => cdp.once('Emulation.virtualTimeBudgetExpired', r))
        .catch(() => {}); // already expired during reload is fine
    await page.evaluateHandle('document.fonts.ready');

    console.log(`Capturing ${TOTAL_FRAMES} frames at ${FPS} fps (${DURATION_S}s)…`);
    const startTime = Date.now();
    for (let i = 0; i < TOTAL_FRAMES; i++) {
        const expired = new Promise(r => cdp.once('Emulation.virtualTimeBudgetExpired', r));
        await cdp.send('Emulation.setVirtualTimePolicy', {
            policy: 'advance',
            budget: FRAME_MS
        });
        await expired;

        const filePath = path.join(FRAMES_DIR, `frame-${String(i).padStart(5, '0')}.png`);
        await page.screenshot({ path: filePath, type: 'png' });

        if (i % 15 === 0 || i === TOTAL_FRAMES - 1) {
            const pct = Math.round(((i + 1) / TOTAL_FRAMES) * 100);
            process.stdout.write(`\r  frame ${i + 1}/${TOTAL_FRAMES} (${pct}%)`);
        }
    }
    process.stdout.write('\n');
    console.log(`Captured in ${((Date.now() - startTime) / 1000).toFixed(1)}s`);

    await browser.close();

    console.log('Encoding MP4 with ffmpeg…');
    await new Promise((resolve, reject) => {
        const ff = spawn('ffmpeg', [
            '-y',
            '-framerate', String(FPS),
            '-i', path.join(FRAMES_DIR, 'frame-%05d.png'),
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
