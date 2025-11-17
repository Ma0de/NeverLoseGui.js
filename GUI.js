
class NeverloseGUI {
    constructor(options = {}) {
        
        if (window.__NeverloseGUI_Instance__) {
            console.warn('NeverloseGUI 已经注入，不能重复注入');
            return window.__NeverloseGUI_Instance__;
        }
        
        this.options = {
            container: document.body,
            logo: 'NEVERLOSE',
            categories: [],
            ...options
        };
        
        this.isOpen = false;
        this.overlay = null;
        this.guiWindow = null;
        this.currentScale = 1;
        this.optimalScale = this.calculateOptimalScale(); 
        
        
        this._sectionsToAdd = [];
        
        window.__NeverloseGUI_Instance__ = this;
        
        this.initMessageSystem();
        this.initKeyboardListener();
        this.initResizeListener(); 
        this.injectSuccessMessage();
        
        
        this.preCreateGUI();
    }
    
    initMessageSystem() {
        
        if (document.querySelector('style[data-neverlose-messages]')) {
            return;
        }
        
        const messageStyle = document.createElement('style');
        messageStyle.setAttribute('data-neverlose-messages', 'true');
        messageStyle.textContent = `
            .message-system {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                max-width: 400px;
            }
            
            .message {
                background: #1e293b;
                border-left: 4px solid #3b82f6;
                color: white;
                padding: 12px 16px;
                margin-bottom: 10px;
                border-radius: 6px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                transform: translateX(100%);
                opacity: 0;
                transition: all 0.3s ease;
                position: relative;
                min-width: 300px;
            }
            
            .message.show {
                transform: translateX(0);
                opacity: 1;
            }
            
            .message.hide {
                transform: translateX(100%);
                opacity: 0;
            }
            
            .message.highlight {
                animation: highlight-pulse 1s ease;
            }
            
            .message.info {
                border-left-color: #3b82f6;
            }
            
            .message.warning {
                border-left-color: #f59e0b;
            }
            
            .message.error {
                border-left-color: #ef4444;
            }
            
            .message-title {
                font-weight: bold;
                margin-bottom: 4px;
                font-size: 14px;
            }
            
            .message-close {
                position: absolute;
                top: 8px;
                right: 8px;
                cursor: pointer;
                font-size: 18px;
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 3px;
                transition: background 0.2s;
            }
            
            .message-close:hover {
                background: rgba(255, 255, 255, 0.1);
            }
            
            @keyframes highlight-pulse {
                0%, 100% { box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3); }
                50% { box-shadow: 0 4px 20px rgba(59, 130, 246, 0.5); }
            }
            
            .nl-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: transparent;
                z-index: 9998;
                display: none;
            }
            
            .nl-gui-window {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) scale(var(--gui-scale, 1));
                width: var(--gui-width, 1200px);
                height: var(--gui-height, 700px);
                background: #0f172a;
                border-radius: 12px;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                z-index: 9999;
                display: none;
                overflow: hidden;
                transform-origin: center center;
                transition: transform 0.3s ease;
            }
            
            .nl-gui-container {
                display: flex;
                width: 100%;
                height: 100%;
            }
        `;
        document.head.appendChild(messageStyle);
        
        
        if (!document.querySelector('.message-system')) {
            this.messageContainer = document.createElement('div');
            this.messageContainer.className = 'message-system';
            document.body.appendChild(this.messageContainer);
        } else {
            this.messageContainer = document.querySelector('.message-system');
        }
        
        this.messages = [];
        this.nextMessageId = 1;
    }
    
    initKeyboardListener() {
        
        document.removeEventListener('keydown', this._keyboardHandler);
        
        this._keyboardHandler = (e) => {
            if (e.code === 'ShiftRight' && !e.repeat) {
                e.preventDefault();
                this.toggleGUI();
            }
        };
        
        document.addEventListener('keydown', this._keyboardHandler);
    }
    
    initResizeListener() {
        
        this._resizeHandler = () => {
            this.optimalScale = this.calculateOptimalScale();
            
            if (this.isOpen) {
                this.setScale(this.optimalScale);
            }
        };
        
        window.addEventListener('resize', this._resizeHandler);
    }
    
