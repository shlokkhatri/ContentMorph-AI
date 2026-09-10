"""
This file is the single place that defines every output type the platform
can generate. To add a brand new output type in the future, add ONE new
entry here - nothing else in the codebase needs to change.

For each output type we define:
- label:        shown on the dashboard checkbox
- instructions: told to Claude, explains what this deliverable is
- schema:       the exact JSON shape Claude must return for it
"""

OUTPUT_TYPES = {
    "linkedin_post": {
        "label": "LinkedIn Post",
        "instructions": "A ready-to-publish, professional LinkedIn post.",
        "schema": {
            "type": "object",
            "properties": {
                "post_text": {
                    "type": "string",
                    "description": "The full LinkedIn post, ready to copy-paste.",
                },
                "hashtags": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "3-6 relevant hashtags, without the # symbol.",
                },
            },
            "required": ["post_text", "hashtags"],
        },
    },
    "twitter_post": {
        "label": "Twitter/X Post",
        "instructions": "A single tweet, or a short numbered thread if the content needs more than one tweet.",
        "schema": {
            "type": "object",
            "properties": {
                "tweets": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "One or more tweets in order, each under 280 characters.",
                },
            },
            "required": ["tweets"],
        },
    },
    "advisory": {
        "label": "Advisory",
        "instructions": "A structured advisory document (e.g. security, policy, or operational advisory).",
        "schema": {
            "type": "object",
            "properties": {
                "title": {"type": "string"},
                "severity": {
                    "type": "string",
                    "description": "e.g. Low, Medium, High, Critical, or Informational",
                },
                "summary": {"type": "string"},
                "affected_parties": {"type": "string"},
                "recommended_actions": {
                    "type": "array",
                    "items": {"type": "string"},
                },
            },
            "required": ["title", "severity", "summary", "affected_parties", "recommended_actions"],
        },
    },
    "infographic": {
        "label": "Infographic",
        "instructions": "Content and layout recommendations for an infographic. This is a content blueprint (text), not a rendered image.",
        "schema": {
            "type": "object",
            "properties": {
                "title": {"type": "string"},
                "sections": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "heading": {"type": "string"},
                            "content": {"type": "string", "description": "Short text or stat for this section."},
                        },
                        "required": ["heading", "content"],
                    },
                },
                "visual_recommendations": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Suggested icons, charts, colours, or imagery for a designer to use.",
                },
            },
            "required": ["title", "sections", "visual_recommendations"],
        },
    },
    "executive_summary": {
        "label": "Executive Summary",
        "instructions": "A concise executive briefing focused on what a decision-maker needs to know.",
        "schema": {
            "type": "object",
            "properties": {
                "title": {"type": "string"},
                "summary": {"type": "string", "description": "2-4 sentence overview."},
                "key_points": {"type": "array", "items": {"type": "string"}},
                "recommendation": {"type": "string"},
            },
            "required": ["title", "summary", "key_points", "recommendation"],
        },
    },
    "presentation": {
        "label": "Presentation",
        "instructions": "Slide-by-slide content with speaker notes, ready to paste into PowerPoint or Google Slides.",
        "schema": {
            "type": "object",
            "properties": {
                "slides": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "slide_title": {"type": "string"},
                            "bullet_points": {"type": "array", "items": {"type": "string"}},
                            "speaker_notes": {"type": "string"},
                        },
                        "required": ["slide_title", "bullet_points", "speaker_notes"],
                    },
                },
            },
            "required": ["slides"],
        },
    },
    "video_package": {
        "label": "Video",
        "instructions": "A complete short video package: script, storyboard, narration, subtitles and visual recommendations.",
        "schema": {
            "type": "object",
            "properties": {
                "title": {"type": "string"},
                "estimated_duration": {"type": "string", "description": "e.g. '90 seconds'"},
                "scenes": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "scene_number": {"type": "integer"},
                            "visual_description": {"type": "string"},
                            "narration": {"type": "string"},
                            "subtitle": {"type": "string"},
                        },
                        "required": ["scene_number", "visual_description", "narration", "subtitle"],
                    },
                },
            },
            "required": ["title", "estimated_duration", "scenes"],
        },
    },
}
