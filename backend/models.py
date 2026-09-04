from typing import Optional, List, Literal
from pydantic import BaseModel, Field

class InternalStateDelta(BaseModel):
    trust_delta: int = Field(..., description="Изменение доверия: от -30 до +30")
    tension_delta: int = Field(..., description="Изменение напряжения: от -30 до +30")
    progress_delta: int = Field(..., description="Изменение прогресса сделки: от -20 до +30")
    stage_change: bool = Field(False, description="true только если произошел переход на следующий этап")
    new_stage: Optional[int] = Field(None, description="Номер нового этапа (1, 2, 3 или 4)")

class BranchTrigger(BaseModel):
    activated: bool = Field(False, description="true только если переговоры однозначно завершены")
    ending_type: Optional[Literal["deal", "compromise", "fail"]] = Field(None, description="Тип концовки")
    reason: Optional[str] = Field(None, description="Причина завершения переговоров")

class SparkResponse(BaseModel):
    reply: str = Field(..., description="Текст реплики оппонента от первого лица")
    internal_state: InternalStateDelta = Field(..., description="Дельты внутренних параметров")
    branch_trigger: BranchTrigger = Field(..., description="Триггер завершения переговоров")
    hint: Optional[str] = Field(None, description="Опциональная развивающая подсказка пользователю")

class DebriefResponse(BaseModel):
    summary: str = Field(..., description="Краткое резюме переговоров")
    score: int = Field(..., ge=0, le=100, description="Итоговая оценка навыков (0-100)")
    harvard_analysis: str = Field(..., description="Анализ по Гарвардской модели (люди vs проблемы, интересы vs позиции)")
    spin_analysis: str = Field(..., description="Анализ использования SPIN-вопросов")
    batna_analysis: str = Field(..., description="Оценка работы с BATNA")
    strengths: List[str] = Field(..., description="Сильные стороны пользователя")
    weaknesses: List[str] = Field(..., description="Слабые стороны и допущенные ошибки")
    recommendations: List[str] = Field(..., description="Практические рекомендации для улучшения")

class MetricsState(BaseModel):
    trust: int = Field(0, ge=-100, le=100)
    tension: int = Field(0, ge=-100, le=100)
    progress: int = Field(0, ge=0, le=100)

class ChatMessage(BaseModel):
    sender: Literal["user", "spark", "system"]
    text: str
    timestamp: Optional[str] = None
    hint: Optional[str] = None

class SessionStartRequest(BaseModel):
    persona_type: Literal["shark", "partner", "trickster"] = "shark"
    scenario_id: Literal["price_war", "contract_renewal", "deadline_crunch"] = "price_war"
    user_batna: Optional[str] = None
    api_key: Optional[str] = None

class ChatRequest(BaseModel):
    session_id: str
    user_message: str
    api_key: Optional[str] = None

class DebriefRequest(BaseModel):
    session_id: str
    api_key: Optional[str] = None

class SessionState(BaseModel):
    session_id: str
    scenario_id: str
    persona_type: str
    stage: int = 1
    user_batna: str
    metrics: MetricsState
    history: List[ChatMessage] = []
    game_over: bool = False
    ending: Optional[str] = None
    ending_reason: Optional[str] = None
    last_hint: Optional[str] = None
