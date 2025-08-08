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
    newChatButton: document.getElementById('new-chat-btn'),
    historySidebar: document.getElementById('history-sidebar'),
    sidebarOverlay: document.getElementById('sidebar-overlay'),
    historyList: document.getElementById('history-list'),
    deleteAllChatsButton: document.getElementById('delete-all-chats'),
    modelSelectButton: document.getElementById('model-select-button'),
    currentModelName: document.getElementById('current-model-name'),
    modelSelectModal: document.getElementById('model-select-modal'),
    modalContent: document.getElementById('modal-content'),
    modelOptionCards: document.querySelectorAll('.model-option'),
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
    welcomeScreen: document.getElementById('welcome-screen'),
    messagesContainer: document.getElementById('messages-container'),
};

const MAX_TEXTAREA_HEIGHT = 200;
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

// Welcome Screen Functions
export function showWelcomeScreen() {
    if (dom.welcomeScreen) {
        dom.welcomeScreen.style.display = 'flex';
    }
    if (dom.messagesContainer) {
        dom.messagesContainer.style.display = 'none';
    }
}

export function hideWelcomeScreen() {
    if (dom.welcomeScreen) {
        dom.welcomeScreen.style.display = 'none';
    }
    if (dom.messagesContainer) {
        dom.messagesContainer.style.display = 'block';
    }
}

export function hideFilePreview() {
    if (dom.imagePreviewContainer) {
        dom.imagePreviewContainer.classList.remove('flex');
        dom.imagePreviewContainer.classList.add('hidden');
    }
}

export function showFilePreview() {
    if (dom.imagePreviewContainer) {
        dom.imagePreviewContainer.classList.remove('hidden');
        dom.imagePreviewContainer.classList.add('flex');
    }
}

export function showFileUploading(fileName) {
    if (dom.fileInfoText) {
        dom.fileInfoText.textContent = `در حال آپلود: ${fileName}...`;
    }
    showFilePreview();
}

export function updateUploadProgress(percent) {
    if (dom.fileInfoText) {
        dom.fileInfoText.textContent = `آپلود: ${percent}%`;
    }
}

export function showFileReady(fileName, mimeType, url) {
    const icon = getFileIcon(mimeType);
    if (dom.fileInfoText) {
        dom.fileInfoText.textContent = `${icon} ${fileName}`;
    }
    
    if (mimeType.startsWith('image/') && dom.imagePreview) {
        dom.imagePreview.src = url;
        dom.imagePreview.style.display = 'block';
    } else if (dom.imagePreview) {
        dom.imagePreview.style.display = 'none';
    }
    
    showFilePreview();
}

export function showFileError(errorMessage) {
    if (dom.fileInfoText) {
        dom.fileInfoText.textContent = `خطا: ${errorMessage}`;
    }
    showFilePreview();
    setTimeout(hideFilePreview, 3000);
}

export function toggleFilePopupMenu(show) {
    if (!dom.filePopupMenu) return;
    
    if (show) {
        dom.filePopupMenu.classList.remove('hidden');
        setTimeout(() => dom.filePopupMenu.classList.add('visible'), 10);
    } else {
        dom.filePopupMenu.classList.remove('visible');
        setTimeout(() => dom.filePopupMenu.classList.add('hidden'), 200);
    }
}

export function toggleSidebar(show) {
    if (!dom.historySidebar || !dom.sidebarOverlay) return;
    
    if (show) {
        dom.historySidebar.classList.add('visible');
        dom.sidebarOverlay.classList.add('visible');
    } else {
        dom.historySidebar.classList.remove('visible');
        dom.sidebarOverlay.classList.remove('visible');
    }
}

export function toggleModal(show) {
    if (dom.modelSelectModal) {
        if (show) {
            dom.modelSelectModal.classList.add('visible');
        } else {
            dom.modelSelectModal.classList.remove('visible');
        }
    }
}

export function toggleSettingsModal(show) {
    if (dom.settingsModal) {
        if (show) {
            dom.settingsModal.classList.add('visible');
        } else {
            dom.settingsModal.classList.remove('visible');
        }
    }
}

export function updateRadioButtons() {
    // Update radio button states for model selection
    const activeChat = state.getActiveChat();
    if (!activeChat) return;
    
    const modelOptions = document.querySelectorAll('.model-option');
    modelOptions.forEach(option => {
        const dot = option.querySelector('.inner-dot');
        if (option.dataset.model === activeChat.model) {
            dot?.classList.remove('hidden');
        } else {
            dot?.classList.add('hidden');
        }
    });
}

