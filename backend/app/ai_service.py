"""
This file is the only place in the codebase that talks to the Groq API.

How generation works, in three steps:
1. Build a "tool" (function) whose parameters schema has one field per output
   type the operator selected (see output_schemas.py for each field's shape).
2. Force the model to call that tool via tool_choice. This guarantees the
   response is valid JSON matching our schema - no fragile text-parsing needed.
3. Read the tool call's arguments straight back out - that dictionary IS
   the final result, ready to send to the frontend.

Groq uses the OpenAI-compatible API so we use the `groq` Python SDK.
"""

import json
import base64
from groq import Groq

from app.config import settings
from app.output_schemas import OUTPUT_TYPES

client = Groq(api_key=settings.GROQ_API_KEY)

TOOL_NAME = "produce_content_outputs"


def _build_tool(selected_output_types: list[str]) -> dict:
    """Builds one tool definition whose schema has one property per selected output type."""
    properties = {key: OUTPUT_TYPES[key]["schema"] for key in selected_output_types}

    return {
        "type": "function",
        "function": {
            "name": TOOL_NAME,
            "description": "Return the generated content for every requested output type.",
            "parameters": {
                "type": "object",
                "properties": properties,
                "required": list(selected_output_types),
            },
        },
    }


def _build_prompt(source_text: str, selected_output_types: list[str], parameters: dict) -> str:
    """Builds the natural-language instructions sent to the model alongside the source content."""
    requested_list = "\n".join(
        f"- {OUTPUT_TYPES[key]['label']}: {OUTPUT_TYPES[key]['instructions']}"
        for key in selected_output_types
    )

    return f"""You are a content transformation assistant for an organisation.
Read the SOURCE CONTENT below, understand its facts, context and intent,
then produce EVERY one of the requested output artefacts from it.

SOURCE CONTENT:
\"\"\"
{source_text}
\"\"\"

GENERATION PARAMETERS:
- Target audience: {parameters.get('audience')}
- Tone: {parameters.get('tone')}
- Language: {parameters.get('language')}
- Level of detail: {parameters.get('detail_level')}
- Communication objective: {parameters.get('objective')}
- Additional instructions: {parameters.get('extra_instructions') or 'None'}

REQUESTED OUTPUTS:
{requested_list}

Rules:
- Base every output ONLY on facts present in the source content. Do not invent facts, numbers, or names.
- Adapt tone, structure and level of detail to the audience and objective given above.
- Write all outputs in the requested language.
- Call the {TOOL_NAME} tool with your results.
"""


def _extract_tool_result(response) -> dict:
    """Parse the tool call arguments from the Groq response."""
    message = response.choices[0].message
    if message.tool_calls:
        for tc in message.tool_calls:
            if tc.function.name == TOOL_NAME:
                return json.loads(tc.function.arguments)
    raise RuntimeError("The model did not return the expected structured response. Please try again.")


def generate_outputs(source_text: str, selected_output_types: list[str], parameters: dict) -> dict:
    """
    Generates all selected output types from plain text source content.
    Returns a dict like: { "linkedin_post": {...}, "advisory": {...} }
    """
    tool = _build_tool(selected_output_types)
    prompt = _build_prompt(source_text, selected_output_types, parameters)

    response = client.chat.completions.create(
        model=settings.GROQ_MODEL,
        max_tokens=4096,
        tools=[tool],
        tool_choice={"type": "function", "function": {"name": TOOL_NAME}},
        messages=[{"role": "user", "content": prompt}],
    )

    return _extract_tool_result(response)


def generate_outputs_from_image(
    image_bytes: bytes, media_type: str, selected_output_types: list[str], parameters: dict
) -> dict:
    """
    Attempts to process an image using Groq's vision-capable model.
    Falls back to text-only with a notice if vision fails.
    """
    tool = _build_tool(selected_output_types)
    image_b64 = base64.b64encode(image_bytes).decode("utf-8")
    image_data_url = f"data:{media_type};base64,{image_b64}"

    prompt_text = _build_prompt(
        "(See the attached image for the source content.)",
        selected_output_types,
        parameters,
    )

    messages = [
        {
            "role": "user",
            "content": [
                {"type": "image_url", "image_url": {"url": image_data_url}},
                {"type": "text", "text": prompt_text},
            ],
        }
    ]

    try:
        response = client.chat.completions.create(
            model=settings.GROQ_VISION_MODEL,
            max_tokens=4096,
            tools=[tool],
            tool_choice={"type": "function", "function": {"name": TOOL_NAME}},
            messages=messages,
        )
        return _extract_tool_result(response)
    except Exception:
        # Fallback: text-only if vision fails
        fallback_prompt = _build_prompt(
            "[An image was uploaded but could not be processed. "
            "Please ask the user to paste the text content directly.]",
            selected_output_types,
            parameters,
        )
        response = client.chat.completions.create(
            model=settings.GROQ_MODEL,
            max_tokens=4096,
            tools=[tool],
            tool_choice={"type": "function", "function": {"name": TOOL_NAME}},
            messages=[{"role": "user", "content": fallback_prompt}],
        )
        return _extract_tool_result(response)
