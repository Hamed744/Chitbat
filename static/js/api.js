import * as state from './state.js';
import * as ui from './ui.js';

const UPLOADER_API_URL = 'https://asrasahar-ok-uploader-bot.hf.space/upload';
const YOUR_IMAGE_UPLOAD_SERVER_URL = 'https://www.aisada.ir/hamed/upload.php';
const CONVERTER_API_URL = 'https://texttopdf-5irq.onrender.com/';

const HF_IMAGE_GEN_URL_BASE = "https://black-forest-labs-flux-1-schnell.hf.space";
const FN_INDEX_GEN_IMAGE = 2;
const TRIGGER_ID_GEN_IMAGE = 5;

function getDimensionsFromRatio(ratioString) {
    const defaultSize = { width: 768, height: 1344 };
    if (!ratioString || typeof ratioString !== 'string') return defaultSize;
    const r = ratioString.toLowerCase().replace(/[\sدر:بهx]/g, '');
    if (r === '11' || r.includes('مربع')) return { width: 1024, height: 1024 };
    if (r === '169' || r.includes('افقی') || r.includes('لندسکیپ')) return { width: 1344, height: 768 };
    if (r === '916' || r.includes('عمودی') || r.includes('پرتره') || r.includes('موبایل')) return { width: 768, height: 1344 };
    if (r === '43') return { width: 1152, height: 864 };
    if (r === '34') return { width: 864, height: 1152 };
    if (r === '32') return { width: 1216, height: 832 };
    if (r === '23') return { width: 832, height: 1216 };
    console.warn(`نسبت تصویر '${ratioString}' شناسایی نشد. از اندازه پیش‌فرض استفاده می‌شود.`);
    return defaultSize;
}
export async function convertTextToFile(content, format, buttonElement) {
    if (buttonElement) ui.showLoadingOnButton(buttonElement, true);
    try {
        const convertFormData = new FormData();
        convertFormData.append('content', content);
        convertFormData.append('format', format);
        const convertResponse = await fetch(CONVERTER_API_URL, {
            method: 'POST',
            body: convertFormData,
        });
        if (!convertResponse.ok) {
            throw new Error(`خطا در ارتباط با سرور تبدیل: ${convertResponse.statusText}`);
        }
        const fileBlob = await convertResponse.blob();
        const fileName = `alpha-export-${Date.now()}.${format}`;
        const uploadFormData = new FormData();
        uploadFormData.append('image', fileBlob, fileName); 
        const uploadResponse = await fetch(YOUR_IMAGE_UPLOAD_SERVER_URL, {
            method: 'POST',
            body: uploadFormData,
        });
        if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text().catch(() => `HTTP ${uploadResponse.status}`);
            throw new Error(`آپلود فایل ساخته شده به سرور شما ناموفق بود: ${errorText}`);
        }
        const uploadData = await uploadResponse.json();
        if (uploadData.success && uploadData.url) {
            window.parent.postMessage({
                type: 'OPEN_EXTERNAL_URL',
                url: uploadData.url
            }, '*');
        } else {
            throw new Error(uploadData.message || 'پاسخ سرور آپلود شما پس از ساخت فایل، نامعتبر بود.');
        }
    } catch (error) {
        console.error('خطا در فرآیند تبدیل و آپلود فایل:', error);
        alert(`متاسفانه در آماده‌سازی فایل برای دانلود خطایی رخ داد: ${error.message}`);
    } finally {
        if (buttonElement) ui.showLoadingOnButton(buttonElement, false);
    }
}