    calculateOptimalScale() {
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        
        const baseWidth = 1200;
        const baseHeight = 700;
        
        
        const maxWidth = viewportWidth * 0.95;
        const maxHeight = viewportHeight * 0.95;
        
        
        const widthScale = maxWidth / baseWidth;
        const heightScale = maxHeight / baseHeight;
        
        
        let optimalScale = Math.min(widthScale, heightScale);
        
        
        optimalScale = Math.min(Math.max(optimalScale, 0.6), 1.2);
        
        console.log(`窗口尺寸: ${viewportWidth}x${viewportHeight}, 计算缩放: ${optimalScale}`);
        return optimalScale;
    }
    
    preCreateGUI() {
        
        this.createOverlay();
        this.createGUIWindow();
    }
    
    createOverlay() {
        if (!this.overlay) {
            this.overlay = document.createElement('div');
            this.overlay.className = 'nl-overlay';
            document.body.appendChild(this.overlay);
        }
    }
    
    createGUIWindow() {
        if (!this.guiWindow) {
            this.guiWindow = document.createElement('div');
            this.guiWindow.className = 'nl-gui-window';
            
            const guiContainer = document.createElement('div');
            guiContainer.className = 'nl-gui-container';
            this.guiWindow.appendChild(guiContainer);
            
            document.body.appendChild(this.guiWindow);
            
            
            this.guiWindow.style.setProperty('--gui-width', '1200px');
            this.guiWindow.style.setProperty('--gui-height', '700px');
            
            
            this.setScale(this.optimalScale);
        }
    }
    
    injectSuccessMessage() {
        setTimeout(() => {
            this.showMessage({
                title: '注入成功',
                message: '按右Shift打开GUI',
                type: 'info',
                duration: 2000,
                highlight: true
            });
        }, 1000);
    }
    
    showMessage(options) {
        if (typeof options === 'string') {
            options = { message: options };
        }

        const config = {
            message: '',
            type: 'info',
            duration: 2000,
            title: '',
            highlight: false,
            closable: true,
            ...options
        };

        const id = this.nextMessageId++;
        const messageElement = document.createElement('div');
        messageElement.className = `message ${config.type}`;
        
        if (config.title) {
            const titleElement = document.createElement('div');
            titleElement.className = 'message-title';
            titleElement.textContent = config.title;
            messageElement.appendChild(titleElement);
        }
        
        const contentElement = document.createElement('div');
        contentElement.textContent = config.message;
        messageElement.appendChild(contentElement);
        
        if (config.closable) {
            const closeElement = document.createElement('span');
            closeElement.className = 'message-close';
            closeElement.innerHTML = '×';
            closeElement.addEventListener('click', () => this.closeMessage(id));
            messageElement.appendChild(closeElement);
        }
        
        this.messageContainer.appendChild(messageElement);
        
        const messageObj = {
            id,
            element: messageElement,
            timer: null,
            isHiding: false
        };
        this.messages.push(messageObj);
        
        setTimeout(() => {
            messageElement.classList.add('show');
            
            if (config.highlight) {
                messageElement.classList.add('highlight');
                setTimeout(() => {
                    messageElement.classList.remove('highlight');
                }, 1000);
            }
            
            if (config.duration > 0) {
                messageObj.timer = setTimeout(() => this.closeMessage(id), config.duration);
            }
        }, 10);
        
        return () => this.closeMessage(id);
    }
    
    closeMessage(id) {
        const messageObj = this.messages.find(m => m.id === id);
        if (!messageObj || messageObj.isHiding) return;
        
        messageObj.isHiding = true;
        clearTimeout(messageObj.timer);
        
        messageObj.element.classList.remove('show');
        messageObj.element.classList.add('hide');
        
        this.messages = this.messages.filter(m => m.id !== id);
        
        setTimeout(() => {
            messageObj.element.remove();
        }, 400);
    }
    
    setScale(scale) {
        this.currentScale = scale;
        if (this.guiWindow) {
            this.guiWindow.style.setProperty('--gui-scale', scale);
        }
    }
    
