"""
Renders slide JSON (as produced by PresentationAgent) into a real,
professionally-formatted .pptx file using python-pptx.

This does NOT use PowerPoint COM automation and does not require
PowerPoint to be installed - the output is a standard OOXML .pptx that
opens in PowerPoint, Google Slides, Keynote, and LibreOffice.

Files are written to OUTPUT_DIR, named by a random file_id. main.py stores
that file_id on the Generation record so /api/download/{id}/{format} can
find it again later (and, for docx/pdf, convert it on first request).
"""

from __future__ import annotations

import os
import uuid
from dataclasses import dataclass

from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "generated_files")
os.makedirs(OUTPUT_DIR, exist_ok=True)

SLIDE_W = Inches(13.333)
SLIDE_H = Inches(7.5)
MARGIN = Inches(0.6)


@dataclass
class Theme:
    background: str
    primary: str
    secondary: str
    accent: str
    text: str
    font: str = "Calibri"


THEMES = {
    "modern": Theme("FFFFFF", "1D4ED8", "0F172A", "2563EB", "0F172A"),
    "dark": Theme("0F172A", "38BDF8", "E2E8F0", "38BDF8", "E2E8F0"),
    "corporate": Theme("FFFFFF", "0B3D91", "1F2937", "0B3D91", "1F2937"),
    "minimal": Theme("FFFFFF", "111827", "374151", "111827", "111827"),
    "academic": Theme("FFFFFF", "7C2D12", "1F2937", "9A3412", "1F2937"),
    "technology": Theme("0B0F19", "22D3EE", "E5E7EB", "22D3EE", "E5E7EB"),
    "startup": Theme("FFFFFF", "6D28D9", "1F2937", "7C3AED", "1F2937"),
    "creative": Theme("FFFFFF", "DB2777", "1F2937", "EC4899", "1F2937"),
    "education": Theme("FFFFFF", "0E7490", "1F2937", "0891B2", "1F2937"),
}


def _rgb(hex_str: str) -> RGBColor:
    return RGBColor.from_string(hex_str)


def _set_background(slide, theme: Theme):
    fill = slide.background.fill
    fill.solid()
    fill.fore_color.rgb = _rgb(theme.background)


def _add_title(slide, text: str, theme: Theme, size=Pt(40), top=Inches(0.55)):
    box = slide.shapes.add_textbox(MARGIN, top, SLIDE_W - 2 * MARGIN, Inches(1.2))
    box.name = "slide_title"
    tf = box.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    run = p.add_run()
    run.text = text
    run.font.size = size
    run.font.bold = True
    run.font.name = theme.font
    run.font.color.rgb = _rgb(theme.primary)
    return box


def _add_footer(slide, theme: Theme, page_num: int, total: int, deck_title: str):
    box = slide.shapes.add_textbox(MARGIN, SLIDE_H - Inches(0.45), SLIDE_W - 2 * MARGIN, Inches(0.35))
    box.name = "footer_deck_title"
    tf = box.text_frame
    p = tf.paragraphs[0]
    run = p.add_run()
    run.text = f"{deck_title}"
    run.font.size = Pt(10)
    run.font.color.rgb = _rgb(theme.secondary)

    num_box = slide.shapes.add_textbox(SLIDE_W - Inches(1.3), SLIDE_H - Inches(0.45), Inches(0.9), Inches(0.35))
    num_box.name = "footer_page_num"
    p2 = num_box.text_frame.paragraphs[0]
    p2.alignment = PP_ALIGN.RIGHT
    run2 = p2.add_run()
    run2.text = f"{page_num}/{total}"
    run2.font.size = Pt(10)
    run2.font.color.rgb = _rgb(theme.secondary)


