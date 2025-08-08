import * as state from './state.js';

export const dom = {
    appContainer: document.getElementById('app-container'),
    chatWindow: document.getElementById('chat-window'),
    mainHeader: document.getElementById('main-header'),
    mainFooter: document.getElementById('main-footer'),
    messageForm: document.getElementById('message-form'),
    messageInput: document.getElementById('message-input'),
    submitButton: document.getElementById('submit-button'),
    sendIcon: document.getElementById('send-icon'),
    stopIcon: document.getElementById('stop-icon'),
    menuButton: document.getElementById('menu-button'),
    newChatButton: document.getElementById('new-chat-button'),
    historySidebar: document.getElementById('history-sidebar'),
    sidebarOverlay: document.getElementById('sidebar-overlay'),
    historyList: document.getElementById('history-list'),
    deleteAllChatsButton: document.getElementById('delete-all-chats'),
    modelSelectButton: document.getElementById('model-select-button'),
    currentModelName: document.getElementById('current-model-name'),
    modelSelectModal: document.getElementById('model-select-modal'),
    modalContent: document.getElementById('modal-content'),
    modelOptionCards: document.querySelectorAll('.model-option-card'),
    attachFileButton: document.getElementById('attach-file-button'),
    imageFileInput: document.getElementById('image-file-input'),
    generalFileInput: document.getElementById('general-file-input'),
    imagePreviewContainer: document.getElementById('image-preview-container'),
    imagePreview: document.getElementById('image-preview'),
    removeImageButton: document.getElementById('remove-image-button'),
    fileInfoText: document.getElementById('file-info-text'),
    historyItemMenu: document.getElementById('history-item-menu'),
    messageItemMenu: document.getElementById('message-item-menu'),
    messageItemMenuOverlay: document.getElementById('message-item-menu-overlay'),
    messageItemMenuContent: document.getElementById('message-item-menu-content'),
    confirmModal: document.getElementById('confirm-modal'),
    confirmModalOverlay: document.getElementById('confirm-modal-overlay'),
    confirmModalContent: document.getElementById('confirm-modal-content'),
    confirmModalMessage: document.getElementById('confirm-modal-message'),
    confirmModalConfirmBtn: document.getElementById('confirm-modal-confirm-btn'),
    confirmModalCancelBtn: document.getElementById('confirm-modal-cancel-btn'),
    renameModal: document.getElementById('rename-modal'),
    renameModalOverlay: document.getElementById('rename-modal-overlay'),
    renameModalContent: document.getElementById('rename-modal-content'),
    renameInput: document.getElementById('rename-input'),
    renameModalConfirmBtn: document.getElementById('rename-modal-confirm-btn'),
    renameModalCancelBtn: document.getElementById('rename-modal-cancel-btn'),
    editModal: document.getElementById('edit-modal'),
    editModalOverlay: document.getElementById('edit-modal-overlay'),
    editModalContent: document.getElementById('edit-modal-content'),
    editInput: document.getElementById('edit-input'),
    editModalConfirmBtn: document.getElementById('edit-modal-confirm-btn'),
    editModalCancelBtn: document.getElementById('edit-modal-cancel-btn'),
    htmlPreviewModal: document.getElementById('html-preview-modal'),
    htmlPreviewOverlay: document.getElementById('html-preview-overlay'),
    htmlPreviewContent: document.getElementById('html-preview-content'),
    htmlPreviewIframe: document.getElementById('html-preview-iframe'),
    htmlPreviewCloseBtn: document.getElementById('html-preview-close-btn'),
    filePopupMenu: document.getElementById('file-popup-menu'),
    selectImageOption: document.getElementById('select-image-option'),
    selectFileOption: document.getElementById('select-file-option'),
    imageGalleryModal: document.getElementById('image-gallery-modal'),
    imageGalleryContent: document.getElementById('image-gallery-content'),
    galleryCloseBtn: document.getElementById('gallery-close-btn'),
    galleryMainImage: document.getElementById('gallery-main-image'),
    galleryPrevBtn: document.getElementById('gallery-prev-btn'),
    galleryNextBtn: document.getElementById('gallery-next-btn'),
    galleryThumbnails: document.getElementById('gallery-thumbnails'),
    galleryDownloadBtn: document.getElementById('gallery-download-btn'),
    settingsButton: document.getElementById('settings-button'),
    settingsModal: document.getElementById('settings-modal'),
    settingsModalContent: document.getElementById('settings-modal-content'),
    themeToggle: document.getElementById('theme-toggle'),
};

const MAX_TEXTAREA_HEIGHT = 160;
const MAX_RADIUS = 28;
const MIN_RADIUS = 20;
export let minTextareaHeight = 0;
let currentGalleryImages = [];
let currentGalleryIndex = 0;

function escapeHTML(str) {
    const p = document.createElement("p");
    p.textContent = str;
    return p.innerHTML;
}

export function setMinTextareaHeight(height) { minTextareaHeight = height; }
export function getCurrentGalleryImageUrl() { return currentGalleryImages[currentGalleryIndex]; }

function getFileIcon(mimeType) {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.startsWith('video/')) return '🎬';
    if (mimeType.startsWith('audio/')) return '🎵';
    if (mimeType.startsWith('application/pdf')) return '📄';
    if (mimeType.startsWith('text/')) return '📝';
    return '📁';
}

export function hideFilePreview() {
    dom.imagePreviewContainer.classList.add('hidden');
    dom.imagePreview.src = '';
    dom.fileInfoText.innerHTML = '';
    dom.imageFileInput.value = '';
    dom.generalFileInput.value = '';
}