    toggleGUI() {
        if (this.isOpen) {
            this.closeGUI();
        } else {
            this.openGUI();
        }
    }
    
openGUI() {
    if (this.isOpen) return;
    
    this.createOverlay();
    this.createGUIWindow();
    
    this.optimalScale = this.calculateOptimalScale();
    this.setScale(this.optimalScale);
    
    setTimeout(() => {
        this.overlay.style.display = 'block';
        this.guiWindow.style.display = 'block';
        
        const guiContainer = this.guiWindow.querySelector('.nl-gui-container');
        
        if (this.sidebar) this.sidebar.remove();
        if (this.mainContent) this.mainContent.remove();
        
        this.options.container = guiContainer;
        this.init();
        
        
        if (this._sectionsToAdd) {
            this._sectionsToAdd.forEach(section => {
                this.renderSection(section);
            });
        }
        
        
        if (this._currentSection) {
            const activeOption = this.sidebar.querySelector(`[data-section="${this._currentSection}"]`);
            if (activeOption) {
                activeOption.classList.add('active');
                this.showSection(this._currentSection);
            }
        } else if (this.sectionsContainer.firstChild) {
            
            const firstSection = this.sectionsContainer.firstChild;
            const firstSectionId = firstSection.id;
            const firstOption = this.sidebar.querySelector(`[data-section="${firstSectionId}"]`);
            if (firstOption) {
                firstOption.classList.add('active');
                firstSection.classList.remove('nl-hidden');
                this._currentSection = firstSectionId;
            }
        }
        
        this.isOpen = true;
    }, 10);
}

    
    closeGUI() {
        if (!this.isOpen) return;
        
        
        this.overlay.style.display = 'none';
        this.guiWindow.style.display = 'none';
        
        this.isOpen = false;
        
      
    }
    
    init() {
        this.createStyles();
        this.createSidebar();
        this.createMainContent();
        this.bindEvents();
    }
    
