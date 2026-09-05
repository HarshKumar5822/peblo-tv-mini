import io
import json
import os
from PIL import Image
from typing import Dict, Any, Tuple
from app.config import settings

class ArtworkValidationError(ValueError):
    pass

SPECS = {
    "poster": {"ratio": 2/3, "ratio_str": "2:3", "target_px": (600, 900), "max_kb": 200},
    "banner": {"ratio": 16/9, "ratio_str": "16:9", "target_px": (1280, 720), "max_kb": 200},
    "thumbnail": {"ratio": 16/9, "ratio_str": "16:9", "target_px": (640, 360), "max_kb": 200},
}

def validate_and_process_artwork(file_bytes: bytes, artwork_type: str, filename: str) -> Dict[str, Any]:
    if artwork_type not in SPECS:
        raise ArtworkValidationError(f"Invalid artwork type '{artwork_type}'. Allowed types: poster, banner, thumbnail.")

    spec = SPECS[artwork_type]
    file_size_kb = len(file_bytes) / 1024.0

    # 1. File Size Ceiling Check
    if file_size_kb > spec["max_kb"]:
        raise ArtworkValidationError(
            f"File size ({file_size_kb:.1f} KB) exceeds the maximum allowed limit of {spec['max_kb']} KB for {artwork_type}. "
            "Please compress your image before uploading."
        )

    # 2. Image Decoding & Dimension Check
    try:
        image = Image.open(io.BytesIO(file_bytes))
        image.verify()
        # Re-open after verify()
        image = Image.open(io.BytesIO(file_bytes))
    except Exception as e:
        raise ArtworkValidationError("Uploaded file is not a valid JPEG/PNG image. Please upload a valid image file.")

    width, height = image.size
    actual_ratio = width / float(height)
    expected_ratio = spec["ratio"]
    target_w, target_h = spec["target_px"]

    # Aspect ratio tolerance check (± 0.05)
    if abs(actual_ratio - expected_ratio) > 0.05:
        raise ArtworkValidationError(
            f"Invalid aspect ratio ({width}x{height} px, ratio {actual_ratio:.2f}). "
            f"{artwork_type.capitalize()} artwork must have a {spec['ratio_str']} aspect ratio "
            f"(target: ~{target_w}x{target_h} px). Please crop your image."
        )

    ext = os.path.splitext(filename)[1].lower()
    if ext not in [".jpg", ".jpeg", ".png", ".webp"]:
        ext = ".jpg" if image.format == "JPEG" else ".png"

    mime_type = "image/jpeg" if ext in [".jpg", ".jpeg"] else "image/png"

    return {
        "width": width,
        "height": height,
        "file_size_kb": round(file_size_kb, 2),
        "aspect_ratio": round(actual_ratio, 2),
        "mime_type": mime_type,
        "ext": ext,
        "format": image.format
    }
