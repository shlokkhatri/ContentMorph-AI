"""
Turns uploaded files into plain text so they can be sent to Claude.

Supported as text: .txt, .pdf, .docx
Images (.png, .jpg, .jpeg, .webp) are handled separately - they are sent
straight to Claude's vision input instead of being converted to text
(see ai_service.generate_outputs_from_image).
"""

import io
from typing import Optional

from pypdf import PdfReader
from docx import Document


def extract_text_from_pdf(file_bytes: bytes) -> str:
    reader = PdfReader(io.BytesIO(file_bytes))
    pages = [page.extract_text() or "" for page in reader.pages]
    return "\n".join(pages).strip()


def extract_text_from_docx(file_bytes: bytes) -> str:
    document = Document(io.BytesIO(file_bytes))
    paragraphs = [p.text for p in document.paragraphs]
    return "\n".join(paragraphs).strip()


def extract_text_from_upload(filename: str, file_bytes: bytes) -> str:
    """Picks the right extractor based on the file extension."""
    lower_name = filename.lower()

    if lower_name.endswith(".pdf"):
        return extract_text_from_pdf(file_bytes)
    if lower_name.endswith(".docx"):
        return extract_text_from_docx(file_bytes)
    if lower_name.endswith(".txt"):
        return file_bytes.decode("utf-8", errors="ignore")

    raise ValueError(
        f"Unsupported file type for '{filename}'. "
        "Please upload a .txt, .pdf, .docx, or image file, or paste the text directly."
    )


IMAGE_MEDIA_TYPES = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
}


def get_image_media_type(filename: str) -> Optional[str]:
    """Returns the Claude-compatible media type if this file is a supported image, else None."""
    lower_name = filename.lower()
    for extension, media_type in IMAGE_MEDIA_TYPES.items():
        if lower_name.endswith(extension):
            return media_type
    return None
