// این فایل تمام وضعیت‌های برنامه را مدیریت می‌کند

// START: تغییرات برای محدود کردن سابقه چت
export const MAX_CHAT_SESSIONS = 150; // حد مجاز تعداد تاریخچه چت
// END: تغییرات برای محدود کردن سابقه چت

export let chatSessions = [];
export let activeChatId = null;
export let attachedFile = null;
export let isGenerating = false;
export let globalAbortController = null;
export let currentImageEventSource = null;
export let currentUploadXHR = null;
export let isGpuGuideActive = false;

export function setChatSessions(newSessions) {
    chatSessions = newSessions;
}

export function setActiveChatId(id) {
    activeChatId = id;
}

export function setAttachedFile(file) {
    attachedFile = file;
}

export function setGenerating(status) {
    isGenerating = status;
}

export function setGeneratingState(status) {
    isGenerating = status;
}

export function setGlobalAbortController(controller) {
    globalAbortController = controller;
}

export function setCurrentImageEventSource(source) {
    currentImageEventSource = source;
}

export function setCurrentUploadXHR(xhr) {
    currentUploadXHR = xhr;
}

export function setGpuGuideState(isActive) {
    isGpuGuideActive = isActive;
}

export function getActiveChat() {
    return chatSessions.find(s => s.id === activeChatId);
}

// START: تابع جدید برای اعمال محدودیت تعداد سابقه
/**
 * این تابع بررسی می‌کند که آیا تعداد تاریخچه‌ها از حد مجاز بیشتر است یا خیر.
 * اگر بیشتر بود، قدیمی‌ترین تاریخچه‌ها را حذف می‌کند تا تعداد به حد مجاز برسد.
 * چون چت‌های جدید با unshift به ابتدای آرایه اضافه می‌شوند، قدیمی‌ترین‌ها در انتهای آرایه قرار دارند.
 */
function enforceSessionLimit() {
    if (chatSessions.length > MAX_CHAT_SESSIONS) {
        // حذف موارد اضافی از انتهای آرایه (قدیمی‌ترین‌ها)
        chatSessions.splice(MAX_CHAT_SESSIONS);
        console.log(`تعداد تاریخچه به ${MAX_CHAT_SESSIONS} محدود شد. قدیمی‌ترین‌ها حذف شدند.`);
    }
}
// END: تابع جدید برای اعمال محدودیت تعداد سابقه

// *** تابع اصلاح شده ***
export function saveSessions() {
    // START: تغییرات برای محدود کردن سابقه چت
    // قبل از ذخیره، محدودیت را اعمال می‌کنیم
    enforceSessionLimit();
    // END: تغییرات برای محدود کردن سابقه چت
    
    try {
        // ایجاد یک کپی عمیق برای جلوگیری از تغییر داده اصلی
        const sessionsToSave = JSON.parse(JSON.stringify(chatSessions));
        
        // حذف base64Data از تمام پیام‌ها قبل از ذخیره‌سازی
        sessionsToSave.forEach(session => {
            session.messages.forEach(message => {
                if (message.parts) {
                    message.parts.forEach(part => {
                        delete part.base64Data;
                    });
                }
            });
        });

        localStorage.setItem('alphaChatSessions', JSON.stringify(sessionsToSave));
    } catch (e) {
        console.error("Failed to save sessions to localStorage:", e);
    }
}

// *** تابع اصلاح شده ***
export function loadSessions() {
    try {
        const saved = localStorage.getItem('alphaChatSessions');
        chatSessions = saved ? JSON.parse(saved) : [];
        
        // START: تغییرات برای محدود کردن سابقه چت
        // پس از بارگذاری، محدودیت را اعمال می‌کنیم تا موارد اضافی موجود پاک شوند
        enforceSessionLimit();
        // END: تغییرات برای محدود کردن سابقه چت
        
    } catch (e) {
        console.error("Failed to load sessions from localStorage:", e);
        chatSessions = [];
    }
}

export function findLastIndex(array, predicate) {
    for (let i = array.length - 1; i >= 0; i--) {
        if (predicate(array[i])) { return i; }
    }
    return -1;
}

export function deleteMessage(chatId, messageIndex) {
    const chat = chatSessions.find(s => s.id === chatId);
    if (chat && chat.messages[messageIndex]) {
        chat.messages.splice(messageIndex, 1);
        saveSessions();
    }
}