export function showFileUploading(fileName) {
    dom.imagePreview.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' class='animate-spin' fill='none' viewBox='0 0 24 24' stroke-width='2' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707'/%3E%3C/svg%3E`;
    dom.fileInfoText.innerHTML = `<div class='flex flex-col'><span class='font-semibold'>${fileName}</span><div class='text-xs text-slate-500'>در حال آپلود... <span class='upload-progress'>0%</span></div></div>`;
    dom.imagePreviewContainer.classList.remove('hidden');
}

export function updateUploadProgress(percent) {
    const progressSpan = dom.fileInfoText.querySelector('.upload-progress');
    if(progressSpan) progressSpan.textContent = `${percent}%`;
}

export function showFileReady(fileName, mimeType, url) {
    const icon = getFileIcon(mimeType);
    if(mimeType.startsWith('image/')) {
        dom.imagePreview.src = url;
    } else {
        dom.imagePreview.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z'%3E%3C/path%3E%3Cpolyline points='13 2 13 9 20 9'%3E%3C/polyline%3E%3C/svg%3E`;
    }
    dom.fileInfoText.innerHTML = `<div class='flex flex-col'><span class='font-semibold'>${icon} ${fileName}</span><span class='text-xs text-green-600'>فایل برای ارسال آماده است.</span></div>`;
    dom.imagePreviewContainer.classList.remove('hidden');
}

export function showFileError(errorMessage) {
    dom.imagePreview.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' /%3E%3C/svg%3E`;
    dom.fileInfoText.innerHTML = `<div class='flex flex-col'><span class='font-semibold text-red-600'>خطا در آپلود</span><span class='text-xs text-red-500'>${errorMessage}</span></div>`;
    dom.imagePreviewContainer.classList.remove('hidden');
    setTimeout(hideFilePreview, 5000);
}

export function handleSuggestionClick(text) {
    dom.messageInput.value = text;
    dom.messageInput.dispatchEvent(new Event('input', { bubbles: true }));
    dom.messageInput.focus();
}

export function runWelcomeAnimation() {
    const chatbotNameContainer = document.querySelector('.chatbot-name');
    const mainTitle = document.querySelector('.main-title');
    const buttons = document.querySelectorAll('.action-button-welcome');
    if (!chatbotNameContainer || !mainTitle || buttons.length === 0) return;
    const textToType = "چت بات آلفا";
    let charIndex = 0;
    const typingSpeed = 90;
    function typeChatbotName() {
        if (charIndex < textToType.length) {
            chatbotNameContainer.textContent += textToType.charAt(charIndex);
            charIndex++;
            setTimeout(typeChatbotName, typingSpeed);
        } else {
            chatbotNameContainer.style.opacity = '1';
            setTimeout(() => { mainTitle.style.opacity = '1'; }, 500);
            setTimeout(() => {
                buttons.forEach((button, index) => {
                    setTimeout(() => {
                        button.style.opacity = '1';
                        button.style.transform = 'translateY(0)';
                    }, index * 120);
                });
            }, 1200);
        }
    }
    chatbotNameContainer.textContent = '';
    typeChatbotName();
}

export function setupCodeBlockActions(container) {
    const codeBlocks = container.querySelectorAll('pre code');
    codeBlocks.forEach(el => {
        if (el.dataset.highlighted === 'yes') return;

        hljs.highlightElement(el);
        el.dataset.highlighted = 'yes';

        const pre = el.parentElement;
        let buttonContainer = pre.querySelector('.code-button-container');
        if (buttonContainer) buttonContainer.remove();
        
        buttonContainer = document.createElement('div');
        buttonContainer.className = 'code-button-container';

        const copyButton = document.createElement('button');
        copyButton.className = 'code-button';
        copyButton.innerHTML = `<span class="copy-text">کپی</span><svg class="copy-tick-icon hidden w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path></svg>`;
        copyButton.onclick = () => {
            navigator.clipboard.writeText(el.innerText).then(() => {
                const copyTextSpan = copyButton.querySelector('.copy-text');
                const copyTickIcon = copyButton.querySelector('.copy-tick-icon');
                if (copyTextSpan && copyTickIcon) {
                    copyTextSpan.classList.add('hidden');
                    copyTickIcon.classList.remove('hidden');
                    setTimeout(() => {
                        copyTickIcon.classList.add('hidden');
                        copyTextSpan.classList.remove('hidden');
                    }, 2000);
                }
            });
        };
        buttonContainer.appendChild(copyButton);

        const languageClass = Array.from(el.classList).find(cls => cls.startsWith('language-'));
        if (languageClass === 'language-html') {
            const runButton = document.createElement('button');
            runButton.className = 'code-button';
            runButton.innerHTML = `<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd"></path></svg><span>اجرا</span>`;
            runButton.onclick = () => { toggleHtmlPreviewModal(true, el.innerText); };
            buttonContainer.appendChild(runButton);
        }
        pre.appendChild(buttonContainer);
    });
}

const createMenuItem = (options) => {
    const { action, format = '', text, icon, isDanger = false, type = 'button' } = options;
    const element = document.createElement(type);
    element.className = `menu-item ${isDanger ? 'danger' : ''}`;
    element.dataset.action = action;
    if (format) element.dataset.format = format;
    element.innerHTML = `${icon}<span>${text}</span><div class="hidden w-4 h-4 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin ml-auto"></div>`;
    return element;
};

const getConversionMenuItems = (action) => `
    ${createMenuItem({ action, format: 'pdf', text: 'تبدیل به PDF', icon: `<svg fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>` }).outerHTML}
    ${createMenuItem({ action, format: 'docx', text: 'تبدیل به Word', icon: `<svg fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H15M2.25 3h1.5M2.25 6h1.5M2.25 9h1.5M2.25 12h1.5M2.25 15h1.5M2.25 18h1.5M4.5 21h15a2.25 2.25 0 002.25-2.25V5.25A2.25 2.25 0 0019.5 3h-15A2.25 2.25 0 002.25 5.25v13.5A2.25 2.25 0 004.5 21z" /></svg>` }).outerHTML}
    ${createMenuItem({ action, format: 'txt', text: 'تبدیل به Text', icon: `<svg fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" /></svg>` }).outerHTML}
    ${createMenuItem({ action, format: 'html', text: 'تبدیل به HTML', icon: `<svg fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" /></svg>` }).outerHTML}
