import re


PROVINCE_NAME_TO_GEOJSON_ID = {
    "aceh": "ID-AC",
    "bali": "ID-BA",
    "bangka belitung": "ID-BB",
    "kepulauan bangka belitung": "ID-BB",
    "banten": "ID-BT",
    "bengkulu": "ID-BE",
    "daerah istimewa yogyakarta": "ID-YO",
    "di yogyakarta": "ID-YO",
    "diy": "ID-YO",
    "yogyakarta": "ID-YO",
    "daerah khusus ibukota jakarta": "ID-JK",
    "dki jakarta": "ID-JK",
    "jakarta": "ID-JK",
    "jakarta raya": "ID-JK",
    "gorontalo": "ID-GO",
    "jambi": "ID-JA",
    "jawa barat": "ID-JB",
    "jawa tengah": "ID-JT",
    "jawa timur": "ID-JI",
    "kalimantan barat": "ID-KB",
    "kalimantan selatan": "ID-KS",
    "kalimantan tengah": "ID-KT",
    "kalimantan timur": "ID-KI",
    "kalimantan utara": "ID-KU",
    "kepulauan riau": "ID-KR",
    "lampung": "ID-LA",
    "maluku": "ID-MA",
    "maluku utara": "ID-MU",
    "nusa tenggara barat": "ID-NB",
    "ntb": "ID-NB",
    "nusa tenggara timur": "ID-NT",
    "ntt": "ID-NT",
    "papua": "ID-PA",
    "papua barat": "ID-PB",
    "papua barat daya": "ID-PD",
    "papua pegunungan": "ID-PP",
    "papua selatan": "ID-PS",
    "papua tengah": "ID-PT",
    "riau": "ID-RI",
    "sulawesi barat": "ID-SR",
    "sulawesi selatan": "ID-SN",
    "sulawesi tengah": "ID-ST",
    "sulawesi tenggara": "ID-SG",
    "sulawesi utara": "ID-SA",
    "sumatera barat": "ID-SB",
    "sumatera selatan": "ID-SS",
    "sumatera utara": "ID-SU",
}


def normalize_province_name(value: str | None) -> str:
    text = (value or "").strip().lower()
    text = re.sub(r"[^a-z0-9]+", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def get_province_geojson_id(province: str | None) -> str | None:
    normalized = normalize_province_name(province)
    if not normalized:
        return None
    return PROVINCE_NAME_TO_GEOJSON_ID.get(normalized)
