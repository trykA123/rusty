"""Cut static instances from the prototype's variable fonts.

GPUI's Linux text system (cosmic-text) draws a variable font only at its default
instance, so each weight the spike uses is shipped as its own static face.
Run with fonttools 4.60.1: python instance.py
"""

from pathlib import Path

from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

SOURCE = Path(__file__).resolve().parents[3] / "design" / "prototype" / "fonts"
OUT = Path(__file__).resolve().parent
STYLES = {400: "Regular", 500: "Medium", 600: "SemiBold", 700: "Bold"}
FAMILIES = {
    "Archivo": ("Archivo", {"wdth": 92}),
    "JetBrainsMono": ("JetBrains Mono", {}),
}


def rename(font: TTFont, family: str, style: str) -> None:
    names = font["name"]
    for record in list(names.names):
        if record.nameID in (1, 2, 4, 6, 16, 17):
            names.removeNames(nameID=record.nameID)
    names.setName(family, 1, 3, 1, 0x409)
    names.setName(style, 2, 3, 1, 0x409)
    names.setName(f"{family} {style}", 4, 3, 1, 0x409)
    names.setName(f"{family.replace(' ', '')}-{style}", 6, 3, 1, 0x409)


def main() -> None:
    for stem, (family, axes) in FAMILIES.items():
        for weight, style in STYLES.items():
            font = TTFont(SOURCE / f"{stem}.ttf")
            static = instantiateVariableFont(font, {**axes, "wght": weight})
            rename(static, family, style)
            static["OS/2"].usWeightClass = weight
            static["OS/2"].usWidthClass = 5
            static.save(OUT / f"{stem}-{style}.ttf")


if __name__ == "__main__":
    main()
