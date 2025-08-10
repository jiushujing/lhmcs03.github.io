document.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('phone-container')) return;

    // --- CONFIGURE LIBRARIES ---
    marked.setOptions({ breaks: true, gfm: true });

    // --- DOM ELEMENTS ---
    const dom = {
        // Screens
        homeScreen: document.getElementById('home-screen'),
        characterDetailScreen: document.getElementById('character-detail-screen'),
        characterEditScreen: document.getElementById('character-edit-screen'),
        chatScreen: document.getElementById('chat-screen'),
        apiSettingsScreen: document.getElementById('api-settings-screen'),
        // Home Screen
        characterList: document.getElementById('character-list'),
        addCharacterBtn: document.getElementById('add-character-btn'),
        // Character Detail
        detailAvatar: document.getElementById('detail-avatar'),
        detailName: document.getElementById('detail-name'),
        detailSubtitle: document.getElementById('detail-subtitle'),
        detailNameHeader: document.getElementById('detail-name-header'),
        goToChatBtn: document.getElementById('go-to-chat-btn'),
        goToEditBtn: document.getElementById('go-to-edit-btn'),
        // Character Edit
        characterEditForm: document.getElementById('character-edit-form'),
        editCharAvatar: document.getElementById('edit-char-avatar'),
        editCharAvatarUpload: document.getElementById('edit-char-avatar-upload'),
        editCharName: document.getElementById('edit-char-name'),
        editCharSubtitle: document.getElementById('edit-char-subtitle'),
        editCharSetting: document.getElementById('edit-char-setting'),
        deleteCharacterBtn: document.getElementById('delete-character-btn'),
        // Chat Screen
        chatHeaderTitle: document.getElementById('chat-header-title'),
        chatHistory: document.getElementById('chat-history'),
        chatForm: document.getElementById('chat-form'),
        chatInput: document.getElementById('chat-input'),
        sendButton: document.getElementById('send-button'),
        // API Settings (from Gen-1)
        apiUrlInput: document.getElementById('api-url'),
        apiKeyInput: document.getElementById('api-key'),
        modelSelect: document.getElementById('model-select'),
        fetchModelsButton: document.getElementById('fetch-models-button'),
        saveSettingsBtn: document.getElementById('save-settings-btn'),
        btnOpenAI: document.getElementById('btn-openai'),
        btnGemini: document.getElementById('btn-gemini'),
        openaiModelsGroup: document.getElementById('openai-models'),
        geminiModelsGroup: document.getElementById('gemini-models'),
        // FAB
        fabWrapper: document.getElementById('fab-wrapper'),
        fabToggleBtn: document.getElementById('fab-toggle-btn'),
        fabPanelContainer: document.getElementById('fab-panel-container'),
    };

    // --- STATE MANAGEMENT ---
    let characters = [];
    let apiSettings = {};
    let activeCharacterId = null;
    let screenHistory = ['home'];
    let isSending = false;
    let currentApiType = 'openai';

    const CHARACTERS_KEY = 'aiChatCharacters_v3';
    const API_SETTINGS_KEY = 'aiChatApiSettings_v3';
    const FAB_POSITION_KEY = 'aiChatFabPosition_v3';

    const defaultModels = {
        openai: { "gpt-3.5-turbo": "GPT-3.5-Turbo" },
        gemini: { "gemini-pro": "Gemini Pro" }
    };

    // --- DATA & PERSISTENCE ---
    const saveCharacters = () => localStorage.setItem(CHARACTERS_KEY, JSON.stringify(characters));
    const loadCharacters = () => {
        const saved = localStorage.getItem(CHARACTERS_KEY);
        if (saved) {
            characters = JSON.parse(saved);
        } else {
            characters = [{ id: Date.now(), name: '助手小C', subtitle: '乐于助人的AI助手', setting: '你是一个由程序员小C创建的、乐于助人的AI助手。', avatar: '', history: [] }];
            saveCharacters();
        }
    };
    const saveApiSettings = () => {
        let settings = JSON.parse(localStorage.getItem(API_SETTINGS_KEY) || '{}');
        settings.apiType = currentApiType;
        settings.model = dom.modelSelect.value;
        if (currentApiType === 'gemini') {
            settings.geminiApiKey = dom.apiKeyInput.value.trim();
        } else {
            settings.openaiApiUrl = dom.apiUrlInput.value.trim();
            settings.openaiApiKey = dom.apiKeyInput.value.trim();
        }
        localStorage.setItem(API_SETTINGS_KEY, JSON.stringify(settings));
        apiSettings = settings; // Update in-memory state
        alert('API设定已保存！');
        goBack();
    };
    const loadApiSettings = () => {
        apiSettings = JSON.parse(localStorage.getItem(API_SETTINGS_KEY) || '{}');
    };
    const checkApiSettings = () => {
        const { apiType, model } = apiSettings;
        const apiKey = apiType === 'gemini' ? apiSettings.geminiApiKey : apiSettings.openaiApiKey;
        const apiUrl = apiType === 'openai' ? apiSettings.openaiApiUrl : '';
        if (!model || !apiKey || (apiType === 'openai' && !apiUrl)) {
            alert('请先在API设定中完成配置！');
            showScreen('apiSettings');
            return false;
        }
        return true;
    };


    // --- NAVIGATION ---
    const showScreen = (screenName, contextId = null) => {
        if (!screenName) return;
        const currentScreen = screenHistory[screenHistory.length - 1];
        if (screenName !== currentScreen) screenHistory.push(screenName);
        if (screenHistory.length > 10) screenHistory.shift();

        document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
        const screenMap = { home: dom.homeScreen, characterDetail: dom.characterDetailScreen, characterEdit: dom.characterEditScreen, chat: dom.chatScreen, apiSettings: dom.apiSettingsScreen };
        const targetScreen = Object.values(screenMap).find(s => s.id.startsWith(screenName));
        if (targetScreen) targetScreen.classList.remove('hidden');

        activeCharacterId = contextId || activeCharacterId;
        if (activeCharacterId) sessionStorage.setItem('activeCharacterId', activeCharacterId);

        // Screen-specific rendering logic
        switch (screenName) {
            case 'home': renderCharacterList(); break;
            case 'characterDetail': renderCharacterDetail(); break;
            case 'characterEdit': renderCharacterEdit(); break;
            case 'chat': renderChatScreen(); break;
            case 'apiSettings': initializeApiForm(); break;
        }
    };

    const goBack = () => {
        if (screenHistory.length > 1) {
            screenHistory.pop();
            const previousScreenName = screenHistory[screenHistory.length - 1];
            // Re-run showScreen to ensure correct rendering logic is triggered
            showScreen(previousScreenName);
            // We pushed it again, so pop it to correct history
            screenHistory.pop();
        }
    };

    // --- UI RENDERING ---
    const renderCharacterList = () => {
        dom.characterList.innerHTML = '';
        characters.forEach(char => {
            const item = document.createElement('div');
            item.className = 'character-card';
            item.innerHTML = `<img src="${char.avatar || 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'}" alt="Avatar"><div class="character-info"><div class="name">${char.name}</div><div class="subtitle">${char.subtitle || ''}</div></div>`;
            item.addEventListener('click', () => showScreen('characterDetail', char.id));
            dom.characterList.appendChild(item);
        });
    };

    const renderCharacterDetail = () => {
        const char = characters.find(c => c.id === activeCharacterId);
        if (!char) { goBack(); return; }
        dom.detailAvatar.src = char.avatar || 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
        dom.detailName.textContent = char.name;
        dom.detailNameHeader.textContent = char.name;
        dom.detailSubtitle.textContent = char.subtitle;
    };
    
    const renderCharacterEdit = () => {
        const char = characters.find(c => c.id === activeCharacterId);
        if (!char) { goBack(); return; }
        dom.editCharAvatar.src = char.avatar || 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
        dom.editCharName.value = char.name;
        dom.editCharSubtitle.value = char.subtitle;
        dom.editCharSetting.value = char.setting;
    };

    const renderChatScreen = () => {
        const char = characters.find(c => c.id === activeCharacterId);
        if (!char) { goBack(); return; }
        dom.chatHeaderTitle.textContent = `与 ${char.name} 聊天`;
        dom.chatHistory.innerHTML = '';
        char.history.forEach(msg => addMessageToUI(msg.role, msg.content, char.avatar));
        dom.chatHistory.scrollTop = dom.chatHistory.scrollHeight;
    };

    const addMessageToUI = (role, text, avatarUrl) => {
        const isUser = role === 'user';
        const messageWrapper = document.createElement('div');
        messageWrapper.className = `message ${isUser ? 'user-message' : 'ai-message'}`;
        
        const avatar = document.createElement('img');
        avatar.className = 'avatar';
        avatar.src = isUser ? '' : (avatarUrl || 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7');
        
        const content = document.createElement('div');
        content.className = 'content';

        if (text === '...thinking...') {
             content.innerHTML = '<div class="typing-indicator"><span></span><span></span><span></span></div>';
        } else {
            content.innerHTML = marked.parse(text);
        }

        messageWrapper.appendChild(avatar);
        messageWrapper.appendChild(content);
        dom.chatHistory.appendChild(messageWrapper);
        dom.chatHistory.scrollTop = dom.chatHistory.scrollHeight;
        
        if (!isUser) {
            content.querySelectorAll('pre code').forEach(block => hljs.highlightElement(block));
            addCopyButtons(content);
        }
        return content;
    };

    // --- CHAT & API LOGIC (Fused from Gen-1) ---

    const addCopyButtons = (targetElement) => {
        targetElement.querySelectorAll('pre').forEach(block => {
            if (block.querySelector('.copy-btn')) return;
            const button = document.createElement('button');
            button.className = 'copy-btn';
            button.title = '复制';
            button.innerHTML = '<i class="far fa-copy"></i>';
            button.addEventListener('click', () => {
                const code = block.querySelector('code').innerText;
                navigator.clipboard.writeText(code).then(() => {
                    button.innerHTML = '<i class="fas fa-check"></i>';
                    setTimeout(() => { button.innerHTML = '<i class="far fa-copy"></i>'; }, 2000);
                });
            });
            block.appendChild(button);
        });
    };

    const handleSendMessage = async () => {
        const userInput = dom.chatInput.value.trim();
        if (!userInput || isSending) return;
        if (!checkApiSettings()) return;

        const character = characters.find(c => c.id === activeCharacterId);
        if (!character) return;

        isSending = true;
        dom.sendButton.disabled = true;
        dom.chatInput.value = '';

        addMessageToUI('user', userInput, '');
        character.history.push({ role: 'user', content: userInput });

        const thinkingMessageContent = addMessageToUI('assistant', '...thinking...', character.avatar);

        try {
            await callApi(thinkingMessageContent, character);
        } catch (error) {
            console.error('API Call Error:', error);
            thinkingMessageContent.innerHTML = `<p>出错了: ${error.message}</p>`;
        } finally {
            isSending = false;
            dom.sendButton.disabled = false;
            dom.chatHistory.scrollTop = dom.chatHistory.scrollHeight;
            saveCharacters();
        }
    };
    
    const callApi = async (targetElement, character) => {
        const { apiType, model } = apiSettings;
        let finalResponseText = '';
        targetElement.innerHTML = '';

        let messages = [];
        if (character.setting) {
            messages.push({ role: 'system', content: character.setting });
        }
        messages = messages.concat(character.history);

        try {
            let response;
            if (apiType === 'openai') {
                response = await fetch(`${apiSettings.openaiApiUrl}/v1/chat/completions`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiSettings.openaiApiKey}` },
                    body: JSON.stringify({ model, messages, stream: true })
                });
            } else { // Gemini
                 const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${apiSettings.geminiApiKey}&alt=sse`;
                 const geminiContents = messages.map(msg => ({ role: msg.role === 'assistant' ? 'model' : msg.role, parts: [{ text: msg.content }] }));
                 response = await fetch(geminiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ contents: geminiContents })
                });
            }

            if (!response.ok) throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
            
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            while(true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value);
                const lines = chunk.split('\n').filter(line => line.trim().startsWith('data: '));
                for (const line of lines) {
                    const jsonStr = line.replace('data: ', '');
                    if (jsonStr.includes('[DONE]')) continue;
                    try {
                        const parsed = JSON.parse(jsonStr);
                        let delta = '';
                        if (apiType === 'openai') {
                            delta = parsed.choices[0]?.delta?.content || '';
                        } else {
                            delta = parsed.candidates[0]?.content?.parts[0]?.text || '';
                        }
                        if (delta) {
                            finalResponseText += delta;
                            targetElement.innerHTML = marked.parse(finalResponseText);
                            dom.chatHistory.scrollTop = dom.chatHistory.scrollHeight;
                        }
                    } catch (e) { /* ignore parse errors for incomplete chunks */ }
                }
            }
        } catch (error) {
            finalResponseText = `**API 请求失败:** ${error.message}`;
            targetElement.innerHTML = marked.parse(finalResponseText);
        }

        if (finalResponseText) {
            character.history.push({ role: 'assistant', content: finalResponseText });
        }
        targetElement.querySelectorAll('pre code').forEach(block => hljs.highlightElement(block));
        addCopyButtons(targetElement);
    };

    // --- API FORM LOGIC (from Gen-1) ---
    const initializeApiForm = () => {
        populateModels(defaultModels.openai, 'openai');
        populateModels(defaultModels.gemini, 'gemini');
        updateApiForm(apiSettings.apiType || 'openai');
    };
    const populateModels = (models, type) => {
        const group = type === 'openai' ? dom.openaiModelsGroup : dom.geminiModelsGroup;
        group.innerHTML = '';
        Object.entries(models).forEach(([id, name]) => {
            const option = document.createElement('option');
            option.value = id;
            option.textContent = name;
            group.appendChild(option);
        });
    };
    const restoreSelection = (modelId) => {
        if (modelId && Array.from(dom.modelSelect.options).some(opt => opt.value === modelId)) {
            dom.modelSelect.value = modelId;
        }
    };
    const updateApiForm = (apiType) => {
        currentApiType = apiType;
        const isGemini = apiType === 'gemini';
        dom.btnOpenAI.classList.toggle('active', !isGemini);
        dom.btnGemini.classList.toggle('active', isGemini);
        dom.openaiModelsGroup.hidden = isGemini;
        dom.geminiModelsGroup.hidden = !isGemini;
        dom.apiUrlInput.disabled = isGemini;
        dom.apiUrlInput.value = isGemini ? 'https://generativelanguage.googleapis.com' : (apiSettings.openaiApiUrl || '');
        dom.apiKeyInput.value = isGemini ? (apiSettings.geminiApiKey || '') : (apiSettings.openaiApiKey || '');
        restoreSelection(apiSettings.model);
    };
    const fetchModels = async () => { /* ... identical to Gen-1 fetchModels logic ... */ }; // For brevity, assuming this is copied
    dom.fetchModelsButton.addEventListener('click', async () => {
        const apiKey = dom.apiKeyInput.value.trim();
        dom.fetchModelsButton.textContent = '正在拉取...';
        dom.fetchModelsButton.disabled = true;
        try {
            let fetchedModels;
            if (currentApiType === 'openai') {
                const baseUrl = dom.apiUrlInput.value.trim();
                if (!baseUrl || !apiKey) throw new Error('请先填写 API 地址和密钥！');
                const response = await fetch(`${baseUrl}/v1/models`, { headers: { 'Authorization': `Bearer ${apiKey}` } });
                if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
                const data = await response.json();
                fetchedModels = data.data.reduce((acc, model) => ({ ...acc, [model.id]: model.id }), {});
            } else { // Gemini
                if (!apiKey) throw new Error('请先填写 Gemini API Key！');
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
                if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
                const data = await response.json();
                fetchedModels = data.models
                    .filter(m => m.supportedGenerationMethods.includes('generateContent'))
                    .reduce((acc, model) => ({ ...acc, [model.name.split('/').pop()]: model.displayName }), {});
            }
            if (Object.keys(fetchedModels).length === 0) throw new Error("API未返回任何可用模型");
            populateModels(fetchedModels, currentApiType);
        } catch (error) {
            alert(`拉取模型失败: ${error.message}`);
            populateModels(defaultModels[currentApiType], currentApiType);
        } finally {
            dom.fetchModelsButton.textContent = '拉取模型';
            dom.fetchModelsButton.disabled = false;
        }
    });


    // --- EVENT LISTENERS ---
    // Navigation
    document.querySelectorAll('.back-button').forEach(btn => btn.addEventListener('click', goBack));
    dom.goToChatBtn.addEventListener('click', () => showScreen('chat'));
    dom.goToEditBtn.addEventListener('click', () => showScreen('characterEdit'));
    
    // Home Screen
    dom.addCharacterBtn.addEventListener('click', () => {
        const newChar = { id: Date.now(), name: '新角色', subtitle: '', setting: '', avatar: '', history: [] };
        characters.push(newChar);
        saveCharacters();
        showScreen('characterEdit', newChar.id);
    });

    // Edit Screen
    dom.characterEditForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const char = characters.find(c => c.id === activeCharacterId);
        if (char) {
            char.name = dom.editCharName.value;
            char.subtitle = dom.editCharSubtitle.value;
            char.setting = dom.editCharSetting.value;
            // Avatar is handled by change event
            saveCharacters();
            showScreen('characterDetail');
        }
    });
    dom.editCharAvatarUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const char = characters.find(c => c.id === activeCharacterId);
                if (char) {
                    char.avatar = event.target.result;
                    dom.editCharAvatar.src = event.target.result;
                    saveCharacters();
                }
            };
            reader.readAsDataURL(file);
        }
    });
    dom.deleteCharacterBtn.addEventListener('click', () => {
        if (confirm('确定要删除这个角色吗？此操作无法撤销。')) {
            characters = characters.filter(c => c.id !== activeCharacterId);
            saveCharacters();
            showScreen('home');
        }
    });

    // Chat Screen
    dom.chatForm.addEventListener('submit', (e) => { e.preventDefault(); handleSendMessage(); });
    dom.chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }
    });

    // API Settings Screen
    dom.btnOpenAI.addEventListener('click', () => updateApiForm('openai'));
    dom.btnGemini.addEventListener('click', () => updateApiForm('gemini'));
    dom.saveSettingsBtn.addEventListener('click', saveApiSettings);
    dom.apiKeyInput.addEventListener('focus', () => { dom.apiKeyInput.type = 'text'; });
    dom.apiKeyInput.addEventListener('blur', () => { dom.apiKeyInput.type = 'password'; });

    // FAB Logic (from Gen-2, simplified)
    const fab = {
        isDragging: false, wasDragged: false, startX: 0, startY: 0, initialX: 0, initialY: 0,
        onPointerDown: function(e) {
            if (e.target.closest('.panel-button')) return;
            this.isDragging = true; this.wasDragged = false;
            const ptr = e.touches ? e.touches[0] : e;
            this.startX = ptr.clientX; this.startY = ptr.clientY;
            const rect = dom.fabWrapper.getBoundingClientRect();
            const containerRect = dom.fabWrapper.parentElement.getBoundingClientRect();
            this.initialX = rect.left - containerRect.left; this.initialY = rect.top - containerRect.top;
            dom.fabWrapper.classList.add('dragging');
            window.addEventListener('pointermove', this.onPointerMove);
            window.addEventListener('pointerup', this.onPointerUp);
        },
        onPointerMove: function(e) {
            if (!this.isDragging) return;
            const ptr = e.touches ? e.touches[0] : e;
            const dx = ptr.clientX - this.startX, dy = ptr.clientY - this.startY;
            if (!this.wasDragged && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
                this.wasDragged = true;
                dom.fabPanelContainer.classList.add('hidden');
            }
            if (this.wasDragged) {
                let newX = this.initialX + dx, newY = this.initialY + dy;
                const parent = dom.fabWrapper.parentElement;
                newX = Math.max(0, Math.min(newX, parent.clientWidth - dom.fabWrapper.offsetWidth));
                newY = Math.max(0, Math.min(newY, parent.clientHeight - dom.fabWrapper.offsetHeight));
                dom.fabWrapper.style.left = `${newX}px`; dom.fabWrapper.style.top = `${newY}px`;
                dom.fabWrapper.style.right = 'auto'; dom.fabWrapper.style.bottom = 'auto';
            }
        },
        onPointerUp: function() {
            if (!this.isDragging) return;
            this.isDragging = false;
            dom.fabWrapper.classList.remove('dragging');
            window.removeEventListener('pointermove', this.onPointerMove);
            window.removeEventListener('pointerup', this.onPointerUp);
            if (this.wasDragged) {
                const fabRect = dom.fabWrapper.getBoundingClientRect();
                const parentWidth = dom.fabWrapper.parentElement.clientWidth;
                const isLeft = (fabRect.left + fabRect.width / 2) < parentWidth / 2;
                dom.fabWrapper.style.left = isLeft ? '20px' : 'auto';
                dom.fabWrapper.style.right = isLeft ? 'auto' : '20px';
                localStorage.setItem(FAB_POSITION_KEY, JSON.stringify({ top: dom.fabWrapper.style.top, left: dom.fabWrapper.style.left, right: dom.fabWrapper.style.right }));
            } else {
                const panel = dom.fabPanelContainer;
                const isHidden = panel.classList.toggle('hidden');
                if (!isHidden) {
                    panel.style.left = `${dom.fabToggleBtn.offsetWidth / 2 - panel.offsetWidth / 2}px`;
                    panel.style.bottom = `${dom.fabToggleBtn.offsetHeight + 10}px`;
                }
            }
        }
    };
    fab.onPointerMove = fab.onPointerMove.bind(fab);
    fab.onPointerUp = fab.onPointerUp.bind(fab);
    dom.fabWrapper.addEventListener('pointerdown', fab.onPointerDown.bind(fab));

    dom.fabPanelContainer.addEventListener('click', (e) => {
        const button = e.target.closest('.panel-button');
        if (!button) return;
        const targetScreen = button.dataset.targetScreen;
        const action = button.dataset.action;
        if (targetScreen) showScreen(targetScreen);
        else if (action === 'back') goBack();
        dom.fabPanelContainer.classList.add('hidden');
    });

    // --- INITIAL LOAD ---
    const initialSetup = () => {
        loadCharacters();
        loadApiSettings();
        activeCharacterId = parseInt(sessionStorage.getItem('activeCharacterId'));
        const savedFabPos = JSON.parse(localStorage.getItem(FAB_POSITION_KEY));
        if (savedFabPos) {
            Object.assign(dom.fabWrapper.style, savedFabPos);
        }
        showScreen('home');
    };

    initialSetup();
});