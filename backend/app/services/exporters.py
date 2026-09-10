"""
Converts a generated .pptx into other downloadable formats:

- .docx  : built directly with python-docx (one heading + bullets + notes
           section per slide) - no external dependency, always works.
- .pdf   : shelled out to LibreOffice headless (`soffice --headless
           --convert-to pdf`). Requires LibreOffice to be installed on the
           server (`apt-get install libreoffice` on Debian/Ubuntu). If it's
           not available, we raise a clear, actionable error instead of
           silently failing.

Both conversions are cached next to the source .pptx so repeat downloads
are instant.
"""

from __future__ import annotations

import os
import shutil
import subprocess

from docx import Document
from docx.shared import Pt
from pptx import Presentation


class ExportUnavailable(RuntimeError):
    """Raised when a requested export format cannot be produced right now."""


def _sibling_path(pptx_path: str, new_ext: str) -> str:
    base, _ = os.path.splitext(pptx_path)
    return f"{base}.{new_ext}"


def export_to_docx(pptx_path: str) -> str:
    """
    Renders the deck's content (title, bullets, speaker notes) as a Word
    document - one section per slide. This is a content export, not a
    pixel-for-pixel replica of the slide layout, which is what stakeholders
    who "just want it in Word" usually want: a readable, editable outline.
    """
    out_path = _sibling_path(pptx_path, "docx")
    if os.path.exists(out_path) and os.path.getmtime(out_path) >= os.path.getmtime(pptx_path):
        return out_path

    prs = Presentation(pptx_path)
    doc = Document()

    doc.add_heading(
        os.path.splitext(os.path.basename(pptx_path))[0].split("__", 1)[-1].replace("_", " "),
        level=0,
    )

    # Only pull from shapes we explicitly named when building the deck
    # (see pptx_builder.py) - this excludes footer/page-number textboxes,
    # which would otherwise get misread as extra bullet content.
    CONTENT_NAMES = {"slide_title", "slide_subtitle", "slide_bullets"}

    for i, slide in enumerate(prs.slides, start=1):
        by_name = {
            shape.name: shape.text_frame.text.strip()
            for shape in slide.shapes
            if shape.has_text_frame and shape.name in CONTENT_NAMES and shape.text_frame.text.strip()
        }

        title_text = by_name.get("slide_title", f"Slide {i}")
        doc.add_heading(f"{i}. {title_text}", level=1)

        if "slide_subtitle" in by_name:
            doc.add_paragraph(by_name["slide_subtitle"])

        for line in by_name.get("slide_bullets", "").split("\n"):
            line = line.strip().lstrip("•").strip()
            if line:
                doc.add_paragraph(line, style="List Bullet")

        if slide.has_notes_slide:
            notes = slide.notes_slide.notes_text_frame.text.strip()
            if notes:
                p = doc.add_paragraph()
                run = p.add_run(f"Speaker notes: {notes}")
                run.italic = True
                run.font.size = Pt(10)

        doc.add_paragraph("")  # spacing between slides

    doc.save(out_path)
    return out_path


def _soffice_binary() -> str | None:
    for candidate in ("soffice", "libreoffice"):
        path = shutil.which(candidate)
        if path:
            return path
    return None


def export_to_pdf(pptx_path: str) -> str:
    """Converts the .pptx to .pdf via LibreOffice headless. Cached alongside the source file."""
    out_path = _sibling_path(pptx_path, "pdf")
    if os.path.exists(out_path) and os.path.getmtime(out_path) >= os.path.getmtime(pptx_path):
        return out_path

    binary = _soffice_binary()
    if not binary:
        raise ExportUnavailable(
            "PDF export requires LibreOffice to be installed on the server "
            "(e.g. `apt-get install libreoffice` on Debian/Ubuntu, or "
            "`brew install --cask libreoffice` on macOS)."
        )

    out_dir = os.path.dirname(pptx_path)
    result = subprocess.run(
        [binary, "--headless", "--convert-to", "pdf", "--outdir", out_dir, pptx_path],
        capture_output=True,
        text=True,
        timeout=120,
    )
    if result.returncode != 0 or not os.path.exists(out_path):
        raise ExportUnavailable(
            f"LibreOffice failed to convert the presentation to PDF: {result.stderr.strip() or result.stdout.strip()}"
        )
    return out_path


def export(pptx_path: str, fmt: str) -> str:
    fmt = fmt.lower().lstrip(".")
    if fmt == "pptx":
        return pptx_path
    if fmt == "docx":
        return export_to_docx(pptx_path)
    if fmt == "pdf":
        return export_to_pdf(pptx_path)
    raise ValueError(f"Unsupported export format: {fmt}")