`;

export function renderHistoryList() {
    dom.historyList.innerHTML = '';
    const chatsToDisplay = state.chatSessions.filter(session => session.messages.length > 0 || session.id === state.activeChatId);
    if (chatsToDisplay.length > 0) {
        chatsToDisplay.forEach((session) => {
            const itemContainer = document.createElement('div');
            itemContainer.className = 'history-item flex items-center justify-between rounded-lg';
            const itemLink = document.createElement('a');
            itemLink.href = '#';
            itemLink.className = `flex-grow p-3 truncate transition-colors rounded-lg ${session.id === state.activeChatId ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-semibold' : 'hover:bg-slate-200/60 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-300'}`;
            itemLink.textContent = session.title;
            itemLink.onclick = (e) => { e.preventDefault(); state.setActiveChatId(session.id); renderActiveChat(); renderHistoryList(); toggleSidebar(false); };
            const menuButton = document.createElement('button');
            menuButton.className = 'history-item-button p-2 ml-1 text-slate-500 dark:text-slate-400 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 rounded-full flex-shrink-0';
            menuButton.innerHTML = '<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" /></svg>';
            menuButton.onclick = (e) => showHistoryMenu(e, session.id);
            itemContainer.appendChild(itemLink);
            itemContainer.appendChild(menuButton);
            dom.historyList.appendChild(itemContainer);
        });
    }
}

export function renderActiveChat() {
    dom.chatWindow.innerHTML = '';
    const activeChat = state.getActiveChat();

    if (activeChat && activeChat.messages.length === 0) {
        dom.chatWindow.innerHTML = `<div class="welcome-screen"><div class="welcome-container"><div class="chatbot-name"></div><h1 class="main-title">چطور می‌توانم به شما کمک کنم؟</h1><div class="buttons-grid"><a href="#" class="action-button-welcome" onclick="handleSuggestionClick('یک تصویر هنری از یک فضانورد در حال قدم زدن روی مریخ تولید کن')"><div class="button-icon green-icon">🖼️</div><div class="button-text">تولید عکس</div></a><a href="#" class="action-button-welcome" onclick="handleSuggestionClick('این فایل را خلاصه کن و نکات کلیدی آن را استخراج کن')"><div class="button-icon orange-icon">📄</div><div class="button-text">دسترسی به فایل</div></a><a href="#" class="action-button-welcome" onclick="handleSuggestionClick('آخرین اخبار در مورد هوش مصنوعی را برایم پیدا کن')"><div class="button-icon blue-icon">🔍</div><div class="button-text">جست‌وجو در اینترنت</div></a><a href="#" class="action-button-welcome" onclick="handleSuggestionClick('یک ایده برای برنامه‌ریزی سفر به ایتالیا به من بده')"><div class="button-icon purple-icon">✈️</div><div class="button-text">برنامه‌ریزی سفر</div></a></div></div></div>`;
        runWelcomeAnimation();
    } else if (activeChat && activeChat.messages.length > 0) {
        const lastMessageIndex = activeChat.messages.length - 1;
        const lastUserMessageIndex = state.findLastIndex(activeChat.messages, msg => msg.role === 'user');
        activeChat.messages.forEach((msg, index) => {
            if (msg.isTemporary) return;
            const isLastUser = (index === lastUserMessageIndex);
            const isLastModel = (index === lastMessageIndex && msg.role === 'model');
            addMessageToUI(msg, index, { isLastUser: isLastUser, isLastModel: isLastModel, animate: false });
        });
    }

    if (activeChat) {
        const modelCard = document.querySelector(`.model-option-card[data-model="${activeChat.model}"]`);
        if (modelCard) {
            dom.currentModelName.textContent = modelCard.dataset.name;
        } else {
            const defaultModelCard = dom.modelOptionCards[0];
            activeChat.model = defaultModelCard.dataset.model;
            dom.currentModelName.textContent = defaultModelCard.dataset.name;
        }
        updateRadioButtons();
    }

    requestAnimationFrame(() => { dom.chatWindow.scrollTop = dom.chatWindow.scrollHeight; });
}

export function createMessageActionsHtml(options) {
    const { role, isLastUser, isLastModel, messageObject } = options;
    let buttonsHtml = '';
    const textContent = messageObject?.parts.find(p => p.text)?.text;
    const copyButtonHtml = `<button data-action="copy" title="کپی" class="action-button relative"><svg class="w-4 h-4 copy-icon" fill="currentColor" viewBox="0 0 24 24"><path d="M16 1H4c-1.1 0-2 .9-2 2v12h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2z"/></svg><svg class="w-4 h-4 check-icon hidden text-green-500" fill="none" viewBox="0 0 24 24" stroke-width="3" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg><span class="copy-feedback">کپی شد!</span></button>`;
    const menuButtonHtml = `<button data-action="show-message-menu" title="گزینه‌های بیشتر" class="action-button"><svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg></button>`;

    if (role === 'user') {
        if (textContent) {
            buttonsHtml += copyButtonHtml;
        }
        if (isLastUser && textContent) {
            buttonsHtml += `<button data-action="edit" title="ویرایش" class="action-button"><svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg></button>`;
        }
        buttonsHtml += menuButtonHtml;
    }

    if (role === 'model') {
        const hasTextContent = messageObject?.parts.some(p => p.text);
        const hasDownloadableContent = messageObject?.parts.some(p => p.image_url || p.edited_images);
        const isClarification = !!messageObject?.clarification;
        const isGpuGuide = !!messageObject?.isGpuGuide;

        if (hasDownloadableContent) {
            buttonsHtml += `<button data-action="download-image" title="دانلود تصویر" class="action-button"><svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg></button>`;
        }
        
        if (hasTextContent) {
            buttonsHtml += copyButtonHtml;
        }
        
        if (isLastModel && !isClarification && !isGpuGuide) {
            buttonsHtml += `<button data-action="regenerate" title="تولید مجدد" class="action-button"><svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 6v3l4-4-4-4v3c-4.42 0-8 3.58-8 8 0 1.57.46 3.03 1.24 4.26L6.7 14.8c-.45-.83-.7-1.79-.7-2.8 0-3.31 2.69-6 6-6zm6.76 1.74L17.3 9.2c.44.84.7 1.79.7 2.8 0 3.31-2.69 6-6 6v-3l-4 4 4 4v-3c4.42 0 8-3.58 8-8 0-1.57-.46-3.03-1.24-4.26z"/></svg></button>`;
        }
        
        if (hasTextContent && !isClarification && !isGpuGuide) {
             buttonsHtml += `<button data-action="like" title="پسندیدم" class="action-button"><svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"/></svg></button><button data-action="dislike" title="نپسندیدم" class="action-button"><svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M15 3H6c-.83 0-1.54.5-1.84 1.22l-3.02 7.05c-.09.23-.14.47-.14-.73v2c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41-.17-.79-.44 1.06L9.83 23l6.59-6.59c.36-.36.58-.86.58-1.41V5c0-1.1-.9-2-2-2zm4 0v12h4V3h-4z"/></svg></button>`;
        }
        buttonsHtml += menuButtonHtml;
    }
    return buttonsHtml ? `<div class="message-actions"><div class="flex items-center gap-1.5">${buttonsHtml}</div></div>` : '';
}

