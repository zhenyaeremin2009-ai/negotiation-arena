// Frontend logic for Negotiation Arena: Spark AI (Universal Dual-Mode: Full-Stack & GitHub Pages)

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide icons
  lucide.createIcons();

  // State
  let currentSession = null;
  let selectedPersona = 'shark';
  let hasApiKey = false;
  let isStaticMode = false;
  let clientApiKey = localStorage.getItem('gemini_api_key') || '';

  const PERSONA_CONFIG = {
    shark: {
      name: 'Spark: The Shark',
      title: 'Коммерческий директор',
      style: 'Агрессивный торг и давление',
      goal: 'Максимум маржи и 100% предоплата',
      color: '#ef4444',
      badgeClass: 'text-red-400',
      emojis: { normal: '🦈', angry: '⚡🦈', pleased: '🤝' }
    },
    partner: {
      name: 'Spark: The Partner',
      title: 'Директор по развитию партнерств',
      style: 'Кооперация (Win-Win)',
      goal: 'Долгосрочное сотрудничество',
      color: '#10b981',
      badgeClass: 'text-emerald-400',
      emojis: { normal: '🤝', angry: '🧐', pleased: '🌟' }
    },
    trickster: {
      name: 'Spark: The Trickster',
      title: 'Старший консультант по сделкам',
      style: 'Манипуляции и психологические ловушки',
      goal: 'Скрыть издержки и урезать SLA',
      color: '#8b5cf6',
      badgeClass: 'text-purple-400',
      emojis: { normal: '🦊', angry: '🎭', pleased: '😏' }
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
  const avatarEmoji = document.getElementById('avatarEmoji');
  const moodBadge = document.getElementById('moodBadge');
  const arenaOpponentName = document.getElementById('arenaOpponentName');
  const arenaOpponentSubtitle = document.getElementById('arenaOpponentSubtitle');
  const arenaStyleTag = document.getElementById('arenaStyleTag');
  const arenaBatnaText = document.getElementById('arenaBatnaText');
  const coachHintText = document.getElementById('coachHintText');

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

  // Start Negotiation Game
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

    const pCfg = PERSONA_CONFIG[currentSession.persona_type] || PERSONA_CONFIG.shark;

    // Tension danger cues
    if (metrics.tension > 50) {
      tensionWidget.classList.add('tension-danger-pulse', 'border-red-500');
      tensionBar.className = 'h-full bg-red-500 transition-all duration-500';
      tensionValue.className = 'font-mono font-bold text-xs text-red-400 animate-pulse';
      tensionVignette.classList.remove('opacity-0');
      tensionVignette.classList.add('opacity-100');
      avatarContainer.classList.add('avatar-stressed', 'border-red-500');
      avatarEmoji.textContent = pCfg.emojis.angry;
      moodBadge.textContent = 'На пределе!';
      moodBadge.className = 'absolute bottom-2 right-2 px-2 py-0.5 rounded-lg bg-red-950/80 backdrop-blur text-[10px] font-bold text-red-300 border border-red-700 animate-pulse';
    } else {
      tensionWidget.classList.remove('tension-danger-pulse', 'border-red-500');
      tensionBar.className = 'h-full bg-amber-500 transition-all duration-500';
      tensionValue.className = 'font-mono font-bold text-xs text-amber-400';
      tensionVignette.classList.remove('opacity-100');
      tensionVignette.classList.add('opacity-0');
      avatarContainer.classList.remove('avatar-stressed', 'border-red-500');

      if (metrics.trust > 30 && metrics.progress > 40) {
        avatarEmoji.textContent = pCfg.emojis.pleased;
        moodBadge.textContent = 'Лоялен';
        moodBadge.className = 'absolute bottom-2 right-2 px-2 py-0.5 rounded-lg bg-emerald-950/80 backdrop-blur text-[10px] font-bold text-emerald-300 border border-emerald-700';
      } else {
        avatarEmoji.textContent = pCfg.emojis.normal;
        moodBadge.textContent = 'Сдержан';
        moodBadge.className = 'absolute bottom-2 right-2 px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur text-[10px] font-bold text-slate-300 border border-white/10';
      }
    }

    // Progress (0 to 100%)
    progressValue.textContent = `${metrics.progress}%`;
    progressBar.style.width = `${metrics.progress}%`;
  }

  // Append Chat Message Bubble
  function appendChatMessage(sender, text, timestamp, hint = null, engine = null) {
    const isUser = sender === 'user';
    const isSpark = sender === 'spark';

    const msgDiv = document.createElement('div');
    msgDiv.className = `flex ${isUser ? 'justify-end' : 'justify-start'} message-bubble`;

    const timeStr = timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (isUser) {
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
  }

  // Handle User Message Submission
  chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = userInput.value.trim();
    if (!text || !currentSession || currentSession.game_over) return;

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
        setTimeout(() => {
          showGameOverBanner(data.ending, data.ending_reason);
        }, 1200);
      }
    } catch (err) {
      appendChatMessage('spark', `⚠️ Произошла ошибка: ${err.message}. Проверьте настройки API ключа.`);
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
    let reply = "Я услышал вашу позицию. Давайте конкретизируем условия.";
    let trustDelta = 0;
    let tensionDelta = 5;
    let progressDelta = 5;
    let hint = null;

    if (persona === 'shark') {
      reply = "Вы серьезно предлагаете такие условия? Это неприемлемо. Мы либо фиксируем начальную планку, либо заканчиваем.";
      tensionDelta = 15;
      trustDelta = -5;
      hint = "С Акулой важно говорить на языке цифр и взаимной выгоды (LTV, предоплата).";
    } else if (persona === 'partner') {
      reply = "Интересный аргумент. А что если мы пойдем навстречу по графику платежей, но закрепим долгосрочный контракт?";
      trustDelta = 10;
      tensionDelta = -5;
      progressDelta = 10;
      hint = "Партнер готов к встречным уступкам. Закрепите компромисс.";
    }

    applyClientDelta({ trust_delta: trustDelta, tension_delta: tensionDelta, progress_delta: progressDelta }, { activated: false });
    currentSession.history.push({ sender: 'spark', text: reply, hint: hint });
    appendChatMessage('spark', reply, null, hint, 'mock');
    updateMetricsAndUI(currentSession.metrics, currentSession.stage);
  }

  // Game Over handling
  function showGameOverBanner(ending, reason) {
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
      triggerDebrief();
    }
  });

  // Trigger Debrief Generation
  async function triggerDebrief() {
    if (!currentSession) return;

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
          "Самообладание при психологическом прессинге",
          "Готовность выдвигать контраргументы",
          "Ориентация на сохранение контакта"
        ],
        weaknesses: [
          "Недостаточное зондирование мотивов контрагента",
          "Мало встречных условий формата «Да, если...»"
        ],
        recommendations: [
          "Разделяйте человека и проблему: выражайте уважение личности и аргументируйте цифрами",
          "Используйте пакетные соглашения (цена в обмен на срок или объем)"
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
