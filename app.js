// ==========================================================================
// Frontend Logic for Negotiation Arena: Spark AI (Dual-Mode: Full-Stack & GitHub Pages)
// With Apple iOS Liquid Glass UI, 45s Turn Countdown Timer & Dynamic Tension Avatars
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide icons
  lucide.createIcons();

  // Application State
  let currentSession = null;
  let selectedPersona = 'shark';
  let hasApiKey = false;
  let isStaticMode = false;
  let clientApiKey = localStorage.getItem('gemini_api_key') || '';

  // 45-second Turn Countdown Timer State
  const TURN_DURATION = 45;
  let timerSecondsLeft = TURN_DURATION;
  let turnTimerInterval = null;
  let isTimerPaused = false;

  const PERSONA_CONFIG = {
    shark: {
      name: 'Spark: The Shark',
      title: 'Коммерческий директор',
      style: 'Агрессивный торг и давление',
      goal: 'Максимум маржи и 100% предоплата',
      color: '#ef4444',
      badgeClass: 'text-red-400',
      moods: {
        calm: { label: 'Хладнокровен', class: 'bg-slate-900/80 text-cyan-300 border-cyan-500/30' },
        evaluating: { label: 'Оценивает силу', class: 'bg-indigo-950/80 text-indigo-300 border-indigo-500/30' },
        irritated: { label: 'Наращивает нажим!', class: 'bg-amber-950/80 text-amber-300 border-amber-500/40 animate-pulse' },
        critical: { label: 'В ЯРОСТИ / УЛЬТИМАТУМ!', class: 'bg-red-950/90 text-red-200 border-red-500 animate-pulse' },
        harmonious: { label: 'Уважает позицию', class: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40' }
      }
    },
    partner: {
      name: 'Spark: The Partner',
      title: 'Директор по развитию партнерств',
      style: 'Кооперация (Win-Win)',
      goal: 'Долгосрочное сотрудничество',
      color: '#10b981',
      badgeClass: 'text-emerald-400',
      moods: {
        calm: { label: 'Открыт к диалогу', class: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/30' },
        evaluating: { label: 'Ищет компромисс', class: 'bg-indigo-950/80 text-indigo-300 border-indigo-500/30' },
        irritated: { label: 'Обеспокоен уступками', class: 'bg-amber-950/80 text-amber-300 border-amber-500/40 animate-pulse' },
        critical: { label: 'НА ГРАНИ РАЗРЫВА!', class: 'bg-red-950/90 text-red-200 border-red-500 animate-pulse' },
        harmonious: { label: 'Win-Win Согласие!', class: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40' }
      }
    },
    trickster: {
      name: 'Spark: The Trickster',
      title: 'Старший консультант по сделкам',
      style: 'Манипуляции и психологические ловушки',
      goal: 'Скрыть издержки и урезать SLA',
      color: '#8b5cf6',
      badgeClass: 'text-purple-400',
      moods: {
        calm: { label: 'Ироничен', class: 'bg-purple-950/80 text-purple-300 border-purple-500/30' },
        evaluating: { label: 'Зондирует почву', class: 'bg-indigo-950/80 text-indigo-300 border-indigo-500/30' },
        irritated: { label: 'Ловушка сорвана!', class: 'bg-amber-950/80 text-amber-300 border-amber-500/40 animate-pulse' },
        critical: { label: 'ПРИЖАТ К СТЕНКЕ!', class: 'bg-red-950/90 text-red-200 border-red-500 animate-pulse' },
        harmonious: { label: 'Согласился на правила', class: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40' }
      }
    }
  };

  const SCENARIOS = {
    price_war: {
      desc: 'Переговоры о поставке IT-инфраструктуры. Вы хотите снизить начальную стоимость, оппонент настаивает на максимальной марже.',
      defaultBatna: 'Средняя: есть предложение от другого поставщика, но внедрение займет на 2 месяца дольше.'
    },
    contract_renewal: {
      desc: 'Поставщик сервиса объявляет о повышении тарифов на 30%. Ваша задача — защитить бюджет и выбить преференции.',
      defaultBatna: 'Слабая: миграция на альтернативное решение рискованна и потребует согласования совета директоров.'
    },
    deadline_crunch: {
      desc: 'Ключевой подрядчик заявляет о риске срыва дедлайна на 4 недели и требует доплату за сверхурочные.',
      defaultBatna: 'Критическая: смена подрядчика прямо сейчас невозможна, дедлайн проекта жестко зафиксирован инвесторами.'
    }
  };

  const WELCOME_STARTERS = {
    "shark_price_war": "Добрый день. Сразу к делу: у меня ровно 15 минут до встречи с советом директоров. Наше коммерческое предложение у вас на столе: 12 миллионов рублей, предоплата 100%. Вы либо подписываете, либо мы передаем квоту вашим конкурентам. Что скажете?",
    "partner_price_war": "Здравствуйте! Рад нашей встрече. Мы внимательно изучили потребности вашей компании в обновлении инфраструктуры. Наша базовая планка — 12 миллионов, но мы хотим выстроить долгосрочные партнерские отношения. С чего вам было бы комфортно начать обсуждение?",
    "trickster_price_war": "Приветствую! Выглядите очень уверенно, коллеги о вас много рассказывали. Правда, на рынке сейчас ходят слухи, что бюджеты в вашей отрасли сильно урезают... Но мы же с вами разумные люди, правда? Базовый пакет на 12 миллионов — отличная инвестиция, согласны?",

    "shark_contract_renewal": "Приветствую. Продление контракта на следующий год — плюс 30% к ставке в связи с инфляцией и ростом мощностей. Это окончательное решение руководства. Принимаете условия или с первого числа отключаем сервис?",
    "partner_contract_renewal": "Добрый день! Прошел целый год успешного сотрудничества. Из-за расширения функционала и инфраструктуры мы вынуждены пересмотреть тарифы (+30%), но я здесь, чтобы помочь вам оптимизировать эту статью расходов. Давайте посмотрим, какие опции вам действительно нужны?",
    "trickster_contract_renewal": "Здравствуйте! Кстати, поздравляю с отличным кварталом. Мы уже автоматически подготовили пролонгацию с небольшой корректировкой на 30% — сущие копейки для вашего масштаба. Подмахнем формальности сегодня, чтобы не отвлекаться от важных дел?",

    "shark_deadline_crunch": "Так, слушайте сюда. Ваши правки в ТЗ сломали весь спринт. Релиз задерживается минимум на месяц, либо вы прямо сейчас согласовываете доплату 3 миллиона за круглосуточную работу команды. Других вариантов нет.",
    "partner_deadline_crunch": "Привет! У нас возникло серьезное узкое место: объем дополнительных требований ставит под угрозу дату релиза. Я предлагаю сесть вместе и решить: либо мы урезаем скоуп до MVP и успеваем вовремя, либо ищем ресурсы на усиление команды. Что для бизнеса в приоритете?",
    "trickster_deadline_crunch": "Добрый день... Ох, ну вы же сами понимаете ситуацию на проекте. Мы, конечно, из кожи вон лезем, но ваши аналитики так долго согласовывали макеты, что уложиться в срок теперь практически подвиг. Либо мы сдвигаем дедлайн, либо потребуется дополнительное финансирование. Как поступим?"
  };

  const STAGES = {
    1: '1: Установление контакта',
    2: '2: Обсуждение потребностей',
    3: '3: Торг / Аргументация',
    4: '4: Завершение сделки'
  };

  const SYSTEM_PROMPT = `Ты — ИИ-оппонент в деловой игре «Арена переговоров» (Хакатон «Лидеры цифровой трансформации 2026»). Твоё имя — Spark.
Глобальная цель: Имитировать живого, сложного переговорщика, адаптироваться к стилю пользователя и обучать его через реалистичный диалог и качественную обратную связь.
Стили поведения:
- shark: Жёсткий, перебивает, давит авторитетом, ультиматумы.
- partner: Кооперативный, техника «Да, и...», ищет Win-Win, задает открытые вопросы.
- trickster: Манипулятор, искажает факты, сеет сомнения.
Параметры internal_state:
- trust_delta (-30..30)
- tension_delta (-30..30)
- progress_delta (-20..30)
- stage_change (bool)
- new_stage (1..4 or null)
branch_trigger:
- activated (bool)
- ending_type ("deal"|"compromise"|"fail"|null)
- reason (string|null)
hint: Опциональная наводящая развивающая подсказка.
Верни ТОЛЬКО валидный JSON со структурой:
{"reply": "...", "internal_state": {"trust_delta": 0, "tension_delta": 0, "progress_delta": 0, "stage_change": false, "new_stage": null}, "branch_trigger": {"activated": false, "ending_type": null, "reason": null}, "hint": null}`;

  // DOM Elements
  const lobbyScreen = document.getElementById('lobbyScreen');
  const arenaScreen = document.getElementById('arenaScreen');
  const debriefModal = document.getElementById('debriefModal');
  const settingsModal = document.getElementById('settingsModal');

  const headerPersonaBadge = document.getElementById('headerPersonaBadge');
  const personaDot = document.getElementById('personaDot');
  const personaHeaderName = document.getElementById('personaHeaderName');
  const btnRestart = document.getElementById('btnRestart');
  const btnSettings = document.getElementById('btnSettings');
  const btnCloseSettings = document.getElementById('btnCloseSettings');
  const btnSaveKey = document.getElementById('btnSaveKey');
  const inputApiKey = document.getElementById('inputApiKey');
  const apiKeyStatusMsg = document.getElementById('apiKeyStatusMsg');

  const selectScenario = document.getElementById('selectScenario');
  const scenarioDesc = document.getElementById('scenarioDesc');
  const inputBatna = document.getElementById('inputBatna');
  const btnStartGame = document.getElementById('btnStartGame');

  const stageLabel = document.getElementById('stageLabel');
  const stepBars = [
    document.getElementById('stepBar1'),
    document.getElementById('stepBar2'),
    document.getElementById('stepBar3'),
    document.getElementById('stepBar4')
  ];

  const trustValue = document.getElementById('trustValue');
  const trustBar = document.getElementById('trustBar');
  const tensionWidget = document.getElementById('tensionWidget');
  const tensionValue = document.getElementById('tensionValue');
  const tensionBar = document.getElementById('tensionBar');
  const progressValue = document.getElementById('progressValue');
  const progressBar = document.getElementById('progressBar');
  const tensionVignette = document.getElementById('tensionVignette');

  const avatarContainer = document.getElementById('avatarContainer');
  const avatarGraphic = document.getElementById('avatarGraphic');
  const moodBadge = document.getElementById('moodBadge');
  const arenaOpponentName = document.getElementById('arenaOpponentName');
  const arenaOpponentSubtitle = document.getElementById('arenaOpponentSubtitle');
  const arenaStyleTag = document.getElementById('arenaStyleTag');
  const arenaBatnaText = document.getElementById('arenaBatnaText');
  const coachHintText = document.getElementById('coachHintText');

  // Dynamic Island Timer Elements
  const dynamicIslandTimer = document.getElementById('dynamicIslandTimer');
  const timerProgressCircle = document.getElementById('timerProgressCircle');
  const timerSecondsDisplay = document.getElementById('timerSecondsDisplay');
  const timerStatusHint = document.getElementById('timerStatusHint');
  const timerPulseDot = document.getElementById('timerPulseDot');
  const timerPenaltyAlert = document.getElementById('timerPenaltyAlert');
  const btnPauseTimer = document.getElementById('btnPauseTimer');
  const btnPauseTimerIcon = document.getElementById('btnPauseTimerIcon');
  const btnPauseTimerText = document.getElementById('btnPauseTimerText');

  const chatMessages = document.getElementById('chatMessages');
  const typingIndicator = document.getElementById('typingIndicator');
  const chatForm = document.getElementById('chatForm');
  const userInput = document.getElementById('userInput');
  const btnSend = document.getElementById('btnSend');
  const btnForceDebrief = document.getElementById('btnForceDebrief');
  const btnDebriefPlayAgain = document.getElementById('btnDebriefPlayAgain');

  const aiEngineBadge = document.getElementById('aiEngineBadge');
  const aiEngineText = document.getElementById('aiEngineText');
  const aiEngineDot = document.getElementById('aiEngineDot');

  function updateAiEngineBadge(engine) {
    if (!aiEngineBadge) return;
    if (engine && engine.includes('gemini')) {
      aiEngineBadge.className = 'flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-[11px] text-emerald-300 shadow-sm backdrop-blur-md';
      aiEngineDot.className = 'w-2 h-2 rounded-full bg-emerald-400 animate-pulse';
      aiEngineText.textContent = `${engine}`;
    } else {
      aiEngineBadge.className = 'flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-amber-950/50 border border-amber-500/40 text-[11px] text-amber-300 shadow-sm backdrop-blur-md';
      aiEngineDot.className = 'w-2 h-2 rounded-full bg-amber-400';
      aiEngineText.textContent = 'Demo Mode (Mock)';
    }
  }

  // Check health & API Key on load
  fetch('/api/health')
    .then(res => {
      if (!res.ok) throw new Error('Not local backend');
      return res.json();
    })
    .then(data => {
      hasApiKey = data.has_api_key;
      if (hasApiKey) {
        updateAiEngineBadge('gemini-3.6-flash');
        if (apiKeyStatusMsg) {
          apiKeyStatusMsg.textContent = 'Ключ Gemini API активен и загружен из .env';
          apiKeyStatusMsg.className = 'text-xs text-emerald-400 mb-4 block';
        }
      } else {
        updateAiEngineBadge('mock');
        if (apiKeyStatusMsg) {
          apiKeyStatusMsg.textContent = 'Ключ Gemini API еще не сохранен. Введите его для полноценной работы.';
          apiKeyStatusMsg.className = 'text-xs text-amber-400 mb-4 block';
        }
      }
    })
    .catch(() => {
      // Running on GitHub Pages or static web
      isStaticMode = true;
      if (clientApiKey) {
        hasApiKey = true;
        inputApiKey.value = clientApiKey;
        updateAiEngineBadge('gemini-3.6-flash');
        if (apiKeyStatusMsg) {
          apiKeyStatusMsg.textContent = 'Ключ Gemini API сохранен в вашем браузере';
          apiKeyStatusMsg.className = 'text-xs text-emerald-400 mb-4 block';
        }
      } else {
        updateAiEngineBadge('mock');
        if (apiKeyStatusMsg) {
          apiKeyStatusMsg.textContent = 'Введите ваш ключ Gemini API в настройках для активации ИИ-модели';
          apiKeyStatusMsg.className = 'text-xs text-amber-400 mb-4 block';
        }
      }
    });

  // Persona Selection Cards
  document.querySelectorAll('.persona-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.persona-card').forEach(c => {
        c.classList.remove('active', 'border-2');
        c.classList.add('border');
      });
      card.classList.add('active', 'border-2');
      selectedPersona = card.dataset.persona;
    });
  });

  // Scenario Selection change
  selectScenario.addEventListener('change', () => {
    const sc = SCENARIOS[selectScenario.value];
    if (sc) {
      scenarioDesc.textContent = sc.desc;
      inputBatna.value = sc.defaultBatna;
    }
  });

  // Settings Modal controls
  btnSettings.addEventListener('click', () => {
    settingsModal.classList.remove('hidden');
  });
  btnCloseSettings.addEventListener('click', () => {
    settingsModal.classList.add('hidden');
  });
  btnSaveKey.addEventListener('click', async () => {
    const key = inputApiKey.value.trim();
    if (!key) return;

    btnSaveKey.disabled = true;
    btnSaveKey.textContent = 'Сохраняем...';

    // Store in browser
    localStorage.setItem('gemini_api_key', key);
    clientApiKey = key;
    hasApiKey = true;
    updateAiEngineBadge('gemini-3.6-flash');

    if (!isStaticMode) {
      try {
        await fetch('/api/config/key', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ api_key: key })
        });
      } catch (e) {}
    }

    apiKeyStatusMsg.textContent = 'Ключ успешно сохранен!';
    apiKeyStatusMsg.className = 'text-xs text-emerald-400 mb-4 block';
    btnSaveKey.disabled = false;
    btnSaveKey.textContent = 'Сохранить ключ';
    setTimeout(() => {
      settingsModal.classList.add('hidden');
    }, 1200);
  });

  // Quick Tactic Chips
  document.querySelectorAll('.tactic-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      userInput.value = chip.dataset.text;
      userInput.focus();
    });
  });

  // ==========================================================================
  // Dynamic 45-Second Response Timer Engine (iOS Dynamic Island Style)
  // ==========================================================================
  const TIMER_CIRCUMFERENCE = 2 * Math.PI * 13; // ~81.68px for r=13

  function startTurnTimer() {
    stopTurnTimer();
    timerSecondsLeft = TURN_DURATION;
    isTimerPaused = false;
    updatePauseButtonUI();
    updateTimerDisplay();

    turnTimerInterval = setInterval(() => {
      if (isTimerPaused) return;

      timerSecondsLeft--;
      updateTimerDisplay();

      if (timerSecondsLeft <= 0) {
        handleTurnTimeout();
      }
    }, 1000);
  }

  function stopTurnTimer() {
    if (turnTimerInterval) {
      clearInterval(turnTimerInterval);
      turnTimerInterval = null;
    }
  }

  function updateTimerDisplay() {
    if (!timerSecondsDisplay || !timerProgressCircle) return;

    // Numerical display
    const secStr = timerSecondsLeft < 10 ? '0' + Math.max(0, timerSecondsLeft) : Math.max(0, timerSecondsLeft);
    timerSecondsDisplay.textContent = `00:${secStr}`;

    // SVG radial progress stroke offset
    const progressFraction = Math.max(0, timerSecondsLeft) / TURN_DURATION;
    const offset = TIMER_CIRCUMFERENCE * (1 - progressFraction);
    timerProgressCircle.style.strokeDashoffset = offset;

    // Escalating urgency stages
    if (timerSecondsLeft > 20) {
      dynamicIslandTimer.className = 'ios-dynamic-island mx-4 mt-3.5 mb-1 px-4 py-2.5 rounded-2xl flex items-center justify-between timer-calm z-20 transition-all duration-300';
      timerProgressCircle.className = 'text-blue-400 transition-all duration-300';
      timerPulseDot.className = 'w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping';
      timerStatusHint.textContent = 'Ваш ход — оппонент ждёт ответа';
      timerPenaltyAlert.classList.add('hidden');
    } else if (timerSecondsLeft <= 20 && timerSecondsLeft > 10) {
      dynamicIslandTimer.className = 'ios-dynamic-island mx-4 mt-3.5 mb-1 px-4 py-2.5 rounded-2xl flex items-center justify-between timer-warning z-20 transition-all duration-300';
      timerProgressCircle.className = 'text-amber-400 transition-all duration-300';
      timerPulseDot.className = 'w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping';
      timerStatusHint.textContent = 'Оппонент начинает проявлять нетерпение...';
      timerPenaltyAlert.classList.add('hidden');
    } else {
      dynamicIslandTimer.className = 'ios-dynamic-island mx-4 mt-3.5 mb-1 px-4 py-2.5 rounded-2xl flex items-center justify-between timer-danger z-20 transition-all duration-300';
      timerProgressCircle.className = 'text-red-500 transition-all duration-300';
      timerPulseDot.className = 'w-1.5 h-1.5 rounded-full bg-red-500 animate-ping';
      timerStatusHint.textContent = 'Срочно! Пауза критически накаляет обстановку!';
      timerPenaltyAlert.classList.remove('hidden');
    }
  }

  function updatePauseButtonUI() {
    if (!btnPauseTimerIcon || !btnPauseTimerText) return;
    if (isTimerPaused) {
      btnPauseTimerIcon.setAttribute('data-lucide', 'play');
      btnPauseTimerText.textContent = 'Пуск';
      dynamicIslandTimer.classList.add('opacity-70');
      timerStatusHint.textContent = 'Таймер на паузе (размышление)';
    } else {
      btnPauseTimerIcon.setAttribute('data-lucide', 'pause');
      btnPauseTimerText.textContent = 'Пауза';
      dynamicIslandTimer.classList.remove('opacity-70');
    }
    lucide.createIcons();
  }

  if (btnPauseTimer) {
    btnPauseTimer.addEventListener('click', () => {
      isTimerPaused = !isTimerPaused;
      updatePauseButtonUI();
    });
  }

  // Handle Turn Timeout (45s expired)
  async function handleTurnTimeout() {
    stopTurnTimer();

    // Show system penalty notification in chat
    appendChatMessage('system', '⏱️ Время на ответ истекло (45 секунд). Затянувшаяся пауза расценена оппонентом как слабость позиции (+15 к напряжению).');

    // Penalize metrics
    currentSession.metrics.tension = Math.min(100, currentSession.metrics.tension + 15);
    currentSession.metrics.trust = Math.max(-100, currentSession.metrics.trust - 8);
    updateMetricsAndUI(currentSession.metrics, currentSession.stage);

    // If tension exploded
    if (currentSession.metrics.tension >= 85) {
      currentSession.game_over = true;
      currentSession.ending = 'fail';
      currentSession.ending_reason = 'Оппонент потерял терпение из-за молчания и вышел из переговоров.';
      showGameOverBanner(currentSession.ending, currentSession.ending_reason);
      return;
    }

    // Spark delivers in-character psychological pressure
    typingIndicator.classList.remove('hidden');
    typingIndicator.classList.add('flex');
    chatMessages.scrollTop = chatMessages.scrollHeight;

    const timeoutNotice = '[Пользователь молчал более 45 секунд: оппонент видит замешательство и усиливает давление]';

    if (isStaticMode) {
      setTimeout(() => {
        simulateMockReply(timeoutNotice);
        typingIndicator.classList.add('hidden');
        typingIndicator.classList.remove('flex');
        if (!currentSession.game_over) startTurnTimer();
      }, 900);
      return;
    }

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: currentSession.session_id,
          user_message: timeoutNotice
        })
      });

      if (!res.ok) throw new Error('Ошибка связи при таймауте');

      const data = await res.json();
      currentSession = data.session;

      if (data.spark_reply) {
        appendChatMessage('spark', data.spark_reply, null, data.hint, data.engine);
      }

      updateMetricsAndUI(currentSession.metrics, currentSession.stage);

      if (data.game_over) {
        setTimeout(() => {
          showGameOverBanner(data.ending, data.ending_reason);
        }, 1200);
      } else {
        startTurnTimer();
      }
    } catch (err) {
      simulateMockReply(timeoutNotice);
      if (!currentSession.game_over) startTurnTimer();
    } finally {
      typingIndicator.classList.add('hidden');
      typingIndicator.classList.remove('flex');
    }
  }

  // ==========================================================================
  // Dynamic Tension Avatars System (5 Emotional States in Vector SVG)
  // ==========================================================================
  function renderSparkAvatar(persona, tension, trust, progress) {
    if (!avatarGraphic || !avatarContainer || !moodBadge) return;

    // 1. Determine Emotional Level (5 states)
    let emotion = 'calm';
    if (trust > 30 && progress > 50) {
      emotion = 'harmonious';
    } else if (tension > 75) {
      emotion = 'critical';
    } else if (tension > 50) {
      emotion = 'irritated';
    } else if (tension > 25) {
      emotion = 'evaluating';
    } else {
      emotion = 'calm';
    }

    // 2. Set Aura Class on Avatar Container
    avatarContainer.className = `relative w-32 h-32 rounded-3xl bg-gradient-to-br from-white/10 to-white/5 border flex items-center justify-center mb-3.5 shadow-xl overflow-hidden transition-all duration-300 aura-${emotion}`;

    // 3. Set Mood Badge
    const pCfg = PERSONA_CONFIG[persona] || PERSONA_CONFIG.shark;
    const moodInfo = pCfg.moods[emotion] || pCfg.moods.calm;
    moodBadge.textContent = moodInfo.label;
    moodBadge.className = `absolute bottom-2 right-2 px-2.5 py-0.5 rounded-lg backdrop-blur-md text-[10px] font-bold border shadow-sm ${moodInfo.class}`;

    // 4. Generate Expressive SVG Graphic
    avatarGraphic.innerHTML = generateAvatarSvgMarkup(persona, emotion);
  }

  function generateAvatarSvgMarkup(persona, emotion) {
    if (persona === 'shark') {
      return generateSharkSvg(emotion);
    } else if (persona === 'partner') {
      return generatePartnerSvg(emotion);
    } else {
      return generateTricksterSvg(emotion);
    }
  }

  // SHARK SVG GENERATOR
  function generateSharkSvg(emotion) {
    let eyeHtml = `<circle cx="36" cy="42" r="3.5" fill="#38bdf8" filter="drop-shadow(0 0 4px #0284c7)"/>`;
    let browHtml = `<path d="M28 38 Q36 36 44 39" stroke="#94a3b8" stroke-width="2.5" fill="none" stroke-linecap="round"/>`;
    let mouthHtml = `<path d="M36 64 Q50 67 64 61" stroke="#cbd5e1" stroke-width="2.5" fill="none" stroke-linecap="round"/>`;
    let extrasHtml = ``;

    if (emotion === 'evaluating') {
      eyeHtml = `<ellipse cx="37" cy="42" rx="3.5" ry="2" fill="#60a5fa"/>`;
      browHtml = `<path d="M28 35 L44 40" stroke="#94a3b8" stroke-width="2.5" fill="none" stroke-linecap="round"/>`;
      mouthHtml = `<line x1="38" y1="63" x2="62" y2="63" stroke="#cbd5e1" stroke-width="2.5" stroke-linecap="round"/>`;
    } else if (emotion === 'irritated') {
      eyeHtml = `<circle cx="37" cy="42" r="4" fill="#f59e0b" filter="drop-shadow(0 0 6px #d97706)"/>`;
      browHtml = `<path d="M26 34 L45 42" stroke="#f59e0b" stroke-width="3" fill="none" stroke-linecap="round"/>`;
      mouthHtml = `
        <path d="M34 61 Q50 68 66 61" stroke="#f59e0b" stroke-width="2" fill="#0f172a"/>
        <polygon points="38,61 41,66 44,61 47,66 50,61 53,66 56,61 59,66 62,61" fill="#ffffff"/>
      `;
    } else if (emotion === 'critical') {
      eyeHtml = `<circle cx="37" cy="42" r="5" fill="#ef4444" filter="drop-shadow(0 0 10px #dc2626)"/>`;
      browHtml = `<path d="M24 32 L46 44" stroke="#ef4444" stroke-width="3.5" fill="none" stroke-linecap="round"/>`;
      mouthHtml = `
        <path d="M32 58 Q50 74 68 58" stroke="#ef4444" stroke-width="2.5" fill="#450a0a"/>
        <polygon points="36,58 39,66 42,58 45,66 48,58 51,66 54,58 57,66 60,58 63,66 66,58" fill="#ffffff"/>
        <polygon points="38,71 42,65 46,71 50,65 54,71 58,65 62,71" fill="#ffffff"/>
      `;
      extrasHtml = `
        <path d="M74 25 L71 31 L75 33 L69 41" stroke="#ef4444" stroke-width="2" fill="none"/>
        <circle cx="20" cy="30" r="1.5" fill="#f87171" opacity="0.8"/>
      `;
    } else if (emotion === 'harmonious') {
      eyeHtml = `
        <circle cx="37" cy="42" r="3.5" fill="#38bdf8" filter="drop-shadow(0 0 6px #38bdf8)"/>
        <polygon points="46,36 47,39 50,39 48,41 49,44 46,42 43,44 44,41 42,39 45,39" fill="#fbbf24"/>
      `;
      browHtml = `<path d="M28 36 Q36 34 44 37" stroke="#38bdf8" stroke-width="2.5" fill="none" stroke-linecap="round"/>`;
      mouthHtml = `
        <path d="M34 60 Q50 70 66 60" stroke="#38bdf8" stroke-width="2" fill="#0f172a"/>
        <polygon points="40,61 43,65 46,61 49,65 52,61 55,65 58,61" fill="#ffffff"/>
      `;
    }

    return `
      <svg viewBox="0 0 100 100" class="w-full h-full">
        <defs>
          <linearGradient id="sharkSkin" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#334155"/>
            <stop offset="60%" stop-color="#1e293b"/>
            <stop offset="100%" stop-color="#0f172a"/>
          </linearGradient>
          <linearGradient id="sharkBelly" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#f1f5f9"/>
            <stop offset="100%" stop-color="#94a3b8"/>
          </linearGradient>
        </defs>
        <!-- Dorsal Fin -->
        <path d="M50 10 Q65 14 62 30 Q54 28 50 30 Z" fill="#1e293b" stroke="#475569" stroke-width="1.5"/>
        <!-- Main Shark Head -->
        <path d="M15 50 Q18 24 55 24 Q82 24 85 54 Q86 78 50 82 Q20 80 15 50 Z" fill="url(#sharkSkin)" stroke="#475569" stroke-width="1.5"/>
        <!-- White Underbelly / Chest -->
        <path d="M32 66 Q50 80 68 66 Q62 82 50 82 Q38 82 32 66 Z" fill="url(#sharkBelly)"/>
        <!-- Dark Business Tie & Collar -->
        <polygon points="44,82 56,82 53,98 47,98" fill="#ef4444"/>
        <polygon points="36,80 50,86 64,80 57,82 50,83 43,82" fill="#090d16"/>
        <!-- Dynamic Eyebrow, Eye, Mouth, Extras -->
        ${browHtml}
        ${eyeHtml}
        ${mouthHtml}
        ${extrasHtml}
      </svg>
    `;
  }

  // PARTNER SVG GENERATOR
  function generatePartnerSvg(emotion) {
    let eyeHtml = `<circle cx="36" cy="45" r="3.5" fill="#34d399"/><circle cx="64" cy="45" r="3.5" fill="#34d399"/>`;
    let browHtml = `<path d="M28 38 Q36 36 44 38" stroke="#34d399" stroke-width="2" fill="none"/><path d="M56 38 Q64 36 72 38" stroke="#34d399" stroke-width="2" fill="none"/>`;
    let mouthHtml = `<path d="M40 68 Q50 76 60 68" stroke="#34d399" stroke-width="2.5" fill="none" stroke-linecap="round"/>`;
    let extrasHtml = ``;

    if (emotion === 'evaluating') {
      browHtml = `<path d="M28 34 Q36 32 44 35" stroke="#34d399" stroke-width="2.5" fill="none"/><path d="M56 39 Q64 37 72 39" stroke="#34d399" stroke-width="2" fill="none"/>`;
      mouthHtml = `<path d="M42 70 Q50 71 58 70" stroke="#cbd5e1" stroke-width="2" fill="none" stroke-linecap="round"/>`;
    } else if (emotion === 'irritated') {
      eyeHtml = `<circle cx="36" cy="45" r="3" fill="#fbbf24"/><circle cx="64" cy="45" r="3" fill="#fbbf24"/>`;
      browHtml = `<path d="M28 41 L44 37" stroke="#fbbf24" stroke-width="2.5" fill="none"/><path d="M56 37 L72 41" stroke="#fbbf24" stroke-width="2.5" fill="none"/>`;
      mouthHtml = `<path d="M42 72 Q50 67 58 72" stroke="#fbbf24" stroke-width="2.5" fill="none" stroke-linecap="round"/>`;
      extrasHtml = `<path d="M76 40 Q80 44 78 48 Q76 46 76 40" fill="#38bdf8"/>`;
    } else if (emotion === 'critical') {
      eyeHtml = `<circle cx="36" cy="45" r="4.5" fill="#ef4444"/><circle cx="64" cy="45" r="4.5" fill="#ef4444"/>`;
      browHtml = `<path d="M26 43 L44 36" stroke="#ef4444" stroke-width="3" fill="none"/><path d="M56 36 L74 43" stroke="#ef4444" stroke-width="3" fill="none"/>`;
      mouthHtml = `<path d="M38 74 Q50 65 62 74" stroke="#ef4444" stroke-width="3" fill="none" stroke-linecap="round"/>`;
      extrasHtml = `
        <path d="M78 36 Q83 41 80 46 Q77 44 78 36" fill="#38bdf8"/>
        <path d="M22 36 Q17 41 20 46 Q23 44 22 36" fill="#38bdf8"/>
      `;
    } else if (emotion === 'harmonious') {
      eyeHtml = `<path d="M32 46 Q36 40 40 46" stroke="#10b981" stroke-width="2.5" fill="none"/><path d="M60 46 Q64 40 68 46" stroke="#10b981" stroke-width="2.5" fill="none"/>`;
      browHtml = `<path d="M28 35 Q36 33 44 35" stroke="#10b981" stroke-width="2" fill="none"/><path d="M56 35 Q64 33 72 35" stroke="#10b981" stroke-width="2" fill="none"/>`;
      mouthHtml = `<path d="M36 66 Q50 82 64 66" stroke="#10b981" stroke-width="3" fill="#064e3b" stroke-linecap="round"/>`;
      extrasHtml = `<polygon points="50,22 52,26 56,26 53,29 54,33 50,30 46,33 47,29 44,26 48,26" fill="#fbbf24"/>`;
    }

    return `
      <svg viewBox="0 0 100 100" class="w-full h-full">
        <defs>
          <linearGradient id="partnerBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#065f46"/>
            <stop offset="100%" stop-color="#064e3b"/>
          </linearGradient>
        </defs>
        <!-- Head Contour -->
        <ellipse cx="50" cy="50" rx="34" ry="38" fill="#1e293b" stroke="#059669" stroke-width="2"/>
        <!-- Glasses Frames -->
        <rect x="26" y="38" width="20" height="15" rx="5" fill="rgba(255,255,255,0.08)" stroke="#10b981" stroke-width="2"/>
        <rect x="54" y="38" width="20" height="15" rx="5" fill="rgba(255,255,255,0.08)" stroke="#10b981" stroke-width="2"/>
        <line x1="46" y1="45" x2="54" y2="45" stroke="#10b981" stroke-width="2"/>
        <!-- Suit Collar -->
        <polygon points="34,88 50,96 66,88 58,99 42,99" fill="#064e3b"/>
        <!-- Dynamic Features -->
        ${browHtml}
        ${eyeHtml}
        ${mouthHtml}
        ${extrasHtml}
      </svg>
    `;
  }

  // TRICKSTER SVG GENERATOR
  function generateTricksterSvg(emotion) {
    let eyeHtml = `<path d="M32 46 Q38 41 45 46" stroke="#c084fc" stroke-width="2.5" fill="none"/><path d="M55 46 Q62 41 68 46" stroke="#c084fc" stroke-width="2.5" fill="none"/>`;
    let mouthHtml = `<path d="M42 68 Q50 74 62 65" stroke="#c084fc" stroke-width="2.5" fill="none" stroke-linecap="round"/>`;
    let browHtml = `<path d="M30 38 Q38 35 44 39" stroke="#c084fc" stroke-width="2" fill="none"/><path d="M56 36 Q62 33 70 38" stroke="#c084fc" stroke-width="2.5" fill="none"/>`;
    let extrasHtml = ``;

    if (emotion === 'evaluating') {
      browHtml = `<path d="M28 35 Q36 32 44 38" stroke="#a855f7" stroke-width="2.5" fill="none"/><path d="M56 38 L68 36" stroke="#a855f7" stroke-width="2" fill="none"/>`;
      eyeHtml = `<circle cx="38" cy="45" r="3" fill="#c084fc"/><ellipse cx="62" cy="45" rx="3.5" ry="2" fill="#c084fc"/>`;
    } else if (emotion === 'irritated') {
      browHtml = `<path d="M28 42 L44 37" stroke="#fb923c" stroke-width="2.5" fill="none"/><path d="M56 37 L72 42" stroke="#fb923c" stroke-width="2.5" fill="none"/>`;
      eyeHtml = `<circle cx="38" cy="46" r="3.5" fill="#fb923c"/><circle cx="62" cy="46" r="3.5" fill="#fb923c"/>`;
      mouthHtml = `<line x1="42" y1="69" x2="58" y2="69" stroke="#fb923c" stroke-width="2.5" stroke-linecap="round"/>`;
    } else if (emotion === 'critical') {
      browHtml = `<path d="M26 44 L44 35" stroke="#ef4444" stroke-width="3" fill="none"/><path d="M56 35 L74 44" stroke="#ef4444" stroke-width="3" fill="none"/>`;
      eyeHtml = `<circle cx="38" cy="46" r="5" fill="#ef4444"/><circle cx="62" cy="46" r="5" fill="#ef4444"/>`;
      mouthHtml = `
        <path d="M36 67 Q50 60 64 67" stroke="#ef4444" stroke-width="2.5" fill="#3b0764"/>
        <polygon points="42,67 44,72 46,67 54,67 56,72 58,67" fill="#ffffff"/>
      `;
      extrasHtml = `<path d="M78 32 Q82 36 80 40 Q77 38 78 32" fill="#38bdf8"/>`;
    } else if (emotion === 'harmonious') {
      eyeHtml = `
        <path d="M32 46 Q38 42 44 46" stroke="#fbbf24" stroke-width="2.5" fill="none"/>
        <polygon points="62,40 64,43 67,43 65,45 66,48 62,46 59,48 60,45 58,43 61,43" fill="#fbbf24"/>
      `;
      mouthHtml = `<path d="M38 67 Q50 78 64 66" stroke="#fbbf24" stroke-width="2.5" fill="none" stroke-linecap="round"/>`;
    }

    return `
      <svg viewBox="0 0 100 100" class="w-full h-full">
        <defs>
          <linearGradient id="foxSkin" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#4c1d95"/>
            <stop offset="60%" stop-color="#2e1065"/>
            <stop offset="100%" stop-color="#0f0728"/>
          </linearGradient>
        </defs>
        <!-- Fox Ears -->
        <polygon points="22,40 28,14 46,34" fill="#6b21a8" stroke="#a855f7" stroke-width="1.5"/>
        <polygon points="26,36 30,20 42,33" fill="#c084fc"/>
        <polygon points="78,40 72,14 54,34" fill="#6b21a8" stroke="#a855f7" stroke-width="1.5"/>
        <polygon points="74,36 70,20 58,33" fill="#c084fc"/>
        <!-- Face Contour -->
        <path d="M22 45 Q50 28 78 45 Q82 72 50 86 Q18 72 22 45 Z" fill="url(#foxSkin)" stroke="#a855f7" stroke-width="1.5"/>
        <!-- White/Violet Muzzle -->
        <path d="M36 62 Q50 56 64 62 Q50 82 36 62 Z" fill="#3b0764"/>
        <polygon points="47,60 53,60 50,64" fill="#c084fc"/>
        <!-- Dynamic Features -->
        ${browHtml}
        ${eyeHtml}
        ${mouthHtml}
        ${extrasHtml}
      </svg>
    `;
  }

  // ==========================================================================
  // Start Negotiation Game
  // ==========================================================================
  btnStartGame.addEventListener('click', async () => {
    btnStartGame.disabled = true;
    btnStartGame.innerHTML = `<span class="animate-spin mr-2">⏳</span> Входим на арену...`;

    if (isStaticMode) {
      const starterKey = `${selectedPersona}_${selectScenario.value}`;
      const welcomeText = WELCOME_STARTERS[starterKey] || "Здравствуйте. Я готов к переговорам. Каково ваше предложение?";
      currentSession = {
        session_id: 'web-' + Date.now(),
        persona_type: selectedPersona,
        scenario_id: selectScenario.value,
        user_batna: inputBatna.value.trim(),
        stage: 1,
        metrics: {
          trust: selectedPersona === 'trickster' ? -10 : 0,
          tension: selectedPersona === 'shark' ? 10 : 0,
          progress: 0
        },
        history: [{ sender: 'spark', text: welcomeText, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }],
        game_over: false
      };
      launchArena();
      btnStartGame.disabled = false;
      btnStartGame.innerHTML = `<i data-lucide="play" class="w-5 h-5 fill-current"></i><span>Войти на Арену переговоров</span>`;
      lucide.createIcons();
      return;
    }

    try {
      const payload = {
        persona_type: selectedPersona,
        scenario_id: selectScenario.value,
        user_batna: inputBatna.value.trim()
      };

      const res = await fetch('/api/session/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json();
        alert(`Ошибка старта: ${err.detail || 'Не удалось начать сессию'}`);
        return;
      }

      const data = await res.json();
      currentSession = data.session;
      launchArena();
    } catch (err) {
      alert('Ошибка соединения с бэкендом: ' + err.message);
    } finally {
      btnStartGame.disabled = false;
      btnStartGame.innerHTML = `<i data-lucide="play" class="w-5 h-5 fill-current"></i><span>Войти на Арену переговоров</span>`;
      lucide.createIcons();
    }
  });

  function launchArena() {
    lobbyScreen.classList.add('hidden');
    arenaScreen.classList.remove('hidden');
    btnRestart.classList.remove('hidden');
    headerPersonaBadge.classList.remove('hidden');
    headerPersonaBadge.classList.add('flex');

    const pCfg = PERSONA_CONFIG[currentSession.persona_type] || PERSONA_CONFIG.shark;
    personaHeaderName.textContent = pCfg.name;
    personaDot.style.backgroundColor = pCfg.color;

    arenaOpponentName.textContent = pCfg.name;
    arenaOpponentSubtitle.textContent = pCfg.title;
    arenaStyleTag.textContent = pCfg.style;
    arenaBatnaText.textContent = currentSession.user_batna;

    // Render initial history
    chatMessages.innerHTML = '';
    currentSession.history.forEach(msg => {
      appendChatMessage(msg.sender, msg.text, msg.timestamp, msg.hint);
    });

    updateMetricsAndUI(currentSession.metrics, currentSession.stage);
    userInput.focus();
    lucide.createIcons();

    // Start 45-second Turn Countdown Timer
    startTurnTimer();
  }

  // Update UI and visual indicators
  function updateMetricsAndUI(metrics, stage) {
    // Stage
    stageLabel.textContent = STAGES[stage] || `Этап ${stage}`;
    stepBars.forEach((bar, idx) => {
      if (idx + 1 <= stage) {
        bar.className = 'h-2 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50 transition-colors';
      } else {
        bar.className = 'h-2 rounded-full bg-white/10 transition-colors';
      }
    });

    // Trust (-100 to 100) -> Percentage 0 to 100%
    const trustPercent = Math.max(0, Math.min(100, (metrics.trust + 100) / 2));
    trustValue.textContent = (metrics.trust > 0 ? '+' : '') + metrics.trust;
    trustBar.style.width = `${trustPercent}%`;
    if (metrics.trust < -20) {
      trustBar.className = 'h-full bg-red-500 transition-all duration-500';
      trustValue.className = 'font-mono font-bold text-xs text-red-400';
    } else if (metrics.trust > 20) {
      trustBar.className = 'h-full bg-emerald-500 transition-all duration-500';
      trustValue.className = 'font-mono font-bold text-xs text-emerald-400';
    } else {
      trustBar.className = 'h-full bg-slate-400 transition-all duration-500';
      trustValue.className = 'font-mono font-bold text-xs text-slate-300';
    }

    // Tension (-100 to 100) -> Percentage 0 to 100%
    const tensionPercent = Math.max(0, Math.min(100, (metrics.tension + 100) / 2));
    tensionValue.textContent = (metrics.tension > 0 ? '+' : '') + metrics.tension;
    tensionBar.style.width = `${tensionPercent}%`;

    // Tension danger cues
    if (metrics.tension > 50) {
      tensionWidget.classList.add('tension-danger-pulse', 'border-red-500');
      tensionBar.className = 'h-full bg-red-500 transition-all duration-500';
      tensionValue.className = 'font-mono font-bold text-xs text-red-400 animate-pulse';
      tensionVignette.classList.remove('opacity-0');
      tensionVignette.classList.add('opacity-100');
    } else {
      tensionWidget.classList.remove('tension-danger-pulse', 'border-red-500');
      tensionBar.className = 'h-full bg-amber-500 transition-all duration-500';
      tensionValue.className = 'font-mono font-bold text-xs text-amber-400';
      tensionVignette.classList.remove('opacity-100');
      tensionVignette.classList.add('opacity-0');
    }

    // Progress (0 to 100%)
    progressValue.textContent = `${metrics.progress}%`;
    progressBar.style.width = `${metrics.progress}%`;

    // Update Vector Avatar Graphics and Aura
    renderSparkAvatar(currentSession.persona_type, metrics.tension, metrics.trust, metrics.progress);
  }

  // Append Chat Message Bubble
  function appendChatMessage(sender, text, timestamp, hint = null, engine = null) {
    const isUser = sender === 'user';
    const isSpark = sender === 'spark';
    const isSystem = sender === 'system';

    const msgDiv = document.createElement('div');
    const timeStr = timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (isSystem) {
      msgDiv.className = 'flex justify-center my-2 message-bubble';
      msgDiv.innerHTML = `
        <div class="px-4 py-2 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-amber-200 text-xs font-medium backdrop-blur-md shadow-sm max-w-lg text-center flex items-center gap-2">
          <i data-lucide="alert-circle" class="w-4 h-4 text-amber-400 shrink-0"></i>
          <span>${escapeHtml(text)}</span>
        </div>
      `;
    } else if (isUser) {
      msgDiv.className = 'flex justify-end message-bubble';
      msgDiv.innerHTML = `
        <div class="max-w-xl bubble-user text-white px-5 py-3.5 shadow-lg">
          <div class="flex items-center justify-between gap-4 mb-1">
            <span class="text-[11px] font-bold text-blue-100">Вы</span>
            <span class="text-[10px] text-blue-200/80 font-mono">${timeStr}</span>
          </div>
          <p class="text-sm leading-relaxed whitespace-pre-wrap font-normal">${escapeHtml(text)}</p>
        </div>
      `;
    } else if (isSpark) {
      msgDiv.className = 'flex justify-start message-bubble';
      const pCfg = PERSONA_CONFIG[currentSession?.persona_type] || PERSONA_CONFIG.shark;
      const engineLabel = engine || (hasApiKey ? 'gemini-3.6-flash' : 'starter');
      const isGemini = engineLabel.includes('gemini');

      msgDiv.innerHTML = `
        <div class="max-w-xl bubble-spark text-slate-100 px-5 py-3.5 shadow-xl">
          <div class="flex items-center justify-between gap-4 mb-1.5">
            <span class="text-[11px] font-bold text-slate-200 flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full shadow-sm" style="background-color: ${pCfg.color};"></span>
              ${pCfg.name}
            </span>
            <div class="flex items-center gap-2">
              <span class="text-[9px] px-2 py-0.5 rounded-md font-mono font-semibold ${isGemini ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 shadow-sm' : 'bg-white/10 text-slate-300 border border-white/10'}">
                ${engineLabel}
              </span>
              <span class="text-[10px] text-slate-400 font-mono">${timeStr}</span>
            </div>
          </div>
          <p class="text-sm leading-relaxed whitespace-pre-wrap text-slate-200 font-normal">${escapeHtml(text)}</p>
        </div>
      `;
    }

    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Update Coach hint if present
    if (hint) {
      coachHintText.textContent = hint;
      coachHintText.parentElement.classList.add('bg-blue-900/40', 'border-blue-500');
      setTimeout(() => {
        coachHintText.parentElement.classList.remove('bg-blue-900/40', 'border-blue-500');
      }, 1500);
    }
    lucide.createIcons();
  }

  // Handle User Message Submission
  chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = userInput.value.trim();
    if (!text || !currentSession || currentSession.game_over) return;

    // User took action: stop turn countdown timer
    stopTurnTimer();

    userInput.value = '';
    btnSend.disabled = true;

    // Render User Message immediately
    appendChatMessage('user', text);

    // Show Spark typing indicator
    typingIndicator.classList.remove('hidden');
    typingIndicator.classList.add('flex');
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // If Static Mode (GitHub Pages)
    if (isStaticMode) {
      await handleStaticModeChat(text);
      typingIndicator.classList.add('hidden');
      typingIndicator.classList.remove('flex');
      btnSend.disabled = false;
      userInput.focus();
      if (!currentSession.game_over) startTurnTimer();
      return;
    }

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: currentSession.session_id,
          user_message: text
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Ошибка отправки сообщения');
      }

      const data = await res.json();
      currentSession = data.session;

      if (data.engine) {
        updateAiEngineBadge(data.engine);
      }

      if (data.spark_reply) {
        appendChatMessage('spark', data.spark_reply, null, data.hint, data.engine);
      }

      updateMetricsAndUI(currentSession.metrics, currentSession.stage);

      if (data.game_over) {
        stopTurnTimer();
        setTimeout(() => {
          showGameOverBanner(data.ending, data.ending_reason);
        }, 1200);
      } else {
        // Restart 45-second timer for player's next move
        startTurnTimer();
      }
    } catch (err) {
      appendChatMessage('spark', `⚠️ Произошла ошибка: ${err.message}. Проверьте настройки API ключа.`);
      if (!currentSession.game_over) startTurnTimer();
    } finally {
      typingIndicator.classList.add('hidden');
      typingIndicator.classList.remove('flex');
      btnSend.disabled = false;
      userInput.focus();
    }
  });

  // Client-Side Direct Gemini Engine for GitHub Pages
  async function handleStaticModeChat(text) {
    const activeKey = clientApiKey || localStorage.getItem('gemini_api_key');
    if (!activeKey) {
      // Offline heuristic
      simulateMockReply(text);
      return;
    }

    try {
      const recentHistory = currentSession.history.slice(-6).map(m => `${m.sender === 'user' ? 'User' : 'Spark'}: ${m.text}`);
      const payload = {
        user_message: text,
        history: recentHistory,
        persona_type: currentSession.persona_type,
        stage: currentSession.stage,
        user_batna: currentSession.user_batna,
        metrics: currentSession.metrics
      };

      const prompt = `${SYSTEM_PROMPT}\n\nКонтекст:\n${JSON.stringify(payload, null, 2)}`;
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${activeKey}`;

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { response_mime_type: "application/json", temperature: 0.7 }
        })
      });

      if (!res.ok) {
        throw new Error(`API Error: ${res.status}`);
      }

      const raw = await res.json();
      const textOutput = raw.candidates?.[0]?.content?.parts?.[0]?.text;
      const parsed = JSON.parse(textOutput);

      applyClientDelta(parsed.internal_state, parsed.branch_trigger);
      currentSession.history.push({ sender: 'spark', text: parsed.reply, hint: parsed.hint });
      appendChatMessage('spark', parsed.reply, null, parsed.hint, 'gemini-3.6-flash');
      updateMetricsAndUI(currentSession.metrics, currentSession.stage);

      if (currentSession.game_over) {
        stopTurnTimer();
        setTimeout(() => {
          showGameOverBanner(currentSession.ending, currentSession.ending_reason);
        }, 1200);
      }
    } catch (err) {
      console.warn('Client Gemini call failed, falling back to heuristic:', err);
      simulateMockReply(text);
    }
  }

  function applyClientDelta(delta, branch) {
    currentSession.metrics.trust = Math.max(-100, Math.min(100, currentSession.metrics.trust + (delta.trust_delta || 0)));
    currentSession.metrics.tension = Math.max(-100, Math.min(100, currentSession.metrics.tension + (delta.tension_delta || 0)));
    currentSession.metrics.progress = Math.max(0, Math.min(100, currentSession.metrics.progress + (delta.progress_delta || 0)));

    if (delta.stage_change && delta.new_stage) {
      currentSession.stage = Math.max(1, Math.min(4, delta.new_stage));
    }

    if (branch && branch.activated) {
      currentSession.game_over = true;
      currentSession.ending = branch.ending_type || 'compromise';
      currentSession.ending_reason = branch.reason || 'Переговоры завершены.';
    } else if (currentSession.metrics.tension >= 85) {
      currentSession.game_over = true;
      currentSession.ending = 'fail';
      currentSession.ending_reason = 'Уровень напряжения превысил критический порог (85+). Оппонент хлопнул дверью.';
    } else if (currentSession.metrics.progress >= 95) {
      currentSession.game_over = true;
      currentSession.ending = 'deal';
      currentSession.ending_reason = 'Сделка успешно согласована на взаимовыгодных условиях!';
    }
  }

  function simulateMockReply(userText) {
    const persona = currentSession.persona_type;
    const lower = userText.toLowerCase();

    let reply = "Я услышал вашу позицию. Давайте конкретизируем условия.";
    let trustDelta = 0;
    let tensionDelta = 5;
    let progressDelta = 5;
    let hint = null;

    if (lower.includes('молч') || lower.includes('тайм-аут') || lower.includes('пауз')) {
      if (persona === 'shark') {
        reply = "Вы молчите уже больше 45 секунд. В реальном бизнесе такая пауза означает капитуляцию. Либо мы фиксируем моё предложение, либо расходимся.";
        tensionDelta = 15;
        trustDelta = -8;
        hint = "С Акулой молчание воспринимается как слабость. Верните инициативу конкретным встречным предложением.";
      } else if (persona === 'partner') {
        reply = "Я вижу, что вы взяли долгую паузу. Видимо, наши условия вызывают у вас внутреннее сопротивление. Скажите открыто: что именно вас останавливает?";
        tensionDelta = 8;
        trustDelta = -4;
        hint = "Партнер готов выслушать ваши реальные опасения. Обозначьте свои скрытые интересы.";
      } else {
        reply = "Замешкались? Обычно так молчат, когда понимают, что возразить нечего. Давайте просто подпишем текущий драфт и не будем терять драгоценное время.";
        tensionDelta = 12;
        trustDelta = -6;
        hint = "Трикстер пользуется вашей заминкой. Не соглашайтесь молча, задайте встречный уточняющий вопрос.";
      }
    } else if (persona === 'shark') {
      reply = "Вы серьезно предлагаете такие условия? Это неприемлемо. Мы либо фиксируем начальную планку, либо заканчиваем.";
      tensionDelta = 12;
      trustDelta = -5;
      hint = "С Акулой важно говорить на языке цифр и взаимной выгоды (LTV, предоплата).";
    } else if (persona === 'partner') {
      reply = "Интересный аргумент. А что если мы пойдем навстречу по графику платежей, но закрепим долгосрочный контракт?";
      trustDelta = 10;
      tensionDelta = -5;
      progressDelta = 10;
      hint = "Партнер готов к встречным уступкам. Закрепите компромисс.";
    } else {
      reply = "Вы очень складно говорите, но статистика рынка показывает обратное. Давайте остановимся на первоначальной оценке.";
      trustDelta = -5;
      tensionDelta = 6;
      hint = "Трикстер сеет сомнения. Опирайтесь на факты и зафиксированные договоренности.";
    }

    applyClientDelta({ trust_delta: trustDelta, tension_delta: tensionDelta, progress_delta: progressDelta }, { activated: false });
    currentSession.history.push({ sender: 'spark', text: reply, hint: hint });
    appendChatMessage('spark', reply, null, hint, 'mock');
    updateMetricsAndUI(currentSession.metrics, currentSession.stage);
  }

  // Game Over handling
  function showGameOverBanner(ending, reason) {
    stopTurnTimer();

    const banner = document.createElement('div');
    banner.className = 'my-4 p-5 rounded-3xl border text-center transition-all message-bubble backdrop-blur-xl shadow-xl ';

    if (ending === 'deal') {
      banner.className += 'bg-emerald-950/50 border-emerald-500/50 text-emerald-200';
      banner.innerHTML = `
        <div class="font-bold text-base mb-1">🎉 Переговоры успешно завершены: СДЕЛКА!</div>
        <div class="text-xs mb-3 text-slate-200 font-medium">${reason || 'Условия согласованы'}</div>
        <button id="btnOpenDebrief" class="px-6 py-2.5 ios-btn-primary text-white text-xs font-bold rounded-xl shadow-lg">
          Посмотреть детальный разбор (Debrief)
        </button>
      `;
    } else if (ending === 'fail') {
      banner.className += 'bg-red-950/50 border-red-500/50 text-red-200';
      banner.innerHTML = `
        <div class="font-bold text-base mb-1">🛑 Переговоры сорваны: ПРОВАЛ!</div>
        <div class="text-xs mb-3 text-slate-200 font-medium">${reason || 'Оппонент вышел из диалога'}</div>
        <button id="btnOpenDebrief" class="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl shadow-lg transition">
          Посмотреть детальный разбор (Debrief)
        </button>
      `;
    } else {
      banner.className += 'bg-amber-950/50 border-amber-500/50 text-amber-200';
      banner.innerHTML = `
        <div class="font-bold text-base mb-1">⚖️ Переговоры завершены: КОМПРОМИСС</div>
        <div class="text-xs mb-3 text-slate-200 font-medium">${reason || 'Стороны пошли на взаимные уступки'}</div>
        <button id="btnOpenDebrief" class="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl shadow-lg transition">
          Посмотреть детальный разбор (Debrief)
        </button>
      `;
    }

    chatMessages.appendChild(banner);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    document.getElementById('btnOpenDebrief').addEventListener('click', triggerDebrief);
  }

  // Force Debrief
  btnForceDebrief.addEventListener('click', () => {
    if (!currentSession) return;
    if (confirm('Вы уверены, что хотите досрочно завершить раунд и перейти к аналитическому разбору?')) {
      stopTurnTimer();
      triggerDebrief();
    }
  });

  // Trigger Debrief Generation
  async function triggerDebrief() {
    if (!currentSession) return;
    stopTurnTimer();

    btnForceDebrief.disabled = true;
    btnForceDebrief.innerHTML = `<span class="animate-spin mr-1">⏳</span> Анализируем...`;

    if (isStaticMode) {
      const mockDebrief = {
        score: Math.max(25, Math.min(95, 50 + Math.round(currentSession.metrics.trust * 0.25) - Math.round(currentSession.metrics.tension * 0.2) + Math.round(currentSession.metrics.progress * 0.25))),
        summary: `Раунд завершен с исходом: ${currentSession.ending || 'Компромисс'}. Вы вели переговоры с персоной ${currentSession.persona_type}.`,
        harvard_analysis: "Вы отстаивали деловые условия и проверяли гибкость контрагента. В критические моменты наблюдалась позиционная борьба вместо поиска скрытых интересов.",
        spin_analysis: "Были применены ситуационные вопросы. Рекомендуется активнее использовать извлекающие вопросы для усиления ценности вашего предложения.",
        batna_analysis: `Альтернатива (${currentSession.user_batna}) позволила не соглашаться на заведомо невыгодные условия.`,
        strengths: [
          "Самообладание при психологическом прессинге и дедлайне 45 секунд",
          "Готовность выдвигать контраргументы в стрессовых условиях",
          "Ориентация на сохранение контакта с оппонентом"
        ],
        weaknesses: [
          "Недостаточное зондирование скрытых мотивов контрагента",
          "Мало встречных условий формата «Да, если...»"
        ],
        recommendations: [
          "Разделяйте человека и проблему: выражайте уважение личности и аргументируйте цифрами",
          "Используйте пакетные соглашения (цена в обмен на срок или объем)",
          "При тайм-лимите 45 секунд не уходите в молчание: лучше задать открытый вопрос, чем брать долгую паузу"
        ]
      };
      renderDebriefModal(mockDebrief, currentSession.ending, currentSession.ending_reason);
      btnForceDebrief.disabled = false;
      btnForceDebrief.innerHTML = `<i data-lucide="flag" class="w-3.5 h-3.5"></i><span>Завершить и разобрать</span>`;
      lucide.createIcons();
      return;
    }

    try {
      const res = await fetch('/api/session/debrief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: currentSession.session_id })
      });

      if (!res.ok) throw new Error('Не удалось получить разбор');

      const data = await res.json();
      renderDebriefModal(data.debrief, data.ending, data.ending_reason);
    } catch (err) {
      alert('Ошибка генерации разбора: ' + err.message);
    } finally {
      btnForceDebrief.disabled = false;
      btnForceDebrief.innerHTML = `<i data-lucide="flag" class="w-3.5 h-3.5"></i><span>Завершить и разобрать</span>`;
      lucide.createIcons();
    }
  }

  // Render Debrief Modal
  function renderDebriefModal(debrief, ending, reason) {
    const endingBadge = document.getElementById('debriefEndingBadge');
    if (ending === 'deal') {
      endingBadge.textContent = 'Сделка заключена (Win-Win)';
      endingBadge.className = 'inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-3 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40';
    } else if (ending === 'fail') {
      endingBadge.textContent = 'Переговоры сорваны (No Deal)';
      endingBadge.className = 'inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-3 bg-red-500/20 text-red-300 border border-red-500/40';
    } else {
      endingBadge.textContent = 'Компромиссное решение';
      endingBadge.className = 'inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-3 bg-amber-500/20 text-amber-300 border border-amber-500/40';
    }

    document.getElementById('debriefEndingReason').textContent = reason || '';
    document.getElementById('debriefScore').textContent = debrief.score;

    document.getElementById('debriefFinalTrust').textContent = (currentSession.metrics.trust > 0 ? '+' : '') + currentSession.metrics.trust;
    document.getElementById('debriefFinalTension').textContent = currentSession.metrics.tension;
    document.getElementById('debriefFinalProgress').textContent = currentSession.metrics.progress + '%';

    document.getElementById('debriefSummary').textContent = debrief.summary;
    document.getElementById('debriefHarvard').textContent = debrief.harvard_analysis;
    document.getElementById('debriefSpin').textContent = debrief.spin_analysis;
    document.getElementById('debriefBatna').textContent = debrief.batna_analysis;

    // Lists
    const ulStrengths = document.getElementById('debriefStrengths');
    ulStrengths.innerHTML = '';
    (debrief.strengths || []).forEach(item => {
      const li = document.createElement('li');
      li.textContent = item;
      ulStrengths.appendChild(li);
    });

    const ulWeaknesses = document.getElementById('debriefWeaknesses');
    ulWeaknesses.innerHTML = '';
    (debrief.weaknesses || []).forEach(item => {
      const li = document.createElement('li');
      li.textContent = item;
      ulWeaknesses.appendChild(li);
    });

    const ulRecs = document.getElementById('debriefRecommendations');
    ulRecs.innerHTML = '';
    (debrief.recommendations || []).forEach(item => {
      const li = document.createElement('li');
      li.textContent = item;
      ulRecs.appendChild(li);
    });

    debriefModal.classList.remove('hidden');
    lucide.createIcons();
  }

  // Play Again / Reset
  btnDebriefPlayAgain.addEventListener('click', resetToLobby);
  btnRestart.addEventListener('click', () => {
    if (confirm('Вернуться в лобби и сбросить текущие переговоры?')) {
      resetToLobby();
    }
  });

  function resetToLobby() {
    stopTurnTimer();
    debriefModal.classList.add('hidden');
    arenaScreen.classList.add('hidden');
    lobbyScreen.classList.remove('hidden');
    btnRestart.classList.add('hidden');
    headerPersonaBadge.classList.add('hidden');
    tensionVignette.classList.add('opacity-0');
    tensionVignette.classList.remove('opacity-100');
    currentSession = null;
  }

  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
});