// #############################################################################
// START: کد نهایی و اصلاح شده
// این تابع بازنویسی شده تا به صورت هوشمند به مدل یادآوری کند که با چه نوع فایلی روبروست
// #############################################################################
function summarizeHistoryForApi(history) {
    return history.map(msg => {
        if (msg.isTemporary) return null;

        const newMsg = { ...msg };
        const newParts = [];
        let hasContent = false;

        if (newMsg.parts && newMsg.parts.length > 0) {
            for (const part of newMsg.parts) {
                const newPart = { ...part };
                delete newPart.base64Data;
                delete newPart.inlineData;
                
                // **بخش کلیدی و اصلاح شده**
                // اگر پارت حاوی فایل باشد، یک دستور صریح برای تحلیل آن اضافه می‌کنیم
                if (part.fileUrl && part.mimeType) {
                    let fileTypeDescription = "این فایل";
                    if (part.mimeType.startsWith('video/')) {
                        fileTypeDescription = "این ویدیو";
                    } else if (part.mimeType.startsWith('audio/')) {
                        fileTypeDescription = "این فایل صوتی";
                    } else if (part.mimeType.startsWith('image/')) {
                        // برای عکس نیازی به متن اضافه نیست
                    } else {
                        fileTypeDescription = `این سند (${part.name})`;
                    }
                    
                    // فقط اگر از نوع عکس نباشد متن را اضافه کن
                    if (!part.mimeType.startsWith('image/')) {
                         // اگر پیام کاربر متنی نداشت، یک پارت متنی جدید ایجاد کن
                        let textPart = newParts.find(p => p.text);
                        const instructionText = `\n(دستور برای تو: ${fileTypeDescription} را تحلیل کن و محتوای آن را شرح بده.)`;
                        if (textPart) {
                            textPart.text += instructionText;
                        } else {
                            newParts.push({ text: instructionText });
                        }
                    }
                }

                // فقط پارت‌هایی که محتوای واقعی دارند را نگه دار
                if (newPart.text || newPart.fileUrl || newPart.image_url || newPart.edited_images) {
                    newParts.push(newPart);
                    hasContent = true;
                }
            }
        }
        
        // یادآوری پرامپت استفاده شده برای ساخت تصویر
        if (msg.role === 'user' && msg.english_prompt_used) {
            const prompt_note = `پرامپت انگلیسی استفاده شده: "${msg.english_prompt_used}"`;
            const ratio_note = msg.aspect_ratio_used ? `, نسبت تصویر: "${msg.aspect_ratio_used}"` : "";
            const memoryNoteText = `\n[یادآوری برای تو (مدل): این پیام کاربر منجر به ساخت تصویری با مشخصات زیر شد. ${prompt_note}${ratio_note}]`;
            
            let textPart = newParts.find(p => p.text);
            if (textPart) {
                textPart.text += memoryNoteText;
            } else {
                newParts.push({ text: memoryNoteText });
            }
            hasContent = true;
        }

        newMsg.parts = newParts;
        return hasContent ? newMsg : null;
    }).filter(Boolean);
}
// #############################################################################
// END: کد نهایی و اصلاح شده
// #############################################################################


