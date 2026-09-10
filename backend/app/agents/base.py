"""
Base class for a single-responsibility content agent.

Design change from the old ai_service.py:
    OLD: one Groq call, one giant tool with a property per selected output
         type -> if the model fumbles ONE property, the whole request can
         fail, and every output type is coupled to the same prompt/context.
    NEW: one agent per output type. Each agent:
         - owns its own tool schema (still sourced from output_schemas.py,
           so you don't have to maintain two copies of the schema)
         - owns its own system/user prompt, tuned for that one deliverable
         - fails independently - a broken "video_package" agent doesn't
           take down "linkedin_post"
         - can be swapped for a different model/temperature/vendor later
           without touching anything else

Agents are plain, synchronous, stateless callables. The orchestrator is
responsible for running many of them concurrently (see orchestrator.py).
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Optional

from groq import Groq

from app.config import settings
from app.output_schemas import OUTPUT_TYPES

_client = Groq(api_key=settings.GROQ_API_KEY)


@dataclass
class AgentResult:
    key: str
    ok: bool
    data: Optional[dict] = None
    error: Optional[str] = None


class OutputAgent:
    """
    A single agent responsible for producing exactly one output type.

    Subclasses may override `build_prompt` to give a type-specific system
    prompt, or override `postprocess` to do extra work after the model
    responds (e.g. PresentationAgent renders an actual .pptx file).
    """

    def __init__(self, key: str):
        if key not in OUTPUT_TYPES:
            raise ValueError(f"Unknown output type: {key}")
        self.key = key
        self.label = OUTPUT_TYPES[key]["label"]
        self.instructions = OUTPUT_TYPES[key]["instructions"]
        self.schema = OUTPUT_TYPES[key]["schema"]
        self.tool_name = f"produce_{key}"

    def build_tool(self) -> dict:
        return {
            "type": "function",
            "function": {
                "name": self.tool_name,
                "description": f"Return the generated {self.label} content.",
                "parameters": self.schema,
            },
        }

    def build_prompt(self, source_text: str, parameters: dict) -> str:
        """Default prompt. Override per-agent for type-specific guidance."""
        return f"""You are a specialist agent whose ONLY job is to produce one
deliverable: {self.label}.

{self.instructions}

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

Rules:
- Base your output ONLY on facts present in the source content. Never invent
  facts, numbers, names, or statistics that are not present above.
- Write in the requested language.
- Call the {self.tool_name} tool with your result. Do not respond in plain text.
"""

    def postprocess(self, data: dict, parameters: dict) -> dict:
        """Hook for subclasses. Default: return the model's data unchanged."""
        return data

    def run(self, source_text: str, parameters: dict) -> AgentResult:
        tool = self.build_tool()
        prompt = self.build_prompt(source_text, parameters)

        try:
            response = _client.chat.completions.create(
                model=settings.GROQ_MODEL,
                max_tokens=4096,
                tools=[tool],
                tool_choice={"type": "function", "function": {"name": self.tool_name}},
                messages=[{"role": "user", "content": prompt}],
            )
            message = response.choices[0].message
            if not message.tool_calls:
                return AgentResult(self.key, ok=False, error="Model returned no structured output.")

            call = next((c for c in message.tool_calls if c.function.name == self.tool_name), None)
            if call is None:
                return AgentResult(self.key, ok=False, error="Model called the wrong tool.")

            data = json.loads(call.function.arguments)
            data = self.postprocess(data, parameters)
            return AgentResult(self.key, ok=True, data=data)

        except Exception as exc:  # noqa: BLE001 - agent boundary must not raise
            return AgentResult(self.key, ok=False, error=str(exc))