function createFileContentHtml(filePart) {
    const { fileUrl, mimeType, name } = filePart;
    let fileHtml = '';

    if (mimeType.startsWith('image/')) {
        fileHtml = `<img src="${fileUrl}" alt="${name}" class="rounded-lg mb-2 max-w-xs sm:max-w-sm md:max-w-md">`;
    } else if (mimeType.startsWith('video/')) {
        fileHtml = `<video controls src="${fileUrl}" class="rounded-lg mb-2 max-w-xs sm:max-w-sm md:max-w-md"></video>`;
    } else if (mimeType.startsWith('audio/')) {
        fileHtml = `<audio controls src="${fileUrl}" class="w-full max-w-xs"></audio>`;
    } else {
        fileHtml = `<div class="flex items-center gap-3 p-3 bg-slate-100 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-sm">
                        <svg class="w-8 h-8 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                        <div class="flex flex-col overflow-hidden">
                            <span class="font-semibold truncate">${name}</span>
                            <a href="${fileUrl}" target="_blank" rel="noopener noreferrer" class="text-xs text-blue-600 hover:underline">دانلود فایل</a>
                        </div>
                    </div>`;
    }
    return fileHtml;
}

export function addMessageToUI(message, index, options = {}, existingElement = null) {
    const { role, parts } = message;
    const { isLastUser = false, isLastModel = false, animate = true } = options;
    const isUser = role === 'user';
    const messageId = `msg-${Date.now()}-${index}`;

    let finalElement = existingElement;

    if (!finalElement) {
        finalElement = document.createElement('div');
        finalElement.className = `message-entry mb-6 flex items-end gap-3 ${isUser ? 'justify-end' : 'justify-start'}`;
        finalElement.dataset.index = index;
        if (animate) finalElement.classList.add('message-entry');

        const messageBubbleClasses = isUser 
            ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100' 
            : 'bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200';
            
        const userIcon = `<div class=\"w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 bg-blue-600 text-white\"><svg class=\"w-6 h-6\" fill=\"none\" viewBox=\"0 0 24 24\" stroke-width=\"1.5\" stroke=\"currentColor\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z\"></path></svg></div>`
        const modelIcon = `<div class=\"w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 bg-emerald-600 text-white\"><svg class=\"w-6 h-6\" fill=\"none\" viewBox=\"0 0 24 24\" stroke-width=\"1.5\" stroke=\"currentColor\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z\"></path></svg></div>`}
        
        finalElement.innerHTML = `
            ${!isUser ? modelIcon : ''}
            <div class="relative group w-11/12 md:max-w-2xl">
                <div id="${messageId}" class="p-4 rounded-xl ${messageBubbleClasses}">
                    <div class="message-content-area"></div>
                </div>
            </div>
            ${isUser ? userIcon : ''}
        `;
        dom.chatWindow.appendChild(finalElement);
    }
    
    const contentArea = finalElement.querySelector('.message-content-area');
    contentArea.innerHTML = '';

    if (message.clarification) {
        let contentHtml = `<p class="mb-4 text-slate-700 dark:text-slate-300">${message.question}</p>`;
        contentHtml += '<div class="flex flex-col gap-3">';
        const optionsData = message.clarification;
        const editIcon = `<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 011.941-5.585L14.25 6l5.5 5.5-3.094 3.093a4.5 4.5 0 01-5.585 1.941z"></path><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 3.75l5.5 5.5"></path></svg>`;
        const regenerateIcon = `<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0011.664 0l3.181-3.183m-4.991-2.695v4.992m0 0h-4.992m4.992 0l-3.181-3.183a8.25 8.25 0 00-11.664 0l-3.181 3.183"></path></svg>`;
        if (optionsData.edit) {
            const editPayload = JSON.stringify(optionsData.edit);
            contentHtml += `<button class="clarification-button glass-button" data-action-payload='${editPayload}'>${editIcon}<span>${optionsData.edit.label}</span></button>`;
        }
        if (optionsData.regenerate) {
            const regeneratePayload = JSON.stringify(optionsData.regenerate);
            contentHtml += `<button class="clarification-button glass-button" data-action-payload='${regeneratePayload}'>${regenerateIcon}<span>${optionsData.regenerate.label}</span></button>`;
        }
        contentHtml += '</div>';
        contentArea.innerHTML = contentHtml;
    } else if (parts && parts.length > 0) {
        let allContent = '';
        parts.forEach(part => {
            if (isUser && part.fileUrl) allContent += createFileContentHtml(part);
            if (part.image_url) allContent += `<img src="${part.image_url}" alt="generated image" class="rounded-lg max-w-full">`;
            if (part.edited_images && Array.isArray(part.edited_images)) {
                const imageUrlsString = JSON.stringify(part.edited_images);
                let galleryHtml = `<div class="grid grid-cols-2 gap-2 js-image-gallery-grid" data-urls='${imageUrlsString}'>`;
                part.edited_images.forEach((url, i) => {
                    galleryHtml += `<div class="relative group cursor-pointer" data-index="${i}"><img src="${url}" alt="edited image" class="pointer-events-none rounded-lg w-full h-full object-cover"></div>`;
                });
                galleryHtml += '</div>';
                allContent += galleryHtml;
            }
            if (part.text) {
                if (isUser) {
                    const escapedText = escapeHTML(part.text);
                    allContent += `<div class="whitespace-pre-wrap">${escapedText}</div>`;
                } else {
                    const parsedText = marked.parse(part.text, { breaks: true, gfm: true });
                    allContent += `<div class="prose prose-sm md:prose-base max-w-none dark:prose-invert">${parsedText}</div>`;
                }
            }
        });
        contentArea.innerHTML = allContent;
    } else if (!isUser) {
        contentArea.innerHTML = `<div class="typing-indicator"><span></span><span></span><span></span></div>`;
    }

    if (!isUser) {
        setupCodeBlockActions(contentArea);
    }

    updateMessageActions(finalElement, message, isLastUser, isLastModel);
    
    finalElement.scrollIntoView({ behavior: 'smooth', block: 'end' });
    return finalElement;
}

