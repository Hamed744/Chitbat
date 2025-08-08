import * as state from './state.js';
import * as ui from './ui.js';
import * as api from './api.js';

async function handleFileSelection(event) {
    const file = event.target.files[0];
    if (!file) return;

    ui.showFileUploading(file.name);
    ui.dom.submitButton.disabled = true;

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
        ui.dom.submitButton.disabled = false;
    }
}

function handleNewChat() {
    // #####################################################################
    // START: کد اصلاح شده
    // مدل پیش‌فرض به نسخه قدرتمندتر پرو تغییر کرد
    // #####################################################################
    const newSession = { id: Date.now().toString(), title: 'چت جدید', model: 'gemini-1.5-pro-latest', messages: [] };
    // #####################################################################
    // END: کد اصلاح شده
    // #####################################################################
    state.chatSessions.unshift(newSession);
    state.setActiveChatId(newSession.id);
    ui.renderActiveChat();
    ui.renderHistoryList();
}

function getFullChatText(session) {
    if (!session || !session.messages) return "";
    return session.messages
        .map(msg => {
            const prefix = msg.role === 'user' ? 'کاربر' : 'مدل';
            const textContent = msg.parts?.find(p => p.text)?.text || '[محتوای غیر متنی]';
            return `${prefix}:\n${textContent}`;
        })
        .join('\n\n---\n\n');
}

