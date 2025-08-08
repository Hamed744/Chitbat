// ChatGPT Clone - JavaScript
class ChatGPT {
    constructor() {
        this.currentConversationId = null;
        this.isLoading = false;
        this.init();
    }

    init() {
        console.log('🚀 ChatGPT initialized');
        this.bindEvents();
        this.initTheme();
        this.loadConversations();
    }

    bindEvents() {
        // Form submission
        const messageForm = document.getElementById('message-form');
        const messageInput = document.getElementById('message-input');
        const sendButton = document.getElementById('send-button');

        if (messageForm && messageInput && sendButton) {
            messageForm.addEventListener('submit', (e) => this.handleSubmit(e));
            messageInput.addEventListener('input', () => this.handleInputChange());
            messageInput.addEventListener('keydown', (e) => this.handleKeyDown(e));
        }

        // Sidebar events
        const newChatBtn = document.getElementById('new-chat-btn');
        const sidebarToggle = document.getElementById('sidebar-toggle');
        
        if (newChatBtn) {
            newChatBtn.addEventListener('click', () => this.startNewChat());
        }
        
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => this.toggleSidebar());
        }

        // Theme toggle
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }

        // Close sidebar on overlay click (mobile)
        document.addEventListener('click', (e) => {
            const sidebar = document.getElementById('sidebar');
            const sidebarToggle = document.getElementById('sidebar-toggle');
            
            if (window.innerWidth <= 768 && 
                sidebar && sidebar.classList.contains('open') &&
                !sidebar.contains(e.target) && 
                e.target !== sidebarToggle) {
                this.closeSidebar();
            }
        });

        // Auto-resize textarea
        if (messageInput) {
            messageInput.addEventListener('input', () => this.autoResizeTextarea(messageInput));
        }
    }

    handleSubmit(e) {
        e.preventDefault();
        
        if (this.isLoading) return;
        
        const messageInput = document.getElementById('message-input');
        const message = messageInput.value.trim();
        
        if (!message) return;
        
        this.sendMessage(message);
        messageInput.value = '';
        this.handleInputChange();
        this.autoResizeTextarea(messageInput);
    }

    handleInputChange() {
        const messageInput = document.getElementById('message-input');
        const sendButton = document.getElementById('send-button');
        
        if (messageInput && sendButton) {
            const hasText = messageInput.value.trim().length > 0;
            sendButton.disabled = !hasText || this.isLoading;
        }
    }

    handleKeyDown(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            this.handleSubmit(e);
        }
    }

    async sendMessage(message) {
        console.log('📤 Sending message:', message);
        
        this.isLoading = true;
        this.hideWelcomeScreen();
        this.addUserMessage(message);
        this.showTypingIndicator();
        this.handleInputChange();

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message,
                    conversation_id: this.currentConversationId
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            if (data.success) {
                this.currentConversationId = data.conversation_id;
                this.hideTypingIndicator();
                this.addAssistantMessage(data.response);
                this.loadConversations(); // Refresh sidebar
            } else {
                throw new Error(data.error || 'خطای ناشناخته');
            }

        } catch (error) {
            console.error('❌ Error sending message:', error);
            this.hideTypingIndicator();
            this.addAssistantMessage(`خطا در ارسال پیام: ${error.message}`);
        } finally {
            this.isLoading = false;
            this.handleInputChange();
        }
    }

    addUserMessage(message) {
        const messagesContainer = document.getElementById('messages-container');
        if (!messagesContainer) return;

        const messageElement = this.createMessageElement('user', message);
        messagesContainer.appendChild(messageElement);
        this.scrollToBottom();
    }

    addAssistantMessage(message) {
        const messagesContainer = document.getElementById('messages-container');
        if (!messagesContainer) return;

        const messageElement = this.createMessageElement('assistant', message);
        messagesContainer.appendChild(messageElement);
        this.scrollToBottom();
    }

    createMessageElement(role, content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}`;
        
        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'message-avatar';
        avatarDiv.textContent = role === 'user' ? '👤' : '🤖';
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        const textDiv = document.createElement('div');
        textDiv.className = 'message-text';
        textDiv.textContent = content;
        
        contentDiv.appendChild(textDiv);
        messageDiv.appendChild(avatarDiv);
        messageDiv.appendChild(contentDiv);
        
        return messageDiv;
    }

    showTypingIndicator() {
        const messagesContainer = document.getElementById('messages-container');
        if (!messagesContainer) return;

        // Remove existing typing indicator
        this.hideTypingIndicator();

        const typingDiv = document.createElement('div');
        typingDiv.className = 'message assistant';
        typingDiv.id = 'typing-indicator';
        
        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'message-avatar';
        avatarDiv.textContent = '🤖';
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        const typingContent = document.createElement('div');
        typingContent.className = 'typing-indicator';
        typingContent.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';
        
        contentDiv.appendChild(typingContent);
        typingDiv.appendChild(avatarDiv);
        typingDiv.appendChild(contentDiv);
        
        messagesContainer.appendChild(typingDiv);
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    hideWelcomeScreen() {
        const welcomeScreen = document.getElementById('welcome-screen');
        if (welcomeScreen) {
            welcomeScreen.style.display = 'none';
        }
    }

    showWelcomeScreen() {
        const welcomeScreen = document.getElementById('welcome-screen');
        const messagesContainer = document.getElementById('messages-container');
        
        if (welcomeScreen && messagesContainer) {
            // Clear messages
            const messages = messagesContainer.querySelectorAll('.message');
            messages.forEach(msg => msg.remove());
            
            // Show welcome screen
            welcomeScreen.style.display = 'flex';
        }
    }

    scrollToBottom() {
        const chatContainer = document.querySelector('.chat-container');
        if (chatContainer) {
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }
    }

    autoResizeTextarea(textarea) {
        textarea.style.height = 'auto';
        const maxHeight = 200;
        const newHeight = Math.min(textarea.scrollHeight, maxHeight);
        textarea.style.height = newHeight + 'px';
        
        if (textarea.scrollHeight > maxHeight) {
            textarea.style.overflowY = 'auto';
        } else {
            textarea.style.overflowY = 'hidden';
        }
    }

    startNewChat() {
        console.log('🆕 Starting new chat');
        this.currentConversationId = null;
        this.showWelcomeScreen();
        this.loadConversations();
        
        // Clear active conversation in sidebar
        const activeConv = document.querySelector('.conversation-item.active');
        if (activeConv) {
            activeConv.classList.remove('active');
        }
    }

    async loadConversations() {
        try {
            const response = await fetch('/api/conversations');
            if (!response.ok) return;
            
            const data = await response.json();
            this.renderConversations(data.conversations || []);
        } catch (error) {
            console.error('Error loading conversations:', error);
        }
    }

    renderConversations(conversations) {
        const conversationsList = document.getElementById('conversations-list');
        if (!conversationsList) return;
        
        conversationsList.innerHTML = '';
        
        conversations.forEach(conv => {
            const convElement = document.createElement('div');
            convElement.className = 'conversation-item';
            if (conv.id === this.currentConversationId) {
                convElement.classList.add('active');
            }
            
            convElement.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                <span class="conversation-title">${conv.title}</span>
            `;
            
            convElement.addEventListener('click', () => this.loadConversation(conv.id));
            conversationsList.appendChild(convElement);
        });
    }

    async loadConversation(conversationId) {
        console.log('📂 Loading conversation:', conversationId);
        
        try {
            const response = await fetch(`/api/conversations/${conversationId}`);
            if (!response.ok) return;
            
            const data = await response.json();
            
            this.currentConversationId = conversationId;
            this.hideWelcomeScreen();
            this.renderMessages(data.messages || []);
            
            // Update active conversation in sidebar
            const convItems = document.querySelectorAll('.conversation-item');
            convItems.forEach(item => item.classList.remove('active'));
            
            const activeItem = [...convItems].find(item => 
                item.querySelector('.conversation-title').textContent === data.messages[0]?.content.substring(0, 50)
            );
            if (activeItem) {
                activeItem.classList.add('active');
            }
            
        } catch (error) {
            console.error('Error loading conversation:', error);
        }
    }

    renderMessages(messages) {
        const messagesContainer = document.getElementById('messages-container');
        if (!messagesContainer) return;
        
        // Clear existing messages
        const existingMessages = messagesContainer.querySelectorAll('.message');
        existingMessages.forEach(msg => msg.remove());
        
        // Add all messages
        messages.forEach(message => {
            if (message.role === 'user') {
                this.addUserMessage(message.content);
            } else if (message.role === 'assistant') {
                this.addAssistantMessage(message.content);
            }
        });
    }

    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            sidebar.classList.toggle('open');
        }
    }

    closeSidebar() {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            sidebar.classList.remove('open');
        }
    }

    initTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        this.setTheme(savedTheme);
    }

    toggleTheme() {
        const currentTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
    }

    setTheme(theme) {
        const html = document.documentElement;
        const sunIcon = document.querySelector('.sun-icon');
        const moonIcon = document.querySelector('.moon-icon');
        
        if (theme === 'dark') {
            html.classList.add('dark');
            if (sunIcon) sunIcon.classList.add('hidden');
            if (moonIcon) moonIcon.classList.remove('hidden');
        } else {
            html.classList.remove('dark');
            if (sunIcon) sunIcon.classList.remove('hidden');
            if (moonIcon) moonIcon.classList.add('hidden');
        }
    }
}

// Global function for example prompts
function sendMessage(message) {
    if (window.chatGPT) {
        const messageInput = document.getElementById('message-input');
        if (messageInput) {
            messageInput.value = message;
            window.chatGPT.handleInputChange();
            window.chatGPT.sendMessage(message);
            messageInput.value = '';
            window.chatGPT.handleInputChange();
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎯 DOM loaded, initializing ChatGPT...');
    window.chatGPT = new ChatGPT();
});

// Make sendMessage globally available
window.sendMessage = sendMessage;