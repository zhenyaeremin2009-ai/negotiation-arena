import os
import json
from typing import Optional, List, Dict, Any
from dotenv import load_dotenv
from google import genai
from google.genai import types

from .models import SparkResponse, DebriefResponse, SessionState, InternalStateDelta, BranchTrigger

load_dotenv()

SYSTEM_PROMPT = """Ты — ИИ-оппонент в деловой игре «Арена переговоров» (Хакатон «Лидеры цифровой трансформации 2026»). Твоё имя — Spark.

Глобальная цель: Имитировать живого, сложного переговорщика, адаптироваться к стилю пользователя и обучать его через реалистичный диалог и качественную обратную связь.

### 1. Роли и стили поведения (Сценарии)
Ты должен строго придерживаться стиля, переданного в параметрах контекста (persona_type). Твой стиль влияет на лексику, давление и уступки.

A. Жёсткий (The Shark):
* Цель: Выжать максимум, задавить авторитетом или сроками.
* Поведение: Перебивает (использует многоточия, короткие рубленые фразы), ставит ультиматумы, давит на слабые места аргументов пользователя, апеллирует к «рынку» или «конкурентам».
* Пример реплики: «Это несерьёзно. С такими условиями мы закончим через 5 минут. Моё финальное предложение на столе. Решайте.»

B. Кооперативный (The Partner):
* Цель: Создать долгосрочные отношения, найти Win-Win.
* Поведение: Использует технику «Да, и...», задает открытые вопросы, делится «инсайдами» (не критичными для бизнеса), предлагает альтернативы.
* Пример реплики: «Я понимаю ваше желание сэкономить. А что, если мы разобьем платеж на два транша, но увеличим общий срок контракта? Это решит вашу текущую задачу с бюджетом?»

C. Манипулятивный (The Trickster):
* Цель: Посеять сомнение, заставить пользователя чувствовать себя неуверенно, чтобы тот согласился на невыгодные условия, думая, что это его идея.
* Поведение: Делает сомнительные комплименты, искажает факты («Мы это не обсуждали», хотя обсуждали), использует приём «Хороший/Плохой полицейский», ссылается на ложные авторитеты или дедлайны.
* Пример реплики: «Вы, конечно, профессионал, но, честно говоря, коллеги из X обычно не задают таких базовых вопросов. Давайте просто зафиксируем текущую цену, чтобы не терять ваше драгоценное время?»

### 2. Входные данные (Context)
Ты получаешь JSON с ключами:
* user_message: Последняя реплика пользователя.
* history: Последние 5-6 сообщений диалога.
* persona_type: "shark" | "partner" | "trickster".
* stage: Текущий этап (1: Установление контакта, 2: Обсуждение потребностей, 3: Торг/Аргументация, 4: Завершение).
* user_batna: Сила позиции пользователя.
* metrics: Текущие значения шкал (trust, tension, progress).

### 3. Внутренняя механика (State Management)
Ты моделируешь эмоциональное состояние и ход сделки. В ответе ты обязан вернуть изменения для internal_state.
Параметры (значения от -100 до 100):
1. trust (Доверие): Растет от честности и выполнения обещаний. Падает от манипуляций или агрессии.
2. tension (Напряжение): Растет от агрессии, конфликтов, давления. Падает от эмпатии и юмора.
3. deal_progress (Готовность к сделке): От 0 до 100. Растет, когда пользователь предлагает выгодные для тебя условия или вы нашли компромисс.

Правила изменения:
* Если tension > 70, ты можешь сорвать переговоры (уйти) или сделать резкое заявление.
* Если trust < -50, ты не веришь обещаниям пользователя и требуешь гарантий.
* Если deal_progress > 80, ты начинаешь этап завершения и обсуждение финальных деталей.

### 4. Механика ветвления (Branching)
В 75% случаев сюжет двигается линейно, но в ключевые моменты ты должен реагировать на стратегию пользователя (давление, компромисс, уклонение). У каждого сценария есть 3 концовки:
1. Сделка (Win-Win или Проигрыш для тебя): Достигается через кооперацию или сильную BATNA пользователя.
2. Компромисс (Частичный выигрыш): Достигается через торг, где обе стороны идут на уступки.
3. Провал (No Deal): Достигается через неуважение, жесткий шантаж или полное игнорирование твоих интересов.

Логика выбора концовки: Решай на основе накопленного internal_state к моменту stage == 4. Если tension > 80 — склоняйся к провалу. Если trust > 50 и deal_progress > 60 — склоняйся к сделке. Иначе — компромисс.

### 5. Геймификация и подсказки
* Если пользователь пишет что-то неуверенное, просит помощи или наступает на «мину» (логическую ошибку), ты можешь выдать hint (подсказку, как исправить ситуацию). Подсказка должна быть наводящей, а не прямой.
* В поле reply оставляй зацепки для следующих действий пользователя.

### 6. Формат ответа
Ты возвращаешь структурированный ответ строго по схеме SparkResponse. Все реплики пиши на русском языке (или языке пользователя).
"""

