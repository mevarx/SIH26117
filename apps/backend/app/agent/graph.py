"""
Autonomous Agent execution state graph.

Executes multi-step reasoning, tool dispatch (calculator, document search,
sandboxed file I/O, docker sandbox), and verification loops.
"""

import json
import logging
import re
from typing import Any, AsyncIterator, Dict, List, Optional

from app.agent.events import (
    CompletionEvent,
    ErrorEvent,
    ReasoningEvent,
    StatusEvent,
    StreamEvent,
    TokenEvent,
    ToolCallEvent,
    ToolResultEvent,
)
from app.agent.state import AgentState, AgentStatus, StepResult
from app.models.base import ChatMessage, GenerationRequest
from app.models.registry import model_registry
from app.sandbox.docker_runner import DockerSandboxRunner
from app.tools.calculator import CALCULATOR_TOOL_SCHEMA, calculate
from app.tools.document_tool import DOCUMENT_TOOL_SCHEMA, search_document
from app.tools.file_tool import (
    READ_FILE_TOOL_SCHEMA,
    WRITE_FILE_TOOL_SCHEMA,
    read_file,
    write_file,
)
from app.integrations.plant import create_work_order, fetch_scada_telemetry

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are an Autonomous Digital Plant Engineer operating inside an air-gapped refinery.
You have access to specialized tools to assist the user:
- calculator(expression): Evaluate mathematical expressions deterministically.
- search_document(file_path, query): Search text in PDF, DOCX, and TXT files.
- read_file(file_path): Read file contents within allowed directories.
- write_file(file_path, content): Write content to a file within allowed directories.
- run_sandbox_code(code, language): Run Python code in an isolated Docker sandbox.
- fetch_live_scada_telemetry(sensor_tag): Read live temperature, pressure, and RPM telemetry.
- create_sap_work_order(equipment_id, fault_description, priority_level, sop_reference): Create a SAP PM work order only after a critical fault is confirmed.

Cross-reference visual or document findings with live sensor data before declaring a critical failure. Explain concise, user-safe action summaries and never expose hidden chain-of-thought.

When you need to call a tool, you may provide an XML tool call:
<tool_call>
{"name": "tool_name", "parameters": {"arg": "value"}}
</tool_call>

