#!/usr/bin/env node
/**
 * Mix procedural audio onto the rendered MP4s.
 *
 * Per format we synthesise:
 *  - a warm low-frequency pad (60+90+120Hz sine chord) at very low volume,
 *  - a soft "tick" at each slot-machine roll boundary (short HF sine burst),
 *  - a bell-like stinger when the slot locks on the final phrase.
 *
 * Slot timing comes straight from the HTML reel: 1500ms initial delay, then
 * a sequence of roll durations summing to the lock time. Tick events fire
 * at the end of each roll; the stinger fires at the final lock.
 *
 * Output: writes a -audio.mp4 sibling, then renames it over the source.
 */
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const FORMATS = {
    reel: {
        mp4: path.join(__dirname, 'exports', 'fitz-hr-reel.mp4'),
        duration: 14,
        slotStart: 1.5,
        rollMs: [580, 820, 1200, 1900]   // same as hero-video.html
    },
    square: {
        mp4: path.join(__dirname, 'exports', 'fitz-hr-square.mp4'),
        duration: 16,
        slotStart: 1.5,
        rollMs: [850, 1200, 1700, 2700]  // same as hero-video-square.html
    }
};

function tickTimes(slotStart, rollMs) {
    // Each tick fires at the *end* of a roll (when the new phrase locks at top).
    // The last roll is the final lock — that gets the bell, not a tick.
    const times = [];
    let t = slotStart;
    for (let i = 0; i < rollMs.length; i++) {
        t += rollMs[i] / 1000;
        times.push(t);
    }
    return {
        ticks: times.slice(0, -1),  // all but the last
        lock:  times[times.length - 1]
    };
}

function buildFilter(duration, ticks, lock) {
    // Warm low pad: three sines at 60/90/120 Hz mixed gently.
    // Ticks: 1.6kHz sine bursts, 60ms, sharp attack + fast decay.
    // Bell: 880Hz + 1320Hz + 1760Hz layered, 3.5s with long exponential decay.

    const D = duration;
    const inputs = [];
    const chains = [];
    const mixLabels = [];
    let idx = 0;

    function addLavfi(src, durationS) {
        inputs.push(`-f lavfi -t ${durationS.toFixed(3)} -i "${src}"`);
        // Lavfi inputs map to ffmpeg input indices 1, 2, 3, ... (input 0 is video).
        // Stream label format is [N:a] for the audio stream of input N.
        const label = `[${idx + 1}:a]`;
        idx += 1;
        return label;
    }

    // Pad chord: three sines summed.
    const padA = addLavfi(`sine=frequency=60`,  D);
    const padB = addLavfi(`sine=frequency=90`,  D);
    const padC = addLavfi(`sine=frequency=120`, D);
    chains.push(`${padA}volume=0.10[padA]`);
    chains.push(`${padB}volume=0.07[padB]`);
    chains.push(`${padC}volume=0.05[padC]`);
    chains.push(`[padA][padB][padC]amix=inputs=3:duration=first,volume=2.0[pad]`);
    mixLabels.push('[pad]');

    // Ticks
    ticks.forEach((tSec, i) => {
        const src = addLavfi(`sine=frequency=1600`, 0.06);
        const delayMs = Math.round(tSec * 1000);
        chains.push(
            `${src}afade=t=in:d=0.005,afade=t=out:st=0.015:d=0.045,` +
            `adelay=${delayMs}|${delayMs},volume=0.35[tick${i}]`
        );
        mixLabels.push(`[tick${i}]`);
    });

    // Bell stinger at lock — three harmonically related sines with a long decay.
    const bellA = addLavfi(`sine=frequency=880`,  3.5);
    const bellB = addLavfi(`sine=frequency=1320`, 3.5);
    const bellC = addLavfi(`sine=frequency=1760`, 3.5);
    const lockMs = Math.round(lock * 1000);
    chains.push(
        `${bellA}afade=t=in:d=0.01,afade=t=out:st=0.05:d=3.4,volume=0.45,` +
        `adelay=${lockMs}|${lockMs}[bellA]`
    );
    chains.push(
        `${bellB}afade=t=in:d=0.01,afade=t=out:st=0.05:d=3.4,volume=0.25,` +
        `adelay=${lockMs}|${lockMs}[bellB]`
    );
    chains.push(
        `${bellC}afade=t=in:d=0.01,afade=t=out:st=0.05:d=3.4,volume=0.15,` +
        `adelay=${lockMs}|${lockMs}[bellC]`
    );
    chains.push(`[bellA][bellB][bellC]amix=inputs=3:duration=first,volume=1.5[bell]`);
    mixLabels.push('[bell]');

    // Final master mix — amix divides by input count so we boost back up,
    // then loudnorm brings it to social-media target (~-14 LUFS).
    chains.push(
        `${mixLabels.join('')}amix=inputs=${mixLabels.length}:duration=longest,` +
        `volume=${mixLabels.length.toFixed(1)},` +
        `loudnorm=I=-14:TP=-1.0:LRA=11,` +
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
    const { ticks, lock } = tickTimes(cfg.slotStart, cfg.rollMs);
    console.log(`\n${name}: ticks at [${ticks.map(t=>t.toFixed(2)).join(', ')}], lock at ${lock.toFixed(2)}s`);

    const { inputs, filter } = buildFilter(cfg.duration, ticks, lock);
    const tmpOut = cfg.mp4.replace(/\.mp4$/, '.audio.mp4');

    // Build argv: input video first, then all lavfi audio sources.
    // We use the existing video stream as-is (copy) and replace its audio with [aout].
    const args = ['-y', '-i', cfg.mp4];
    inputs.forEach(spec => {
        // each spec is like: -f lavfi -t 14.000 -i "sine=frequency=60"
        // tokenise carefully — the -i value is quoted in the spec but we need
        // to feed it without the quotes since spawn handles argv directly.
        const m = spec.match(/^-f lavfi -t ([\d.]+) -i "(.+)"$/);
        if (!m) throw new Error('bad lavfi spec: ' + spec);
        args.push('-f', 'lavfi', '-t', m[1], '-i', m[2]);
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

    console.log('  encoding…');
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