function uploadFileToHuggingFace(file, onProgress) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        state.setCurrentUploadXHR(xhr);
        xhr.open('POST', UPLOADER_API_URL, true);
        xhr.onload = function () {
            state.setCurrentUploadXHR(null);
            try {
                const response = JSON.parse(xhr.responseText);
                if (xhr.status >= 200 && xhr.status < 300) {
                    if (response.hf_url) {
                        resolve(response);
                    } else {
                        reject(new Error("پاسخ سرور فاقد 'hf_url' بود."));
                    }
                } else {
                    reject(new Error(response.error || `خطای سرور: ${xhr.statusText}`));
                }
            } catch (e) {
                reject(new Error(`خطای ناشناخته در پاسخ سرور آپلود. ${xhr.statusText}`));
            }
        };
        xhr.onerror = function () {
            state.setCurrentUploadXHR(null);
            if (xhr.status === 0 && !xhr.statusText) {
                reject(new Error('آپلود توسط کاربر لغو شد.'));
            } else {
                reject(new Error('خطای ارتباط با شبکه هنگام آپلود. لطفاً اتصال اینترنت خود را بررسی کنید.'));
            }
        };
        xhr.upload.onprogress = function (event) {
            if (event.lengthComputable && onProgress) {
                const percentComplete = Math.round((event.loaded / event.total) * 100);
                onProgress(percentComplete);
            }
        };
        const formData = new FormData();
        formData.append('file', file);
        xhr.send(formData);
    });
}
async function uploadUrlToHuggingFace(url) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', UPLOADER_API_URL, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.onload = function () {
            try {
                const response = JSON.parse(xhr.responseText);
                if (xhr.status >= 200 && xhr.status < 300 && response.hf_url) {
                    resolve(response);
                } else {
                    reject(new Error(response.error || `خطای سرور: ${xhr.statusText}`));
                }
            } catch (e) {
                reject(new Error(`خطای ناشناخته در پاسخ سرور آپلود. ${xhr.statusText}`));
            }
        };
        xhr.onerror = function () { reject(new Error('خطای ارتباط با شبکه هنگام آپلود URL.')); };
        xhr.send(JSON.stringify({ url: url }));
    });
}
export async function processAndUploadFile(file, onProgress) {
    const readFileAsBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const base64String = reader.result.split(',')[1];
                resolve(base64String);
            };
            reader.onerror = (error) => reject(error);
            reader.readAsDataURL(file);
        });
    };
    try {
        const [uploadResult, base64Data] = await Promise.all([
            uploadFileToHuggingFace(file, onProgress),
            readFileAsBase64(file)
        ]);
        return {
            url: uploadResult.hf_url,
            name: file.name,
            mimeType: file.type,
            base64Data: base64Data
        };
    } catch (error) {
        console.error("خطا در پردازش و آپلود فایل:", error);
        throw error;
    }
}
export async function uploadToAISADAAndOpenAlpha(imageUrlFromSpace, downloadButtonElement) {
    if (!imageUrlFromSpace) {
        if (downloadButtonElement) downloadButtonElement.textContent = "خطا: URL نامعتبر";
        return;
    }
    if (downloadButtonElement) {
        downloadButtonElement.disabled = true;
        downloadButtonElement.innerHTML = `<div class="typing-indicator" style="height:16px; gap: 3px;"><span style="width:6px; height:6px; background-color:currentColor;"></span><span style="width:6px; height:6px; background-color:currentColor;"></span><span style="width:6px; height:6px; background-color:currentColor;"></span></div>`;
    }
    try {
        const imageResponse = await fetch(imageUrlFromSpace);
        if (!imageResponse.ok) throw new Error(`خطا در دریافت فایل از هاگینگ فیس: ${imageResponse.status}`);
        const imageBlob = await imageResponse.blob();
        const formData = new FormData();
        let filename = `generated_alpha_image_${Date.now()}.webp`;
        try {
            const urlPath = new URL(imageUrlFromSpace).pathname.split('/').pop();
            if(urlPath && urlPath.includes('.')) filename = urlPath.split('?')[0];
        } catch(e){ console.warn("Could not parse filename from HF URL:", e); }
        formData.append('image', imageBlob, filename);
        const uploadResponse = await fetch(YOUR_IMAGE_UPLOAD_SERVER_URL, { method: 'POST', body: formData });
        if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text().catch(() => `HTTP ${uploadResponse.status}`);
            throw new Error(`آپلود به سرور شما ناموفق بود: ${errorText}`);
        }
        const uploadData = await uploadResponse.json();
        if (uploadData.success && uploadData.url) {
            window.parent.postMessage({
                type: 'OPEN_EXTERNAL_URL',
                url: uploadData.url
            }, '*');
        } else {
            throw new Error(uploadData.message || 'پاسخ سرور آپلود شما نامعتبر بود.');
        }
    } catch (error) {
        console.error("خطا در فرآیند دانلود و آپلود تصویر:", error);
        if (downloadButtonElement) downloadButtonElement.textContent = "خطا";
        alert(`خطا در آماده‌سازی دانلود: ${error.message}`);
    } finally {
        if (downloadButtonElement) {
            setTimeout(() => {
                downloadButtonElement.disabled = false;
                downloadButtonElement.innerHTML = `<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>`;
            }, 2000);
        }
    }
}
function convertImageBlobToPng(imageBlob) {
    return new Promise((resolve, reject) => {
        const imageUrl = URL.createObjectURL(imageBlob);
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            canvas.toBlob((blob) => {
                resolve(blob);
                URL.revokeObjectURL(imageUrl);
            }, 'image/png');
        };
        img.onerror = () => {
            reject(new Error('خطا در بارگذاری تصویر برای تبدیل فرمت.'));
            URL.revokeObjectURL(imageUrl);
        };
        img.src = imageUrl;
    });
}