export function showStatusUpdate(message, modelBubbleOuterDivElement) {
    const contentArea = modelBubbleOuterDivElement.querySelector('.message-content-area');
    let statusDiv = modelBubbleOuterDivElement.querySelector('.status-update-area');
    
    const typingIndicator = contentArea.querySelector('.typing-indicator');
    if (typingIndicator) typingIndicator.remove();
    
    if (!statusDiv) {
        statusDiv = document.createElement('div');
        statusDiv.className = 'status-update-area p-2 text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2 mt-3 border-t border-slate-200/50 dark:border-slate-600/50';
        contentArea.prepend(statusDiv);
    }
    statusDiv.innerHTML = `<div class="typing-indicator" style="height:16px; gap: 3px;"><span style="width:6px; height:6px;"></span><span style="width:6px; height:6px;"></span><span style="width:6px; height:6px;"></span></div><p>${message}</p>`;
    requestAnimationFrame(() => { dom.chatWindow.scrollTop = dom.chatWindow.scrollHeight; });
}

export function addPartialResult(data, modelBubbleOuterDivElement) {
    const contentArea = modelBubbleOuterDivElement.querySelector('.message-content-area');
    const partialResultDiv = document.createElement('div');
    partialResultDiv.className = 'partial-result-container border-t border-slate-200/50 mt-2 pt-2';
    
    if (data.contentType === 'image' && data.url) {
        partialResultDiv.innerHTML = `<img src="${data.url}" alt="partial result" class="rounded-lg max-w-xs mx-auto my-2">`;
    } else if (data.contentType === 'code' && data.content) {
        partialResultDiv.innerHTML = `<div class="prose prose-sm md:prose-base max-w-none dark:prose-invert">${marked.parse(data.content, { breaks: true, gfm: true })}</div>`;
        setupCodeBlockActions(partialResultDiv);
    }
    
    const statusDiv = contentArea.querySelector('.status-update-area');
    if (statusDiv) {
        contentArea.insertBefore(partialResultDiv, statusDiv);
    } else {
        contentArea.appendChild(partialResultDiv);
    }
}

export function streamFinalText(text, modelBubbleOuterDivElement) {
    const contentArea = modelBubbleOuterDivElement.querySelector('.message-content-area');
    let finalTextArea = contentArea.querySelector('.final-text-area');

    if (!finalTextArea) {
        contentArea.innerHTML = '';
        
        finalTextArea = document.createElement('div');
        finalTextArea.className = 'final-text-area prose prose-sm md:prose-base max-w-none dark:prose-invert';
        contentArea.appendChild(finalTextArea);
    }

    finalTextArea.innerHTML = marked.parse(text, { breaks: true, gfm: true });
    
    setupCodeBlockActions(finalTextArea);
    
    requestAnimationFrame(() => { dom.chatWindow.scrollTop = dom.chatWindow.scrollHeight; });
}

export function updateMessageActions(messageOuterDivElement, messageObject, isLastUser, isLastModel) {
    const messageWrapper = messageOuterDivElement.querySelector('.group');
    if (!messageWrapper) return;
    let oldActionsContainer = messageWrapper.querySelector('.message-actions');
    if (oldActionsContainer) { oldActionsContainer.remove(); }
    const newActionsHtml = createMessageActionsHtml({ role: messageObject.role, isLastUser: isLastUser, isLastModel: isLastModel, messageObject: messageObject });
    if (newActionsHtml) { messageWrapper.insertAdjacentHTML('beforeend', newActionsHtml); }
}

export function adjustTextareaHeight(el, formEl = null) {
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;

    if (formEl) {
        const currentHeight = el.scrollHeight;
        const heightRange = MAX_TEXTAREA_HEIGHT - minTextareaHeight;
        if (heightRange > 0) {
            const progress = Math.max(0, Math.min(1, (currentHeight - minTextareaHeight) / heightRange));
            const radiusRange = MAX_RADIUS - MIN_RADIUS;
            const newRadius = MAX_RADIUS - (radiusRange * progress);
            formEl.style.borderRadius = `${newRadius}px`;
        }
    }
}

export function showCopyFeedback(button) {
    const copyIcon = button.querySelector('.copy-icon');
    const checkIcon = button.querySelector('.check-icon');
    const feedback = button.querySelector('.copy-feedback');
    if (copyIcon && checkIcon && feedback) {
        copyIcon.classList.add('hidden');
        checkIcon.classList.remove('hidden');
        feedback.classList.add('visible');
        setTimeout(() => {
           copyIcon.classList.remove('hidden');
           checkIcon.classList.add('hidden');
           feedback.classList.remove('visible');
        }, 2000);
    }
}

export function handleLikeDislike(button, messageEntry) {
    const isActive = button.classList.toggle('active');
    if (isActive) {
        button.classList.add('like-animation');
        button.addEventListener('animationend', () => button.classList.remove('like-animation'), { once: true });
        const action = button.dataset.action;
        const siblingAction = action === 'like' ? 'dislike' : 'like';
        const siblingButton = messageEntry.querySelector(`[data-action="${siblingAction}"]`); 
        if (siblingButton) siblingButton.classList.remove('active');
    }
}

export function resetState() {
    state.setGenerating(false);
    dom.submitButton.classList.remove('is-loading');
    dom.submitButton.title = 'ارسال';
    dom.submitButton.disabled = false;
    dom.messageInput.disabled = false;
    dom.attachFileButton.disabled = false;
    state.setGlobalAbortController(null);
    if (state.currentImageEventSource) {
        state.currentImageEventSource.close();
        state.setCurrentImageEventSource(null);
    }
}