def _add_bullets(slide, bullets: list[str], theme: Theme, top=Inches(1.9)):
    box = slide.shapes.add_textbox(MARGIN, top, SLIDE_W - 2 * MARGIN, SLIDE_H - top - Inches(0.7))
    box.name = "slide_bullets"
    tf = box.text_frame
    tf.word_wrap = True
    for i, bullet in enumerate(bullets):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.space_after = Pt(14)
        run = p.add_run()
        run.text = f"•  {bullet}"
        run.font.size = Pt(20)
        run.font.name = theme.font
        run.font.color.rgb = _rgb(theme.text)
    return box


def _title_slide(prs: Presentation, title: str, subtitle: str, theme: Theme):
    slide = prs.slides.add_slide(prs.slide_layouts[6])  # blank layout
    _set_background(slide, theme)

    title_box = slide.shapes.add_textbox(Inches(1.0), Inches(2.7), SLIDE_W - Inches(2.0), Inches(1.6))
    title_box.name = "slide_title"
    tf = title_box.text_frame
    tf.word_wrap = True
    tf.vertical_anchor = MSO_ANCHOR.MIDDLE
    p = tf.paragraphs[0]
    p.alignment = PP_ALIGN.LEFT
    run = p.add_run()
    run.text = title
    run.font.size = Pt(48)
    run.font.bold = True
    run.font.name = theme.font
    run.font.color.rgb = _rgb(theme.primary)

    if subtitle:
        sub_box = slide.shapes.add_textbox(Inches(1.0), Inches(4.2), SLIDE_W - Inches(2.0), Inches(0.8))
        sub_box.name = "slide_subtitle"
        sp = sub_box.text_frame.paragraphs[0]
        srun = sp.add_run()
        srun.text = subtitle
        srun.font.size = Pt(20)
        srun.font.name = theme.font
        srun.font.color.rgb = _rgb(theme.secondary)

    # accent rule
    line = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(1.0), Inches(2.55), Inches(1.4), Pt(4))
    line.fill.solid()
    line.fill.fore_color.rgb = _rgb(theme.accent)
    line.line.fill.background()
    return slide


def _content_slide(prs: Presentation, index: int, total: int, deck_title: str,
                    slide_title: str, bullets: list[str], notes: str, theme: Theme):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    _set_background(slide, theme)
    _add_title(slide, slide_title, theme)
    if bullets:
        _add_bullets(slide, bullets, theme)
    _add_footer(slide, theme, index, total, deck_title)

    if notes:
        slide.notes_slide.notes_text_frame.text = notes
    return slide


def build_presentation(title: str, slides: list[dict], theme: str = "modern") -> tuple[str, str]:
    """
    Builds a .pptx from slide JSON. Returns (file_id, absolute_path).
    `slides` items look like: {slide_title, bullet_points, speaker_notes}
    """
    th = THEMES.get(theme, THEMES["modern"])
    prs = Presentation()
    prs.slide_width = SLIDE_W
    prs.slide_height = SLIDE_H

    if not slides:
        slides = [{"slide_title": title, "bullet_points": [], "speaker_notes": ""}]

    first = slides[0]
    _title_slide(prs, title=title, subtitle=first.get("slide_title", ""), theme=th)

    body_slides = slides[1:] if len(slides) > 1 else slides
    total = len(body_slides)
    for i, s in enumerate(body_slides, start=1):
        _content_slide(
            prs,
            index=i,
            total=total,
            deck_title=title,
            slide_title=s.get("slide_title", f"Slide {i}"),
            bullets=s.get("bullet_points", []) or [],
            notes=s.get("speaker_notes", "") or "",
            theme=th,
        )

    file_id = uuid.uuid4().hex
    safe_name = "".join(c if c.isalnum() or c in " -_" else "" for c in title).strip().replace(" ", "_") or "presentation"
    path = os.path.join(OUTPUT_DIR, f"{file_id}__{safe_name}.pptx")
    prs.save(path)
    return file_id, path


def find_pptx_path(file_id: str) -> str | None:
    """Looks up a previously generated .pptx by its file_id prefix."""
    for name in os.listdir(OUTPUT_DIR):
        if name.startswith(file_id) and name.endswith(".pptx"):
            return os.path.join(OUTPUT_DIR, name)
    return None