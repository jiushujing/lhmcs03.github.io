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
    let screenHistory = [];
    let isBatchDeleteMode = false;
    let isSending = false;
    let currentApiType = 'openai';

    const CHARACTERS_KEY = 'aiChatCharacters_v3';
    const API_SETTINGS_KEY = 'aiChatApiSettings_v3';
    
    // --- DATA & HELPER FUNCTIONS ---
    const saveCharacters = () => localStorage.setItem(CHARACTERS_KEY, JSON.stringify(characters));
    const loadCharacters = () => {
        const saved = localStorage.getItem(CHARACTERS_KEY);
        characters = saved ? JSON.parse(saved) : [{ id: Date.now(), name: '助手小C', subtitle: '乐于助人的AI伙伴', setting: '你是一位乐于助人、知识渊博的AI助手，名叫小C。', avatar: '', history: [] }];
        if (!saved) saveCharacters();
    };
    const getActiveCharacter = () => characters.find(c => c.id === activeCharacterId);

    // --- NAVIGATION (REFACTORED & FIXED) ---
    const showScreen = (screenName) => {
        document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
        const screenElement = document.getElementById(`${screenName}-screen`);
        if (screenElement) {
            screenElement.classList.remove('hidden');
        } else {
            console.error(`Screen not found: ${screenName}`);
            document.getElementById('home-screen').classList.remove('hidden'); // Fallback
        }
    };

    const navigateTo = (screenName) => {
        if (!screenName) return;
        const currentScreen = screenHistory[screenHistory.length - 1];
        if (screenName !== currentScreen) {
            screenHistory.push(screenName);
        }
        showScreen(screenName);
        // Call render function after showing the screen
        const renderFunc = window[`render${screenName.charAt(0).toUpperCase() + screenName.slice(1)}`];
        if (typeof renderFunc === 'function') {
            renderFunc();
        }
    };

    const goBack = () => {
        if (screenHistory.length > 1) {
            screenHistory.pop();
            const previousScreen = screenHistory[screenHistory.length - 1];
            navigateTo(previousScreen);
            // Since navigateTo pushes, we pop again to correct history
            if (screenHistory[screenHistory.length - 1] === previousScreen) {
                screenHistory.pop();
            }
        }
    };
    
    // --- BATCH DELETE MODE ---
    const enterBatchDeleteMode = () => {
        isBatchDeleteMode = true;
        dom.homeScreen.classList.add('batch-delete-active');
        renderHome();
    };
    const exitBatchDeleteMode = () => {
        isBatchDeleteMode = false;
        dom.homeScreen.classList.remove('batch-delete-active');
        renderHome();
    };

    // --- RENDERING LOGIC (RENAMED FOR CONSISTENCY) ---
    window.renderHome = () => {
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
    window.renderCharacterDetail = () => {
        const char = getActiveCharacter();
        if (!char) { goBack(); return; }
        dom.detailAvatar.src = char.avatar || 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
        dom.detailName.textContent = char.name;
    };
    window.renderCharacterEdit = () => {
        const char = getActiveCharacter();
        if (!char) { goBack(); return; }
        dom.editCharAvatar.src = char.avatar || 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
        dom.editCharName.value = char.name;
        dom.editCharSubtitle.value = char.subtitle || '';
        dom.editCharSetting.value = char.setting || '';
    };
    window.renderChat = () => {
        const char = getActiveCharacter();
        if (!char) { goBack(); return; }
        dom.chatHeaderTitle.textContent = `与 ${char.name} 聊天`;
        dom.chatHistory.innerHTML = '';
        if (char.history) {
            char.history.forEach(msg => addMessageToUI(msg.role, msg.content));
        }
        if (!loadAndCheckApiSettings()) {
            alert('请先完成API设定！');
            setTimeout(() => navigateTo('apiSettings'), 100);
        }
    };
    
    // --- API & CHAT LOGIC ---
    const loadAndCheckApiSettings = () => { /* ... unchanged ... */ return true; };
    const addCopyButtons = (targetElement) => { /* ... unchanged ... */ };
    const addMessageToUI = (sender, text) => { /* ... unchanged ... */ return document.createElement('div'); };
    const handleSendMessage = async () => { /* ... unchanged ... */ };
    const callApi = async () => { /* ... unchanged ... */ };
    
    // --- API SETTINGS FORM LOGIC ---
    const initializeApiForm = () => { /* ... unchanged ... */ };
    const updateApiForm = (apiType) => { /* ... unchanged ... */ };
    const saveApiSettings = () => { /* ... unchanged ... */ goBack(); };

    // --- EVENT LISTENERS (FIXED & SIMPLIFIED) ---
    document.querySelectorAll('.back-button').forEach(btn => btn.addEventListener('click', goBack));
    
    // Menu button logic
    dom.menuBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent body click from firing immediately
        const isShown = dom.dropdownMenu.style.display === 'block';
        dom.dropdownMenu.style.display = isShown ? 'none' : 'block';
    });

    // Dropdown item click logic
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
        dom.dropdownMenu.style.display = 'none'; // Hide menu after action
    });

    // Global click to hide menu
    document.body.addEventListener('click', () => {
        if (dom.dropdownMenu.style.display === 'block') {
            dom.dropdownMenu.style.display = 'none';
        }
    });

    // Add character button
    dom.addCharacterBtn.addEventListener('click', () => {
        const newChar = { id: Date.now(), name: '新角色', subtitle: '', setting: '', avatar: '', history: [] };
        characters.push(newChar);
        activeCharacterId = newChar.id;
        navigateTo('characterEdit');
    });

    // Other navigation buttons
    dom.goToChatBtn.addEventListener('click', () => navigateTo('chat'));
    dom.goToEditBtn.addEventListener('click', () => navigateTo('characterEdit'));

    // Form submission
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
    
    // Chat functionality
    dom.sendBtn.addEventListener('click', handleSendMessage);
    dom.chatInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); handleSendMessage(); } });
    dom.clearHistoryBtn.addEventListener('click', () => {
        if (confirm('确定要清空当前角色的所有对话记录吗？')) {
            const char = getActiveCharacter();
            if (char) {
                char.history = [];
                saveCharacters();
                window.renderChat();
            }
        }
    });

    // API settings functionality
    dom.btnOpenAI.addEventListener('click', () => updateApiForm('openai'));
    dom.btnGemini.addEventListener('click', () => updateApiForm('gemini'));
    dom.saveSettingsBtn.addEventListener('click', saveApiSettings);
    
    // --- INITIAL LOAD ---
    const initialSetup = () => {
        loadCharacters();
        initializeApiForm();
        navigateTo('home');
    };

    initialSetup();
});
// NOTE: Some function bodies are collapsed for brevity (`/* ... unchanged ... */`)
// The full logic from the previous correct version should be there.
