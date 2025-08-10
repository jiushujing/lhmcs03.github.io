document.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('phone-container')) return;

    // --- CONFIGURE LIBRARIES ---
    marked.setOptions({
        breaks: true,
        gfm: true,
    });

    // --- DOM ELEMENTS ---
    const dom = {
        // Screens
        homeScreen: document.getElementById('home-screen'),
        characterDetailScreen: document.getElementById('character-detail-screen'),
        characterEditScreen: document.getElementById('character-edit-screen'),
        chatScreen: document.getElementById('chat-screen'),
        myDashboardScreen: document.getElementById('my-dashboard-screen'),
        apiSettingsScreen: document.getElementById('api-settings-screen'),

        // Home Screen
        characterList: document.getElementById('character-list'),
        addCharacterBtn: document.getElementById('add-character-btn'),
        menuBtn: document.getElementById('menu-btn'),
        dropdownMenu: document.getElementById('dropdown-menu'),
        batchDeleteFooter: document.getElementById('batch-delete-footer'),
        deleteSelectedBtn: document.getElementById('delete-selected-btn'),
        cancelDeleteBtn: document.getElementById('cancel-delete-btn'),
        batchDeleteHeader: document.getElementById('batch-delete-header'),


        // Character Detail & Edit
        detailAvatar: document.getElementById('detail-avatar'),
        detailName: document.getElementById('detail-name'),
        goToChatBtn: document.getElementById('go-to-chat-btn'),
        goToEditBtn: document.getElementById('go-to-edit-btn'),
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
        chatInput: document.getElementById('chat-input'),
        sendBtn: document.getElementById('send-btn'),
        clearHistoryBtn: document.getElementById('clear-history-btn'),
        
        // API Settings Screen
        apiSettingsForm: document.getElementById('api-settings-form'),
        apiUrlInput: document.getElementById('api-url'),
        apiKeyInput: document.getElementById('api-key'),
        modelSelect: document.getElementById('model-select'),
        fetchModelsButton: document.getElementById('fetch-models-button'),
        saveSettingsBtn: document.getElementById('save-settings-btn'),
        btnOpenAI: document.getElementById('btn-openai'),
        btnGemini: document.getElementById('btn-gemini'),
        openaiModelsGroup: document.getElementById('openai-models'),
        geminiModelsGroup: document.getElementById('gemini-models'),
    };

    // --- STATE MANAGEMENT ---
    let characters = [];
    let apiSettings = {};
    let activeCharacterId = null;
    let screenHistory = []; // Start with an empty history
    let isBatchDeleteMode = false;
    let isSending = false;
    let currentApiType = 'openai';

    const CHARACTERS_KEY = 'aiChatCharacters_v3';
    const API_SETTINGS_KEY = 'aiChatApiSettings_v3';
    
    const defaultModels = {
        openai: { "gpt-3.5-turbo": "GPT-3.5-Turbo" },
        gemini: { "gemini-pro": "Gemini Pro" }
    };

    // --- DATA & HELPER FUNCTIONS ---
    const saveCharacters = () => localStorage.setItem(CHARACTERS_KEY, JSON.stringify(characters));
    const loadCharacters = () => {
        const saved = localStorage.getItem(CHARACTERS_KEY);
        if (saved) {
            characters = JSON.parse(saved);
        } else {
            characters = [{ id: Date.now(), name: '助手小C', subtitle: '乐于助人的AI伙伴', setting: '你是一位乐于助人、知识渊博的AI助手，名叫小C。', avatar: '', history: [] }];
            saveCharacters();
        }
    };
    const getActiveCharacter = () => characters.find(c => c.id === activeCharacterId);

    // --- NAVIGATION (REFACTORED & FIXED) ---
    const showScreen = (screenName) => {
        if (!screenName) return;

        document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
        const screenElement = document.getElementById(`${screenName}-screen`);
        if (screenElement) {
            screenElement.classList.remove('hidden');
        } else {
            console.error(`Screen not found: ${screenName}-screen`);
            // Fallback to home screen if target is not found
            document.getElementById('home-screen').classList.remove('hidden');
            return;
        }

        // Screen-specific rendering logic
        if (screenName === 'home') renderCharacterList();
        if (screenName === 'characterDetail') renderCharacterDetail();
        if (screenName === 'characterEdit') renderCharacterEdit();
        if (screenName === 'chat') renderChatScreen();
    };

    const navigateTo = (screenName) => {
        const currentScreen = screenHistory[screenHistory.length - 1];
        if (screenName !== currentScreen) {
            screenHistory.push(screenName);
        }
        showScreen(screenName);
    };

    const goBack = () => {
        if (screenHistory.length > 1) {
            screenHistory.pop();
            const previousScreen = screenHistory[screenHistory.length - 1];
            showScreen(previousScreen);
        }
    };
    
    // --- BATCH DELETE MODE ---
    const enterBatchDeleteMode = () => {
        isBatchDeleteMode = true;
        dom.homeScreen.classList.add('batch-delete-active');
        renderCharacterList();
    };
    const exitBatchDeleteMode = () => {
        isBatchDeleteMode = false;
        dom.homeScreen.classList.remove('batch-delete-active');
        renderCharacterList();
    };

    // --- RENDERING LOGIC ---
    const renderCharacterList = () => {
        dom.characterList.innerHTML = '';
        characters.forEach(char => {
            const item = document.createElement('div');
            item.className = 'character-card';
            item.dataset.id = char.id;
            let content = `<img src="${char.avatar || 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'}" alt="Avatar"><div class="character-info"><div class="name">${char.name}</div><div class="subtitle">${char.subtitle || ''}</div><div class="meta"><span>💬</span><span>${char.history ? char.history.length : 0}</span></div></div>`;
            if (isBatchDeleteMode) {
                item.classList.add('batch-delete-item');
                content = `<input type="checkbox" class="batch-delete-checkbox" data-id="${char.id}">${content}`;
            }
            item.innerHTML = content;
            dom.characterList.appendChild(item);
        });

        if (!isBatchDeleteMode) {
            dom.characterList.querySelectorAll('.character-card').forEach(card => {
                card.addEventListener('click', () => {
                    activeCharacterId = parseInt(card.dataset.id);
                    navigateTo('characterDetail');
                });
            });
        }
    };
    const renderCharacterDetail = () => {
        const char = getActiveCharacter();
        if (!char) { goBack(); return; }
        dom.detailAvatar.src = char.avatar || 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
        dom.detailName.textContent = char.name;
    };
    const renderCharacterEdit = () => {
        const char = getActiveCharacter();
        if (!char) { goBack(); return; }
        dom.editCharAvatar.src = char.avatar || 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
        dom.editCharName.value = char.name;
        dom.editCharSubtitle.value = char.subtitle || '';
        dom.editCharSetting.value = char.setting || '';
    };
    const renderChatScreen = () => {
        const char = getActiveCharacter();
        if (!char) { goBack(); return; }
        dom.chatHeaderTitle.textContent = `与 ${char.name} 聊天`;
        dom.chatHistory.innerHTML = '';
        char.history.forEach(msg => addMessageToUI(msg.role, msg.content));
        
        if (!loadAndCheckApiSettings()) {
            setTimeout(() => navigateTo('apiSettings'), 100);
        }
    };
    
    // --- API & CHAT LOGIC ---
    const loadAndCheckApiSettings = () => {
        const settingsStr = localStorage.getItem(API_SETTINGS_KEY);
        if (!settingsStr) return false;
        apiSettings = JSON.parse(settingsStr);
        const { apiType, model } = apiSettings;
        const apiKey = apiType === 'gemini' ? apiSettings.geminiApiKey : apiSettings.openaiApiKey;
        const apiUrl = apiType === 'openai' ? apiSettings.openaiApiUrl : '';
        return !(!model || !apiKey || (apiType === 'openai' && !apiUrl));
    };
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
    const addMessageToUI = (sender, text) => {
        const role = (sender === 'user' || sender === 'system') ? 'user' : 'assistant';
        const messageWrapper = document.createElement('div');
        messageWrapper.className = `message ${role}`;
        
        const char = getActiveCharacter();
        const avatar = document.createElement('div');
        avatar.className = 'avatar';
        if (role === 'assistant' && char && char.avatar) {
            avatar.innerHTML = `<img src="${char.avatar}" alt="av" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
        } else {
            avatar.innerHTML = `<i class="fas ${role === 'user' ? 'fa-user' : 'fa-robot'}"></i>`;
        }

        const content = document.createElement('div');
        content.className = 'content';

        if (text === '...thinking...') {
             content.innerHTML = '<div class="typing-indicator"><span></span><span></span><span></span></div>';
        } else {
            content.innerHTML = marked.parse(text);
            content.querySelectorAll('pre code').forEach(block => hljs.highlightElement(block));
            addCopyButtons(content);
        }

        messageWrapper.appendChild(avatar);
        messageWrapper.appendChild(content);
        dom.chatHistory.appendChild(messageWrapper);
        dom.chatHistory.scrollTop = dom.chatHistory.scrollHeight;
        return content;
    };
    const handleSendMessage = async () => {
        const userInput = dom.chatInput.value.trim();
        if (!userInput || isSending) return;
        if (!loadAndCheckApiSettings()) { alert('请先完成API设定！'); navigateTo('apiSettings'); return; }
        
        isSending = true;
        dom.sendBtn.disabled = true;
        dom.chatInput.value = '';

        const char = getActiveCharacter();
        if (!char) return;

        addMessageToUI('user', userInput);
        char.history.push({ role: 'user', content: userInput });
        
        const thinkingMessageContent = addMessageToUI('assistant', '...thinking...');
        
        try {
            const finalResponseText = await callApi();
            thinkingMessageContent.innerHTML = marked.parse(finalResponseText);
            thinkingMessageContent.querySelectorAll('pre code').forEach(block => hljs.highlightElement(block));
            addCopyButtons(thinkingMessageContent);
            
            char.history.push({ role: 'assistant', content: finalResponseText });
            saveCharacters();
        } catch (error) {
            console.error('API Call Error:', error);
            thinkingMessageContent.innerHTML = `<p>出错了: ${error.message}</p>`;
        } finally {
            isSending = false;
            dom.sendBtn.disabled = false;
            dom.chatHistory.scrollTop = dom.chatHistory.scrollHeight;
        }
    };
    const callApi = async () => { /* ... This function is correct and remains unchanged ... */ };
    
    // --- API SETTINGS FORM LOGIC ---
    const initializeApiForm = () => { /* ... This function is correct and remains unchanged ... */ };
    const updateApiForm = (apiType) => { /* ... This function is correct and remains unchanged ... */ };
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
        apiSettings = settings;
        alert('API设定已保存！');
        goBack();
    };

    // --- EVENT LISTENERS (FIXED) ---
    document.querySelectorAll('.back-button').forEach(btn => btn.addEventListener('click', goBack));
    
    dom.menuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dom.dropdownMenu.style.display = dom.dropdownMenu.style.display === 'block' ? 'none' : 'block';
    });
    
    document.body.addEventListener('click', () => {
        if (dom.dropdownMenu.style.display === 'block') {
            dom.dropdownMenu.style.display = 'none';
        }
    });

    dom.dropdownMenu.addEventListener('click', (e) => {
        const target = e.target.closest('.dropdown-item');
        if (!target) return;

        const screen = target.dataset.targetScreen;
        const action = target.dataset.action;

        if (screen) {
            navigateTo(screen);
        } else if (action === 'batch-delete') {
            enterBatchDeleteMode();
        }
        
        dom.dropdownMenu.style.display = 'none';
    });

    dom.addCharacterBtn.addEventListener('click', () => {
        const newChar = { id: Date.now(), name: '新角色', subtitle: '', setting: '', avatar: '', history: [] };
        characters.push(newChar);
        activeCharacterId = newChar.id;
        navigateTo('characterEdit');
    });

    dom.goToChatBtn.addEventListener('click', () => navigateTo('chat'));
    dom.goToEditBtn.addEventListener('click', () => navigateTo('characterEdit'));

    dom.characterEditForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const char = getActiveCharacter();
        if(char) {
            char.name = dom.editCharName.value.trim() || '未命名角色';
            char.subtitle = dom.editCharSubtitle.value.trim();
            char.setting = dom.editCharSetting.value.trim();
            saveCharacters();
            navigateTo('characterDetail');
        }
    });
    
    dom.editCharAvatarUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const char = getActiveCharacter();
                if(char) {
                    char.avatar = event.target.result;
                    dom.editCharAvatar.src = event.target.result;
                    saveCharacters();
                }
            };
            reader.readAsDataURL(file);
        }
    });
    
    dom.sendBtn.addEventListener('click', handleSendMessage);
    dom.chatInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); handleSendMessage(); } });
    
    dom.clearHistoryBtn.addEventListener('click', () => {
        if (confirm('确定要清空当前角色的所有对话记录吗？')) {
            const char = getActiveCharacter();
            if (char) {
                char.history = [];
                saveCharacters();
                renderChatScreen();
            }
        }
    });

    dom.btnOpenAI.addEventListener('click', () => updateApiForm('openai'));
    dom.btnGemini.addEventListener('click', () => updateApiForm('gemini'));
    dom.saveSettingsBtn.addEventListener('click', saveApiSettings);
    
    // --- INITIAL LOAD ---
    const initialSetup = () => {
        loadCharacters();
        initializeApiForm();
        navigateTo('home'); // Start at the home screen
    };

    initialSetup();
});

// NOTE: The `callApi` and API form helper functions are omitted for brevity but are assumed to be correct from the previous version.
// The full script above includes placeholders for them.
