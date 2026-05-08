/* Focus IA Chat Widget - Logic */

(function () {
    // --- Constants & Config ---
    const STORAGE_KEY = "focus-ia-conversas";
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

    const INITIAL_MESSAGE = `Olá! Eu sou o Focus IA 💪
Seu assistente inteligente de treino, nutrição e performance da Studio Focus.

Pronto para evoluir seu treino, alimentação e resultados.

**Como posso te ajudar hoje?**`;

    // --- State Management ---
    let state = {
        conversas: [],
        conversa_ativa: null
    };

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

    // --- Storage Logic ---
    function loadFromStorage() {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            state = JSON.parse(saved);
        }
    }

    function saveToStorage() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }

    function createNewConversation() {
        const id = crypto.randomUUID();
        const newConv = {
            id: id,
            titulo: "Nova conversa",
            data: new Date().toISOString(),
            messages: [{ role: "assistant", content: INITIAL_MESSAGE }]
        };

        if (state.conversas.length >= 5) {
            state.conversas.shift(); // Remove oldest
        }

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
            state.conversa_ativa = state.conversas.length > 0 ? state.conversas[state.conversas.length - 1].id : null;
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

        // Hide chips if there's already user activity
        const conv = state.conversas.find(c => c.id === id);
        if (conv.messages.some(m => m.role === "user")) {
            hideChips();
        } else {
            showChips();
        }
    }

    // --- UI Logic ---
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

        // Load jsPDF
        const script = document.createElement('script');
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
        document.head.appendChild(script);
    }

    function setupEventListeners() {
        const launcher = document.getElementById('focus-ia-launcher');
        const closeBtn = document.getElementById('focus-ia-close-btn');
        const historyBtn = document.getElementById('focus-ia-history-btn');
        const backBtn = document.getElementById('focus-ia-back-btn');
        const newBtn = document.getElementById('focus-ia-new-btn');
        const sendBtn = document.getElementById('focus-ia-send');
        const input = document.getElementById('focus-ia-input');
        const chips = document.querySelectorAll('.focus-chip');
        const pdfBtn = document.getElementById('focus-ia-pdf-btn');
        const win = document.getElementById('focus-ia-window');

        launcher.onclick = toggleWindow;
        closeBtn.onclick = toggleWindow;
        historyBtn.onclick = showHistoryPanel;
        backBtn.onclick = hideHistoryPanel;
        newBtn.onclick = () => {
            createNewConversation();
            hideHistoryPanel();
        };

        sendBtn.onclick = sendMessage;
        input.onkeypress = (e) => { if (e.key === 'Enter') sendMessage(); };

        chips.forEach(chip => {
            chip.onclick = () => {
                input.value = chip.innerText;
                sendMessage();
            };
        });

        pdfBtn.onclick = generatePDF;
    }

    function toggleWindow() {
        const win = document.getElementById('focus-ia-window');
        const tooltip = document.getElementById('focus-ia-tooltip');
        win.classList.toggle('active');
        if (win.classList.contains('active')) {
            tooltip.classList.remove('active', 'focus-ia-pulse');
            scrollToBottom();
            document.getElementById('focus-ia-input').focus();
        } else {
            tooltip.classList.add('active', 'focus-ia-pulse');
        }
    }

    function showHistoryPanel() {
        document.getElementById('focus-ia-history-panel').classList.add('active');
        renderHistory();
    }

    function hideHistoryPanel() {
        document.getElementById('focus-ia-history-panel').classList.remove('active');
    }

    function showChips() {
        document.getElementById('focus-ia-chips-container').style.display = 'block';
    }

    function hideChips() {
        document.getElementById('focus-ia-chips-container').style.display = 'none';
    }

    function scrollToBottom() {
        const msgDiv = document.getElementById('focus-ia-messages');
        msgDiv.scrollTop = msgDiv.scrollHeight;
    }

    function renderActiveConversation() {
        const conv = state.conversas.find(c => c.id === state.conversa_ativa);
        const container = document.getElementById('focus-ia-messages');
        container.innerHTML = '';

        if (conv) {
            conv.messages.forEach(msg => {
                addMessageToUI(msg.role, msg.content);
            });
            updatePDFButtonState();
        }
        scrollToBottom();
    }

    function renderHistory() {
        const list = document.getElementById('focus-ia-history-list');
        list.innerHTML = '';

        [...state.conversas].reverse().forEach(conv => {
            const date = new Date(conv.data);
            const formattedDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')} às ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;

            const item = document.createElement('div');
            item.className = `history-item ${conv.id === state.conversa_ativa ? 'active' : ''}`;
            item.onclick = () => setActiveConversation(conv.id);

            item.innerHTML = `
                <div class="history-item-content">
                    <div class="history-item-title">${conv.titulo}</div>
                    <div class="history-item-date">${formattedDate}</div>
                </div>
                <button class="history-delete-btn" title="Excluir">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                </button>
            `;

            const delBtn = item.querySelector('.history-delete-btn');
            delBtn.onclick = (e) => deleteConversation(conv.id, e);

            list.appendChild(item);
        });
    }

    function addMessageToUI(role, content) {
        const container = document.getElementById('focus-ia-messages');
        const msgDiv = document.createElement('div');
        msgDiv.className = `focus-msg ${role === 'user' ? 'user' : 'ia'}`;

        // Basic markdown-like support for bold and line breaks
        let formattedContent = content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n/g, '<br>');

        msgDiv.innerHTML = formattedContent;
        container.appendChild(msgDiv);
    }

    function showTyping() {
        const container = document.getElementById('focus-ia-messages');
        const typingDiv = document.createElement('div');
        typingDiv.id = 'focus-ia-typing';
        typingDiv.className = 'focus-typing';
        typingDiv.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 4px;">
                <span style="font-size: 11px; color: #666; margin-bottom: 2px;">Focus IA está digitando...</span>
                <div style="display: flex; gap: 4px;">
                    <div class="focus-dot"></div><div class="focus-dot"></div><div class="focus-dot"></div>
                </div>
            </div>`;
        container.appendChild(typingDiv);
        scrollToBottom();
    }

    function hideTyping() {
        const typing = document.getElementById('focus-ia-typing');
        if (typing) typing.remove();
    }

    function updatePDFButtonState() {
        const conv = state.conversas.find(c => c.id === state.conversa_ativa);
        const btn = document.getElementById('focus-ia-pdf-btn');
        if (conv && conv.messages.length >= 2) {
            btn.disabled = false;
        } else {
            btn.disabled = true;
        }
    }

    // --- API Logic ---
    async function callGemini(messages) {
        let response;
        if (isLocal) {
            const body = {
                system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
                contents: messages,
                generationConfig: { maxOutputTokens: 2048, temperature: 0.7 }
            };
            response = await fetch(API_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
        } else {
            // Em produção (Vercel Bridge), usamos JSON que é o padrão da Vercel
            response = await fetch(API_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    system_prompt: SYSTEM_PROMPT,
                    messages: messages
                })
            });
        }

        const data = await response.json();
        
        if (data.error) {
            const err = new Error(data.error.message || "Erro na API");
            err.code = data.error.code;
            err.status = data.error.status;
            throw err;
        }

        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
            const parts = data.candidates[0].content.parts;
            const textPart = parts.find(p => p.text);
            if (textPart) return textPart.text;
        }
        
        throw new Error("Resposta inválida da IA");
    }

    async function sendMessage() {
        const input = document.getElementById('focus-ia-input');
        const text = input.value.trim();
        if (!text) return;

        input.value = '';
        input.disabled = true;
        document.getElementById('focus-ia-send').disabled = true;
        hideChips();

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

        try {
            const geminiContents = conv.messages.map(msg => ({
                role: msg.role === "assistant" ? "model" : "user",
                parts: [{ text: msg.content }]
            }));

            let aiMsg;
            try {
                aiMsg = await callGemini(geminiContents);
            } catch (err) {
                console.error("API Error:", err);
                throw err;
            }

            hideTyping();
            conv.messages.push({ role: "assistant", content: aiMsg });
            addMessageToUI('ia', aiMsg);
            saveToStorage();
            updatePDFButtonState();
            scrollToBottom();
        } catch (error) {
            console.error("Final API Error:", error);
            hideTyping();
            let errorText = "Ops, tive um problema de conexão. Tente novamente.";
            if (error.code === 503 || (error.message && error.message.includes("high demand"))) {
                errorText = "O Focus IA está com muita demanda agora. Por favor, tente novamente em alguns instantes.";
            }
            addMessageToUI('ia', errorText);
        } finally {
            input.disabled = false;
            document.getElementById('focus-ia-send').disabled = false;
            input.focus();
        }
    }

    // --- PDF Logic ---
    function generatePDF() {
        const { jsPDF } = window.jspdf;
        if (!jsPDF) return;

        const conv = state.conversas.find(c => c.id === state.conversa_ativa);
        if (!conv) return;

        const doc = new jsPDF();
        const date = new Date();
        const timestamp = `${date.toLocaleDateString('pt-BR')} ${date.toLocaleTimeString('pt-BR')}`;
        const primaryColor = [0, 102, 255]; // #0066FF

        // Header Decoration
        doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
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
        const margin = 20;
        const pageWidth = 210;
        const contentWidth = pageWidth - (margin * 2);

        conv.messages.forEach((msg, index) => {
            // Check for page break before each message block
            if (y > 260) {
                doc.addPage();
                y = 25;
            }

            // Role Header
            doc.setFont("helvetica", "bold");
            doc.setFontSize(11);
            if (msg.role === 'user') {
                doc.setTextColor(0, 0, 0);
                doc.text("VOCÊ", margin, y);
            } else {
                doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
                doc.text("FOCUS IA", margin, y);
            }
            y += 6;

            // Content
            doc.setFont("helvetica", "normal");
            doc.setFontSize(11);
            doc.setTextColor(60, 60, 60);

            // Remove markdown bold for PDF text simplicity
            const cleanText = msg.content.replace(/\*\*(.*?)\*\*/g, '$1');
            const splitText = doc.splitTextToSize(cleanText, contentWidth);

            doc.text(splitText, margin, y);
            y += (splitText.length * 6) + 12;

            // Subtle separator line
            if (index < conv.messages.length - 1 && y < 270) {
                doc.setDrawColor(240, 240, 240);
                doc.line(margin, y - 6, pageWidth - margin, y - 6);
            }
        });

        // Footer on all pages
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(9);
            doc.setTextColor(150);
            doc.text(`Página ${i} de ${pageCount}`, pageWidth / 2, 288, { align: 'center' });
            doc.text("studiofocus.app.br", margin, 288);
        }

        const fileName = `conversa-focus-ia-${date.toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);
    }

    // Start
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            init();
            startTooltipCycle();
            setupViewportHandling();
        });
    } else {
        init();
        startTooltipCycle();
        setupViewportHandling();
    }

    function setupViewportHandling() {
        if (!window.visualViewport || window.innerWidth > 480) return;

        const win = document.getElementById('focus-ia-window');
        if (!win) return;

        const handleViewportChange = () => {
            if (!win.classList.contains('active')) return;
            const vp = window.visualViewport;
            win.style.top = vp.offsetTop + 'px';
            win.style.height = vp.height + 'px';
            setTimeout(scrollToBottom, 50);
        };

        window.visualViewport.addEventListener('resize', handleViewportChange);
        window.visualViewport.addEventListener('scroll', handleViewportChange);
    }

    function startTooltipCycle() {
        const tooltip = document.getElementById('focus-ia-tooltip');
        if (!tooltip) return;

        setTimeout(() => {
            if (!document.getElementById('focus-ia-window').classList.contains('active')) {
                tooltip.classList.add('active', 'focus-ia-pulse');
            }
        }, 2000);
    }
})();
