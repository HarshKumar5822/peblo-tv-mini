import io
import pytest
from PIL import Image
from app.services.artwork_service import validate_and_process_artwork, ArtworkValidationError

def create_dummy_image(width: int, height: int, format: str = "JPEG") -> bytes:
    img = Image.new("RGB", (width, height), color="red")
    buf = io.BytesIO()
    img.save(buf, format=format)
    return buf.getvalue()

def test_valid_poster_artwork():
    # 600x900 is 2:3 aspect ratio
    img_bytes = create_dummy_image(600, 900)
    info = validate_and_process_artwork(img_bytes, "poster", "poster.jpg")
    assert info["width"] == 600
    assert info["height"] == 900
    assert info["aspect_ratio"] == 0.67

def test_valid_banner_artwork():
    # 1280x720 is 16:9 aspect ratio
    img_bytes = create_dummy_image(1280, 720)
    info = validate_and_process_artwork(img_bytes, "banner", "banner.jpg")
    assert info["width"] == 1280
    assert info["height"] == 720
    assert info["aspect_ratio"] == 1.78

def test_invalid_aspect_ratio_rejected():
    # 900x600 is 3:2, invalid for poster (2:3)
    img_bytes = create_dummy_image(900, 600)
    with pytest.raises(ArtworkValidationError) as exc:
        validate_and_process_artwork(img_bytes, "poster", "poster_wrong.jpg")
    assert "Invalid aspect ratio" in str(exc.value)

def test_oversized_file_rejected():
    # Large dummy payload > 200 KB
    large_bytes = b"0" * (205 * 1024)
    with pytest.raises(ArtworkValidationError) as exc:
        validate_and_process_artwork(large_bytes, "poster", "huge.jpg")
    assert "exceeds the maximum allowed limit of 200 KB" in str(exc.value)