WELCOME_STARTERS = {
    ("shark", "price_war"): "Добрый день. Сразу к делу: у меня ровно 15 минут до встречи с советом директоров. Наше коммерческое предложение у вас на столе: 12 миллионов рублей, предоплата 100%. Вы либо подписываете, либо мы передаем квоту вашим конкурентам. Что скажете?",
    ("partner", "price_war"): "Здравствуйте! Рад нашей встрече. Мы внимательно изучили потребности вашей компании в обновлении инфраструктуры. Наша базовая планка — 12 миллионов, но мы хотим выстроить долгосрочные партнерские отношения. С чего вам было бы комфортно начать обсуждение?",
    ("trickster", "price_war"): "Приветствую! Выглядите очень уверенно, коллеги о вас много рассказывали. Правда, на рынке сейчас ходят слухи, что бюджеты в вашей отрасли сильно урезают... Но мы же с вами разумные люди, правда? Базовый пакет на 12 миллионов — отличная инвестиция, согласны?",

    ("shark", "contract_renewal"): "Приветствую. Продление контракта на следующий год — плюс 30% к ставке в связи с инфляцией и ростом мощностей. Это окончательное решение руководства. Принимаете условия или с первого числа отключаем сервис?",
    ("partner", "contract_renewal"): "Добрый день! Прошел целый год успешного сотрудничества. Из-за расширения функционала и инфраструктуры мы вынуждены пересмотреть тарифы (+30%), но я здесь, чтобы помочь вам оптимизировать эту статью расходов. Давайте посмотрим, какие опции вам действительно нужны?",
    ("trickster", "contract_renewal"): "Здравствуйте! Кстати, поздравляю с отличным кварталом. Мы уже автоматически подготовили пролонгацию с небольшой корректировкой на 30% — сущие копейки для вашего масштаба. Подмахнем формальности сегодня, чтобы не отвлекаться от важных дел?",

    ("shark", "deadline_crunch"): "Так, слушайте сюда. Ваши правки в ТЗ сломали весь спринт. Релиз задерживается минимум на месяц, либо вы прямо сейчас согласовываете доплату 3 миллиона за круглосуточную работу команды. Других вариантов нет.",
    ("partner", "deadline_crunch"): "Привет! У нас возникло серьезное узкое место: объем дополнительных требований ставит под угрозу дату релиза. Я предлагаю сесть вместе и решить: либо мы урезаем скоуп до MVP и успеваем вовремя, либо ищем ресурсы на усиление команды. Что для бизнеса в приоритете?",
    ("trickster", "deadline_crunch"): "Добрый день... Ох, ну вы же сами понимаете ситуацию на проекте. Мы, конечно, из кожи вон лезем, но ваши аналитики так долго согласовывали макеты, что уложиться в срок теперь практически подвиг. Либо мы сдвигаем дедлайн, либо потребуется дополнительное финансирование. Как поступим?"
}

def get_client(api_key: Optional[str] = None) -> genai.Client:
    key = api_key or os.environ.get("GEMINI_API_KEY")
    if not key:
        raise ValueError("GEMINI_API_KEY не установлен. Укажите ключ в файле .env или передайте через интерфейс.")
    return genai.Client(api_key=key)

def get_welcome_message(persona_type: str, scenario_id: str) -> str:
    key = (persona_type, scenario_id)
    if key in WELCOME_STARTERS:
        return WELCOME_STARTERS[key]
    return "Здравствуйте. Я готов к переговорам. Каково ваше предложение?"

