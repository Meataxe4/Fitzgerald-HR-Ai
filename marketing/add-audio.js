#!/usr/bin/env node
/**
 * Mix a sustained warm audio bed onto the rendered MP4s.
 *
 * No SFX, no timing — just a soft musical pad underneath the visual.
 * Synthesised entirely with ffmpeg lavfi sources so no external sample
 * files are required. The pad is built from detuned sines forming a
 * low Am9 voicing, gently tremolo'd and low-passed so it reads as
 * "ambient music" rather than synth tones.
 *
 * Output: writes a -audio.mp4 sibling, then renames it over the source.
 */
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const FORMATS = {
    reel:   { mp4: path.join(__dirname, 'exports', 'fitz-hr-reel.mp4'),   duration: 14 },
    square: { mp4: path.join(__dirname, 'exports', 'fitz-hr-square.mp4'), duration: 16 }
};

// Low Am9 voicing — A2 + E3 + G3 + B3 + C4 — open, warm, no harsh third.
// Each "note" is layered as a pair of slightly detuned sines (~0.5Hz apart)
// so they beat against each other, giving the pad a chorused, organic feel
// instead of sounding like raw sine waves.
const NOTES = [
    { freq: 110.00, gain: 0.42 },  // A2
    { freq: 164.81, gain: 0.30 },  // E3
    { freq: 196.00, gain: 0.22 },  // G3
    { freq: 246.94, gain: 0.18 },  // B3
    { freq: 261.63, gain: 0.14 }   // C4
];

function buildFilter(durationS) {
    const inputs = [];
    const chains = [];
    const noteLabels = [];

    NOTES.forEach((note, i) => {
        // Two detuned sines per note for a soft chorus / beating effect.
        const detune = 0.45;
        inputs.push(`-f lavfi -t ${durationS.toFixed(3)} -i sine=frequency=${(note.freq - detune).toFixed(3)}`);
        inputs.push(`-f lavfi -t ${durationS.toFixed(3)} -i sine=frequency=${(note.freq + detune).toFixed(3)}`);

        const aIdx = i * 2 + 1; // lavfi inputs start at ffmpeg index 1 (0 is video)
        const bIdx = i * 2 + 2;
        const lbl  = `[note${i}]`;
        chains.push(
            `[${aIdx}:a][${bIdx}:a]amix=inputs=2:duration=first,` +
            `volume=${(note.gain * 2).toFixed(3)}${lbl}`
        );
        noteLabels.push(lbl);
    });

    // Mix all notes, soft tremolo for slow life, gentle low-pass for warmth,
    // gentle high-pass to keep speakers happy, fades at the edges, and
    // loudnorm to -16 LUFS (a touch under social-media spec so the pad sits
    // behind the visual instead of competing with whatever caption/voiceover
    // gets added later).
    chains.push(
        `${noteLabels.join('')}amix=inputs=${noteLabels.length}:duration=first,` +
        `volume=${noteLabels.length.toFixed(1)},` +
        `tremolo=f=0.22:d=0.18,` +
        `lowpass=f=1400,highpass=f=55,` +
        `afade=t=in:d=0.8,afade=t=out:st=${(durationS - 1.2).toFixed(2)}:d=1.2,` +
        `loudnorm=I=-16:TP=-1.5:LRA=11,` +
        `aresample=48000[aout]`
    );

    return { inputs, filter: chains.join(';') };
}

function run(cmd, args) {
    return new Promise((resolve, reject) => {
        const p = spawn(cmd, args, { shell: false });
        let stderr = '';
        p.stderr.on('data', d => { stderr += d.toString(); });
        p.on('exit', code => {
            if (code === 0) resolve();
            else reject(new Error(`${cmd} exited ${code}\n${stderr.slice(-1500)}`));
        });
    });
}

async function processFormat(name, cfg) {
    if (!fs.existsSync(cfg.mp4)) {
        console.warn(`skip ${name}: ${cfg.mp4} not found`);
        return;
    }
    const { inputs, filter } = buildFilter(cfg.duration);
    const tmpOut = cfg.mp4.replace(/\.mp4$/, '.audio.mp4');

    const args = ['-y', '-i', cfg.mp4];
    inputs.forEach(spec => {
        // spec is "-f lavfi -t N.NNN -i sine=frequency=NNN"
        const parts = spec.split(' ');
        const iIdx = parts.indexOf('-i');
        args.push('-f', 'lavfi', '-t', parts[parts.indexOf('-t') + 1], '-i', parts.slice(iIdx + 1).join(' '));
    });
    args.push(
        '-filter_complex', filter,
        '-map', '0:v',
        '-map', '[aout]',
        '-c:v', 'copy',
        '-c:a', 'aac',
        '-b:a', '160k',
        '-shortest',
        tmpOut
    );

    console.log(`${name}: encoding ${cfg.duration}s pad…`);
    await run('ffmpeg', args);
    fs.renameSync(tmpOut, cfg.mp4);
    const size = (fs.statSync(cfg.mp4).size / 1024 / 1024).toFixed(2);
    console.log(`  ✓ ${path.relative(process.cwd(), cfg.mp4)} (${size} MB)`);
}

(async () => {
    for (const [name, cfg] of Object.entries(FORMATS)) {
        await processFormat(name, cfg);
    }
})().catch(err => {
    console.error('Audio mux failed:', err.message);
    process.exit(1);
});
