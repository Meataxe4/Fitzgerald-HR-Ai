#!/usr/bin/env python3
"""Render the reel cards into an Instagram-ready 1080x1920 MP4.
Cards are held perfectly static (no zoom/drift) so nothing moves within a slide;
only a short crossfade joins consecutive cards.
Usage: python3 scripts/build_reel_mp4.py [cards_preview_dir] [out.mp4] [hold_seconds]"""
import os, glob, sys
import numpy as np
import imageio.v2 as imageio
from PIL import Image

HERE = os.path.dirname(__file__)
CARDS = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, "..", "marketing", "reel-cards", "preview")
OUT = sys.argv[2] if len(sys.argv) > 2 else os.path.join(HERE, "..", "marketing", "exports", "fitz-hr-award-increase-2026-reel.mp4")

FPS = 30
HOLD = float(sys.argv[3]) if len(sys.argv) > 3 else 4.0   # seconds each card is shown (locked)
XF = 0.5       # crossfade seconds between cards

def ease(t):   # easeInOutCubic for a smooth crossfade
    return 4*t**3 if t < 0.5 else 1-(-2*t+2)**3/2

def main():
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    files = sorted(glob.glob(os.path.join(CARDS, "card-*.png")))
    cards = [Image.open(f).convert("RGB") for f in files]
    n = len(cards)

    writer = imageio.get_writer(
        OUT, fps=FPS, codec="libx264", quality=8, macro_block_size=8,
        ffmpeg_params=["-pix_fmt", "yuv420p", "-profile:v", "high", "-movflags", "+faststart"])

    for i, card in enumerate(cards):
        arr = np.asarray(card)
        for _ in range(int(HOLD * FPS)):       # static hold — every frame identical
            writer.append_data(arr)
        if i < n - 1:                           # crossfade into the next card
            nxt = np.asarray(cards[i + 1])
            xf = int(XF * FPS)
            for f in range(xf):
                k = ease((f + 1) / (xf + 1))
                writer.append_data(np.asarray(Image.blend(card, cards[i + 1], k)))
    writer.close()
    print("wrote", os.path.relpath(OUT))

if __name__ == "__main__":
    main()
