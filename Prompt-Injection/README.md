# Prompt Injection

## Description
Prompt Injection vulnerabilities occur in AI/LLM-powered applications where user input can manipulate the system's prompts or instructions. This can lead to unauthorized actions, data leakage, or bypassing of security controls.

## Common Attack Vectors
- System prompt extraction
- Instruction override
- Jailbreaking AI models
- Context manipulation
- Role confusion attacks
- Indirect prompt injection via external data

## Testing Approach
Test AI-powered chatbots, assistants, and applications that use Large Language Models (LLMs). Try to manipulate the model's behavior by injecting malicious prompts that override system instructions.

## Payloads
See `prompt-injection-payloads.txt` for a comprehensive list of prompt injection payloads.

## Additional Payloads
See `indirect-agent-payloads.txt` for indirect document/tool-result injection, RAG poisoning, mock-tool boundaries, synthetic canary requests and multimodal input strings. Select the section matching the target input context. Use synthetic canaries and mock tools; compare the agent's actions with the permitted task and tool boundaries.
