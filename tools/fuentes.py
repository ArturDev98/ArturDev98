"""Instancia y recorta fuentes variables a woff2; también vuelca los anchos de avance. JSON por stdin."""
import base64, io, json, sys
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools import subset

spec = json.load(sys.stdin)
salida = {}

for f in spec["fuentes"]:
    # recalcTimestamp=False: sin fecha nueva en la cabecera, los bytes salen iguales entre corridas.
    t = TTFont(f["archivo"], recalcTimestamp=False)
    t = instancer.instantiateVariableFont(t, {"wght": f["peso"]}, inplace=False)
    cmap, hmtx, upm = t.getBestCmap(), t["hmtx"], t["head"].unitsPerEm
    chars = sorted(set(f["texto"]))
    faltan = [c for c in chars if ord(c) not in cmap]
    if faltan:
        raise SystemExit(f"{f['id']}: sin glifo para {faltan}")
    item = {"adv": {c: hmtx[cmap[ord(c)]][0] / upm for c in chars}}
    if not spec.get("solo_tabla"):
        opt = subset.Options()
        opt.flavor = "woff2"
        opt.layout_features = ["kern", "liga", "tnum"]
        opt.hinting = False
        opt.name_IDs = [1, 2]
        opt.recalc_timestamp = False
        s = subset.Subsetter(opt)
        s.populate(text="".join(chars))
        s.subset(t)
        buf = io.BytesIO()
        t.flavor = "woff2"
        t.save(buf)
        item["b64"] = base64.b64encode(buf.getvalue()).decode()
    salida[f["id"]] = item

json.dump(salida, sys.stdout)