    createStyles() {
        
        if (document.querySelector('style[data-neverlose-gui]')) {
            return;
        }
        
        const style = document.createElement('style');
        style.setAttribute('data-neverlose-gui', 'true');
        style.textContent = `
            .neverlose-gui {
                display: flex;
                width: 100%;
                height: 100%;
                background-color: #0f172a;
                color: #e2e8f0;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            }
            
            .nl-sidebar {
                width: 220px;
                background-color: #1b2e5b;
                padding: 20px 0;
                border-right: 2px solid #3b82f6;
                display: flex;
                flex-direction: column;
                flex-shrink: 0;
            }
            
            .nl-logo {
                color: white;
                font-weight: 800;
                font-size: 32px;
                margin-bottom: 25px;
                padding: 0 15px;
            }
            
            .nl-category {
                color: #94a3b8;
                font-size: 12px;
                padding: 0 15px;
                margin-bottom: 8px;
                margin-top: 15px;
            }
            
            .nl-sidebar-option {
                border-radius: 8px;
                margin: 5px 10px;
                padding: 12px 15px;
                display: flex;
                align-items: center;
                cursor: pointer;
                transition: all 0.2s;
                color: #cbd5e1;
            }
            
            .nl-sidebar-option:hover {
                background-color: rgba(59, 130, 246, 0.2);
            }
            
            .nl-sidebar-option.active {
                background-color: #3b82f6;
                color: white;
            }
            
            .nl-sidebar-icon {
                margin-right: 10px;
                font-size: 16px;
            }
            
            .nl-sidebar-text {
                font-size: 14px;
                font-weight: 500;
            }
            
            .nl-main-content {
                flex: 1;
                padding: 20px;
                overflow-y: auto;
            }
            
            .nl-top-controls {
                display: flex;
                align-items: center;
                margin-bottom: 15px;
                gap: 15px;
            }
            
            .nl-save-btn {
                display: flex;
                align-items: center;
                padding: 8px 15px;
                border: 1px solid #475569;
                border-radius: 5px;
                background: transparent;
                color: #cbd5e1;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .nl-save-btn:hover {
                background-color: rgba(255, 255, 255, 0.05);
            }
            
            .nl-save-icon {
                margin-right: 6px;
                font-size: 14px;
            }
            
            .nl-dropdown {
                display: flex;
                align-items: center;
                padding: 8px 15px;
                border: 1px solid #475569;
                border-radius: 5px;
                background: transparent;
                color: #cbd5e1;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .nl-dropdown:hover {
                background-color: rgba(255, 255, 255, 0.05);
            }
            
            .nl-dropdown-text {
                margin-right: 20px;
            }
            
            .nl-dropdown-arrow {
                font-size: 14px;
                transform: rotate(90deg);
            }
            
            .nl-divider {
                height: 1px;
                background-color: #3b82f6;
                margin: 15px 0;
            }
            
            .nl-section-title {
                color: #94a3b8;
                font-size: 12px;
                margin-bottom: 15px;
            }
            
            .nl-card {
                background-color: #1f3569;
                border-radius: 8px;
                padding: 15px;
                margin-bottom: 20px;
            }
            
            .nl-card-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 10px;
            }
            
            .nl-card-title {
                color: #cbd5e1;
                font-size: 16px;
                font-weight: 500;
            }
            
            .nl-card-controls {
                display: flex;
                align-items: center;
            }
            
            .nl-settings-icon {
                margin-right: 10px;
                font-size: 14px;
                color: #cbd5e1;
                cursor: pointer;
            }
            
            .nl-toggle {
                position: relative;
                width: 40px;
                height: 20px;
                background-color: #475569;
                border-radius: 10px;
                cursor: pointer;
            }
            
            .nl-toggle::after {
                content: '';
                position: absolute;
                width: 16px;
                height: 16px;
                background-color: #cbd5e1;
                border-radius: 50%;
                top: 2px;
                left: 2px;
                transition: all 0.2s;
            }
            
            .nl-toggle.active {
                background-color: #3b82f6;
            }
            
            .nl-toggle.active::after {
                left: 22px;
            }
            
            .nl-card-divider {
                height: 1px;
                background-color: #334155;
                margin: 12px 0;
            }
            
            .nl-content-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 10px;
            }
            
            .nl-content-title {
                color: #e2e8f0;
                font-size: 14px;
            }
            
            .nl-content-controls {
                display: flex;
                align-items: center;
            }
            
            .nl-content-settings {
                margin-right: 10px;
                font-size: 14px;
                color: #e2e8f0;
                cursor: pointer;
            }
            
            .nl-content-toggle {
                background-color: #475569;
            }
            
            .nl-content-toggle.active {
                background-color: #3b82f6;
            }
            
            .nl-sections-container {
                display: flex;
                gap: 20px;
            }
            
            .nl-section {
                flex: 1;
            }
            
            .nl-hidden {
                display: none !important;
            }
        `;
        document.head.appendChild(style);
    }
    
