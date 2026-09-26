"""
Chatbot Router — /api/v1/chatbot
Runtime-only Gemini proxy — no DB storage, stateless.
"""
import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional

from app.config import settings
from app.routers.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/chatbot", tags=["Chatbot"])

class ChatbotMessage(BaseModel):
    role: str  # user | assistant
    content: str

class ChatbotRequest(BaseModel):
    message: str
    history: List[ChatbotMessage] = []

class ChatbotResponse(BaseModel):
    reply: str

SYSTEM_PROMPT = (
    "You are Autowizor Assistant — Pakistan's Connected Auto Ecosystem helper. "
    "Be concise, friendly, and helpful. Answer about cars, bikes, auto financing, insurance, tracker, prices, "
    "and Autowizor services. If user asks unrelated, politely redirect to auto help. Use Urdu/Hinglish if user uses it. "
    "Keep replies short (2-4 lines) unless detailed comparison requested."
)

GEMINI_MODEL = "gemini-3.6-flash"

@router.post("", response_model=ChatbotResponse)
async def chatbot_reply(payload: ChatbotRequest, current_user: User = Depends(get_current_user)):
    # Runtime only — no DB save
    api_key = (settings.GEMINI_API_KEY or "").strip()
    if not api_key:
        raise HTTPException(status_code=500, detail="Gemini API key not configured")

    # Build Gemini contents: history + current message, with system prompt as first user instruction
    contents = []
    # System as first message via user role (Gemini systemInstruction not always supported via API key)
    contents.append({"role": "user", "parts": [{"text": SYSTEM_PROMPT}]})
    contents.append({"role": "model", "parts": [{"text": "Understood. I am Autowizor Assistant, ready to help."}]})
    for m in payload.history[-8:]:  # last 8 turns only for context
        role = "user" if m.role == "user" else "model"
        contents.append({"role": role, "parts": [{"text": m.content}]})
    contents.append({"role": "user", "parts": [{"text": payload.message}]})

    url = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent?key={api_key}"
    body = {
        "contents": contents,
        "generationConfig": {"temperature": 0.7, "maxOutputTokens": 512},
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            res = await client.post(url, json=body, headers={"Content-Type": "application/json"})
            if res.status_code != 200:
                # Try fallback: return friendly error but don't leak key
                err = res.text[:400]
                print(f"[CHATBOT] Gemini {res.status_code}: {err}")
                raise HTTPException(status_code=502, detail="Gemini error")
            data = res.json()
            # Extract text
            candidates = data.get("candidates") or []
            if not candidates:
                raise HTTPException(status_code=502, detail="Empty Gemini response")
            parts = candidates[0].get("content", {}).get("parts") or []
            text = "".join(p.get("text", "") for p in parts).strip()
            if not text:
                text = "Sorry, I couldn't generate a reply. Please try again."
            return ChatbotResponse(reply=text)
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Gemini timeout")
    except HTTPException:
        raise
    except Exception as e:
        print(f"[CHATBOT] error: {e}")
        raise HTTPException(status_code=500, detail="Chatbot error")
