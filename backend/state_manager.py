import uuid
from datetime import datetime
from typing import Dict, Optional
from .models import SessionState, MetricsState, ChatMessage, InternalStateDelta, BranchTrigger

SCENARIOS = {
    "price_war": {
        "title": "Битва за цену контракта",
        "description": "Переговоры о поставке IT-инфраструктуры. Вы хотите снизить начальную стоимость, оппонент настаивает на максимальной марже.",
        "default_batna": "Средняя: есть предложение от другого поставщика, но внедрение займет на 2 месяца дольше."
    },
    "contract_renewal": {
        "title": "Продление годового соглашения",
        "description": "Поставщик сервиса объявляет о повышении тарифов на 30%. Ваша задача — защитить бюджет и выбить преференции.",
        "default_batna": "Слабая: миграция на альтернативное решение рискованна и потребует согласования совета директоров."
    },
    "deadline_crunch": {
        "title": "Кризис дедлайна и доплаты",
        "description": "Ключевой подрядчик заявляет о риске срыва дедлайна на 4 недели и требует доплату за сверхурочные.",
        "default_batna": "Критическая: смена подрядчика прямо сейчас невозможна, дедлайн проекта жестко зафиксирован инвесторами."
    }
}

class SessionManager:
    def __init__(self):
        self._sessions: Dict[str, SessionState] = {}

    def get_session(self, session_id: str) -> Optional[SessionState]:
        return self._sessions.get(session_id)

    def create_session(
        self,
        persona_type: str = "shark",
        scenario_id: str = "price_war",
        user_batna: Optional[str] = None
    ) -> SessionState:
        session_id = str(uuid.uuid4())
        scenario = SCENARIOS.get(scenario_id, SCENARIOS["price_war"])
        batna = user_batna or scenario["default_batna"]

        # Initial metrics depend on persona
        initial_metrics = MetricsState(
            trust=0 if persona_type != "trickster" else -10,
            tension=10 if persona_type == "shark" else 0,
            progress=0
        )

        session = SessionState(
            session_id=session_id,
            scenario_id=scenario_id,
            persona_type=persona_type,
            stage=1,
            user_batna=batna,
            metrics=initial_metrics,
            history=[],
            game_over=False,
            ending=None,
            ending_reason=None,
            last_hint=None
        )
        self._sessions[session_id] = session
        return session

    def add_message(self, session_id: str, sender: str, text: str, hint: Optional[str] = None) -> ChatMessage:
        session = self.get_session(session_id)
        if not session:
            raise ValueError(f"Сессия {session_id} не найдена")

        msg = ChatMessage(
            sender=sender,
            text=text,
            timestamp=datetime.now().strftime("%H:%M:%S"),
            hint=hint
        )
        session.history.append(msg)
        if hint:
            session.last_hint = hint
        return msg

    def apply_delta(self, session_id: str, delta: InternalStateDelta, branch: BranchTrigger) -> SessionState:
        session = self.get_session(session_id)
        if not session:
            raise ValueError(f"Сессия {session_id} не найдена")

        # Clamp metrics to valid range
        new_trust = max(-100, min(100, session.metrics.trust + delta.trust_delta))
        new_tension = max(-100, min(100, session.metrics.tension + delta.tension_delta))
        new_progress = max(0, min(100, session.metrics.progress + delta.progress_delta))

        session.metrics.trust = new_trust
        session.metrics.tension = new_tension
        session.metrics.progress = new_progress

        # Stage change logic
        if delta.stage_change and delta.new_stage:
            session.stage = max(1, min(4, delta.new_stage))

        # Check branch trigger from agent
        if branch.activated:
            session.game_over = True
            session.ending = branch.ending_type or "compromise"
            session.ending_reason = branch.reason or "Переговоры завершены оппонентом."
            return session

        # Auto ending condition: Extreme tension
        if session.metrics.tension >= 85:
            session.game_over = True
            session.ending = "fail"
            session.ending_reason = "Переговоры сорваны! Уровень напряжения превысил критический порог (85+). Оппонент хлопнул дверью."
            return session

        # Auto ending condition: Full deal agreed
        if session.metrics.progress >= 95:
            session.game_over = True
            session.ending = "deal"
            session.ending_reason = "Сделка согласована на взаимовыгодных условиях!"
            return session

        # Auto ending condition: Stage 4 completion threshold
        if session.stage == 4 and len(session.history) >= 12:
            session.game_over = True
            if session.metrics.tension > 80:
                session.ending = "fail"
                session.ending_reason = "Финал переговоров: стороны не смогли преодолеть конфликт и зашли в тупик."
            elif session.metrics.trust > 50 and session.metrics.progress > 60:
                session.ending = "deal"
                session.ending_reason = "Финал переговоров: высокий уровень доверия и прогресса привели к успешной сделке!"
            else:
                session.ending = "compromise"
                session.ending_reason = "Финал переговоров: стороны сошлись на прагматичном компромиссе с взаимными уступками."

        return session

session_manager = SessionManager()
