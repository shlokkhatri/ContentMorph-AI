"""
Runs one independent agent per selected output type, in parallel.

This replaces app/ai_service.generate_outputs(). Each output type gets its
own agent instance and its own Groq call; a failure in one agent is
reported per-key instead of failing the entire /api/generate request.
"""

from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Dict

from app.agents.base import OutputAgent, AgentResult
from app.agents.presentation_agent import PresentationAgent
from app.output_schemas import OUTPUT_TYPES

# Map of output-type key -> agent class. Every key defaults to the generic
# OutputAgent; register a specialised subclass here when a type needs extra
# behaviour (like presentation's pptx rendering).
_AGENT_OVERRIDES = {
    "presentation": PresentationAgent,
}


def _build_agent(key: str) -> OutputAgent:
    agent_cls = _AGENT_OVERRIDES.get(key, OutputAgent)
    return agent_cls(key) if agent_cls is OutputAgent else agent_cls()


def run_agents(source_text: str, selected_types: list[str], parameters: dict) -> dict:
    """
    Returns:
        {
          "results": { "<key>": {...data...}, ... },   # only successful agents
          "errors":  { "<key>": "<error message>", ... }  # only failed agents
        }
    """
    unknown = [t for t in selected_types if t not in OUTPUT_TYPES]
    if unknown:
        raise ValueError(f"Unknown output type(s): {unknown}")

    agents = [_build_agent(key) for key in selected_types]
    results: Dict[str, dict] = {}
    errors: Dict[str, str] = {}

    # Each Groq call is a blocking network request, so a thread pool gives
    # real wall-clock speedup even though the Python GIL is held for CPU work.
    with ThreadPoolExecutor(max_workers=max(1, len(agents))) as pool:
        future_to_agent = {pool.submit(agent.run, source_text, parameters): agent for agent in agents}
        for future in as_completed(future_to_agent):
            agent = future_to_agent[future]
            result: AgentResult = future.result()
            if result.ok:
                results[result.key] = result.data
            else:
                errors[result.key] = result.error or "Unknown agent failure."

    return {"results": results, "errors": errors}