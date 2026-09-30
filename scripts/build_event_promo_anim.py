#!/usr/bin/env python3
"""Animated 9:16 reel for the Fitz HR underpayments webinar promo.
Elements fade + rise in with stagger; the presenter headshots slide up from below;
then a locked hold. Run after setup_fonts.py. HEADS_PNG env = extracted headshots."""
import os, io
import numpy as np
import cairosvg
import imageio.v2 as imageio
from PIL import Image
import build_event_promo as B

OUT = os.path.join(os.path.dirname(__file__), "..", "marketing", "exports", "fitz-hr-underpayments-webinar-reel.mp4")
HEADS = os.environ.get("HEADS_PNG") or os.path.join(os.path.dirname(__file__), "..", "marketing", "event-underpayments-reel", "presenters.png")
FPS, DUR, HOLD, SIZE = 30, 0.6, 2.6, (1080, 1920)

def render(inner):
    png = cairosvg.svg2png(bytestring=B.svg(inner).encode(), output_width=1080, output_height=1920)
    return Image.open(io.BytesIO(png)).convert("RGBA")

def ease(t): return 1 - (1 - t) ** 3

def scale_alpha(img, a):
    r, g, b, al = img.split()
    return Image.merge("RGBA", (r, g, b, al.point(lambda v: int(v * a))))

def main():
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    p = B.parts()
    base = render('<rect width="1080" height="1920" fill="url(#bg)"/>')
    # text layers: (image, delay, rise_px)
    layers = [(render(p["wordmark"]), 0.10, 26),
              (render(p["title"]),    0.28, 40),
              (render(p["barbody"]),  0.60, 34),
              (render(p["date"]),     0.90, 30)]
    # headshots slide up from below
    heads_img = None; heads_y = 0; heads_delay = 0.5; heads_dur = 0.9; heads_rise = 0
    if HEADS and os.path.exists(HEADS):
        h = Image.open(HEADS).convert("RGBA")
        heads_y = 1920 - h.height + 8
        canvas = Image.new("RGBA", SIZE, (0, 0, 0, 0)); canvas.alpha_composite(h, (0, heads_y))
        heads_img = canvas
        heads_rise = h.height + 8  # start fully below frame

    intro_end = max(0.90 + DUR, heads_delay + heads_dur)
    length = intro_end + HOLD

    def compose(t):
        frame = base.copy()
        # heads first (behind text is fine; they're at the bottom)
        if heads_img is not None:
            p2 = min(max((t - heads_delay) / heads_dur, 0), 1); e = ease(p2)
            off = int((1 - e) * heads_rise)
            if p2 > 0:
                if off:
                    cv = Image.new("RGBA", SIZE, (0, 0, 0, 0)); cv.alpha_composite(heads_img, (0, off)); frame.alpha_composite(cv)
                else:
                    frame.alpha_composite(heads_img)
        for img, d, rise in layers:
            pr = (t - d) / DUR
            if pr <= 0: continue
            pr = min(pr, 1.0); e = ease(pr); off = int((1 - e) * rise)
            if off or pr < 1:
                cv = Image.new("RGBA", SIZE, (0, 0, 0, 0)); cv.alpha_composite(img, (0, off))
                frame.alpha_composite(scale_alpha(cv, e) if pr < 1 else cv)
            else:
                frame.alpha_composite(img)
        return frame.convert("RGB")

    w = imageio.get_writer(OUT, fps=FPS, codec="libx264", quality=8, macro_block_size=8,
                           ffmpeg_params=["-pix_fmt", "yuv420p", "-profile:v", "high", "-movflags", "+faststart"])
    for f in range(int(length * FPS)):
        w.append_data(np.asarray(compose(f / FPS)))
    w.close()
    print("wrote", os.path.relpath(OUT), "dur", round(length, 1))

if __name__ == "__main__":
    main()