export function renderHistoryList() {
    if (!dom.historyList) return;
    
    dom.historyList.innerHTML = '';
    
    state.chatSessions.forEach(session => {
        const historyItem = document.createElement('div');
        historyItem.className = `history-item ${session.id === state.activeChatId ? 'active' : ''}`;
        historyItem.dataset.sessionId = session.id;
        
        historyItem.innerHTML = `
            <svg class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span class="history-item-text">${escapeHTML(session.title)}</span>
        `;
        
        historyItem.addEventListener('click', () => {
            if (session.id !== state.activeChatId) {
                state.setActiveChatId(session.id);
                renderActiveChat();
                renderHistoryList();
                hideWelcomeScreen();
                toggleSidebar(false); // Close sidebar on mobile after selection
            }
        });
        
        dom.historyList.appendChild(historyItem);
    });
}

export function renderActiveChat() {
    if (!dom.messagesContainer) return;
    
    const activeChat = state.getActiveChat();
    if (!activeChat) {
        showWelcomeScreen();
        return;
    }
    
    if (activeChat.messages.length === 0) {
        showWelcomeScreen();
        return;
    }
    
    hideWelcomeScreen();
    dom.messagesContainer.innerHTML = '';
    
    activeChat.messages.forEach((message, index) => {
        addMessageToUI(message, index, { animate: false });
    });
    
    scrollToBottom();
}

export function addMessageToUI(message, index, options = {}, replaceElement = null) {
    const { isLastUser = false, animate = false } = options;
    
    const messageEntry = document.createElement('div');
    messageEntry.className = 'message-entry';
    messageEntry.dataset.index = index;
    
    if (animate) {
        messageEntry.style.opacity = '0';
        messageEntry.style.transform = 'translateY(16px)';
    }
    
    let messageHTML = '';
    
    if (message.role === 'user') {
        const textPart = message.parts?.find(p => p.text);
        const filePart = message.parts?.find(p => p.fileUrl || p.mimeType);
        
        messageHTML = `
            <div class="message-content">
                <div class="message-user">
                    ${filePart ? `<div class="mb-2">${getFileIcon(filePart.mimeType || 'application/octet-stream')} ${escapeHTML(filePart.name || 'فایل ضمیمه')}</div>` : ''}
                    ${textPart ? `<div class="message-text">${escapeHTML(textPart.text)}</div>` : ''}
                </div>
            </div>
        `;
    } else if (message.role === 'model') {
        const textPart = message.parts?.find(p => p.text);
        const imagePart = message.parts?.find(p => p.image_url);
        
        messageHTML = `
            <div class="message-content">
                <div class="message-avatar">AI</div>
                <div class="message-body">
                    ${message.isTemporary ? '<div class="typing-indicator"><span></span><span></span><span></span></div>' : ''}
                    ${textPart ? `<div class="message-text prose">${parseMarkdown(textPart.text)}</div>` : ''}
                    ${imagePart ? `<div class="mt-3"><img src="${imagePart.image_url}" alt="Generated Image" class="max-w-full h-auto rounded-lg" /></div>` : ''}
                    ${!message.isTemporary ? getMessageActions(message, index, isLastUser) : ''}
                </div>
            </div>
        `;
    }
    
    messageEntry.innerHTML = messageHTML;
    
    if (replaceElement && replaceElement.parentNode) {
        replaceElement.parentNode.replaceChild(messageEntry, replaceElement);
    } else {
        if (dom.messagesContainer) {
            dom.messagesContainer.appendChild(messageEntry);
        }
    }
    
    if (animate) {
        requestAnimationFrame(() => {
            messageEntry.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            messageEntry.style.opacity = '1';
            messageEntry.style.transform = 'translateY(0)';
        });
    }
    
    scrollToBottom();
    return messageEntry;
}

function getMessageActions(message, index, isLastUser) {
    const hasText = message.parts?.some(p => p.text);
    const hasImage = message.parts?.some(p => p.image_url);
    
    let actions = '';
    
    if (hasText) {
        actions += `
            <button class="action-button" data-action="copy" title="کپی">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
            </button>
        `;
    }
    
    actions += `
        <button class="action-button" data-action="regenerate" title="تولید مجدد">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
        </button>
    `;
    
    if (actions) {
        return `<div class="message-actions mt-2 flex gap-1">${actions}</div>`;
    }
    
    return '';
}

