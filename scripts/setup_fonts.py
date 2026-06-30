#!/usr/bin/env python3
"""Install the brand fonts so cairosvg renders the reel cards in the real typefaces
instead of a wider fallback. Produces three static instances:
  - Outfit-800.ttf            family "Outfit"      (titles, wordmark, labels)
  - OutfitText-500.ttf        family "OutfitText"  (body paragraphs, Reel #2)
  - PlayfairDisplay-900.ttf   family "Playfair Display" (Reel #1 headlines)
Run once before rendering. Requires: pip install fonttools ; network to github.com."""
import os, urllib.request
from fontTools import ttLib
from fontTools.varLib.instancer import instantiateVariableFont

DEST = "/usr/share/fonts/truetype/reel"
SRC = {
    "_outfit.ttf":   "https://github.com/google/fonts/raw/main/ofl/outfit/Outfit%5Bwght%5D.ttf",
    "_playfair.ttf": "https://github.com/google/fonts/raw/main/ofl/playfairdisplay/PlayfairDisplay%5Bwght%5D.ttf",
}

def rename_family(font, new_family):
    """Force the family name so fontconfig exposes this instance under its own name."""
    name = font["name"]
    for nid, val in [(1, new_family), (16, new_family), (2, "Regular"), (17, "Regular"),
                     (4, new_family), (6, new_family.replace(" ", "") + "-Regular")]:
        name.setName(val, nid, 3, 1, 0x409)

def pin(src, out, wght, family=None):
    f = ttLib.TTFont(os.path.join(DEST, src))
    instantiateVariableFont(f, {"wght": wght}, inplace=True)
    f["OS/2"].usWeightClass = wght
    if family:
        rename_family(f, family)
    f.save(os.path.join(DEST, out))

def main():
    os.makedirs(DEST, exist_ok=True)
    for name, url in SRC.items():
        urllib.request.urlretrieve(url, os.path.join(DEST, name))
    pin("_outfit.ttf", "Outfit-800.ttf", 800)                       # family "Outfit"
    pin("_outfit.ttf", "OutfitText-500.ttf", 500, "OutfitText")     # family "OutfitText"
    pin("_playfair.ttf", "PlayfairDisplay-900.ttf", 900)            # family "Playfair Display"
    for tmp in ("_outfit.ttf", "_playfair.ttf"):
        os.remove(os.path.join(DEST, tmp))
    os.system("fc-cache -f " + DEST + " >/dev/null 2>&1")
    print("installed Outfit-800 + OutfitText-500 + PlayfairDisplay-900 into", DEST)

if __name__ == "__main__":
    main()