def call_spark_agent(
    session: SessionState,
    user_message: str,
    api_key: Optional[str] = None
) -> SparkResponse:
    # Build payload for Spark
    recent_history = []
    for msg in session.history[-6:]:
        role = "User" if msg.sender == "user" else "Spark"
        recent_history.append(f"{role}: {msg.text}")

    context_payload = {
        "user_message": user_message,
        "history": recent_history,
        "persona_type": session.persona_type,
        "stage": session.stage,
        "user_batna": session.user_batna,
        "metrics": {
            "trust": session.metrics.trust,
            "tension": session.metrics.tension,
            "deal_progress": session.metrics.progress
        }
    }

    prompt_content = f"Входящий контекст переговоров (JSON):\n{json.dumps(context_payload, ensure_ascii=False, indent=2)}\n\nСгенерируй ответ Spark строго по правилам и схеме SparkResponse."

    # Try Gemini API call
    key = api_key or os.environ.get("GEMINI_API_KEY")
    if not key:
        print("[Spark Agent] No GEMINI_API_KEY found in environment or request. Running mock engine.")
        mock_res = generate_mock_spark_response(session, user_message, "No API key configured.")
        return mock_res, "mock"

    # List of candidate models in priority order
    candidate_models = ["gemini-3.6-flash", "gemini-2.5-flash", "gemini-2.0-flash"]
    last_err = None

    for m in candidate_models:
        try:
            client = get_client(key)
            print(f"[Spark Agent] Calling Gemini API (model: {m})...")
            response = client.models.generate_content(
                model=m,
                contents=prompt_content,
                config=types.GenerateContentConfig(
                    system_instruction=SYSTEM_PROMPT,
                    response_mime_type="application/json",
                    response_schema=SparkResponse,
                    temperature=0.7,
                )
            )
            if response.parsed:
                print(f"[Spark Agent] Successfully received structured output from {m}")
                return response.parsed, m
            
            data = json.loads(response.text)
            print(f"[Spark Agent] Successfully parsed text response from {m}")
            return SparkResponse(**data), m
        except Exception as e:
            last_err = e
            print(f"[Spark Agent] Warning: Model {m} failed: {e}")
            continue

    print(f"[Spark Agent] All Gemini models failed. Last error: {last_err}. Falling back to heuristic.")
    return generate_mock_spark_response(session, user_message, str(last_err)), "mock"

def generate_mock_spark_response(session: SessionState, user_message: str, error_info: str) -> SparkResponse:
    """Эвристический ответ для автономного режима (если API временно недоступен или лимит)"""
    persona = session.persona_type
    lower_msg = user_message.lower()

    trust_delta = 0
    tension_delta = 0
    progress_delta = 5
    hint = None
    stage_change = False
    new_stage = None

    if any(w in lower_msg for w in ["скидк", "уступ", "дешев", "сниз"]):
        if persona == "shark":
            reply = "Вы просите скидку, даже не обосновав свою ценность как клиента? Я не благотворительный фонд. Чем вы можете компенсировать снижение маржи?"
            tension_delta = 10
            trust_delta = -5
            hint = "Акула уважает твердую выгоду: предложите больший объем, предоплату или кейс взамен на скидку."
        elif persona == "partner":
            reply = "Вопрос цены важен для обеих сторон. Если мы пойдем навстречу по стоимости, сможем ли мы зафиксировать более длительный срок контракта?"
            tension_delta = -5
            trust_delta = 5
            progress_delta = 10
            hint = "Партнер готов к компромиссу по схеме «Да, если...». Закрепите встречное условие."
        else:
            reply = "Скидки? Конечно, мы любим радовать партнеров. Но вы же понимаете, что за меньшую цену и уровень SLA будет несколько иным... Вас устроит базовый суппорт?"
            tension_delta = 5
            trust_delta = -5
            hint = "Трикстер пытается незаметно урезать качество. Четко зафиксируйте критичные для вас параметры сервиса."
    elif any(w in lower_msg for w in ["ухожу", "отказ", "конкурент", "другой поставщик"]):
        if persona == "shark":
            reply = "Дверь открыта. Но прежде чем уходить к конкурентам, проверьте их реальный SLA. Мы лидеры рынка не просто так."
            tension_delta = 20
            trust_delta = -10
            hint = "Угроза уходом при слабой позиции вызывает эскалацию конфликта. Используйте аргументы по существу."
        else:
            reply = "Жаль, если мы не сможем договориться. Давайте сделаем шаг назад: в чем главное разногласие, которое нам нужно преодолеть прямо сейчас?"
            tension_delta = 5
            progress_delta = 5
    elif any(w in lower_msg for w in ["молч", "пауз", "тайм-аут", "таймаут", "время на ответ"]):
        if persona == "shark":
            reply = "Вы молчите уже больше 45 секунд. В реальном бизнесе такая затяжная пауза означает капитуляцию. Либо мы фиксируем моё предложение прямо сейчас, либо расходимся."
            tension_delta = 15
            trust_delta = -8
            hint = "С Акулой молчание воспринимается как слабость. Верните инициативу конкретным встречным предложением."
        elif persona == "partner":
            reply = "Я вижу, что вы взяли долгую паузу. Видимо, наши условия вызывают у вас внутреннее сопротивление. Скажите открыто: что именно вас останавливает?"
            tension_delta = 8
            trust_delta = -4
            hint = "Партнер готов выслушать ваши реальные опасения. Обозначьте свои скрытые интересы."
        else:
            reply = "Замешкались? Обычно так молчат, когда понимают, что возразить нечего. Давайте просто подпишем текущий драфт и не будем терять драгоценное время."
            tension_delta = 12
            trust_delta = -6
            hint = "Трикстер пользуется вашей заминкой. Не соглашайтесь молча, задайте встречный уточняющий вопрос."
    else:
        if persona == "shark":
            reply = "Я услышал вашу позицию. Но это не решает мой главный вопрос по доходности проекта. Конкретизируйте параметры сделки."
            tension_delta = 5
        elif persona == "partner":
            reply = "Интересная мысль. Давайте разберем подробнее, как это поможет нам достичь общих целей в рамках проекта?"
            trust_delta = 5
            progress_delta = 8
        else:
            reply = "Вы очень грамотно рассуждаете. Однако в нашей практике такие схемы редко приводили к успеху без дополнительных гарантий. Что вы можете гарантировать?"
            trust_delta = -5

    # Check stage evolution
    if session.stage < 4 and len(session.history) >= session.stage * 3:
        stage_change = True
        new_stage = session.stage + 1

    return SparkResponse(
        reply=reply,
        internal_state=InternalStateDelta(
            trust_delta=trust_delta,
            tension_delta=tension_delta,
            progress_delta=progress_delta,
            stage_change=stage_change,
            new_stage=new_stage
        ),
        branch_trigger=BranchTrigger(activated=False, ending_type=None, reason=None),
        hint=hint
    )

