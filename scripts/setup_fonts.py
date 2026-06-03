#!/usr/bin/env python3
"""Install the brand fonts (Outfit 800, Playfair Display 900) so cairosvg renders
the reel cards in the real typefaces instead of a wider fallback (which overflowed
the CTA wordmark box). Run once before build_reel_cards.py rendering / build_reel_mp4.py.
Requires: pip install fonttools ; network access to github.com."""
import os, urllib.request
from fontTools import ttLib
from fontTools.varLib.instancer import instantiateVariableFont

DEST = "/usr/share/fonts/truetype/reel"
SRC = {
    "_outfit.ttf":   "https://github.com/google/fonts/raw/main/ofl/outfit/Outfit%5Bwght%5D.ttf",
    "_playfair.ttf": "https://github.com/google/fonts/raw/main/ofl/playfairdisplay/PlayfairDisplay%5Bwght%5D.ttf",
}
PIN = [("_outfit.ttf", "Outfit-800.ttf", 800), ("_playfair.ttf", "PlayfairDisplay-900.ttf", 900)]

def main():
    os.makedirs(DEST, exist_ok=True)
    for name, url in SRC.items():
        urllib.request.urlretrieve(url, os.path.join(DEST, name))
    for src, out, wght in PIN:
        f = ttLib.TTFont(os.path.join(DEST, src))
        instantiateVariableFont(f, {"wght": wght}, inplace=True)   # pin to a heavy static weight
        f.save(os.path.join(DEST, out))
        os.remove(os.path.join(DEST, src))
    os.system("fc-cache -f " + DEST + " >/dev/null 2>&1")
    print("installed Outfit-800 + PlayfairDisplay-900 into", DEST)

if __name__ == "__main__":
    main()