    createSidebar() {
    if (!this.options.container) {
        console.error('Cannot create sidebar: container is undefined');
        return;
    }
    
    this.sidebar = document.createElement('div');
    this.sidebar.className = 'nl-sidebar';
    
    const logo = document.createElement('div');
    logo.className = 'nl-logo';
    logo.textContent = this.options.logo;
    this.sidebar.appendChild(logo);
    
    this.options.categories.forEach(category => {
        const categoryEl = document.createElement('div');
        categoryEl.className = 'nl-category';
        categoryEl.textContent = category.name;
        this.sidebar.appendChild(categoryEl);
        
        category.options.forEach(option => {
            const optionEl = document.createElement('div');
            optionEl.className = 'nl-sidebar-option';
            optionEl.dataset.section = option.sectionId;
            
            if (option.icon) {
                const icon = document.createElement('span');
                icon.className = 'nl-sidebar-icon';
                icon.textContent = option.icon;
                optionEl.appendChild(icon);
            }
            
            const text = document.createElement('span');
            text.className = 'nl-sidebar-text';
            text.textContent = option.name;
            optionEl.appendChild(text);
            
            this.sidebar.appendChild(optionEl);
        });
    });
    
    this.options.container.appendChild(this.sidebar);
}

createMainContent() {
    if (!this.options.container) {
        console.error('Cannot create main content: container is undefined');
        return;
    }
    
    this.mainContent = document.createElement('div');
    this.mainContent.className = 'nl-main-content';
    
    const topControls = document.createElement('div');
    topControls.className = 'nl-top-controls';
    
    const saveBtn = document.createElement('button');
    saveBtn.className = 'nl-save-btn';
    
    const saveIcon = document.createElement('span');
    saveIcon.className = 'nl-save-icon';
    saveIcon.textContent = '💾';
    saveBtn.appendChild(saveIcon);
    
    const saveText = document.createElement('span');
    saveText.textContent = 'SAVE';
    saveBtn.appendChild(saveText);
    
    const dropdown = document.createElement('div');
    dropdown.className = 'nl-dropdown';
    
    const dropdownText = document.createElement('span');
    dropdownText.className = 'nl-dropdown-text';
    dropdownText.textContent = 'Global';
    dropdown.appendChild(dropdownText);
    
    const dropdownArrow = document.createElement('span');
    dropdownArrow.className = 'nl-dropdown-arrow';
    dropdownArrow.textContent = '>';
    dropdown.appendChild(dropdownArrow);
    
    topControls.appendChild(saveBtn);
    topControls.appendChild(dropdown);
    this.mainContent.appendChild(topControls);
    
    const divider = document.createElement('div');
    divider.className = 'nl-divider';
    this.mainContent.appendChild(divider);
    
    this.sectionsContainer = document.createElement('div');
    this.sectionsContainer.className = 'nl-sections-container';
    this.mainContent.appendChild(this.sectionsContainer);
    
    this.options.container.appendChild(this.mainContent);
}
    
   bindEvents() {
    if (!this.sidebar) return;
    
    this.sidebar.addEventListener('click', (e) => {
        const option = e.target.closest('.nl-sidebar-option');
        if (option) {
            document.querySelectorAll('.nl-sidebar-option').forEach(opt => {
                opt.classList.remove('active');
            });
            
            option.classList.add('active');
            
            const sectionId = option.dataset.section;
            this.showSection(sectionId);
        }
    });
    
    if (!this.mainContent) return;
    
    this.mainContent.addEventListener('click', (e) => {
        const toggle = e.target.closest('.nl-toggle');
        if (toggle) {
            toggle.classList.toggle('active');
            
            const funcName = toggle.dataset.func;
            if (funcName && typeof this[funcName] === 'function') {
                this[funcName](toggle.classList.contains('active'));
            }
        }
    });
    
    this.mainContent.addEventListener('click', (e) => {
        const settingsIcon = e.target.closest('.nl-settings-icon, .nl-content-settings');
        if (settingsIcon) {
            const funcName = settingsIcon.dataset.func;
            if (funcName && typeof this[funcName] === 'function') {
                this[funcName]();
            }
        }
    });
}
    
    showSection(sectionId) {
        
        document.querySelectorAll('.nl-section').forEach(section => {
            section.classList.add('nl-hidden');
        });
        
        
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.remove('nl-hidden');
        }
    }
    
    
    addCategory(category) {
        this.options.categories.push(category);
        this.rebuildSidebar();
    }
    
    
addSection(section) {
    
    const existingIndex = this._sectionsToAdd.findIndex(s => s.id === section.id);
    if (existingIndex !== -1) {
        this._sectionsToAdd[existingIndex] = section;
    } else {
        this._sectionsToAdd.push(section);
    }
    
    
    if (this.sectionsContainer) {
        this.renderSection(section);
    }
}

