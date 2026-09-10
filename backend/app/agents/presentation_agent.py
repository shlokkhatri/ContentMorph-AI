"""
PresentationAgent - produces the same slide JSON as before, but ALSO
renders a real, downloadable .pptx file using python-pptx (see
app/services/pptx_builder.py), then attaches the file's id to the result
so the API/frontend can offer "Download PPTX / Word / PDF" buttons instead
of just a JSON preview.
"""

from __future__ import annotations

from app.agents.base import OutputAgent
from app.services import pptx_builder


class PresentationAgent(OutputAgent):
    def __init__(self):
        super().__init__("presentation")

    def build_prompt(self, source_text: str, parameters: dict) -> str:
        base = super().build_prompt(source_text, parameters)
        return base + """
Additional slide-deck specific rules:
- Produce between 6 and 16 slides depending on how much source material there is.
- The first slide's bullet_points may be empty (title slide).
- Keep each bullet under ~15 words. Prefer 3-6 bullets per slide.
- Do not repeat the same slide structure for every slide - vary how you
  break up sections (e.g. a slide can have 0 bullets and rely on speaker
  notes if it's a transition/section-header slide).
"""

    def postprocess(self, data: dict, parameters: dict) -> dict:
        """After the model returns slide JSON, render it into an actual .pptx file."""
        title = (parameters.get("presentation_title") or "Presentation").strip()
        file_id, pptx_path = pptx_builder.build_presentation(
            title=title,
            slides=data.get("slides", []),
            theme=parameters.get("theme", "modern"),
        )
        data["file_id"] = file_id
        data["available_formats"] = ["pptx", "docx", "pdf"]
        return data