Or use standard function calling. When you have collected sufficient information, produce your final, comprehensive answer.
"""


class AgentGraph:
    """Lightweight autonomous agent execution state graph."""

    def __init__(self, max_steps: int = 6, enable_critic: bool = True):
        self.max_steps = max_steps
        self.enable_critic = enable_critic
        self.max_critic_loops = 1
        self.sandbox_runner = DockerSandboxRunner()

    def _get_tools_schema(self) -> List[Dict[str, Any]]:
        sandbox_schema = {
            "type": "function",
            "function": {
                "name": "run_sandbox_code",
                "description": "Execute Python code in an isolated, secure Docker container.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "code": {"type": "string", "description": "Python source code to execute."},
                    },
                    "required": ["code"],
                },
            },
        }
        return [
            CALCULATOR_TOOL_SCHEMA,
            DOCUMENT_TOOL_SCHEMA,
            READ_FILE_TOOL_SCHEMA,
            WRITE_FILE_TOOL_SCHEMA,
            sandbox_schema,
            {"type": "function", "function": {"name": "fetch_live_scada_telemetry", "description": "Fetch current SCADA metrics for a sensor tag.", "parameters": {"type": "object", "properties": {"sensor_tag": {"type": "string"}}, "required": ["sensor_tag"]}}},
            {"type": "function", "function": {"name": "create_sap_work_order", "description": "Create a SAP PM work order for a confirmed critical fault.", "parameters": {"type": "object", "properties": {"equipment_id": {"type": "string"}, "fault_description": {"type": "string"}, "priority_level": {"type": "string", "enum": ["LOW", "MEDIUM", "HIGH", "CRITICAL"]}, "sop_reference": {"type": "string"}}, "required": ["equipment_id", "fault_description", "priority_level", "sop_reference"]}}},
        ]

    async def _execute_tool(self, name: str, params: Dict[str, Any]) -> Any:
        """Executes a requested tool and returns the result."""
        logger.info("Agent executing tool: %s with params: %s", name, params)
        try:
            if name == "calculator":
                return calculate(params.get("expression", ""))
            elif name == "search_document":
                return await search_document(
                    file_path=params.get("file_path", ""),
                    query=params.get("query", ""),
                    max_results=params.get("max_results", 5),
                )
            elif name == "read_file":
                return await read_file(file_path=params.get("file_path", ""))
            elif name == "write_file":
                return await write_file(
                    file_path=params.get("file_path", ""),
                    content=params.get("content", ""),
                )
            elif name in ("run_sandbox_code", "sandbox"):
                res = await self.sandbox_runner.run_code(
                    code=params.get("code", ""),
                    language="python",
                )
                return {
                    "stdout": res.stdout,
                    "stderr": res.stderr,
                    "exit_code": res.exit_code,
                    "success": res.success,
                    "duration": res.duration_seconds,
                }
            elif name == "fetch_live_scada_telemetry":
                return fetch_scada_telemetry(params.get("sensor_tag", ""))
            elif name == "create_sap_work_order":
                if params.get("priority_level", "").upper() != "CRITICAL":
                    return "Error: SAP work orders can only be created for confirmed CRITICAL faults."
                return create_work_order(**params)
            else:
                return f"Error: Unknown tool '{name}'"
        except Exception as exc:
            logger.error("Tool execution failed for %s: %s", name, exc)
            return f"Tool error: {str(exc)}"

    def _parse_tool_calls_from_text(self, text: str) -> List[Dict[str, Any]]:
        """Parses <tool_call>{...}</tool_call> blocks if emitted in text."""
        calls = []
        matches = re.finditer(r"<tool_call>(.*?)</tool_call>", text, re.DOTALL)
        for m in matches:
            content = m.group(1).strip()
            try:
                parsed = json.loads(content)
                if "name" in parsed:
                    calls.append(parsed)
            except Exception:
                continue
        return calls

    async def _evaluate_with_critic(
        self,
        client: Any,
        prompt: str,
        draft: str,
    ) -> tuple[bool, str]:
        """
        Agentic self-correction step: evaluates draft response against original prompt.
        Returns (passed: bool, critique: str).
        """
        eval_prompt = (
            f"You are Sovereign Critic, an automated verification engine for a sovereign enterprise AI assistant.\n"
            f"Evaluate the draft response against the original user prompt and any explicit constraints:\n\n"
            f"--- ORIGINAL USER PROMPT ---\n{prompt}\n\n"
            f"--- DRAFT RESPONSE ---\n{draft}\n\n"
            f"Determine whether the draft response fully and accurately fulfills the user prompt, "
            f"respects all constraints, and contains no hallucinations or missing critical steps.\n"
            f"Respond STRICTLY in JSON format:\n"
            f'{{"passed": true, "critique": "Brief confirmation"}}\n'
            f"OR\n"
            f'{{"passed": false, "critique": "Specific missing constraints or errors to fix"}}\n'
        )
        try:
            req = GenerationRequest(
                prompt=eval_prompt,
                system_prompt="You are a strict verification critic. Output valid JSON only.",
                temperature=0.1,
            )
            resp = await client.chat(req)
            text = (resp.content or "").strip()
            json_match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
            raw_json = json_match.group(1) if json_match else text
            parsed = json.loads(raw_json)
            passed = bool(parsed.get("passed", True))
            critique = str(parsed.get("critique", ""))
            return passed, critique
        except Exception as exc:
            logger.warning("Critic evaluation parsing error (%s); defaulting to pass.", exc)
            return True, ""

    async def run(self, state: AgentState) -> AgentState:
        """Runs the agent graph to completion synchronously."""
        state.status = AgentStatus.PLANNING
        client = model_registry.get_client(role="orchestrator")

        if not state.messages:
            state.messages = [
                ChatMessage(role="system", content=SYSTEM_PROMPT),
                ChatMessage(role="user", content=state.prompt),
            ]

        tools = self._get_tools_schema()
        critic_loop_count = 0

        while state.current_step < state.max_steps:
            state.status = AgentStatus.EXECUTING
            req = GenerationRequest(
                messages=state.messages,
                tools=tools,
                temperature=0.3,
            )

            try:
                response = await client.chat(req)
            except Exception as exc:
                state.status = AgentStatus.FAILED
                state.error = f"Model execution failed: {str(exc)}"
                return state

            raw_text = response.content or ""
            reasoning = response.reasoning_content or ""

            # Extract tool calls (structured or XML format)
            tool_calls_to_execute = []
            if response.tool_calls:
                for tc in response.tool_calls:
                    fn = tc.get("function", {})
                    name = fn.get("name")
                    raw_args = fn.get("arguments", "{}")
                    args = json.loads(raw_args) if isinstance(raw_args, str) else raw_args
                    tool_calls_to_execute.append({"name": name, "parameters": args, "id": tc.get("id")})
            else:
                xml_calls = self._parse_tool_calls_from_text(raw_text)
                tool_calls_to_execute.extend(xml_calls)

            if not tool_calls_to_execute:
                # No tools called; model produced candidate final output
                clean_output = re.sub(r"<tool_call>.*?</tool_call>", "", raw_text, flags=re.DOTALL).strip()

                # Critic Verification Step (Agentic Self-Correction)
                if self.enable_critic and critic_loop_count < self.max_critic_loops and state.current_step < state.max_steps - 1:
                    state.status = AgentStatus.EVALUATING
                    passed, critique = await self._evaluate_with_critic(client, state.prompt, clean_output)
                    if not passed and critique:
                        logger.info("Critic rejected draft response: %s", critique)
                        critic_loop_count += 1
                        state.add_step_result(StepResult(
                            step_index=state.current_step,
                            thinking=f"Critic feedback: {critique}",
                            action="self_correction",
                            tool_name="critic",
                            tool_output=critique,
                        ))
                        # Loop back with critic feedback
                        state.messages.append(ChatMessage(role="assistant", content=clean_output))
                        state.messages.append(ChatMessage(
                            role="user",
                            content=f"[Critic Feedback]: Your draft response missed constraints: {critique}. Please revise your output to satisfy all criteria.",
                        ))
                        continue

                state.final_output = clean_output
                state.status = AgentStatus.COMPLETED
                state.add_step_result(StepResult(
                    step_index=state.current_step,
                    thinking=reasoning,
                    action="finish",
                    tool_output=clean_output,
                ))
                return state

            # 1. Append a SINGLE assistant message containing ALL tool calls
            assistant_tool_calls = []
            for i, call in enumerate(tool_calls_to_execute):
                tool_id = call.get("id") or f"call_{state.current_step}_{i}"
                call["id"] = tool_id
                assistant_tool_calls.append({
                    "id": tool_id, 
                    "type": "function", 
                    "function": {
                        "name": call.get("name"), 
                        "arguments": json.dumps(call.get("parameters"))
                    }
                })

            state.messages.append(ChatMessage(
                role="assistant",
                content=raw_text or "Executing tools...",
                tool_calls=assistant_tool_calls if assistant_tool_calls else None,
            ))

            # 2. Execute tools and append their individual results
            for call in tool_calls_to_execute:
                tool_name = call.get("name", "")
                params = call.get("parameters", {})
                tool_result = await self._execute_tool(tool_name, params)

                state.add_step_result(StepResult(
                    step_index=state.current_step,
                    thinking=reasoning,
                    action=f"call_{tool_name}",
                    tool_name=tool_name,
                    tool_input=params,
                    tool_output=tool_result,
                ))

                tool_id = call.get("id") or f"call_{state.current_step}_{tool_calls_to_execute.index(call)}"
                state.messages.append(ChatMessage(
                    role="tool",
                    content=json.dumps(tool_result) if not isinstance(tool_result, str) else tool_result,
                    tool_call_id=tool_id,
                ))

        # Max steps reached
        state.status = AgentStatus.COMPLETED
        state.final_output = state.final_output or "Agent reached maximum execution steps."
        return state

    async def stream_run(self, state: AgentState) -> AsyncIterator[StreamEvent]:
        """Runs the agent graph and yields SSE stream events."""
        yield StatusEvent(status="planning", message="Initializing agent state graph...", task_id=state.task_id)

        client = model_registry.get_client(role="orchestrator")

        if not state.messages:
            state.messages = [
                ChatMessage(role="system", content=SYSTEM_PROMPT),
                ChatMessage(role="user", content=state.prompt),
            ]

        tools = self._get_tools_schema()
        critic_loop_count = 0

        while state.current_step < state.max_steps:
            yield StatusEvent(
                status="executing",
                message=f"Executing step {state.current_step + 1} of {state.max_steps}...",
                progress=(state.current_step / state.max_steps),
                task_id=state.task_id,
            )

            req = GenerationRequest(
                messages=state.messages,
                tools=tools,
                temperature=0.3,
            )

            try:
                response = await client.chat(req)
            except Exception as exc:
                yield ErrorEvent(error=f"Model error: {str(exc)}", task_id=state.task_id)
                state.status = AgentStatus.FAILED
                state.error = str(exc)
                return

            raw_text = response.content or ""
            reasoning = response.reasoning_content or ""

            if reasoning:
                yield ReasoningEvent(reasoning=reasoning, task_id=state.task_id)

            tool_calls_to_execute = []
            if response.tool_calls:
                for tc in response.tool_calls:
                    fn = tc.get("function", {})
                    name = fn.get("name")
                    raw_args = fn.get("arguments", "{}")
                    args = json.loads(raw_args) if isinstance(raw_args, str) else raw_args
                    tool_calls_to_execute.append({"name": name, "parameters": args, "id": tc.get("id")})
            else:
                xml_calls = self._parse_tool_calls_from_text(raw_text)
                tool_calls_to_execute.extend(xml_calls)

            if not tool_calls_to_execute:
                clean_output = re.sub(r"<tool_call>.*?</tool_call>", "", raw_text, flags=re.DOTALL).strip()

                # Critic Verification Step (Agentic Self-Correction)
                if self.enable_critic and critic_loop_count < self.max_critic_loops and state.current_step < state.max_steps - 1:
                    state.status = AgentStatus.EVALUATING
                    yield StatusEvent(status="evaluating", message="Critic evaluating draft response against constraints...", task_id=state.task_id)

                    passed, critique = await self._evaluate_with_critic(client, state.prompt, clean_output)
                    if not passed and critique:
                        logger.info("Critic rejected draft response: %s", critique)
                        critic_loop_count += 1
                        yield ReasoningEvent(reasoning=f"[Self-Correction Critic]: {critique}\nRevising response to address missing constraints...", task_id=state.task_id)

                        state.add_step_result(StepResult(
                            step_index=state.current_step,
                            thinking=f"Critic feedback: {critique}",
                            action="self_correction",
                            tool_name="critic",
                            tool_output=critique,
                        ))

                        state.messages.append(ChatMessage(role="assistant", content=clean_output))
                        state.messages.append(ChatMessage(
                            role="user",
                            content=f"[Critic Feedback]: Your draft response missed constraints: {critique}. Please revise your output to satisfy all criteria.",
                        ))
                        continue

                state.final_output = clean_output
                state.status = AgentStatus.COMPLETED

                # Stream out clean output tokens
                yield TokenEvent(token=clean_output, task_id=state.task_id)
                yield CompletionEvent(result={"output": clean_output, "steps": [s.model_dump() for s in state.step_results]}, task_id=state.task_id)
                return

            # 1. Append a SINGLE assistant message containing ALL tool calls
            assistant_tool_calls = []
            for i, call in enumerate(tool_calls_to_execute):
                tool_id = call.get("id") or f"call_{state.current_step}_{i}"
                call["id"] = tool_id
                assistant_tool_calls.append({
                    "id": tool_id, 
                    "type": "function", 
                    "function": {
                        "name": call.get("name"), 
                        "arguments": json.dumps(call.get("parameters"))
                    }
                })

            state.messages.append(ChatMessage(
                role="assistant",
                content=raw_text or "Executing tools...",
                tool_calls=assistant_tool_calls if assistant_tool_calls else None,
            ))

            # 2. Execute tools and append their individual results
            for call in tool_calls_to_execute:
                tool_name = call.get("name", "")
                params = call.get("parameters", {})
                tool_id = call.get("id") or f"call_{state.current_step}_{tool_calls_to_execute.index(call)}"

                yield ToolCallEvent(tool_name=tool_name, tool_input=params, task_id=state.task_id)
                tool_result = await self._execute_tool(tool_name, params)
                yield ToolResultEvent(tool_name=tool_name, result=tool_result, task_id=state.task_id)

                state.add_step_result(StepResult(
                    step_index=state.current_step,
                    thinking=reasoning,
                    action=f"call_{tool_name}",
                    tool_name=tool_name,
                    tool_input=params,
                    tool_output=tool_result,
                ))

                state.messages.append(ChatMessage(
                    role="tool",
                    content=json.dumps(tool_result) if not isinstance(tool_result, str) else tool_result,
                    tool_call_id=tool_id,
                ))

        state.status = AgentStatus.COMPLETED
        state.final_output = state.final_output or "Agent reached maximum execution steps."
        yield CompletionEvent(result={"output": state.final_output}, task_id=state.task_id)


agent_graph = AgentGraph()

