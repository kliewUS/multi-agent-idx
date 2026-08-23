---
name: real-estate-rag-agent
description: Answers technical and operational questions regarding IDXExchange, real estate data tools, field definitions (e.g., DOM, list-to-close ratio), and schema columns using local documentation.
metadata:
  openclaw:
    requires:
      bins: ["python3"]
tools: execute, read
---

# IDXExchange Documentation RAG Assistant

Use this skill when the user asks informational or technical questions about IDXExchange tools, real estate metrics (e.g., DOM, list-to-close ratio), or dataset column definitions.

---

## Objectives

### PROCESS POLLING RULE FOR LOCAL AGENTS
If a command returns a background process session, you MUST use the string alias (e.g., `tide-nudibranch`) for the `sessionId` field when calling the `process` tool. **NEVER use numeric PIDs (e.g., 79328) as the sessionId.**

### Step 1: Run the RAG Agent
Execute the RAG agent script using the workspace virtual environment, passing the user's natural language question as the single command argument:

```bash
  ~/.openclaw/workspace/venv/bin/python3 ~/.openclaw/workspace/skills/real-estate-recommendations/scripts/rag_agent.py "[USER_QUERY]"
```

---

## Step 2: Output Parsing & Formatting
The script queries the vector store for relevant documentation chunks and outputs a concise text response.

- **Valid Answer**: Present the script's output directly to the user.
- **Fallback / Unsure Response**: If the script returns "I'm not sure how to answer that based on our real estate documentation. Please reach out to IDXExchange Support.", relay this to the user and ask if they would like to refine their question or contact support.

---
## Edge Cases & Error Handling
- **Missing Command-Line Argument**: If invoked without a query argument, the script will output Please provide a search query!. Ensure the user's query is properly quoted.
- **Out-of-Scope Queries**: The agent relies exclusively on retrieved documentation chunks. For requests outside the knowledge base, do not hallucinate answers beyond what the script returns.
