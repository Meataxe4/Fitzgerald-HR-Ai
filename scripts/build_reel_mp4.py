#!/usr/bin/env python3
"""Render the reel cards into an Instagram-ready 1080x1920 MP4.
Cards are held perfectly static (no zoom/drift) so nothing moves within a slide;
only a short crossfade joins consecutive cards.
Run: python3 scripts/build_reel_mp4.py"""
import os, glob
import numpy as np
import imageio.v2 as imageio
from PIL import Image

HERE = os.path.dirname(__file__)
CARDS = os.path.join(HERE, "..", "marketing", "reel-cards", "preview")
OUT = os.path.join(HERE, "..", "marketing", "exports", "fitz-hr-award-increase-2026-reel.mp4")

FPS = 30
HOLD = 4.0     # seconds each card is shown (locked, no movement)
XF = 0.5       # crossfade seconds between cards

def ease(t):   # easeInOutCubic for a smooth crossfade
    return 4*t**3 if t < 0.5 else 1-(-2*t+2)**3/2

def main():
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