document.addEventListener('DOMContentLoaded', () => {
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
    ui.setMinTextareaHeight(ui.dom.messageInput.scrollHeight);
    ui.dom.messageForm.style.borderRadius = '28px';

    ui.dom.newChatButton.addEventListener('click', handleNewChat);
    ui.dom.menuButton.addEventListener('click', () => ui.toggleSidebar(true));
    ui.dom.sidebarOverlay.addEventListener('click', () => ui.toggleSidebar(false));

    ui.dom.deleteAllChatsButton.addEventListener('click', () => {
        ui.showConfirmModal('آیا از حذف تمام چت‌ها مطمئن هستید؟ این عمل غیرقابل بازگشت است.', () => {
            state.setChatSessions([]);
            state.setActiveChatId(null);
            state.saveSessions();
            handleNewChat();
            ui.toggleSidebar(false);
        });
    });

    ui.dom.modelSelectButton.addEventListener('click', () => ui.toggleModal(true));
    ui.dom.modelSelectModal.addEventListener('click', (e) => {
        if (e.target === ui.dom.modelSelectModal) ui.toggleModal(false);
    });
    
    ui.dom.modelOptionCards.forEach(card => {
        card.addEventListener('click', () => {
            const activeChat = state.getActiveChat();
            if (!activeChat) return;
            activeChat.model = card.dataset.model;
            ui.dom.currentModelName.textContent = card.dataset.name;
            ui.updateRadioButtons();
            state.saveSessions();
            ui.toggleModal(false);
        });
    });

    ui.dom.settingsButton.addEventListener('click', () => ui.toggleSettingsModal(true));
    ui.dom.settingsModal.addEventListener('click', (e) => {
        if (e.target === ui.dom.settingsModal) ui.toggleSettingsModal(false);
    });

    ui.dom.themeToggle.addEventListener('change', (e) => {
        const newTheme = e.target.checked ? 'dark' : 'light';
        localStorage.setItem('theme', newTheme);
        ui.applyTheme(newTheme);
    });

    ui.dom.attachFileButton.addEventListener('click', (e) => {
        e.stopPropagation();
        const isVisible = !ui.dom.filePopupMenu.classList.contains('hidden');
        ui.toggleFilePopupMenu(!isVisible);
    });

    window.addEventListener('click', (e) => {
        if (!ui.dom.filePopupMenu.classList.contains('hidden') && !ui.dom.filePopupMenu.contains(e.target) && e.target !== ui.dom.attachFileButton && !ui.dom.attachFileButton.contains(e.target)) {
            ui.toggleFilePopupMenu(false);
        }
    });
    
    ui.dom.selectImageOption.addEventListener('click', () => { ui.dom.imageFileInput.click(); });
    ui.dom.selectFileOption.addEventListener('click', () => { ui.dom.generalFileInput.click(); });

    ui.dom.imageFileInput.addEventListener('change', handleFileSelection);
    ui.dom.generalFileInput.addEventListener('change', handleFileSelection);

    ui.dom.removeImageButton.addEventListener('click', () => {
        if (state.currentUploadXHR) {
            state.currentUploadXHR.abort();
            console.log("آپلود توسط کاربر لغو شد.");
        }
        
        state.setAttachedFile(null);
        ui.hideFilePreview();
        ui.dom.submitButton.disabled = false;
    });

    ui.dom.htmlPreviewCloseBtn.addEventListener('click', () => ui.toggleHtmlPreviewModal(false));
    ui.dom.htmlPreviewOverlay.addEventListener('click', () => ui.toggleHtmlPreviewModal(false));
    
    ui.dom.galleryDownloadBtn.addEventListener('click', function() {
        const url = ui.getCurrentGalleryImageUrl();
        if (url) {
            api.uploadToAISADAAndOpenAlpha(url, this);
        }
    });

    // Enter to send, Shift+Enter for newline
    ui.dom.messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            ui.dom.messageForm.requestSubmit();
        }
    });

    ui.dom.messageForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (state.isGenerating) {
            if (state.globalAbortController) state.globalAbortController.abort();
            if (state.currentImageEventSource) state.currentImageEventSource.close();
            return;
        }

        const activeChat = state.getActiveChat();
        if (!activeChat) return;
        const userMessageText = ui.dom.messageInput.value.trim();
        if (!userMessageText && !state.attachedFile) return;

        ui.setGeneratingState(true);

        const isFirstMessageOfChat = activeChat.messages.length === 0;
        if (isFirstMessageOfChat) {
            const welcomeScreen = ui.dom.chatWindow.querySelector('.welcome-screen');
            if (welcomeScreen) welcomeScreen.remove();
        }

        const previousLastUserIndex = state.findLastIndex(activeChat.messages, msg => msg.role === 'user');
        if (previousLastUserIndex !== -1) {
            const previousUserElement = ui.dom.chatWindow.querySelector(`.message-entry[data-index="${previousLastUserIndex}"]`);
            if (previousUserElement) {
                ui.updateMessageActions(previousUserElement, activeChat.messages[previousLastUserIndex], false, false);
            }
        }
        
        const previousLastModelIndex = state.findLastIndex(activeChat.messages, msg => msg.role === 'model');
        if (previousLastModelIndex !== -1) {
            const isItTheLastMessageOverall = previousLastModelIndex === activeChat.messages.length - 1;
            if (isItTheLastMessageOverall) {
                const previousModelElement = ui.dom.chatWindow.querySelector(`.message-entry[data-index="${previousLastModelIndex}"]`);
                if (previousModelElement) {
                    ui.updateMessageActions(previousModelElement, activeChat.messages[previousLastModelIndex], false, false);
                }
            }
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
        
        ui.dom.messageInput.value = '';
        ui.dom.messageInput.dispatchEvent(new Event('input'));
        
        try {
            await api.streamResponse(modelBubbleOuterDiv, activeChat.messages, activeChat.id);
        } finally {
            if (state.attachedFile) {
                state.setAttachedFile(null);
            }
        }
    });

    ui.dom.chatWindow.addEventListener('click', async (e) => {
        const galleryItem = e.target.closest('.js-image-gallery-grid [data-index]');
        if (galleryItem) {
            const grid = galleryItem.closest('.js-image-gallery-grid');
            const urls = grid.dataset.urls;
            const index = galleryItem.dataset.index;
            if (urls && index !== undefined) {
                ui.openImageGallery(urls, parseInt(index, 10));
                return;
            }
        }

        const clarificationButton = e.target.closest('.clarification-button');
        if (clarificationButton) {
            const payloadString = clarificationButton.dataset.actionPayload;
            if (!payloadString || state.isGenerating) return;

            const actionPayload = JSON.parse(payloadString);
            const activeChat = state.getActiveChat();
            if (!activeChat) return;
            
            ui.setGeneratingState(true);

            const clarificationMessageElement = clarificationButton.closest('.message-entry');
            const clarificationMessageIndex = parseInt(clarificationMessageElement.dataset.index, 10);
            if (isNaN(clarificationMessageIndex)) {
                ui.resetState();
                return;
            }

            const modelPlaceholderMessage = { role: 'model', isTemporary: true, parts: [] };
            activeChat.messages[clarificationMessageIndex] = modelPlaceholderMessage;
            const newModelBubble = ui.addMessageToUI(modelPlaceholderMessage, clarificationMessageIndex, {}, clarificationMessageElement);
            
            const historyBeforeAction = activeChat.messages.slice(0, clarificationMessageIndex);
            
            if (actionPayload.intent === 'edit_image') {
                let fileUrlForEditing = null;
                for (let i = historyBeforeAction.length - 1; i >= 0; i--) {
                    const msg = historyBeforeAction[i];
                    if (msg.parts) {
                        const imagePart = msg.parts.find(p => p.image_url || (p.edited_images && p.edited_images.length > 0));
                        if(imagePart) {
                            fileUrlForEditing = imagePart.image_url || imagePart.edited_images[0];
                            break;
                        }
                        const filePart = msg.parts.find(p => p.fileUrl);
                        if(filePart) {
                            fileUrlForEditing = filePart.fileUrl;
                            break;
                        }
                    }
                }
                
                if (fileUrlForEditing) {
                    await api.runExternalImageEditor(actionPayload.prompt, fileUrlForEditing, newModelBubble, clarificationMessageIndex);
                } else {
                    ui.displayError(newModelBubble, "متاسفانه تصویری برای ویرایش پیدا نشد.");
                    ui.resetState();
                }

            } else if (actionPayload.intent === 'regenerate_with_enhancement') {
                await api.streamResponse(newModelBubble, historyBeforeAction, activeChat.id, actionPayload);
            }
            return;
        }

        const button = e.target.closest('.action-button');
        if (!button) return;
    
        const action = button.dataset.action;
        const messageEntry = button.closest('.message-entry');
        if (!messageEntry) return;

        const messageIndex = parseInt(messageEntry.dataset.index, 10);
        const activeChat = state.getActiveChat();
        if (!activeChat || isNaN(messageIndex)) return;
    
        const message = activeChat.messages[messageIndex];
    
        if (action === 'download-image') {
            const imageUrl = message.parts.find(p => p.image_url)?.image_url;
            if (imageUrl) {
                 api.uploadToAISADAAndOpenAlpha(imageUrl, button);
            }
        } 
        else if (action === 'copy') {
            const textToCopy = message.parts?.find(p => p.text)?.text || '';
            if (textToCopy) {
                navigator.clipboard.writeText(textToCopy).then(() => {
                    ui.showCopyFeedback(button);
                });
            }
        } else if (action === 'like' || action === 'dislike') {
            ui.handleLikeDislike(button, messageEntry);
        } 
        else if (action === 'regenerate') {
            if (state.isGenerating) return;
            
            ui.setGeneratingState(true);
            state.setGpuGuideState(false);
            
            const lastModelMessageIndex = state.findLastIndex(activeChat.messages, msg => msg.role === 'model');
            
            if (messageIndex === lastModelMessageIndex) {
                activeChat.messages.length = messageIndex;
                messageEntry.remove();
                
                const lastUserMessageIndex = state.findLastIndex(activeChat.messages, msg => msg.role === 'user');
                if (lastUserMessageIndex !== -1) {
                    const lastUserMessageElement = ui.dom.chatWindow.querySelector(`.message-entry[data-index="${lastUserMessageIndex}"]`);
                    if (lastUserMessageElement) {
                        ui.updateMessageActions(lastUserMessageElement, activeChat.messages[lastUserMessageIndex], true, false);
                    }
                }

                const modelPlaceholderMessage = { role: 'model', isTemporary: true, parts: [] };
                activeChat.messages.push(modelPlaceholderMessage);
                
                const newModelBubble = ui.addMessageToUI(modelPlaceholderMessage, activeChat.messages.length - 1, { animate: true });
                
                await api.streamResponse(newModelBubble, activeChat.messages, activeChat.id);
            } else {
                ui.resetState();
            }
        } 
        else if (action === 'edit') {
            if (state.isGenerating) return;
            
            const lastUserMessageIndex = state.findLastIndex(activeChat.messages, msg => msg.role === 'user');
            if (messageIndex === lastUserMessageIndex) {
                const textPart = message.parts.find(p => p.text);
                const filePart = message.parts.find(p => p.fileUrl);

                if (textPart || filePart) {
                    ui.showEditModal(textPart ? textPart.text : '', async (newText) => {
                        ui.setGeneratingState(true);
                        
                        const allMessagesInDOM = ui.dom.chatWindow.querySelectorAll('.message-entry');
                        allMessagesInDOM.forEach(msgEl => {
                            const idx = parseInt(msgEl.dataset.index, 10);
                            if (idx >= messageIndex) {
                                msgEl.remove();
                            }
                        });

                        activeChat.messages.length = messageIndex;

                        const newParts = [];
                        if (filePart) {
                             newParts.push(filePart);
                        }
                        if (newText.trim()) newParts.push({ text: newText });

                        if (newParts.length > 0) {
                            const editedUserMessage = { role: 'user', parts: newParts };
                            activeChat.messages.push(editedUserMessage);
                            ui.addMessageToUI(editedUserMessage, activeChat.messages.length - 1, { isLastUser: true, animate: true });
                        }

                        const modelPlaceholderMessage = { role: 'model', isTemporary: true, parts: [] };
                        activeChat.messages.push(modelPlaceholderMessage);
                        state.saveSessions(); 

                        const newModelBubble = ui.addMessageToUI(modelPlaceholderMessage, activeChat.messages.length - 1, { animate: true });
                        
                        await api.streamResponse(newModelBubble, activeChat.messages, activeChat.id);
                    });
                }
            }
        }
        else if (action === 'show-message-menu') {
            ui.showMessageMenu(e, messageIndex);
        }
    });

    ui.dom.historyItemMenu.addEventListener('click', (e) => {
        const button = e.target.closest('.menu-item');
        if (!button) return;

        const action = button.dataset.action;
        const format = button.dataset.format;
        const sessionId = ui.dom.historyItemMenu.dataset.sessionId;
        const session = state.chatSessions.find(s => s.id === sessionId);
        if (!session) return;

        if (action === 'rename') {
            ui.showRenameModal(session.title, (newTitle) => {
                session.title = newTitle;
                state.saveSessions();
                ui.renderHistoryList();
            });
        } else if (action === 'delete') {
            ui.showConfirmModal(`آیا از حذف گفتگوی "${session.title}" مطمئن هستید؟`, () => {
                state.setChatSessions(state.chatSessions.filter(s => s.id !== sessionId));
                state.saveSessions();
                if (state.activeChatId === sessionId) {
                    if (state.chatSessions.length > 0) {
                        state.setActiveChatId(state.chatSessions[0].id);
                        ui.renderActiveChat();
                    } else {
                        handleNewChat();
                    }
                }
                ui.renderHistoryList();
            });
        } else if (action === 'convert-chat') {
            const fullText = getFullChatText(session);
            api.convertTextToFile(fullText, format, button);
        }
        ui.dom.historyItemMenu.classList.remove('visible');
    });

    ui.dom.messageItemMenu.addEventListener('click', (e) => {
        const menu = ui.dom.messageItemMenu;
        const closeMenu = () => {
            menu.classList.remove('visible');
            setTimeout(() => {
                menu.classList.add('hidden');
            }, 300);
        };

        if (e.target === ui.dom.messageItemMenuOverlay) {
            closeMenu();
            return;
        }

        const button = e.target.closest('.menu-item');
        if (!button) return;

        const action = button.dataset.action;
        const format = button.dataset.format;
        const messageIndex = parseInt(menu.dataset.messageIndex, 10);
        const activeChat = state.getActiveChat();
        if (!activeChat || isNaN(messageIndex)) {
            closeMenu();
            return;
        }
        const message = activeChat.messages[messageIndex];

        if (action === 'delete-message') {
            ui.showConfirmModal('آیا از حذف این پیام مطمئن هستید؟', () => {
                state.deleteMessage(activeChat.id, messageIndex);
                ui.renderActiveChat();
            });
        } else if (action === 'convert-message') {
            const textContent = message.parts?.find(p => p.text)?.text || '';
            if (textContent) {
                api.convertTextToFile(textContent, format, button);
            } else {
                alert('محتوای متنی برای تبدیل وجود ندارد.');
            }
        }
        closeMenu();
    });
    
    ui.dom.messageInput.addEventListener('input', () => {
        ui.adjustTextareaHeight(ui.dom.messageInput, ui.dom.messageForm);
    });

    ui.dom.editInput.addEventListener('input', () => {
        ui.adjustTextareaHeight(ui.dom.editInput);
    });
});

window.handleSuggestionClick = ui.handleSuggestionClick;
window.uploadToAISADAAndOpenAlpha = api.uploadToAISADAAndOpenAlpha;
