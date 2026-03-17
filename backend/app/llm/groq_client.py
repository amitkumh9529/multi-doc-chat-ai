"""
Groq LLM client — wraps the Groq REST API to send prompts and return answers.
"""
import httpx
from typing import List, Optional
from app.core.config import settings
from app.models.schemas import ChatMessage


GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

SYSTEM_PROMPT = """You are a helpful AI assistant specialised in answering questions
about uploaded documents. You are given relevant excerpts from those documents as context.

Rules:
- Answer ONLY using the provided context.
- If the answer is not in the context, say: "I couldn't find that information in the uploaded documents."
- Be concise, accurate, and helpful.
- When relevant, mention which document the information came from.
- Do not fabricate information."""


def _build_messages(context: str, question: str, history: List[ChatMessage]) -> List[dict]:
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    for turn in history[-6:]:
        messages.append({"role": turn.role, "content": turn.content})
    user_content = f"Context from documents:\n---\n{context}\n---\n\nQuestion: {question}"
    messages.append({"role": "user", "content": user_content})
    return messages


async def query_groq(
    context: str,
    question: str,
    history: Optional[List[ChatMessage]] = None,
) -> str:
    if not settings.GROQ_API_KEY:
        raise ValueError(
            "GROQ_API_KEY is not set. Add it to your .env file. "
            "Get a free key at https://console.groq.com"
        )

    messages = _build_messages(context, question, history or [])

    payload = {
        "model": settings.GROQ_MODEL,
        "messages": messages,
        "temperature": 0.3,
        "max_tokens": 1024,
    }

    headers = {
        "Authorization": f"Bearer {settings.GROQ_API_KEY}",
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(GROQ_API_URL, json=payload, headers=headers)

    try:
        body = response.json()
    except Exception:
        body = response.text

    if response.status_code != 200:
        groq_msg = ""
        if isinstance(body, dict):
            groq_msg = body.get("error", {}).get("message", "") or str(body)
        else:
            groq_msg = str(body)
        raise RuntimeError(f"Groq API error {response.status_code}: {groq_msg}")

    data: dict = body  # type: ignore[assignment]
    return data["choices"][0]["message"]["content"].strip()