export function setGeneratingState(generating) {
    state.setGenerating(generating);
    if (generating) {
        state.setGlobalAbortController(new AbortController());
        dom.submitButton.classList.add('is-loading');
        dom.submitButton.title = 'توقف تولید';
        dom.submitButton.disabled = false;
        dom.messageInput.disabled = true;
        dom.attachFileButton.disabled = true;
    } else {
        resetState();
    }
}

export function displayError(modelBubbleOuterDivElement, errorMessage, errorType = 'generic') {
    const messageBubbleContentDiv = modelBubbleOuterDivElement.querySelector('.message-content-area');
    const messageWrapper = modelBubbleOuterDivElement.querySelector('.group');
    
    let oldActionsContainer = messageWrapper.querySelector('.message-actions');
    if (oldActionsContainer) { oldActionsContainer.remove(); }

    if (errorType === 'gpu_quota_exceeded') {
        state.setGpuGuideState(true);
        const activeChat = state.getActiveChat();
        if(activeChat) {
             const lastMsg = activeChat.messages[activeChat.messages.length - 1];
             if(lastMsg) lastMsg.isGpuGuide = true;
             state.saveSessions();
        }

        let content = `
            <div class="gpu-error-guide">
                <p class="font-semibold mb-3">متاسفانه با محدودیت موقت سرور مواجه شدیم. برای رفع آن، لطفا نوع اینترنت خود را انتخاب کنید:</p>
                <div class="flex gap-2 mb-3" id="internet-type-selector">
                    <button class="clarification-button flex-1" data-type="sim">📱 سیم‌کارت</button>
                    <button class="clarification-button flex-1" data-type="wifi">📶 وای‌فای</button>
                </div>
                <div id="instructions-container" class="text-sm mt-3 p-3 bg-slate-100 dark:bg-slate-700/50 rounded-md" style="display: none;"></div>
            </div>`;
        messageBubbleContentDiv.innerHTML = content;
        
        const container = messageBubbleContentDiv.querySelector('.gpu-error-guide');
        const instructionsContainer = container.querySelector('#instructions-container');

        const showInstructions = (type) => {
            instructionsContainer.style.display = 'block';
            if (type === 'sim') {
                instructionsContainer.innerHTML = `<p><strong>راه حل (سیم‌کارت):</strong></p><ol class="list-decimal list-inside pr-4 mt-2 space-y-1"><li>اگر فیلترشکن شما روشن است، آن را <strong>خاموش</strong> کنید.</li><li>گوشی را برای <strong>۱۰ ثانیه</strong> در حالت هواپیما قرار دهید.</li><li>حالت هواپیما را <strong>خاموش</strong> کنید.</li></ol>`;
            } else {
                instructionsContainer.innerHTML = `<p><strong>راه حل (وای‌فای):</strong></p><ol class="list-decimal list-inside pr-4 mt-2 space-y-1"><li>مودم وای‌فای خود را برای <strong>۳۰ ثانیه</strong> از برق بکشید.</li><li>دوباره مودم را به برق وصل کرده و منتظر بمانید تا روشن شود.</li></ol>`;
            }
        };

        container.querySelector('[data-type="sim"]').onclick = () => showInstructions('sim');
        container.querySelector('[data-type="wifi"]').onclick = () => showInstructions('wifi');

    } else {
        const errorIcon = `<svg class="w-6 h-6 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"></path></svg>`;
        messageBubbleContentDiv.innerHTML = `${errorIcon}<p class="whitespace-pre-wrap">${errorMessage}</p>`;
    }

    messageBubbleContentDiv.parentElement.className = 'p-4 rounded-2xl shadow-sm relative flex items-center bg-red-100 dark:bg-red-800/20 border border-red-200 dark:border-red-600/30 text-red-800 dark:text-red-300 rounded-bl-none';
    
    const regenerateButtonHtml = `<button data-action="regenerate" title="تلاش مجدد" class="action-button"><svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 6v3l4-4-4-4v3c-4.42 0-8 3.58-8 8 0 1.57.46 3.03 1.24 4.26L6.7 14.8c-.45-.83-.7-1.79-.7-2.8 0-3.31 2.69-6 6-6zm6.76 1.74L17.3 9.2c.44.84.7 1.79.7 2.8 0 3.31-2.69 6-6 6v-3l-4 4 4 4v-3c4.42 0 8-3.58 8-8 0-1.57-.46-3.03-1.24-4.26z"></path></svg></button>`;
    const newActionsHtml = `<div class="message-actions"><div class="flex items-center gap-1.5">${regenerateButtonHtml}</div></div>`;
    if (messageWrapper) {
        messageWrapper.insertAdjacentHTML('beforeend', newActionsHtml);
    }
    
    resetState();
}

