import * as state from './state.js';
import * as ui from './ui.js';
import * as api from './api.js';

function sendExamplePrompt(prompt) {
    const messageInput = document.getElementById('message-input');
    if (messageInput) {
        messageInput.value = prompt;
        // Trigger form submission properly
        const event = new Event('submit', {
            bubbles: true,
            cancelable: true
        });
        const form = document.getElementById('message-form');
        if (form) {
            form.dispatchEvent(event);
        }
    }
}

// Make it globally available for HTML onclick handlers
window.sendExamplePrompt = sendExamplePrompt;

async function handleFileSelection(event) {
    const file = event.target.files[0];
    if (!file) return;

    ui.showFileUploading(file.name);
    
    const submitButton = document.getElementById('submit-button');
    if (submitButton) submitButton.disabled = true;

    try {
        const onProgress = (percent) => {
            ui.updateUploadProgress(percent);
        };
        const uploadedFileData = await api.processAndUploadFile(file, onProgress);
        
        state.setAttachedFile(uploadedFileData);
        
        ui.showFileReady(file.name, file.type, uploadedFileData.url);

    } catch (error) {
        console.error("خطا در آپلود فایل:", error);
        if (error.message !== 'آپلود توسط کاربر لغو شد.') {
            ui.showFileError(error.message);
        } else {
            ui.hideFilePreview();
        }
    } finally {
        event.target.value = '';
        ui.toggleFilePopupMenu(false);
        if (submitButton) submitButton.disabled = false;
    }
}

function handleNewChat() {
    const newSession = { id: Date.now().toString(), title: 'گفتگوی جدید', model: 'gemini-2.5-flash', messages: [] };
    state.chatSessions.unshift(newSession);
    state.setActiveChatId(newSession.id);
    ui.renderActiveChat();
    ui.renderHistoryList();
    ui.showWelcomeScreen();
}

function getFullChatText(session) {
    if (!session || !session.messages) return "";
    return session.messages
        .map(msg => {
            const prefix = msg.role === 'user' ? 'کاربر' : 'دستیار';
            const textContent = msg.parts?.find(p => p.text)?.text || '[محتوای غیر متنی]';
            return `${prefix}:\n${textContent}`;
        })
        .join('\n\n---\n\n');
}

