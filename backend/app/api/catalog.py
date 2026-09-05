import json
from fastapi import APIRouter, Depends, Query, HTTPException, Response
from typing import Optional, List, Dict, Any
from app.storage import get_storage_provider

router = APIRouter(prefix="/catalog", tags=["Catalog"])

def get_published_catalogue() -> Dict[str, Any]:
    storage = get_storage_provider()
    if not storage.exists("catalogue.json"):
        raise HTTPException(
            status_code=404,
            detail="Published catalogue not found. Please trigger a publish run first via POST /admin/catalog/publish."
        )
    try:
        content = storage.read("catalogue.json")
        return json.loads(content.decode("utf-8"))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read published catalogue: {str(e)}")

@router.get("", summary="Get published viewer catalogue")
def get_catalog():
    """Serves the latest published catalogue JSON file."""
    catalog = get_published_catalogue()
    return catalog

@router.get("/search", summary="Search and filter published catalogue")
def search_catalog(
    q: Optional[str] = Query(None, description="Search term matching show title, episode title, or category"),
    category: Optional[str] = Query(None, description="Filter by category (e.g. adventure, india)"),
    language: Optional[str] = Query(None, description="Filter by language (en, hi)"),
    section: Optional[str] = Query(None, description="Filter by section (featured, series, minisodes, songs)")
):
    """
    Search and filter viewer catalogue with composable AND logic.
    """
    catalog = get_published_catalogue()
    shows = catalog.get("all_shows", [])
    
    q_clean = q.strip().lower() if q else None
    cat_clean = category.strip().lower() if category else None
    lang_clean = language.strip().lower() if language else None
    sec_clean = section.strip().lower() if section else None

    filtered_shows = []

    for show in shows:
        # Filter by section
        if sec_clean and show.get("section", "").lower() != sec_clean:
            continue

        # Filter by category
        if cat_clean:
            show_cats = [c.lower() for c in show.get("categories", [])]
            if cat_clean not in show_cats:
                continue

        # Match search term q against show title & categories
        show_title_match = q_clean in show.get("title", "").lower() if q_clean else False
        show_cat_match = any(q_clean in c.lower() for c in show.get("categories", [])) if q_clean else False

        # Check episode matching & language filtering
        matching_seasons = []
        matching_trailers = []
        has_ep_match = False
        has_lang_match = False

        # Process trailers
        for tr in show.get("trailers", []):
            ep_lang_match = (not lang_clean) or (lang_clean in [l.lower() for l in tr.get("languages", [])])
            ep_q_match = (not q_clean) or show_title_match or show_cat_match or (q_clean in tr.get("default_title", "").lower())
            
            if ep_lang_match and ep_q_match:
                matching_trailers.append(tr)
                has_ep_match = True

        # Process seasons & episodes
        for s in show.get("seasons", []):
            matching_episodes = []
            for ep in s.get("episodes", []):
                ep_lang_match = (not lang_clean) or (lang_clean in [l.lower() for l in ep.get("languages", [])])
                ep_title = ep.get("default_title", "").lower()
                ep_q_match = (not q_clean) or show_title_match or show_cat_match or (q_clean in ep_title)
                
                if ep_lang_match and ep_q_match:
                    matching_episodes.append(ep)
                    has_ep_match = True

            if matching_episodes:
                matching_seasons.append({
                    "season_number": s.get("season_number"),
                    "episodes": matching_episodes
                })

        # Decision: Include show if it satisfies all filter criteria
        if (not q_clean or show_title_match or show_cat_match or has_ep_match) and (not lang_clean or has_ep_match or any(lang_clean in [l.lower() for l in tr.get("languages", [])] for tr in show.get("trailers", []))):
            # Include clone of show with filtered seasons/episodes
            show_copy = dict(show)
            show_copy["trailers"] = matching_trailers
            show_copy["seasons"] = matching_seasons
            filtered_shows.append(show_copy)

    # Re-group by section for structured response
    ref_sections = ["featured", "series", "minisodes", "songs"]
    sections_res = {sec: [] for sec in ref_sections}
    for s in filtered_shows:
        s_sec = s.get("section")
        if s_sec in sections_res:
            sections_res[s_sec].append(s)

    return {
        "query": q,
        "filters": {"category": category, "language": language, "section": section},
        "total_results": len(filtered_shows),
        "sections": sections_res,
        "results": filtered_shows
    }