renderSection(section) {
    let sectionEl = document.getElementById(section.id);
    
    if (!sectionEl) {
        sectionEl = document.createElement('div');
        sectionEl.className = 'nl-section';
        sectionEl.id = section.id;
        
        if (section.title) {
            const sectionTitle = document.createElement('div');
            sectionTitle.className = 'nl-section-title';
            sectionTitle.textContent = section.title;
            sectionEl.appendChild(sectionTitle);
        }
        
        section.cards.forEach(card => {
            const cardEl = this.createCard(card);
            sectionEl.appendChild(cardEl);
        });
        
        this.sectionsContainer.appendChild(sectionEl);
        
        
        if (section.id !== this._currentSection) {
            sectionEl.classList.add('nl-hidden');
        }
    } else {
        sectionEl.innerHTML = '';
        
        if (section.title) {
            const sectionTitle = document.createElement('div');
            sectionTitle.className = 'nl-section-title';
            sectionTitle.textContent = section.title;
            sectionEl.appendChild(sectionTitle);
        }
        
        section.cards.forEach(card => {
            const cardEl = this.createCard(card);
            sectionEl.appendChild(cardEl);
        });
    }
}

    
    createCard(card) {
        const cardEl = document.createElement('div');
        cardEl.className = 'nl-card';
        
        
        if (card.header) {
            const cardHeader = document.createElement('div');
            cardHeader.className = 'nl-card-header';
            
            const cardTitle = document.createElement('div');
            cardTitle.className = 'nl-card-title';
            cardTitle.textContent = card.header.title;
            cardHeader.appendChild(cardTitle);
            
            const cardControls = document.createElement('div');
            cardControls.className = 'nl-card-controls';
            
            if (card.header.settingsIcon) {
                const settingsIcon = document.createElement('span');
                settingsIcon.className = 'nl-settings-icon';
                settingsIcon.textContent = '⚙️';
                if (card.header.settingsFunc) {
                    settingsIcon.dataset.func = card.header.settingsFunc;
                }
                cardControls.appendChild(settingsIcon);
            }
            
            if (card.header.toggle) {
                const toggle = document.createElement('div');
                toggle.className = `nl-toggle ${card.header.toggleActive ? 'active' : ''}`;
                if (card.header.toggleFunc) {
                    toggle.dataset.func = card.header.toggleFunc;
                }
                cardControls.appendChild(toggle);
            }
            
            cardHeader.appendChild(cardControls);
            cardEl.appendChild(cardHeader);
        }
        
        
        if (card.content && card.content.length > 0) {
            if (card.header) {
                const cardDivider = document.createElement('div');
                cardDivider.className = 'nl-card-divider';
                cardEl.appendChild(cardDivider);
            }
            
            card.content.forEach(contentRow => {
                const rowEl = document.createElement('div');
                rowEl.className = 'nl-content-row';
                
                const contentTitle = document.createElement('div');
                contentTitle.className = 'nl-content-title';
                contentTitle.textContent = contentRow.title;
                rowEl.appendChild(contentTitle);
                
                const contentControls = document.createElement('div');
                contentControls.className = 'nl-content-controls';
                
                if (contentRow.settingsIcon) {
                    const settingsIcon = document.createElement('span');
                    settingsIcon.className = 'nl-content-settings';
                    settingsIcon.textContent = '⚙️';
                    if (contentRow.settingsFunc) {
                        settingsIcon.dataset.func = contentRow.settingsFunc;
                    }
                    contentControls.appendChild(settingsIcon);
                }
                
                if (contentRow.toggle) {
                    const toggle = document.createElement('div');
                    toggle.className = `nl-toggle nl-content-toggle ${contentRow.toggleActive ? 'active' : ''}`;
                    if (contentRow.toggleFunc) {
                        toggle.dataset.func = contentRow.toggleFunc;
                    }
                    contentControls.appendChild(toggle);
                }
                
                rowEl.appendChild(contentControls);
                cardEl.appendChild(rowEl);
            });
        }
        
        return cardEl;
    }
    
    rebuildSidebar() {
        
        this.sidebar.remove();
        
        
        this.createSidebar();
        this.bindEvents();
    }
    
    
    destroy() {
        if (this.overlay) this.overlay.remove();
        if (this.guiWindow) this.guiWindow.remove();
        if (this.messageContainer) this.messageContainer.remove();
        
        document.removeEventListener('keydown', this._keyboardHandler);
        window.removeEventListener('resize', this._resizeHandler);
        
        window.__NeverloseGUI_Instance__ = null;
    }
}


window.NeverloseGUI = NeverloseGUI;