function showImageInGallery(index) {
    if (index < 0 || index >= currentGalleryImages.length) return;
    currentGalleryIndex = index;
    const newImageUrl = currentGalleryImages[index];

    dom.galleryMainImage.style.opacity = '0';
    setTimeout(() => {
        dom.galleryMainImage.src = newImageUrl;
        dom.galleryMainImage.style.opacity = '1';
    }, 150);

    const thumbnails = dom.galleryThumbnails.querySelectorAll('.gallery-thumb');
    thumbnails.forEach((thumb, i) => {
        thumb.classList.toggle('active', i === index);
        if (i === index) {
            thumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
    });
}

const handleGalleryKeyDown = (e) => {
    if (e.key === 'ArrowRight') showImageInGallery((currentGalleryIndex + 1) % currentGalleryImages.length);
    else if (e.key === 'ArrowLeft') showImageInGallery((currentGalleryIndex - 1 + currentGalleryImages.length) % currentGalleryImages.length);
    else if (e.key === 'Escape') closeImageGallery();
};

export function openImageGallery(imageUrlsString, startIndex) {
    try {
        currentGalleryImages = JSON.parse(imageUrlsString);
    } catch (e) {
        console.error("Failed to parse image URLs for gallery:", e);
        return;
    }

    if (!currentGalleryImages || currentGalleryImages.length === 0) return;
    
    dom.galleryThumbnails.innerHTML = '';
    currentGalleryImages.forEach((url, index) => {
        const thumb = document.createElement('img');
        thumb.src = url;
        thumb.className = 'gallery-thumb';
        thumb.onclick = () => showImageInGallery(index);
        dom.galleryThumbnails.appendChild(thumb);
    });

    showImageInGallery(startIndex);
    
    dom.imageGalleryModal.classList.remove('hidden');
    requestAnimationFrame(() => {
        dom.imageGalleryModal.classList.add('visible');
    });

    dom.galleryCloseBtn.onclick = closeImageGallery;
    dom.imageGalleryModal.onclick = (e) => { if (e.target === dom.imageGalleryModal) closeImageGallery(); };
    dom.galleryNextBtn.onclick = () => showImageInGallery((currentGalleryIndex + 1) % currentGalleryImages.length);
    dom.galleryPrevBtn.onclick = () => showImageInGallery((currentGalleryIndex - 1 + currentGalleryImages.length) % currentGalleryImages.length);
    window.addEventListener('keydown', handleGalleryKeyDown);
}

function closeImageGallery() {
    dom.imageGalleryModal.classList.remove('visible');
    setTimeout(() => {
        dom.imageGalleryModal.classList.add('hidden');
        dom.galleryMainImage.src = '';
    }, 300);
    window.removeEventListener('keydown', handleGalleryKeyDown);
}

export function toggleSidebar(show) {
    if (show) {
        dom.sidebarOverlay.classList.remove('hidden');
        requestAnimationFrame(() => {
            dom.sidebarOverlay.style.opacity = '1';
            dom.historySidebar.style.transform = 'translateX(0)';
        });
    } else {
        dom.sidebarOverlay.style.opacity = '0';
        dom.historySidebar.style.transform = 'translateX(-100%)';
        setTimeout(() => dom.sidebarOverlay.classList.add('hidden'), 300);
    }
}

export function toggleModal(show) {
    if (show) {
        dom.modelSelectModal.classList.remove('hidden');
        requestAnimationFrame(() => {
            dom.modelSelectModal.style.opacity = '1';
            dom.modalContent.style.opacity = '1';
            dom.modalContent.style.transform = 'scale(1)';
        });
    } else {
        dom.modelSelectModal.style.opacity = '0';
        dom.modalContent.style.opacity = '0';
        dom.modalContent.style.transform = 'scale(0.95)';
        setTimeout(() => dom.modelSelectModal.classList.add('hidden'), 200);
    }
}

export function toggleEditModal(show) {
    if (show) {
        dom.editModal.classList.remove('hidden');
        requestAnimationFrame(() => {
            dom.editModalOverlay.style.opacity = '1';
            dom.editModalContent.style.opacity = '1';
            dom.editModalContent.style.transform = 'scale(1)';
            dom.editInput.focus();
        });
    } else {
        dom.editModalOverlay.style.opacity = '0';
        dom.editModalContent.style.opacity = '0';
        dom.editModalContent.style.transform = 'scale(0.95)';
        setTimeout(() => dom.editModal.classList.add('hidden'), 300);
    }
}

export function toggleHtmlPreviewModal(show, htmlContent = '') {
    if (show) {
        dom.htmlPreviewIframe.srcdoc = htmlContent;
        dom.htmlPreviewModal.classList.remove('hidden');
        requestAnimationFrame(() => {
            dom.htmlPreviewOverlay.style.opacity = '1';
            dom.htmlPreviewContent.style.opacity = '1';
            dom.htmlPreviewContent.style.transform = 'scale(1)';
        });
    } else {
        dom.htmlPreviewOverlay.style.opacity = '0';
        dom.htmlPreviewContent.style.opacity = '0';
        dom.htmlPreviewContent.style.transform = 'scale(0.95)';
        setTimeout(() => {
            dom.htmlPreviewModal.classList.add('hidden');
            dom.htmlPreviewIframe.srcdoc = ''; 
        }, 300);
    }
}

export function toggleFilePopupMenu(show) {
    if (show) {
        const buttonRect = dom.attachFileButton.getBoundingClientRect();
        dom.filePopupMenu.style.bottom = `${window.innerHeight - buttonRect.top + 8}px`; 
        dom.filePopupMenu.style.left = `${buttonRect.left}px`; 
        dom.filePopupMenu.classList.remove('hidden');
        requestAnimationFrame(() => {
            dom.filePopupMenu.classList.add('visible');
        });
    } else {
        dom.filePopupMenu.classList.remove('visible');
        setTimeout(() => {
            dom.filePopupMenu.classList.add('hidden');
        }, 200); 
    }
}

export function updateRadioButtons() {
    const activeChat = state.getActiveChat();
    if (!activeChat) return;
    dom.modelOptionCards.forEach(card => {
        const radioIcon = card.querySelector('.radio-icon');
        const innerDot = card.querySelector('.inner-dot');
        const isSelected = card.dataset.model === activeChat.model;
        radioIcon.classList.toggle('border-blue-500', isSelected);
        radioIcon.classList.toggle('dark:border-blue-400', isSelected);
        innerDot.classList.toggle('hidden', !isSelected);
    });
}

export function showHistoryMenu(event, sessionId) {
    event.stopPropagation();
    const menu = dom.historyItemMenu;

    menu.innerHTML = `
        ${createMenuItem({ action: 'rename', text: 'تغییر نام گفتگو', icon: `<svg fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" /></svg>` }).outerHTML}
        <div class="menu-divider"></div>
        ${getConversionMenuItems('convert-chat')}
        <div class="menu-divider"></div>
        ${createMenuItem({ action: 'delete', text: 'حذف گفتگو', icon: `<svg fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>`, isDanger: true }).outerHTML}
    `;

    menu.dataset.sessionId = sessionId;

    const buttonRect = event.currentTarget.getBoundingClientRect();
    const menuHeight = 220;
    const margin = 8;
    
    let top = buttonRect.bottom + margin;
    let left = buttonRect.left;
    
    if (top + menuHeight > window.innerHeight) {
        top = buttonRect.top - menuHeight - margin;
    }
    
    menu.style.top = `${top}px`;
    menu.style.left = `${left}px`;
    menu.style.right = 'auto';
    menu.style.transformOrigin = (top > buttonRect.top) ? 'bottom left' : 'top left';

    menu.classList.add('visible');
    const closeMenu = () => {
        menu.classList.remove('visible');
        window.removeEventListener('click', closeMenu);
    };
    window.addEventListener('click', closeMenu, { once: true });
}

export function showMessageMenu(event, messageIndex) {
    event.stopPropagation();
    const menu = dom.messageItemMenu;
    const menuContent = dom.messageItemMenuContent;
    const activeChat = state.getActiveChat();
    const message = activeChat.messages[messageIndex];
    if (!message) return;

    const textPart = message.parts.find(p => p.text);
    const textContent = textPart ? textPart.text : '[محتوای غیر متنی]';

    let menuItemsHtml = '';
    if (message.role === 'model' && textPart) {
        menuItemsHtml += getConversionMenuItems('convert-message');
        menuItemsHtml += '<div class="menu-divider"></div>';
    }
    
    menuItemsHtml += createMenuItem({ 
        action: 'delete-message', 
        text: 'حذف پیام', 
        icon: `<svg fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>`, 
        isDanger: true 
    }).outerHTML;
    
    const escapedContent = escapeHTML(textContent);

    menuContent.innerHTML = `
        <div class="message-preview-container">
            <p class="message-preview-text">${escapedContent}</p>
        </div>
        ${menuItemsHtml}
    `;

    menu.dataset.messageIndex = messageIndex;

    menu.classList.remove('hidden');
    requestAnimationFrame(() => {
        menu.classList.add('visible');
    });
}

export function showConfirmModal(message, onConfirm) {
    dom.confirmModalMessage.textContent = message;
    dom.confirmModal.classList.remove('hidden');
    requestAnimationFrame(() => {
        dom.confirmModalOverlay.style.opacity = '1';
        dom.confirmModalContent.style.opacity = '1';
        dom.confirmModalContent.style.transform = 'scale(1)';
    });
    const hide = () => {
        dom.confirmModalOverlay.style.opacity = '0';
        dom.confirmModalContent.style.opacity = '0';
        dom.confirmModalContent.style.transform = 'scale(0.95)';
        setTimeout(() => dom.confirmModal.classList.add('hidden'), 300);
    };
    dom.confirmModalConfirmBtn.onclick = () => { onConfirm(); hide(); };
    dom.confirmModalCancelBtn.onclick = hide;
    dom.confirmModalOverlay.onclick = hide;
}

export function showRenameModal(currentTitle, onConfirm) {
    dom.renameInput.value = currentTitle;
    dom.renameModal.classList.remove('hidden');
    requestAnimationFrame(() => {
        dom.renameModalOverlay.style.opacity = '1';
        dom.renameModalContent.style.opacity = '1';
        dom.renameModalContent.style.transform = 'scale(1)';
        dom.renameInput.focus();
        dom.renameInput.select();
    });
    const hide = () => {
        dom.renameModalOverlay.style.opacity = '0';
        dom.renameModalContent.style.opacity = '0';
        dom.renameModalContent.style.transform = 'scale(0.95)';
        setTimeout(() => dom.renameModal.classList.add('hidden'), 300);
    };
    dom.renameModalContent.onsubmit = (e) => {
        e.preventDefault();
        const newTitle = dom.renameInput.value.trim();
        if (newTitle) { onConfirm(newTitle); }
        hide();
    };
    dom.renameModalCancelBtn.onclick = hide;
    dom.renameModalOverlay.onclick = hide;
}

export function showEditModal(currentText, onConfirm) {
    dom.editInput.value = currentText;
    toggleEditModal(true); 
    dom.editModalContent.onsubmit = (e) => {
        e.preventDefault();
        const newText = dom.editInput.value.trim();
        if (newText === '') { 
             showConfirmModal('متن پیام شما خالی است. آیا مایل به حذف پیام هستید؟', () => { onConfirm(''); });
        } else if (newText !== currentText) {
            onConfirm(newText);
        }
        toggleEditModal(false);
    };
    dom.editModalCancelBtn.onclick = () => toggleEditModal(false);
    dom.editModalOverlay.onclick = () => toggleEditModal(false);
}

export function setupMobileKeyboardFix() {
    if ('visualViewport' in window) {
        const handleViewportResize = () => {
            const vp = window.visualViewport;
            document.body.style.height = `${vp.height}px`;
            document.body.style.top = `${vp.offsetTop}px`;
            dom.mainFooter.scrollIntoView({ behavior: "instant", block: "end" });
        };
        window.visualViewport.addEventListener('resize', handleViewportResize);
        handleViewportResize();
    }
}

export function showLoadingOnButton(button, isLoading) {
    const spinner = button.querySelector('.animate-spin');
    const textSpan = button.querySelector('span');
    if (isLoading) {
        button.disabled = true;
        if(textSpan) textSpan.style.opacity = '0.5';
        if(spinner) spinner.classList.remove('hidden');
    } else {
        button.disabled = false;
        if(textSpan) textSpan.style.opacity = '1';
        if(spinner) spinner.classList.add('hidden');
    }
}

export function applyTheme(theme) {
    if (theme === 'dark') {
        document.documentElement.classList.add('dark');
        dom.themeToggle.checked = true;
    } else {
        document.documentElement.classList.remove('dark');
        dom.themeToggle.checked = false;
    }
}

export function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        applyTheme(savedTheme);
    } else {
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        applyTheme(systemPrefersDark ? 'dark' : 'light');
    }
}

export function toggleSettingsModal(show) {
    const modal = dom.settingsModal;
    const content = dom.settingsModalContent;
    if (show) {
        modal.classList.remove('hidden');
        requestAnimationFrame(() => {
            modal.style.opacity = '1';
            content.style.opacity = '1';
            content.style.transform = 'scale(1)';
        });
    } else {
        modal.style.opacity = '0';
        content.style.opacity = '0';
        content.style.transform = 'scale(0.95)';
        setTimeout(() => modal.classList.add('hidden'), 200);
    }
}
