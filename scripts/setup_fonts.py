#!/usr/bin/env python3
"""Install the brand fonts so cairosvg renders reel cards in the real typefaces.
Produces static instances:
  - Outfit-800.ttf            family "Outfit"      (titles, wordmark, labels)
  - OutfitText-500.ttf        family "OutfitText"  (body / list text)
  - PlayfairDisplay-900.ttf   family "Playfair Display"
Run once before rendering. Requires: pip install fonttools ; network to github.com."""
import os, urllib.request
from fontTools import ttLib
from fontTools.varLib.instancer import instantiateVariableFont

DEST = "/usr/share/fonts/truetype/reel"
SRC = {
    "_outfit.ttf":   "https://raw.githubusercontent.com/google/fonts/main/ofl/outfit/Outfit%5Bwght%5D.ttf",
    "_playfair.ttf": "https://raw.githubusercontent.com/google/fonts/main/ofl/playfairdisplay/PlayfairDisplay%5Bwght%5D.ttf",
}

def fetch(url, dest):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=60) as r, open(dest, "wb") as f:
        f.write(r.read())

def rename_family(font, new_family):
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
        fetch(url, os.path.join(DEST, name))
    pin("_outfit.ttf", "Outfit-800.ttf", 800)
    pin("_outfit.ttf", "OutfitText-500.ttf", 500, "OutfitText")
    pin("_playfair.ttf", "PlayfairDisplay-900.ttf", 900)
    for tmp in ("_outfit.ttf", "_playfair.ttf"):
        os.remove(os.path.join(DEST, tmp))
    os.system("fc-cache -f " + DEST + " >/dev/null 2>&1")
    print("installed Outfit-800 + OutfitText-500 + PlayfairDisplay-900 into", DEST)

if __name__ == "__main__":
    main()