// Theme Toggle Function
function toggleTheme() {
    const html = document.documentElement;
    const isDark = html.classList.contains('dark');
    
    if (isDark) {
        html.classList.remove('dark');
        localStorage.setItem('theme', 'light');
    } else {
        html.classList.add('dark');
        localStorage.setItem('theme', 'dark');
    }
    
    // Update theme toggle button
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.checked = !isDark;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded - Starting initialization');

    // Initialize theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
    }
    
    // Update theme toggle state
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.checked = savedTheme === 'dark';
    }
    
    // Initialize UI and State
    try {
        ui.initTheme();
        state.loadSessions();
        
        if (state.chatSessions.length === 0 || !state.getActiveChat()) {
            handleNewChat();
        } else {
            state.setActiveChatId(state.activeChatId || state.chatSessions[0].id);
            ui.renderActiveChat();
            ui.renderHistoryList();
        }

        ui.setupMobileKeyboardFix();
        
        const messageInput = document.getElementById('message-input');
        if (messageInput) {
            ui.setMinTextareaHeight(messageInput.scrollHeight);
        }
    } catch (error) {
        console.error('Error during initialization:', error);
    }

    // Event Listeners Setup
    console.log('Setting up event listeners...');
    
    // New Chat Button
    const newChatBtn = document.getElementById('new-chat-btn');
    if (newChatBtn) {
        newChatBtn.addEventListener('click', (e) => {
            e.preventDefault();
            handleNewChat();
        });
        console.log('New chat button listener added');
    }

    // Menu Button (Mobile)
    const menuButton = document.getElementById('menu-button');
    if (menuButton) {
        menuButton.addEventListener('click', (e) => {
            e.preventDefault();
            ui.toggleSidebar(true);
        });
    }

    // Sidebar Overlay
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', () => ui.toggleSidebar(false));
    }

    // Theme Toggle Button in Header
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', (e) => {
            e.preventDefault();
            toggleTheme();
        });
    }

    // Model Selection
    const modelSelectButton = document.getElementById('model-select-button');
    const modelSelectModal = document.getElementById('model-select-modal');
    
    if (modelSelectButton && modelSelectModal) {
        modelSelectButton.addEventListener('click', (e) => {
            e.preventDefault();
            modelSelectModal.classList.add('visible');
        });
        
        modelSelectModal.addEventListener('click', (e) => {
            if (e.target === modelSelectModal) {
                modelSelectModal.classList.remove('visible');
            }
        });
    }
    
    // Model Option Cards
    const modelOptions = document.querySelectorAll('.model-option');
    modelOptions.forEach(option => {
        option.addEventListener('click', (e) => {
            e.preventDefault();
            const activeChat = state.getActiveChat();
            if (!activeChat) return;
            
            activeChat.model = option.dataset.model;
            
            // Update UI
            modelOptions.forEach(opt => {
                const dot = opt.querySelector('.inner-dot');
                if (dot) dot.classList.add('hidden');
            });
            
            const selectedDot = option.querySelector('.inner-dot');
            if (selectedDot) selectedDot.classList.remove('hidden');
            
            state.saveSessions();
            
            // Close modal
            if (modelSelectModal) {
                modelSelectModal.classList.remove('visible');
            }
        });
    });

    // Settings
    const settingsButton = document.getElementById('settings-button');
    const settingsModal = document.getElementById('settings-modal');
    
    if (settingsButton && settingsModal) {
        settingsButton.addEventListener('click', (e) => {
            e.preventDefault();
            settingsModal.classList.add('visible');
        });
        
        settingsModal.addEventListener('click', (e) => {
            if (e.target === settingsModal) {
                settingsModal.classList.remove('visible');
            }
        });
    }

    // Theme Toggle in Settings
    if (themeToggle) {
        themeToggle.addEventListener('change', toggleTheme);
    }

    // File Attachment
    const attachFileButton = document.getElementById('attach-file-button');
    const filePopupMenu = document.getElementById('file-popup-menu');
    
    if (attachFileButton && filePopupMenu) {
        attachFileButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const isVisible = !filePopupMenu.classList.contains('hidden');
            ui.toggleFilePopupMenu(!isVisible);
        });
    }

    // Close file popup when clicking outside
    window.addEventListener('click', (e) => {
        if (filePopupMenu && !filePopupMenu.classList.contains('hidden') && 
            !filePopupMenu.contains(e.target) && 
            e.target !== attachFileButton && 
            attachFileButton && !attachFileButton.contains(e.target)) {
            ui.toggleFilePopupMenu(false);
        }
    });
    
    // File selection options
    const selectImageOption = document.getElementById('select-image-option');
    const selectFileOption = document.getElementById('select-file-option');
    const imageFileInput = document.getElementById('image-file-input');
    const generalFileInput = document.getElementById('general-file-input');
    
    if (selectImageOption && imageFileInput) {
        selectImageOption.addEventListener('click', (e) => {
            e.preventDefault();
            imageFileInput.click();
        });
    }
    
    if (selectFileOption && generalFileInput) {
        selectFileOption.addEventListener('click', (e) => {
            e.preventDefault();
            generalFileInput.click();
        });
    }

    if (imageFileInput) {
        imageFileInput.addEventListener('change', handleFileSelection);
    }
    
    if (generalFileInput) {
        generalFileInput.addEventListener('change', handleFileSelection);
    }

    // Remove file button
    const removeImageButton = document.getElementById('remove-image-button');
    if (removeImageButton) {
        removeImageButton.addEventListener('click', (e) => {
            e.preventDefault();
            if (state.currentUploadXHR) {
                state.currentUploadXHR.abort();
                console.log("آپلود توسط کاربر لغو شد.");
            }
            
            state.setAttachedFile(null);
            ui.hideFilePreview();
            
            const submitButton = document.getElementById('submit-button');
            if (submitButton) submitButton.disabled = false;
        });
    }

    // Message Form Submit - This is the critical part!
    const messageForm = document.getElementById('message-form');
    const messageInput = document.getElementById('message-input');
    
    if (messageForm && messageInput) {
        console.log('Setting up form submission handler');
        
        messageForm.addEventListener('submit', async (e) => {
            console.log('Form submit event triggered');
            e.preventDefault();
            e.stopPropagation();
            
            if (state.isGenerating) {
                if (state.globalAbortController) state.globalAbortController.abort();
                if (state.currentImageEventSource) state.currentImageEventSource.close();
                return;
            }

            const activeChat = state.getActiveChat();
            if (!activeChat) {
                console.log('No active chat found');
                return;
            }
            
            const userMessageText = messageInput.value.trim();
            if (!userMessageText && !state.attachedFile) {
                console.log('No message text or attached file');
                return;
            }

            console.log('Processing message:', userMessageText);
            
            ui.setGeneratingState(true);

            const isFirstMessageOfChat = activeChat.messages.length === 0;
            if (isFirstMessageOfChat) {
                ui.hideWelcomeScreen();
            }

            const userParts = [];
            if (state.attachedFile) {
                userParts.push({ 
                    fileUrl: state.attachedFile.url,
                    mimeType: state.attachedFile.mimeType,
                    name: state.attachedFile.name,
                    base64Data: state.attachedFile.base64Data
                });
                ui.hideFilePreview();
            }
            if (userMessageText) {
                userParts.push({ text: userMessageText });
            }
            
            const newUserMessage = { role: 'user', parts: userParts };
            activeChat.messages.push(newUserMessage);
            ui.addMessageToUI(newUserMessage, activeChat.messages.length - 1, {isLastUser: true, animate: true});
            
            const modelPlaceholderMessage = { role: 'model', isTemporary: true, parts: [] };
            activeChat.messages.push(modelPlaceholderMessage);
            const modelBubbleOuterDiv = ui.addMessageToUI(modelPlaceholderMessage, activeChat.messages.length - 1, {animate: true});
            
            if (isFirstMessageOfChat && userMessageText) {
                activeChat.title = userMessageText.substring(0, 30) + (userMessageText.length > 30 ? '...' : '');
                ui.renderHistoryList();
            }
            
            messageInput.value = '';
            messageInput.dispatchEvent(new Event('input'));
            
            try {
                await api.streamResponse(modelBubbleOuterDiv, activeChat.messages, activeChat.id);
            } catch (error) {
                console.error('Error in streamResponse:', error);
                ui.resetState();
            } finally {
                if (state.attachedFile) {
                    state.setAttachedFile(null);
                }
            }
        });
        
        console.log('Form submission handler set up successfully');
    } else {
        console.error('Message form or input not found!');
    }

    // Auto-resize textarea
    if (messageInput) {
        messageInput.addEventListener('input', () => {
            ui.adjustTextareaHeight(messageInput, messageForm);
        });
    }

    // Confirm modal handlers
    const confirmModal = document.getElementById('confirm-modal');
    const confirmModalCancelBtn = document.getElementById('confirm-modal-cancel-btn');
    
    if (confirmModal && confirmModalCancelBtn) {
        confirmModalCancelBtn.addEventListener('click', (e) => {
            e.preventDefault();
            confirmModal.classList.remove('visible');
        });
        
        confirmModal.addEventListener('click', (e) => {
            if (e.target === confirmModal) {
                confirmModal.classList.remove('visible');
            }
        });
    }

    console.log('All event listeners set up successfully');
});

// Global functions
window.handleSuggestionClick = ui.handleSuggestionClick;
window.uploadToAISADAAndOpenAlpha = api.uploadToAISADAAndOpenAlpha;