export async function runExternalImageEditor(prompt, fileUrl, modelBubbleOuterDivElement, messageIndex) {
    const activeChat = state.getActiveChat();
    const RENDER_API_URL = 'https://alfa-editor-worker.onrender.com/api/edit';

    const showError = (error) => {
        ui.displayError(modelBubbleOuterDivElement, error.message || String(error));
    };

    try {
        if (!fileUrl) throw new Error("آدرس فایلی برای ویرایش یافت نشد.");

        ui.showStatusUpdate("در حال دانلود فایل برای ویرایش...", modelBubbleOuterDivElement);
        const response = await fetch(fileUrl);
        if (!response.ok) throw new Error(`خطا در دانلود فایل برای ویرایش: ${response.statusText}`);
        
        let imageBlob = await response.blob();
        const originalMimeType = imageBlob.type || response.headers.get('content-type');

        if (originalMimeType && originalMimeType !== 'image/png' && originalMimeType !== 'image/jpeg') {
            const format = originalMimeType.split('/')[1] || 'ناشناخته';
            ui.showStatusUpdate(`فرمت تصویر (${format.toUpperCase()}) نامناسب است. در حال تبدیل به PNG...`, modelBubbleOuterDivElement);
            imageBlob = await convertImageBlobToPng(imageBlob);
        }
        
        ui.showStatusUpdate("ارسال درخواست به سرور ویرایش...", modelBubbleOuterDivElement);
        const formData = new FormData();
        formData.append("image", imageBlob, 'image.png');
        formData.append("prompt", prompt);
        
        const editResponse = await fetch(RENDER_API_URL, {
            method: 'POST', body: formData, signal: state.globalAbortController.signal
        });
        
        const result = await editResponse.json();
        if (!editResponse.ok) throw new Error(result.error || `خطای سرور ویرایش: ${editResponse.status}`);
        
        if (!result.image_urls || result.image_urls.length === 0) {
            throw new Error("پردازش کامل شد اما تصویری از سرور ویرایش دریافت نشد.");
        }
        
        ui.showStatusUpdate("در حال دائمی‌سازی لینک‌های تصاویر ویرایش شده...", modelBubbleOuterDivElement);
        const permanentUrls = await Promise.all(
            result.image_urls.map(tempUrl => uploadUrlToHuggingFace(tempUrl).then(res => res.hf_url))
        );

        const finalMessage = { role: 'model', parts: [{ edited_images: permanentUrls }] };
        
        if (typeof messageIndex !== 'undefined') {
            activeChat.messages[messageIndex] = finalMessage;
            state.saveSessions();
            ui.addMessageToUI(finalMessage, messageIndex, { isLastModel: true, animate: false }, modelBubbleOuterDivElement);
        }

    } catch (error) {
        console.error("خطا در فرآیند ویرایش تصویر:", error);
        if (error.name !== 'AbortError') showError(error);
        else modelBubbleOuterDivElement.querySelector('.message-content-area').innerHTML += '<p class="text-xs text-slate-500 mt-2 text-center">-- عملیات ویرایش متوقف شد --</p>';
    } finally {
        ui.resetState();
    }
}

