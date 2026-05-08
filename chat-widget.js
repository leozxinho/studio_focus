/* Focus IA Chat Widget - Logic */

(function () {
    // --- Constants & Config ---
    const STORAGE_KEY = "focus-ia-conversas";
    const CACHE_KEY   = "focus-ia-cache";
    const SOUND_KEY   = "focus-ia-sound";
    const isLocal = location.hostname === "localhost" || location.hostname === "127.0.0.1";
    const API_ENDPOINT = isLocal
        ? `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key=AIzaSyDp4jIYu82PEZe9ZOOKbp4HUpAzSG3XLcM`
        : "https://studiofocus.app.br/api/chat";
    const SYSTEM_PROMPT = `Você é o Focus IA, assistente virtual da academia Studio Focus em Garça, SP.
Responda APENAS perguntas sobre treino, musculação, nutrição esportiva, emagrecimento, ganho de massa e saúde física.
Seja direto e motivador como um personal trainer experiente.
Use linguagem simples e acessível, com respostas objetivas.
Para perguntas fora desse tema, diga gentilmente que só pode ajudar com assuntos de academia, treino e saúde.
Quando fizer sentido, mencione que o aluno pode agendar uma aula grátis no Studio Focus pelo WhatsApp: https://wa.me/5514982180923`;

    function getInitialMessage() {
        const h = new Date().getHours();
        const saudacao = h >= 5 && h < 12 ? 'Bom dia' : h >= 12 && h < 18 ? 'Boa tarde' : 'Boa noite';
        return `${saudacao}! Eu sou o Focus IA 💪\nSeu assistente inteligente de treino, nutrição e performance da Studio Focus.\n\nPronto para evoluir seu treino, alimentação e resultados.\n\n**Como posso te ajudar hoje?**`;
    }

    // --- State ---
    let state = { conversas: [], conversa_ativa: null };
    let isTyping      = false;
    let soundEnabled  = localStorage.getItem(SOUND_KEY) !== 'false';
    let lastUserMessage = null;
    let audioCtx      = null;

    // --- Audio ---
    function getAudioCtx() {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        return audioCtx;
    }

    function playSound(type) {
        if (!soundEnabled) return;
        try {
            const ctx  = getAudioCtx();
            const osc  = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'sine';
            if (type === 'send') {
                osc.frequency.value = 880;
                gain.gain.setValueAtTime(0.07, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.12);
            } else if (type === 'receive') {
                osc.frequency.value = 660;
                gain.gain.setValueAtTime(0.07, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.2);
            }
        } catch (e) {}
    }

    // --- Cache ---
    function getCache() {
        try { return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}'); } catch { return {}; }
    }
    function setCache(question, answer) {
        const cache = getCache();
        const keys  = Object.keys(cache);
        if (keys.length >= 50) delete cache[keys[0]];
        cache[question.toLowerCase().trim()] = answer;
        localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    }
    function checkCache(question) {
        return getCache()[question.toLowerCase().trim()] || null;
    }

    // --- Initialization ---
    function init() {
        loadFromStorage();
        injectHTML();
        setupEventListeners();
        if (!state.conversa_ativa || state.conversas.length === 0) {
            createNewConversation();
        } else {
            renderActiveConversation();
        }
        renderHistory();
    }

    // --- Storage ---
    function loadFromStorage() {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) state = JSON.parse(saved);
    }
    function saveToStorage() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }

    // --- Conversation Management ---
    function createNewConversation() {
        const id = crypto.randomUUID();
        const newConv = {
            id,
            titulo: "Nova conversa",
            data: new Date().toISOString(),
            messages: [{ role: "assistant", content: getInitialMessage() }]
        };
        if (state.conversas.length >= 5) state.conversas.shift();
        state.conversas.push(newConv);
        state.conversa_ativa = id;
        saveToStorage();
        renderActiveConversation();
        renderHistory();
        showChips();
    }

    function deleteConversation(id, event) {
        if (event) event.stopPropagation();
        state.conversas = state.conversas.filter(c => c.id !== id);
        if (state.conversa_ativa === id) {
            state.conversa_ativa = state.conversas.length > 0
                ? state.conversas[state.conversas.length - 1].id
                : null;
        }
        if (!state.conversa_ativa) {
            createNewConversation();
        } else {
            saveToStorage();
            renderActiveConversation();
            renderHistory();
        }
    }

    function setActiveConversation(id) {
        state.conversa_ativa = id;
        saveToStorage();
        renderActiveConversation();
        renderHistory();
        hideHistoryPanel();
        const conv = state.conversas.find(c => c.id === id);
        if (conv.messages.some(m => m.role === "user")) hideChips();
        else showChips();
    }

    // --- HTML Injection ---
    function injectHTML() {
        const container = document.createElement('div');
        container.id = 'focus-ia-container';
        container.innerHTML = `
            <div id="focus-ia-window">
                <div class="focus-ia-header">
                    <div class="focus-ia-header-info">
                        <div class="focus-ia-status-dot"></div>
                        <span class="focus-ia-header-title">Focus IA</span>
                    </div>
                    <div class="focus-ia-header-actions">
                        <button class="focus-ia-header-btn" id="focus-ia-sound-btn" title="Som ativado">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
                        </button>
                        <button class="focus-ia-header-btn" id="focus-ia-new-btn" title="Nova Conversa">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </button>
                        <button class="focus-ia-header-btn" id="focus-ia-history-btn" title="Histórico">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        </button>
                        <button class="focus-ia-header-btn" id="focus-ia-close-btn">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                    </div>
                </div>

                <div id="focus-ia-history-panel">
                    <div class="history-header">
                        <button class="focus-ia-header-btn" id="focus-ia-back-btn" style="color: #333">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                        </button>
                        <span style="font-weight: 600">Histórico de Conversas</span>
                    </div>
                    <div class="history-list" id="focus-ia-history-list"></div>
                    <div style="padding: 15px; border-top: 1px solid #eee; font-size: 11px; color: #888; text-align: center;">
                        Conversas salvas neste dispositivo · Máx. 5
                    </div>
                </div>

                <div id="focus-ia-messages"></div>

                <button id="focus-ia-scroll-btn">↓ Ir para o fim</button>

                <div id="focus-ia-chips-container" style="padding: 0 20px;">
                    <div id="focus-ia-chips">
                        <div class="focus-chip">Como ganhar massa muscular?</div>
                        <div class="focus-chip">Dieta para emagrecer</div>
                        <div class="focus-chip">Treino para iniciantes</div>
                        <div class="focus-chip">Quantas proteínas devo comer?</div>
                    </div>
                </div>

                <div class="focus-ia-footer">
                    <button id="focus-ia-pdf-btn" class="focus-ia-pdf-btn" disabled>Baixar PDF da conversa</button>
                    <div class="focus-ia-input-container">
                        <input type="text" id="focus-ia-input" placeholder="Digite sua mensagem...">
                        <button id="focus-ia-send">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                        </button>
                    </div>
                    <div class="focus-ia-disclaimer">Conversas salvas localmente · Máx 5</div>
                </div>
            </div>

            <button id="focus-ia-launcher">
                <div id="focus-ia-tooltip">Fale com a Focus IA</div>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
            </button>
        `;
        document.body.appendChild(container);

        if (!soundEnabled) document.getElementById('focus-ia-sound-btn').classList.add('muted');

        const script = document.createElement('script');
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
        document.head.appendChild(script);
    }

    function setupEventListeners() {
        document.getElementById('focus-ia-launcher').onclick    = toggleWindow;
        document.getElementById('focus-ia-close-btn').onclick   = toggleWindow;
        document.getElementById('focus-ia-history-btn').onclick = showHistoryPanel;
        document.getElementById('focus-ia-back-btn').onclick    = hideHistoryPanel;
        document.getElementById('focus-ia-new-btn').onclick     = () => { createNewConversation(); hideHistoryPanel(); };
        document.getElementById('focus-ia-send').onclick        = sendMessage;
        document.getElementById('focus-ia-pdf-btn').onclick     = generatePDF;
        document.getElementById('focus-ia-sound-btn').onclick   = toggleSound;
        document.getElementById('focus-ia-scroll-btn').onclick  = scrollToBottom;

        const input = document.getElementById('focus-ia-input');
        input.onkeypress = (e) => { if (e.key === 'Enter') sendMessage(); };

        document.querySelectorAll('.focus-chip').forEach(chip => {
            chip.onclick = () => { input.value = chip.innerText; sendMessage(); };
        });

        document.getElementById('focus-ia-messages').addEventListener('scroll', updateScrollBtn);
    }

    // --- Window Toggle ---
    function toggleWindow() {
        const win     = document.getElementById('focus-ia-window');
        const tooltip = document.getElementById('focus-ia-tooltip');
        win.classList.toggle('active');
        if (win.classList.contains('active')) {
            document.body.style.overflow = 'hidden';
            tooltip.classList.remove('active', 'focus-ia-pulse');
            scrollToBottom();
            document.getElementById('focus-ia-input').focus();
        } else {
            document.body.style.overflow = '';
            setTimeout(flashTooltip, 1000);
        }
    }

    function toggleSound() {
        soundEnabled = !soundEnabled;
        localStorage.setItem(SOUND_KEY, soundEnabled);
        const btn = document.getElementById('focus-ia-sound-btn');
        btn.classList.toggle('muted', !soundEnabled);
        btn.title = soundEnabled ? 'Som ativado' : 'Som desativado';
    }

    function showHistoryPanel() {
        document.getElementById('focus-ia-history-panel').classList.add('active');
        renderHistory();
    }
    function hideHistoryPanel() {
        document.getElementById('focus-ia-history-panel').classList.remove('active');
    }

    function showChips() { document.getElementById('focus-ia-chips-container').style.display = 'block'; }
    function hideChips() { document.getElementById('focus-ia-chips-container').style.display = 'none'; }

    function scrollToBottom() {
        const msgDiv = document.getElementById('focus-ia-messages');
        msgDiv.scrollTop = msgDiv.scrollHeight;
        updateScrollBtn();
    }

    function updateScrollBtn() {
        const msgs = document.getElementById('focus-ia-messages');
        const btn  = document.getElementById('focus-ia-scroll-btn');
        if (!btn) return;
        const nearBottom = msgs.scrollHeight - msgs.scrollTop - msgs.clientHeight < 80;
        btn.classList.toggle('visible', !nearBottom);
    }

    function setConnectionStatus(status) {
        const dot = document.querySelector('.focus-ia-status-dot');
        if (!dot) return;
        dot.classList.remove('slow', 'offline');
        if (status !== 'online') dot.classList.add(status);
    }

    // --- Render ---
    function renderActiveConversation() {
        const conv      = state.conversas.find(c => c.id === state.conversa_ativa);
        const container = document.getElementById('focus-ia-messages');
        container.innerHTML = '';
        if (conv) {
            conv.messages.forEach(msg => addMessageToUI(msg.role, msg.content));
            updatePDFButtonState();
        }
        scrollToBottom();
    }

    function renderHistory() {
        const list = document.getElementById('focus-ia-history-list');
        list.innerHTML = '';
        const comInteracao = state.conversas.filter(c => c.messages.some(m => m.role === 'user'));
        [...comInteracao].reverse().forEach(conv => {
            const date = new Date(conv.data);
            const fmt  = `${date.getDate().toString().padStart(2,'0')}/${(date.getMonth()+1).toString().padStart(2,'0')} às ${date.getHours().toString().padStart(2,'0')}:${date.getMinutes().toString().padStart(2,'0')}`;
            const item = document.createElement('div');
            item.className = `history-item ${conv.id === state.conversa_ativa ? 'active' : ''}`;
            item.onclick   = () => setActiveConversation(conv.id);
            item.innerHTML = `
                <div class="history-item-content">
                    <div class="history-item-title">${conv.titulo}</div>
                    <div class="history-item-date">${fmt}</div>
                </div>
                <button class="history-delete-btn" title="Excluir">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                </button>`;
            item.querySelector('.history-delete-btn').onclick = (e) => deleteConversation(conv.id, e);
            list.appendChild(item);
        });
    }

    // --- Formatting ---
    function formatInline(text) {
        return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    }

    function formatContent(content) {
        const lines = content.split('\n');
        let html  = '';
        let inUl  = false;
        let inOl  = false;

        for (const line of lines) {
            const ulMatch = line.match(/^[\s]*[-*•]\s+(.+)$/);
            const olMatch = line.match(/^[\s]*\d+[.)]\s+(.+)$/);

            if (ulMatch) {
                if (inOl) { html += '</ol>'; inOl = false; }
                if (!inUl) { html += '<ul>'; inUl = true; }
                html += `<li>${formatInline(ulMatch[1])}</li>`;
            } else if (olMatch) {
                if (inUl) { html += '</ul>'; inUl = false; }
                if (!inOl) { html += '<ol>'; inOl = true; }
                html += `<li>${formatInline(olMatch[1])}</li>`;
            } else {
                if (inUl) { html += '</ul>'; inUl = false; }
                if (inOl) { html += '</ol>'; inOl = false; }
                const trimmed = line.trim();
                html += trimmed === '' ? '<br>' : formatInline(trimmed) + '<br>';
            }
        }

        if (inUl) html += '</ul>';
        if (inOl) html += '</ol>';
        return html.replace(/<br>$/, '').replace(/(<\/(?:ul|ol)>)<br>/g, '$1');
    }

    // --- Message UI ---
    function addCopyButton(msgDiv, rawContent) {
        const btn = document.createElement('button');
        btn.className = 'focus-msg-copy';
        const iconCopy  = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;
        const iconCheck = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
        btn.innerHTML = `${iconCopy} Copiar`;
        btn.onclick = () => {
            navigator.clipboard.writeText(rawContent).then(() => {
                btn.classList.add('copied');
                btn.innerHTML = `${iconCheck} Copiado!`;
                setTimeout(() => {
                    btn.classList.remove('copied');
                    btn.innerHTML = `${iconCopy} Copiar`;
                }, 2000);
            }).catch(() => {});
        };
        msgDiv.appendChild(btn);
    }

    function addMessageToUI(role, content) {
        const container = document.getElementById('focus-ia-messages');
        const msgDiv    = document.createElement('div');
        msgDiv.className = `focus-msg ${role === 'user' ? 'user' : 'ia'}`;
        msgDiv.innerHTML = formatContent(content);
        if (role !== 'user') addCopyButton(msgDiv, content);
        container.appendChild(msgDiv);
    }

    function setSendAsStop(active) {
        const btn = document.getElementById('focus-ia-send');
        if (active) {
            btn.classList.add('stop-mode');
            btn.innerHTML  = `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>`;
            btn.onclick    = stopTyping;
            btn.disabled   = false;
        } else {
            btn.classList.remove('stop-mode');
            btn.innerHTML  = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>`;
            btn.onclick    = sendMessage;
            btn.disabled   = false;
        }
    }

    function stopTyping() { isTyping = false; }

    function typeMessageToUI(content, onComplete) {
        const container = document.getElementById('focus-ia-messages');
        const msgDiv    = document.createElement('div');
        msgDiv.className = 'focus-msg ia';
        container.appendChild(msgDiv);

        const html = formatContent(content);
        let i = 0, displayed = '';
        isTyping = true;
        setSendAsStop(true);

        function step() {
            if (!isTyping || i >= html.length) {
                msgDiv.innerHTML = html;
                addCopyButton(msgDiv, content);
                isTyping = false;
                setSendAsStop(false);
                if (onComplete) onComplete();
                return;
            }
            if (html[i] === '<') {
                const end = html.indexOf('>', i);
                if (end !== -1) {
                    displayed += html.slice(i, end + 1);
                    i = end + 1;
                    msgDiv.innerHTML = displayed;
                    step();
                    return;
                }
            }
            displayed += html[i++];
            msgDiv.innerHTML = displayed;
            scrollToBottom();
            setTimeout(step, 18);
        }

        step();
    }

    function showTyping() {
        const container = document.getElementById('focus-ia-messages');
        const typingDiv = document.createElement('div');
        typingDiv.id        = 'focus-ia-typing';
        typingDiv.className = 'focus-typing';
        typingDiv.innerHTML = `
            <div style="display:flex;flex-direction:column;gap:4px;">
                <span style="font-size:11px;color:#666;margin-bottom:2px;">Focus IA está digitando...</span>
                <div style="display:flex;gap:4px;">
                    <div class="focus-dot"></div><div class="focus-dot"></div><div class="focus-dot"></div>
                </div>
            </div>`;
        container.appendChild(typingDiv);
        scrollToBottom();
    }

    function hideTyping() {
        const t = document.getElementById('focus-ia-typing');
        if (t) t.remove();
    }

    function updatePDFButtonState() {
        const conv = state.conversas.find(c => c.id === state.conversa_ativa);
        document.getElementById('focus-ia-pdf-btn').disabled = !(conv && conv.messages.length >= 2);
    }

    function showErrorWithRetry(message, onRetry) {
        const container = document.getElementById('focus-ia-messages');
        const errDiv    = document.createElement('div');
        errDiv.className = 'focus-msg ia';
        errDiv.innerHTML = `${message}<br><button class="focus-retry-btn">↩ Tentar novamente</button>`;
        errDiv.querySelector('.focus-retry-btn').onclick = () => { errDiv.remove(); onRetry(); };
        container.appendChild(errDiv);
        scrollToBottom();
    }

    // --- API Logic ---
    async function callGemini(messages) {
        let response;
        if (isLocal) {
            response = await fetch(API_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
                    contents: messages,
                    generationConfig: { maxOutputTokens: 2048, temperature: 0.7 }
                })
            });
        } else {
            response = await fetch(API_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ system_prompt: SYSTEM_PROMPT, messages })
            });
        }

        const data = await response.json();
        if (data.error) {
            const err   = new Error(data.error.message || "Erro na API");
            err.code    = data.error.code;
            err.status  = data.error.status;
            throw err;
        }
        if (data.candidates?.[0]?.content) {
            const textPart = data.candidates[0].content.parts.find(p => p.text);
            if (textPart) return textPart.text;
        }
        throw new Error("Resposta inválida da IA");
    }

    async function retryLastMessage() {
        const input = document.getElementById('focus-ia-input');
        input.disabled = true;
        const conv = state.conversas.find(c => c.id === state.conversa_ativa);
        showTyping();
        try {
            const geminiContents = conv.messages.map(msg => ({
                role: msg.role === "assistant" ? "model" : "user",
                parts: [{ text: msg.content }]
            }));
            const aiMsg = await callGemini(geminiContents);
            if (lastUserMessage) setCache(lastUserMessage, aiMsg);
            hideTyping();
            conv.messages.push({ role: "assistant", content: aiMsg });
            saveToStorage();
            updatePDFButtonState();
            setConnectionStatus('online');
            typeMessageToUI(aiMsg, () => { playSound('receive'); scrollToBottom(); });
        } catch (error) {
            hideTyping();
            setConnectionStatus('offline');
            setTimeout(() => setConnectionStatus('online'), 8000);
            const msg = error.code === 503
                ? "Serviço sobrecarregado. Aguarde um momento."
                : "Ainda sem conexão. Tente mais tarde.";
            showErrorWithRetry(msg, retryLastMessage);
        } finally {
            input.disabled = false;
            input.focus();
        }
    }

    async function sendMessage() {
        if (isTyping) return;
        const input = document.getElementById('focus-ia-input');
        const text  = input.value.trim();
        if (!text) return;

        input.value = '';
        input.disabled = true;
        document.getElementById('focus-ia-send').disabled = true;
        hideChips();
        lastUserMessage = text;
        playSound('send');

        const conv = state.conversas.find(c => c.id === state.conversa_ativa);
        if (conv.messages.length === 1 && conv.messages[0].role === 'assistant') {
            conv.titulo = text.substring(0, 40);
        }

        conv.messages.push({ role: "user", content: text });
        addMessageToUI('user', text);
        saveToStorage();
        updatePDFButtonState();
        scrollToBottom();
        showTyping();

        // Cache hit
        const cached = checkCache(text);
        if (cached) {
            hideTyping();
            conv.messages.push({ role: "assistant", content: cached });
            saveToStorage();
            updatePDFButtonState();
            input.disabled = false;
            input.focus();
            typeMessageToUI(cached, () => { playSound('receive'); scrollToBottom(); });
            return;
        }

        const startTime = Date.now();
        try {
            const geminiContents = conv.messages.map(msg => ({
                role: msg.role === "assistant" ? "model" : "user",
                parts: [{ text: msg.content }]
            }));
            const aiMsg   = await callGemini(geminiContents);
            const elapsed = Date.now() - startTime;
            setConnectionStatus(elapsed > 4000 ? 'slow' : 'online');
            setCache(text, aiMsg);
            hideTyping();
            conv.messages.push({ role: "assistant", content: aiMsg });
            saveToStorage();
            updatePDFButtonState();
            typeMessageToUI(aiMsg, () => { playSound('receive'); scrollToBottom(); });
        } catch (error) {
            console.error("API Error:", error);
            hideTyping();
            setConnectionStatus('offline');
            setTimeout(() => setConnectionStatus('online'), 8000);
            const msg = (error.code === 503 || (error.message && error.message.includes("high demand")))
                ? "O Focus IA está com muita demanda agora."
                : "Ops, tive um problema de conexão.";
            showErrorWithRetry(msg, retryLastMessage);
        } finally {
            input.disabled = false;
            if (!isTyping) document.getElementById('focus-ia-send').disabled = false;
            input.focus();
        }
    }

    // --- PDF Logic ---
    function generatePDF() {
        const { jsPDF } = window.jspdf;
        if (!jsPDF) return;
        const conv = state.conversas.find(c => c.id === state.conversa_ativa);
        if (!conv) return;

        const doc          = new jsPDF();
        const date         = new Date();
        const timestamp    = `${date.toLocaleDateString('pt-BR')} ${date.toLocaleTimeString('pt-BR')}`;
        const primaryColor = [0, 102, 255];

        doc.setFillColor(...primaryColor);
        doc.rect(0, 0, 210, 40, 'F');
        doc.setFont("helvetica", "bold");
        doc.setFontSize(22);
        doc.setTextColor(255, 255, 255);
        doc.text("Studio Focus", 20, 20);
        doc.setFontSize(14);
        doc.text("Relatório Focus IA", 20, 30);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text(timestamp, 190, 30, { align: 'right' });

        let y = 55;
        const margin       = 20;
        const pageWidth    = 210;
        const contentWidth = pageWidth - (margin * 2);

        conv.messages.forEach((msg, index) => {
            if (y > 260) { doc.addPage(); y = 25; }
            doc.setFont("helvetica", "bold");
            doc.setFontSize(11);
            if (msg.role === 'user') {
                doc.setTextColor(0, 0, 0);
                doc.text("VOCÊ", margin, y);
            } else {
                doc.setTextColor(...primaryColor);
                doc.text("FOCUS IA", margin, y);
            }
            y += 6;
            doc.setFont("helvetica", "normal");
            doc.setFontSize(11);
            doc.setTextColor(60, 60, 60);
            const cleanText = msg.content
                .replace(/\*\*(.*?)\*\*/g, '$1')
                .replace(/^[-*]\s+/gm, '• ');
            const splitText = doc.splitTextToSize(cleanText, contentWidth);
            doc.text(splitText, margin, y);
            y += (splitText.length * 6) + 12;
            if (index < conv.messages.length - 1 && y < 270) {
                doc.setDrawColor(240, 240, 240);
                doc.line(margin, y - 6, pageWidth - margin, y - 6);
            }
        });

        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(9);
            doc.setTextColor(150);
            doc.text(`Página ${i} de ${pageCount}`, pageWidth / 2, 288, { align: 'center' });
            doc.text("studiofocus.app.br", margin, 288);
        }

        doc.save(`conversa-focus-ia-${date.toISOString().split('T')[0]}.pdf`);
    }

    // --- Startup ---
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => { init(); startTooltipCycle(); setupViewportHandling(); });
    } else {
        init(); startTooltipCycle(); setupViewportHandling();
    }

    function setupViewportHandling() {
        if (!window.visualViewport || window.innerWidth > 480) return;
        const win = document.getElementById('focus-ia-window');
        if (!win) return;
        const handleViewportChange = () => {
            if (!win.classList.contains('active')) return;
            const vp = window.visualViewport;
            win.style.top    = vp.offsetTop + 'px';
            win.style.height = vp.height + 'px';
            setTimeout(scrollToBottom, 50);
        };
        window.visualViewport.addEventListener('resize', handleViewportChange);
        window.visualViewport.addEventListener('scroll', handleViewportChange);
    }

    function flashTooltip() {
        const tooltip = document.getElementById('focus-ia-tooltip');
        if (!tooltip) return;
        if (document.getElementById('focus-ia-window').classList.contains('active')) return;
        tooltip.classList.add('active', 'focus-ia-pulse');
        setTimeout(() => tooltip.classList.remove('active', 'focus-ia-pulse'), 3000);
    }

    function startTooltipCycle() {
        setTimeout(flashTooltip, 2000);
        setInterval(flashTooltip, 20000);
    }
})();
