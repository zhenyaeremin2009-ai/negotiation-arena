import os
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
from typing import Optional

from .models import (
    SessionStartRequest,
    ChatRequest,
    DebriefRequest,
    SessionState,
    SparkResponse,
    DebriefResponse
)
from .state_manager import session_manager, SCENARIOS
from .spark_agent import call_spark_agent, get_welcome_message, generate_debrief

app = FastAPI(title="Арена переговоров: Spark AI", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = Path(__file__).resolve().parent.parent
STATIC_DIR = BASE_DIR / "static"

class ApiKeyConfig(BaseModel):
    api_key: str

@app.get("/api/health")
async def health():
    return {
        "status": "ok",
        "has_api_key": bool(os.environ.get("GEMINI_API_KEY")),
        "scenarios": SCENARIOS
    }

@app.post("/api/config/key")
async def set_api_key(config: ApiKeyConfig):
    cleaned_key = config.api_key.strip()
    if not cleaned_key:
        raise HTTPException(status_code=400, detail="Ключ не может быть пустым")
    os.environ["GEMINI_API_KEY"] = cleaned_key

    # Persist to .env in project root
    env_path = BASE_DIR / ".env"
    try:
        with open(env_path, "w", encoding="utf-8") as f:
            f.write(f"GEMINI_API_KEY={cleaned_key}\n")
    except Exception:
        pass

    return {"status": "success", "message": "Ключ успешно сохранен"}

@app.post("/api/session/start")
async def start_session(req: SessionStartRequest):
    if req.api_key:
        os.environ["GEMINI_API_KEY"] = req.api_key.strip()

    session = session_manager.create_session(
        persona_type=req.persona_type,
        scenario_id=req.scenario_id,
        user_batna=req.user_batna
    )

    # Generate initial welcome message from Spark
    welcome_text = get_welcome_message(session.persona_type, session.scenario_id)
    session_manager.add_message(session.session_id, sender="spark", text=welcome_text)

    return {
        "session": session,
        "scenarios": SCENARIOS
    }

@app.get("/api/session/{session_id}")
async def get_session(session_id: str):
    session = session_manager.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Сессия не найдена")
    return session

@app.post("/api/chat")
async def chat(req: ChatRequest):
    session = session_manager.get_session(req.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Сессия не найдена")

    if session.game_over:
        return {
            "session": session,
            "game_over": True,
            "ending": session.ending,
            "ending_reason": session.ending_reason
        }

    # 1. Add user message to history
    session_manager.add_message(session.session_id, sender="user", text=req.user_message)

    # 2. Call Spark Agent (Gemini)
    spark_response, engine = call_spark_agent(session, req.user_message, api_key=req.api_key)

    # 3. Apply state deltas & check branching
    updated_session = session_manager.apply_delta(
        session.session_id,
        spark_response.internal_state,
        spark_response.branch_trigger
    )

    # 4. Add Spark reply to history
    session_manager.add_message(
        session.session_id,
        sender="spark",
        text=spark_response.reply,
        hint=spark_response.hint
    )

    return {
        "session": updated_session,
        "spark_reply": spark_response.reply,
        "hint": spark_response.hint,
        "engine": engine,
        "internal_state_delta": spark_response.internal_state.model_dump(),
        "branch_trigger": spark_response.branch_trigger.model_dump(),
        "game_over": updated_session.game_over,
        "ending": updated_session.ending,
        "ending_reason": updated_session.ending_reason
    }

@app.post("/api/session/debrief")
async def debrief(req: DebriefRequest):
    session = session_manager.get_session(req.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Сессия не найдена")

    debrief_result: DebriefResponse = generate_debrief(session, api_key=req.api_key)
    return {
        "session_id": session.session_id,
        "ending": session.ending,
        "ending_reason": session.ending_reason,
        "debrief": debrief_result
    }

# Serve frontend static assets
if STATIC_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

@app.get("/")
async def serve_index():
    index_file = STATIC_DIR / "index.html"
    if index_file.exists():
        return FileResponse(str(index_file))
    return JSONResponse({"message": "Negotiation Arena backend is running."})

@app.get("/style.css")
async def serve_style():
    return FileResponse(str(STATIC_DIR / "style.css"))

@app.get("/app.js")
async def serve_app_js():
    return FileResponse(str(STATIC_DIR / "app.js"))