function parseMarkdown(text) {
    if (typeof marked !== 'undefined') {
        return marked.parse(text);
    }
    
    // Basic markdown parsing fallback
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code>$1</code>')
        .replace(/\n/g, '<br>');
}

export function scrollToBottom() {
    if (dom.chatWindow) {
        dom.chatWindow.scrollTop = dom.chatWindow.scrollHeight;
    }
}

export function setGeneratingState(isGenerating) {
    state.setGeneratingState(isGenerating);
    
    if (dom.submitButton) {
        if (isGenerating) {
            dom.submitButton.classList.add('is-loading');
            dom.sendIcon?.classList.add('hidden');
            dom.stopIcon?.classList.remove('hidden');
        } else {
            dom.submitButton.classList.remove('is-loading');
            dom.sendIcon?.classList.remove('hidden');
            dom.stopIcon?.classList.add('hidden');
        }
    }
}

export function resetState() {
    setGeneratingState(false);
}

export function showConfirmModal(message, onConfirm) {
    if (!dom.confirmModal) return;
    
    if (dom.confirmModalMessage) {
        dom.confirmModalMessage.textContent = message;
    }
    
    const confirmHandler = () => {
        onConfirm();
        dom.confirmModal.classList.remove('visible');
        if (dom.confirmModalConfirmBtn) {
            dom.confirmModalConfirmBtn.removeEventListener('click', confirmHandler);
        }
    };
    
    if (dom.confirmModalConfirmBtn) {
        dom.confirmModalConfirmBtn.addEventListener('click', confirmHandler);
    }
    
    dom.confirmModal.classList.add('visible');
}

export function updateMessageActions(messageElement, message, showRegenerate, showEdit) {
    // Update message actions if needed
    const actionsContainer = messageElement.querySelector('.message-actions');
    if (actionsContainer) {
        // Update actions based on parameters
    }
}

export function showCopyFeedback(button) {
    // Show copy feedback
    const feedback = document.createElement('div');
    feedback.textContent = 'کپی شد!';
    feedback.className = 'copy-feedback';
    button.style.position = 'relative';
    button.appendChild(feedback);
    
    setTimeout(() => {
        feedback.remove();
    }, 2000);
}

export function handleLikeDislike(button, messageEntry) {
    const action = button.dataset.action;
    const isActive = button.classList.contains('active');
    
    // Remove active state from both like/dislike buttons
    const actionButtons = messageEntry.querySelectorAll('.action-button[data-action="like"], .action-button[data-action="dislike"]');
    actionButtons.forEach(btn => btn.classList.remove('active'));
    
    // Toggle current button if it wasn't active
    if (!isActive) {
        button.classList.add('active');
        if (action === 'like') {
            button.classList.add('like-animation');
            setTimeout(() => button.classList.remove('like-animation'), 400);
        }
    }
}

export function setupMobileKeyboardFix() {
    // Mobile keyboard handling
    if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
        let initialViewportHeight = window.innerHeight;
        
        window.addEventListener('resize', () => {
            const currentHeight = window.innerHeight;
            const heightDifference = initialViewportHeight - currentHeight;
            
            if (heightDifference > 150) { // Keyboard is likely open
                document.body.style.height = currentHeight + 'px';
            } else {
                document.body.style.height = '100vh';
            }
        });
    }
}

// Legacy compatibility functions
export function toggleEditModal(show) {
    if (dom.editModal) {
        if (show) {
            dom.editModal.classList.add('visible');
        } else {
            dom.editModal.classList.remove('visible');
        }
    }
}

export function toggleHtmlPreviewModal(show) {
    // HTML preview modal toggle (legacy compatibility)
}

export function openImageGallery(urls, index) {
    // Image gallery functionality (legacy compatibility)
}

export function showEditModal(text, onSave) {
    // Edit modal functionality (legacy compatibility)
}

export function showRenameModal(currentTitle, onSave) {
    // Rename modal functionality (legacy compatibility)
}

export function showMessageMenu(event, messageIndex) {
    // Message menu functionality (legacy compatibility)
}

export function handleSuggestionClick(suggestion) {
    if (dom.messageInput) {
        dom.messageInput.value = suggestion;
        dom.messageForm?.dispatchEvent(new Event('submit', {bubbles: true}));
    }
}
