from fastapi import APIRouter, HTTPException, Query
import httpx, os, re

router = APIRouter(prefix="/foods", tags=["foods"])

OFF_BASE = os.getenv("OFF_BASE_URL", "https://world.openfoodfacts.org")
USER_AGENT = os.getenv("OFF_USER_AGENT", "MPP/0.1 (your-email@example.com)")  # required by OFF

# Simple barcode detector: 8–14 digits covers EAN-8/12/13/14 most cases
BARCODE_RE = re.compile(r"^\d{8,14}$")

# We only fetch the fields we need (reduces payload)
FIELDS = "code,product_name,brands,nutriments,nutrition_data_per,serving_size"

def _headers():
    return {"User-Agent": USER_AGENT}

def _kcal_from_nutriments(n: dict):
    # OFF provides energy either in kcal or only in kJ
    kcal = n.get("energy-kcal_100g")
    if kcal is None:
        kj = n.get("energy-kj_100g")
        if kj is not None:
            try:
                kcal = round(float(kj) / 4.184)
            except Exception:
                kcal = None
    return kcal

def _normalize_product(p: dict):
    n = p.get("nutriments") or {}
    kcal = _kcal_from_nutriments(n)
    return {
        "code": p.get("code"),
        "name": p.get("product_name"),
        "brand": (p.get("brands") or "").split(",")[0].strip() or None,
        "nutrition_data_per": p.get("nutrition_data_per"),  # often "100g"
        "serving_size": p.get("serving_size"),
        "per_100g": {
            "kcal": kcal,
            "protein_g": n.get("proteins_100g"),
            "carb_g": n.get("carbohydrates_100g"),
            "fat_g": n.get("fat_100g"),
        },
    }

async def _search_v1_fulltext(query: str, size: int = 5, countries_bias: str | None = "italy"):
    """
    v1 full-text search (the only API with full-text today).
    NOTE: rate-limited (10 req/min) -> debounce/caching on our side.
    Docs: /cgi/search.pl params (+ advanced facets). 
    """
    url = f"{OFF_BASE}/cgi/search.pl"
    params = {
        "search_terms": query,
        "search_simple": 1,
        "action": "process",
        "json": 1,
        "page_size": size,
        "fields": FIELDS,
        "nocache": 1,  # see wiki note about caching
    }
    # Optional bias towards Italy using advanced-search style facet params
    if countries_bias:
        # tagtype_0=countries & tag_contains_0=contains & tag_0=italy
        params.update({
            "tagtype_0": "countries",
            "tag_contains_0": "contains",
            "tag_0": countries_bias,
        })

    timeout = httpx.Timeout(10.0, read=10.0)
    async with httpx.AsyncClient(timeout=timeout, headers=_headers()) as client:
        resp = await client.get(url, params=params)
        resp.raise_for_status()
        data = resp.json()
        return data.get("products", []) or []

async def _get_v2_product(code: str):
    """
    v2 product read — stable schema.
    GET /api/v2/product/{code}.json
    """
    url = f"{OFF_BASE}/api/v2/product/{code}.json"
    timeout = httpx.Timeout(8.0, read=8.0)
    async with httpx.AsyncClient(timeout=timeout, headers=_headers()) as client:
        r = await client.get(url)
        r.raise_for_status()
        j = r.json()
        # v2 returns {"product": {...}} or {"status":0}
        p = (j or {}).get("product")
        return p

async def _search_v2_facets(params: dict, size: int = 5):
    """
    v2 facet search (NOT full-text).
    GET /api/v2/search?categories_tags_en=...&nutrition_grades_tags=...
    Useful if we later add structured filters; not used for free text.
    """
    q = {"page_size": size, "fields": FIELDS, **params}
    url = f"{OFF_BASE}/api/v2/search"
    timeout = httpx.Timeout(10.0, read=10.0)
    async with httpx.AsyncClient(timeout=timeout, headers=_headers()) as client:
        r = await client.get(url, params=q)
        r.raise_for_status()
        j = r.json()
        return (j or {}).get("products", []) or []

@router.get("/search")
async def search_foods(q: str = Query(..., min_length=2), size: int = 5):
    """
    Hybrid search:
    - If q looks like a BARCODE -> v2 product read.
    - Else -> v1 full-text search (with optional Italy bias).
    Returns normalized minimal fields suitable for our UI.
    """
    try:
        if BARCODE_RE.match(q):
            p = await _get_v2_product(q)
            if not p:
                return {"count": 0, "results": []}
            normalized = _normalize_product(p)
            # filter out entries missing core nutrients
            per = normalized.get("per_100g") or {}
            ok = all(per.get(k) is not None for k in ("kcal","protein_g","carb_g","fat_g"))
            return {"count": 1 if ok else 0, "results": [normalized] if ok else []}

        # free-text fallback (v1 cgi search)
        products = await _search_v1_fulltext(q, size=size, countries_bias="italy")
        normalized = [_normalize_product(p) for p in products]
        results = [x for x in normalized
                   if x["per_100g"]["kcal"] is not None
                   and x["per_100g"]["protein_g"] is not None
                   and x["per_100g"]["carb_g"] is not None
                   and x["per_100g"]["fat_g"] is not None]
        return {"count": len(results), "results": results}
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"OFF upstream error: {e}")
