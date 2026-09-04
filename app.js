// Frontend logic for Negotiation Arena: Spark AI

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide icons
  lucide.createIcons();

  // State
  let currentSession = null;
  let selectedPersona = 'shark';
  let hasApiKey = false;

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

  const STAGES = {
    1: '1: Установление контакта',
    2: '2: Обсуждение потребностей',
    3: '3: Торг / Аргументация',
    4: '4: Завершение сделки'
  };

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
      aiEngineBadge.className = 'flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-[11px] text-emerald-300';
      aiEngineDot.className = 'w-2 h-2 rounded-full bg-emerald-400 animate-pulse';
      aiEngineText.textContent = `${engine} (Online)`;
    } else {
      aiEngineBadge.className = 'flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-amber-950/60 border border-amber-500/40 text-[11px] text-amber-300';
      aiEngineDot.className = 'w-2 h-2 rounded-full bg-amber-400';
      aiEngineText.textContent = 'Demo Mode (Mock)';
    }
  }

  // Check health & API Key on load
  fetch('/api/health')
    .then(res => res.json())
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
    .catch(() => {});

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

    try {
      const res = await fetch('/api/config/key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: key })
      });
      const data = await res.json();
      if (res.ok) {
        hasApiKey = true;
        apiKeyStatusMsg.textContent = 'Ключ успешно сохранен в системе!';
        apiKeyStatusMsg.className = 'text-xs text-emerald-400 mb-4 block';
        setTimeout(() => {
          settingsModal.classList.add('hidden');
        }, 1200);
      } else {
        apiKeyStatusMsg.textContent = data.detail || 'Ошибка сохранения';
        apiKeyStatusMsg.className = 'text-xs text-red-400 mb-4 block';
      }
    } catch (err) {
      apiKeyStatusMsg.textContent = 'Ошибка соединения с сервером';
      apiKeyStatusMsg.className = 'text-xs text-red-400 mb-4 block';
    } finally {
      btnSaveKey.disabled = false;
      btnSaveKey.textContent = 'Сохранить ключ';
    }
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
    btnStartGame.innerHTML = `<span class="animate-spin mr-2">⏳</span> Инициализация Spark...`;

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
        bar.className = 'h-2 rounded-full bg-blue-500 transition-colors shadow-sm shadow-blue-500/50';
      } else {
        bar.className = 'h-2 rounded-full bg-slate-700 transition-colors';
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
      moodBadge.className = 'absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-red-950 text-[10px] font-bold text-red-300 border border-red-700 animate-pulse';
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
        moodBadge.className = 'absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-emerald-950 text-[10px] font-semibold text-emerald-300 border border-emerald-700';
      } else {
        avatarEmoji.textContent = pCfg.emojis.normal;
        moodBadge.textContent = 'Сдержан';
        moodBadge.className = 'absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-slate-900 text-[10px] font-semibold text-slate-300 border border-slate-700';
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

      // Update AI Engine badge if returned
      if (data.engine) {
        updateAiEngineBadge(data.engine);
      }

      // Render Spark reply
      if (data.spark_reply) {
        appendChatMessage('spark', data.spark_reply, null, data.hint, data.engine);
      }

      // Update indicators
      updateMetricsAndUI(currentSession.metrics, currentSession.stage);

      // Check if negotiation reached an ending
      if (data.game_over) {
        setTimeout(() => {
          showGameOverBanner(data.ending, data.ending_reason);
        }, 1200);
      }
    } catch (err) {
      appendChatMessage('spark', `⚠️ Произошла ошибка связи: ${err.message}. Проверьте настройки API ключа.`);
    } finally {
      typingIndicator.classList.add('hidden');
      typingIndicator.classList.remove('flex');
      btnSend.disabled = false;
      userInput.focus();
    }
  });

  // Game Over handling
  function showGameOverBanner(ending, reason) {
    const banner = document.createElement('div');
    banner.className = 'my-4 p-4 rounded-2xl border text-center transition-all message-bubble ';

    if (ending === 'deal') {
      banner.className += 'bg-emerald-950/40 border-emerald-500/60 text-emerald-200';
      banner.innerHTML = `
        <div class="font-bold text-base mb-1">🎉 Переговоры успешно завершены: СДЕЛКА!</div>
        <div class="text-xs mb-3 text-slate-300">${reason || 'Условия согласованы'}</div>
        <button id="btnOpenDebrief" class="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition shadow">
          Посмотреть детальный разбор (Debrief)
        </button>
      `;
    } else if (ending === 'fail') {
      banner.className += 'bg-red-950/40 border-red-500/60 text-red-200';
      banner.innerHTML = `
        <div class="font-bold text-base mb-1">🛑 Переговоры сорваны: ПРОВАЛ!</div>
        <div class="text-xs mb-3 text-slate-300">${reason || 'Оппонент вышел из диалога'}</div>
        <button id="btnOpenDebrief" class="px-5 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl transition shadow">
          Посмотреть детальный разбор (Debrief)
        </button>
      `;
    } else {
      banner.className += 'bg-amber-950/40 border-amber-500/60 text-amber-200';
      banner.innerHTML = `
        <div class="font-bold text-base mb-1">⚖️ Переговоры завершены: КОМПРОМИСС</div>
        <div class="text-xs mb-3 text-slate-300">${reason || 'Стороны пошли на взаимные уступки'}</div>
        <button id="btnOpenDebrief" class="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl transition shadow">
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