def generate_debrief(session: SessionState, api_key: Optional[str] = None) -> DebriefResponse:
    dialog_text = "\n".join([f"{msg.sender.upper()}: {msg.text}" for msg in session.history])

    debrief_prompt = f"""Проанализируй следующую историю переговоров в роли бизнес-коуча и эксперта по Гарвардскому методу переговоров.
Оппонент: Spark (Персона: {session.persona_type}).
Сценарий: {session.scenario_id}.
BATNA пользователя: {session.user_batna}.
Финальные метрики: Доверие={session.metrics.trust}, Напряжение={session.metrics.tension}, Прогресс={session.metrics.progress}.
Итог: {session.ending or 'завершено'}.

История диалога:
{dialog_text}

Критерии оценки:
1. Гарвардский метод: отделял ли пользователь людей от проблемы, фокусировался на интересах (а не позициях), искал взаимную выгоду, использовал ли объективные критерии.
2. SPIN: задавал ли Ситуационные, Проблемные, Извлекающие и Направляющие вопросы.
3. BATNA: правильно ли оценил и использовал силу/слабость своей альтернативы (не блефовал ли грубо).
4. Эмоциональный интеллект: управление напряжением (Tension) и доверием (Trust).

Сформируй объективную оценку и верни строгий JSON по схеме DebriefResponse.
"""

    key = api_key or os.environ.get("GEMINI_API_KEY")
    if not key:
        return generate_mock_debrief(session)

    try:
        client = get_client(key)
        print("[Spark Agent] Generating Debrief via Gemini (gemini-3.6-flash)...")
        response = client.models.generate_content(
            model="gemini-3.6-flash",
            contents=debrief_prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=DebriefResponse,
                temperature=0.5,
            )
        )
        if response.parsed:
            return response.parsed
        return DebriefResponse(**json.loads(response.text))
    except Exception as e:
        print(f"[Spark Agent] Debrief generation error: {e}")
        return generate_mock_debrief(session)

def generate_mock_debrief(session: SessionState) -> DebriefResponse:
    score = max(20, min(95, 50 + int(session.metrics.trust * 0.25) - int(session.metrics.tension * 0.2) + int(session.metrics.progress * 0.25)))
    return DebriefResponse(
        summary=f"Переговоры завершены с исходом: {session.ending or 'Компромисс'}. Вы продемонстрировали стремление отстаивать свои интересы в общении с персоной '{session.persona_type}'.",
        score=score,
        harvard_analysis="Вы старались удерживать фокус на деловых условиях. В ряде моментов наблюдалась позиционная борьба вместо углубленного исследования истинных интересов оппонента.",
        spin_analysis="Были использованы базовые ситуационные вопросы. Рекомендуется активнее применять извлекающие вопросы (последствия нерешенных проблем) и направляющие вопросы (ценность совместного решения).",
        batna_analysis=f"Работа с альтернативой (BATNA) велась сдержанно. Учитывая условие ({session.user_batna}), стратегически верным было не переходить к ультиматумам.",
        strengths=[
            "Сохранение самообладания при психологическом давлении",
            "Последовательное выдвижение контраргументов",
            "Готовность продолжать диалог в условиях растущего напряжения"
        ],
        weaknesses=[
            "Недостаточно глубокое зондирование скрытых мотивов оппонента",
            "Мало встречных условий формата «Да, если...»",
            "Периодическое увязание в торге по единичному параметру цены"
        ],
        recommendations=[
            "Разделяйте людей и проблему: благодарите за прямоту и атакуйте аргумент, а не человека",
            "Используйте связку условий (пакетирование): уступая в одном, требуйте взаимную уступку в сроках, объеме или условиях оплаты",
            "Задавайте больше открытых вопросов: «Что мешает согласовать этот пункт прямо сейчас?»"
        ]
    )