export async function runExternalImageGenerator(englishPrompt, aspectRatio, modelBubbleOuterDivElement, followUpText = null) {
    const activeChat = state.getActiveChat();
    const sessionHash = Math.random().toString(36).substring(2, 15);
    
    const showError = (error) => {
        const errorMessage = error.message || String(error);
        if (errorMessage.toLowerCase().includes("gpu") || errorMessage.toLowerCase().includes("quota")) {
            ui.displayError(modelBubbleOuterDivElement, errorMessage, 'gpu_quota_exceeded');
        } else {
            ui.displayError(modelBubbleOuterDivElement, errorMessage);
        }
    };

    try {
        const dimensions = getDimensionsFromRatio(aspectRatio);
        ui.showStatusUpdate("ارسال درخواست به سرور تصویر...", modelBubbleOuterDivElement);
        
        const payload = [ englishPrompt, Math.floor(Math.random() * 2147483647), true, dimensions.width, dimensions.height, 4 ];
        const joinPayload = { "fn_index": FN_INDEX_GEN_IMAGE, "data": payload, "event_data": null, "session_hash": sessionHash, "trigger_id": TRIGGER_ID_GEN_IMAGE };
        
        const joinResponse = await fetch(`${HF_IMAGE_GEN_URL_BASE}/queue/join`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(joinPayload), signal: state.globalAbortController.signal });
        
        if (!joinResponse.ok) {
            let errorText = `خطای سرور: ${joinResponse.status}`;
            try { const errorJson = await joinResponse.json(); errorText = errorJson.error || errorJson.detail || errorText; } catch(e) {}
             throw new Error(errorText);
        }
        
        const joinResult = await joinResponse.json();
        if (!joinResult.event_id) throw new Error("event_id از Gradio دریافت نشد.");
        
        if (state.currentImageEventSource) { state.currentImageEventSource.close(); }
        const eventSource = new EventSource(`${HF_IMAGE_GEN_URL_BASE}/queue/data?session_hash=${sessionHash}`);
        state.setCurrentImageEventSource(eventSource);
        
        await new Promise((resolve, reject) => {
            eventSource.onmessage = async (event) => {
                const data = JSON.parse(event.data);
                switch(data.msg) {
                    case "process_starts": ui.showStatusUpdate("پردازش تصویر در سرور آغاز شد...", modelBubbleOuterDivElement); break;
                    case "progress": if (data.progress_data && data.progress_data.length > 0) { const p = data.progress_data[0]; ui.showStatusUpdate(`در حال ساخت... (${p.index}/${p.length})`, modelBubbleOuterDivElement); } break;
                    case "process_completed":
                        eventSource.close();
                        state.setCurrentImageEventSource(null);
                        if (data.success && data.output?.data?.[0]?.url) {
                            const tempImageUrl = data.output.data[0].url;
                            ui.showStatusUpdate("تصویر ساخته شد. در حال دائمی‌سازی لینک...", modelBubbleOuterDivElement);
                            try {
                                const uploadResult = await uploadUrlToHuggingFace(tempImageUrl);
                                const permanentUrl = uploadResult.hf_url;
                                
                                const newModelMessageParts = [{ image_url: permanentUrl }];
                                if (followUpText) {
                                    newModelMessageParts.push({ text: followUpText });
                                }

                                const newModelMessage = { role: 'model', parts: newModelMessageParts };
                                
                                activeChat.messages[activeChat.messages.length - 1] = newModelMessage;
                                state.saveSessions();
                                ui.addMessageToUI(newModelMessage, activeChat.messages.length - 1, { isLastModel: true, animate: false }, modelBubbleOuterDivElement);
                                resolve();
                            } catch (uploadError) {
                                reject(new Error(`تصویر ساخته شد اما در آپلود به سرور دائمی خطا رخ داد: ${uploadError.message}`));
                            }
                        } else {
                            reject(new Error(data.output?.error || "پاسخ سرور ساخت تصویر، فاقد URL معتبر بود."));
                        }
                        break;
                     case 'queue_full': eventSource.close(); reject(new Error("صف پردازش تصویر پر است. لطفاً چند لحظه دیگر تلاش کنید.")); break;
                }
            };
            eventSource.onerror = () => { eventSource.close(); state.setCurrentImageEventSource(null); reject(new Error("ارتباط با سرور ساخت تصویر قطع شد.")); };
        });

    } catch (error) {
        if (error.name !== 'AbortError') { showError(error); } 
        else { modelBubbleOuterDivElement.querySelector('.message-content-area').innerHTML += '<p class="text-xs text-slate-500 mt-2 text-center">-- تولید پاسخ متوقف شد --</p>'; }
    } finally {
        ui.resetState();
    }
}
export async function streamResponse(modelBubbleOuterDivElement, incomingHistory, chatId, actionPayload = null) {
    state.setGlobalAbortController(new AbortController());
    let fullResponseText = "";
    const activeChat = state.getActiveChat();
    let finalMessageObject = { role: 'model', parts: [] };
    let bodyPayload;
    try {
        const historyForApi = summarizeHistoryForApi(actionPayload ? incomingHistory.slice(0, -1) : incomingHistory);
        bodyPayload = { 
            history: historyForApi, 
            model: state.getActiveChat().model, 
            chatId: chatId, 
            action: actionPayload 
        };
        if (!actionPayload) {
            const lastUserMessage = incomingHistory[incomingHistory.length - 2];
            const filePart = lastUserMessage?.parts.find(p => p.base64Data);
            if (filePart) {
                const apiMessageToUpdate = bodyPayload.history[bodyPayload.history.length - 1];
                if (apiMessageToUpdate) {
                    apiMessageToUpdate.parts.unshift({
                        inlineData: {
                            mimeType: filePart.mimeType,
                            data: filePart.base64Data
                        }
                    });
                }
            }
        }
    } catch(error) {
        ui.displayError(modelBubbleOuterDivElement, `خطا در آماده‌سازی درخواست: ${error.message}`);
        ui.resetState();
        return;
    }
    try {
        const response = await fetch('/chat', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            signal: state.globalAbortController.signal,
            body: JSON.stringify(bodyPayload),
        });
        if (!response.ok) {
             const errorData = await response.json().catch(() => ({error: {message: `خطای سرور: ${response.statusText}`}}));
             throw new Error(errorData.error.message || `خطای سرور: ${response.status}`);
        }
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');
            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    try {
                        const jsonStr = line.substring(6);
                        if (jsonStr.trim() === '') continue;
                        const data = JSON.parse(jsonStr);
                        const lastUserMessage = activeChat.messages[activeChat.messages.length - 2];
                        if (data.intent === 'generate_image') {
                            reader.cancel();
                            if(lastUserMessage && lastUserMessage.role === 'user') { 
                                lastUserMessage.english_prompt_used = data.english_prompt; 
                                lastUserMessage.aspect_ratio_used = data.aspect_ratio;
                                state.saveSessions(); 
                            }
                            await runExternalImageGenerator(data.english_prompt, data.aspect_ratio, modelBubbleOuterDivElement);
                            return; 
                        }
                        else if (data.intent === 'generate_image_with_text') {
                            reader.cancel();
                            const { text, image_generation_payload, follow_up_text } = data;
                            if (lastUserMessage && lastUserMessage.role === 'user') {
                                lastUserMessage.english_prompt_used = image_generation_payload.english_prompt;
                                lastUserMessage.aspect_ratio_used = image_generation_payload.aspect_ratio;
                                state.saveSessions();
                            }
                            ui.streamFinalText(text, modelBubbleOuterDivElement);
                            await runExternalImageGenerator(
                                image_generation_payload.english_prompt,
                                image_generation_payload.aspect_ratio,
                                modelBubbleOuterDivElement,
                                follow_up_text
                            );
                            return;
                        }
                        else if (data.intent === 'clarify_action') {
                           reader.cancel();
                           const commandMessage = { role: 'model', clarification: data.options, question: data.question, parts: [] };
                           activeChat.messages[activeChat.messages.length - 1] = commandMessage;
                           state.saveSessions();
                           ui.addMessageToUI(commandMessage, activeChat.messages.length - 1, { isLastModel: true }, modelBubbleOuterDivElement);
                           ui.resetState();
                           return;
                        }
                        else if (data.intent === 'edit_image') {
                            reader.cancel();
                            let fileUrlForEditing = null;
                            for (let i = incomingHistory.length - 2; i >= 0; i--) {
                                const msg = incomingHistory[i];
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
                            if (!fileUrlForEditing) {
                                throw new Error("قصد ویرایش تشخیص داده شد اما هیچ فایلی برای ویرایش یافت نشد.");
                            }
                            await runExternalImageEditor(data.prompt, fileUrlForEditing, modelBubbleOuterDivElement, activeChat.messages.length - 1);
                            return;
                        }
                        else if (data.error) {
                            throw new Error(data.error.message || JSON.stringify(data.error));
                        }
                        else if (data.candidates) {
                            const chunkText = data.candidates[0].content.parts[0].text;
                            fullResponseText += chunkText;
                            ui.streamFinalText(fullResponseText, modelBubbleOuterDivElement, false);
                        }
                    } catch (e) { console.warn("خطا در پردازش SSE chunk:", e, "Chunk:", line); }
                }
            }
        }
        if (fullResponseText) {
             finalMessageObject.parts.push({ text: fullResponseText });
        }
        if (finalMessageObject.parts.length > 0) {
            activeChat.messages[activeChat.messages.length - 1] = finalMessageObject;
        } else {
             activeChat.messages.pop();
        }
        state.saveSessions();
        ui.updateMessageActions(modelBubbleOuterDivElement, finalMessageObject, false, true);
    } catch (error) {
        if (error.name === 'AbortError') {
            modelBubbleOuterDivElement.querySelector('.message-content-area').innerHTML += '<p class="text-xs text-slate-500 mt-2 text-center">-- عملیات متوقف شد --</p>';
        } else {
            ui.displayError(modelBubbleOuterDivElement, error.message || 'یک خطای ناشناخته رخ داد.');
        }
    } finally {
        ui.resetState();
    }
}
