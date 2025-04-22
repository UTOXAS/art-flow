// Translation dictionary for Arabic and English
const translations = {
    ar: {
        title: 'تدفق الفن',
        switch_to_english: 'التبديل إلى الإنجليزية',
        switch_to_arabic: 'التبديل إلى العربية',
        home: 'الرئيسية',
        describe: 'الوصف',
        text_to_art: 'من النص إلى الفن',
        inspired_art: 'فن مستوحى',
        art_from_description: 'فن من الوصف',
        create_explore: 'إنشاء واستكشاف فن الذكاء الاصطناعي',
        discover_tools: 'اكتشف أربع أدوات قوية لإطلاق العنان لإبداعك باستخدام الذكاء الاصطناعي.',
        describe_info: 'احصل على رؤى تفصيلية من صورك.',
        text_to_art_info: 'حول الكلمات إلى صور بصرية مذهلة.',
        inspired_art_info: 'أعد مزج الصور إلى أعمال فنية فريدة.',
        art_from_description_info: 'أنشئ فنًا من وصف نصي.',
        go: 'اذهب',
        describe_image: 'وصف الصورة',
        upload_image: 'رفع الصورة',
        generate: 'إنشاء',
        loading: 'جارٍ التحميل...',
        result: 'النتيجة',
        copy: 'نسخ',
        art: 'الفن',
        download: 'تنزيل',
        prompt: 'الموجه',
        notes: 'ملاحظات (اختياري)',
        description: 'الوصف',
        regenerate: 'إعادة إنشاء',
        powered_by: 'مدعوم بموديلات جوجل جيميني',
        dedicated_to: 'مكرس لسهيلة',
        published_by: 'طُور بواسطة عبدالله صالح',
        copied: 'تم النسخ إلى الحافظة!',
        failed_copy: 'فشل النسخ.',
        no_image: 'يرجى رفع صورة.',
        no_prompt: 'يرجى إدخال موجه.',
        no_description: 'يرجى إدخال وصف.',
        error: 'خطأ: ',
        server_error: 'حدث خطأ في الخادم. حاول مرة أخرى لاحقًا.',
        image_load_failed: 'فشل تحميل الصورة. حاول مرة أخرى.'
    },
    en: {
        title: 'Art Flow',
        switch_to_english: 'Switch to English',
        switch_to_arabic: 'Switch to Arabic',
        home: 'Home',
        describe: 'Describe',
        text_to_art: 'Text to Art',
        inspired_art: 'Inspired Art',
        art_from_description: 'Art from Description',
        create_explore: 'Create and Explore AI Art',
        discover_tools: 'Discover four powerful tools to unleash your creativity with AI.',
        describe_info: 'Get detailed insights from your images.',
        text_to_art_info: 'Transform words into stunning visual art.',
        inspired_art_info: 'Remix images into unique artworks.',
        art_from_description_info: 'Create art from a textual description.',
        go: 'Go',
        describe_image: 'Describe Image',
        upload_image: 'Upload Image',
        generate: 'Generate',
        loading: 'Loading...',
        result: 'Result',
        copy: 'Copy',
        art: 'Art',
        download: 'Download',
        prompt: 'Prompt',
        notes: 'Notes (Optional)',
        description: 'Description',
        regenerate: 'Regenerate',
        powered_by: 'Powered by Google Gemini Models',
        dedicated_to: 'Dedicated to Suhaila',
        published_by: 'Developed by Abdullah Saleh',
        copied: 'Copied to clipboard!',
        failed_copy: 'Failed to copy.',
        no_image: 'Please upload an image.',
        no_prompt: 'Please enter a prompt.',
        no_description: 'Please enter a description.',
        error: 'Error: ',
        server_error: 'A server error occurred. Please try again later.',
        image_load_failed: 'Failed to load the image. Please try again.'
    }
};

// Set language and update UI
function setLanguage(lang) {
    localStorage.setItem('language', lang);
    document.documentElement.lang = lang;
    document.body.setAttribute('lang', lang);
    document.querySelectorAll('[data-translate-key]').forEach(elem => {
        const key = elem.getAttribute('data-translate-key');
        elem.textContent = translations[lang][key];
    });
    document.getElementById('languageToggle').textContent = translations[lang][lang === 'ar' ? 'switch_to_english' : 'switch_to_arabic'];
    document.getElementById('textPrompt').placeholder = lang === 'ar' ? 'مثال: شاطئ غروب هادئ' : 'e.g., A serene sunset beach';
    document.getElementById('additionalInstructions').placeholder = lang === 'ar' ? 'مثال: استخدم ألوانًا نابضة بالحياة' : 'e.g., Use vibrant colors';
    document.getElementById('descriptionInput').placeholder = lang === 'ar' ? 'مثال: رجل يجلس على جدار خرساني ليلاً بجوار مسطح مائي' : 'e.g., A man sitting on a concrete wall at night by a body of water';
}

// Toggle between Arabic and English
function toggleLanguage() {
    const currentLang = localStorage.getItem('language') || 'ar';
    const newLang = currentLang === 'ar' ? 'en' : 'ar';
    setLanguage(newLang);
}

// Utility: Show Alert
function showAlert(messageKey, params = {}, type = 'success') {
    const lang = localStorage.getItem('language') || 'ar';
    let message = translations[lang][messageKey];
    if (params.error) {
        message += params.error;
    }
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.body.prepend(alertDiv);
    setTimeout(() => alertDiv.remove(), 5000);
}

// Utility: Copy Text to Clipboard
function copyToClipboard(text) {
    navigator.clipboard.writeText(text)
        .then(() => showAlert('copied', {}, 'success'))
        .catch(() => showAlert('failed_copy', {}, 'danger'));
}

// Section Management: Toggle Active Section
function toggleSection(sectionId) {
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    document.querySelector(`#${sectionId}`).classList.add('active');

    document.querySelectorAll('.btn-nav').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`.btn-nav[data-section="${sectionId}"]`).classList.add('active');
}

// Utility: Toggle Loading State
function toggleLoading(form, isLoading) {
    const submitBtn = form.querySelector('button[type="submit"]');
    const loader = form.querySelector('.loader-overlay');
    submitBtn.disabled = isLoading;
    loader.style.display = isLoading ? 'flex' : 'none';
}

// Section 1: Image Description Generator
function setupImageDescription() {
    const form = document.getElementById('imageDescriptionForm');
    if (!form) return;

    const fileInput = document.getElementById('imageFile');
    const preview = document.getElementById('imagePreview');
    const resultDiv = document.getElementById('descriptionResult');
    const copyBtn = document.getElementById('copyDescription');

    fileInput.addEventListener('change', () => {
        const file = fileInput.files[0];
        if (file) {
            preview.src = URL.createObjectURL(file);
            resultDiv.textContent = '';
            copyBtn.style.display = 'none';
        }
    });

    preview.addEventListener('click', () => {
        fileInput.click();
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const file = fileInput.files[0];
        if (!file) {
            showAlert('no_image', {}, 'danger');
            return;
        }

        toggleLoading(form, true);
        const formData = new FormData();
        formData.append('image', file);
        formData.append('language', localStorage.getItem('language') || 'ar');

        try {
            const response = await fetch('/api/image-description', {
                method: 'POST',
                body: formData,
            });
            const data = await response.json();
            if (data.error) {
                showAlert('error', { error: data.error }, 'danger');
            } else {
                resultDiv.textContent = data.description;
                copyBtn.style.display = 'block';
            }
        } catch (err) {
            showAlert('server_error', {}, 'danger');
        } finally {
            toggleLoading(form, false);
        }
    });

    copyBtn.addEventListener('click', () => {
        copyToClipboard(resultDiv.textContent);
    });
}

// Section 2: Text-to-Image Generator
function setupTextToImage() {
    const form = document.getElementById('textToImageForm');
    if (!form) return;

    const promptInput = document.getElementById('textPrompt');
    const preview = document.getElementById('generatedImage');
    const downloadBtn = document.getElementById('downloadImage');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const prompt = promptInput.value.trim();
        if (!prompt) {
            showAlert('no_prompt', {}, 'danger');
            return;
        }

        toggleLoading(form, true);
        try {
            const response = await fetch('/api/text-to-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt, language: localStorage.getItem('language') || 'ar' }),
            });
            const data = await response.json();
            if (data.error) {
                showAlert('error', { error: data.error }, 'danger');
            } else {
                preview.src = data.url;
                downloadBtn.style.display = 'block';
                downloadBtn.href = data.url;
            }
        } catch (err) {
            showAlert('server_error', {}, 'danger');
        } finally {
            toggleLoading(form, false);
        }
    });

    preview.addEventListener('error', () => {
        showAlert('image_load_failed', {}, 'danger');
        preview.src = '/images/generated-placeholder.png';
        downloadBtn.style.display = 'none';
    });
}

// Section 3: Image-Inspired Art Prompt and Image Generator
function setupImageInspired() {
    const form = document.getElementById('imageInspiredForm');
    if (!form) return;

    const fileInput = document.getElementById('inspiredImageFile');
    const preview = document.getElementById('inspiredImagePreview');
    const additionalInput = document.getElementById('additionalInstructions');
    const descriptionDiv = document.getElementById('inspiredDescription');
    const promptDiv = document.getElementById('inspiredPrompt');
    const imagePreview = document.getElementById('inspiredGeneratedImage');
    const copyDescBtn = document.getElementById('copyInspiredDescription');
    const copyPromptBtn = document.getElementById('copyInspiredPrompt');
    const downloadBtn = document.getElementById('downloadInspiredImage');
    const regenerateBtn = document.getElementById('regenerateInspiredImage');
    let currentPrompt = '';

    fileInput.addEventListener('change', () => {
        const file = fileInput.files[0];
        if (file) {
            preview.src = URL.createObjectURL(file);
            descriptionDiv.textContent = '';
            promptDiv.textContent = '';
            imagePreview.src = '/images/generated-placeholder.png';
            copyDescBtn.style.display = 'none';
            copyPromptBtn.style.display = 'none';
            downloadBtn.style.display = 'none';
            regenerateBtn.style.display = 'none';
        }
    });

    preview.addEventListener('click', () => {
        fileInput.click();
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const file = fileInput.files[0];
        const instructions = additionalInput.value.trim();

        if (!file) {
            showAlert('no_image', {}, 'danger');
            return;
        }

        toggleLoading(form, true);
        const formData = new FormData();
        formData.append('image', file);
        formData.append('language', localStorage.getItem('language') || 'ar');
        if (instructions) {
            formData.append('instructions', instructions);
        }

        try {
            const response = await fetch('/api/image-inspired', {
                method: 'POST',
                body: formData,
            });
            const data = await response.json();
            if (data.error) {
                showAlert('error', { error: data.error }, 'danger');
            } else {
                descriptionDiv.textContent = data.description;
                promptDiv.textContent = data.prompt;
                currentPrompt = data.englishPrompt || data.prompt;
                copyDescBtn.style.display = 'block';
                copyPromptBtn.style.display = 'block';
                if (data.url) {
                    imagePreview.src = data.url;
                    downloadBtn.style.display = 'block';
                    downloadBtn.href = data.url;
                    regenerateBtn.style.display = 'block';
                } else {
                    showAlert('image_load_failed', {}, 'warning');
                    imagePreview.src = '/images/generated-placeholder.png';
                }
            }
        } catch (err) {
            showAlert('server_error', {}, 'danger');
        } finally {
            toggleLoading(form, false);
        }
    });

    copyDescBtn.addEventListener('click', () => {
        copyToClipboard(descriptionDiv.textContent);
    });

    copyPromptBtn.addEventListener('click', () => {
        copyToClipboard(promptDiv.textContent);
    });

    regenerateBtn.addEventListener('click', async () => {
        if (!currentPrompt) {
            showAlert('no_prompt', {}, 'danger');
            return;
        }

        toggleLoading(form, true);
        try {
            const response = await fetch('/api/regenerate-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: currentPrompt }),
            });
            const data = await response.json();
            if (data.error) {
                showAlert('error', { error: data.error }, 'danger');
            } else {
                imagePreview.src = data.url;
                downloadBtn.style.display = 'block';
                downloadBtn.href = data.url;
            }
        } catch (err) {
            showAlert('server_error', {}, 'danger');
        } finally {
            toggleLoading(form, false);
        }
    });

    imagePreview.addEventListener('error', () => {
        showAlert('image_load_failed', {}, 'danger');
        imagePreview.src = '/images/generated-placeholder.png';
        downloadBtn.style.display = 'none';
        regenerateBtn.style.display = 'none';
    });
}

// Section 4: Description-to-Art Generator
function setupDescriptionToArt() {
    const form = document.getElementById('descriptionToArtForm');
    if (!form) return;

    const descriptionInput = document.getElementById('descriptionInput');
    const promptDiv = document.getElementById('artPrompt');
    const imagePreview = document.getElementById('artGeneratedImage');
    const copyPromptBtn = document.getElementById('copyArtPrompt');
    const downloadBtn = document.getElementById('downloadArtImage');
    const regenerateBtn = document.getElementById('regenerateArtImage');
    let currentPrompt = '';

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const description = descriptionInput.value.trim();
        if (!description) {
            showAlert('no_description', {}, 'danger');
            return;
        }

        toggleLoading(form, true);
        try {
            const response = await fetch('/api/description-to-art', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ description, language: localStorage.getItem('language') || 'ar' }),
            });
            const data = await response.json();
            if (data.error) {
                showAlert('error', { error: data.error }, 'danger');
            } else {
                promptDiv.textContent = data.prompt;
                currentPrompt = data.englishPrompt || data.prompt;
                copyPromptBtn.style.display = 'block';
                if (data.url) {
                    imagePreview.src = data.url;
                    downloadBtn.style.display = 'block';
                    downloadBtn.href = data.url;
                    regenerateBtn.style.display = 'block';
                }
            }
        } catch (err) {
            showAlert('server_error', {}, 'danger');
        } finally {
            toggleLoading(form, false);
        }
    });

    copyPromptBtn.addEventListener('click', () => {
        copyToClipboard(promptDiv.textContent);
    });

    regenerateBtn.addEventListener('click', async () => {
        if (!currentPrompt) {
            showAlert('no_prompt', {}, 'danger');
            return;
        }

        toggleLoading(form, true);
        try {
            const response = await fetch('/api/regenerate-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: currentPrompt }),
            });
            const data = await response.json();
            if (data.error) {
                showAlert('error', { error: data.error }, 'danger');
            } else {
                imagePreview.src = data.url;
                downloadBtn.style.display = 'block';
                downloadBtn.href = data.url;
            }
        } catch (err) {
            showAlert('server_error', {}, 'danger');
        } finally {
            toggleLoading(form, false);
        }
    });

    imagePreview.addEventListener('error', () => {
        showAlert('image_load_failed', {}, 'danger');
        imagePreview.src = '/images/generated-placeholder.png';
        downloadBtn.style.display = 'none';
        regenerateBtn.style.display = 'none';
    });
}

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    const savedLang = localStorage.getItem('language') || 'ar';
    setLanguage(savedLang);

    document.getElementById('languageToggle').addEventListener('click', toggleLanguage);

    document.querySelectorAll('.btn-nav, .btn-primary[data-section]').forEach(btn => {
        btn.addEventListener('click', () => {
            const section = btn.getAttribute('data-section');
            if (section) toggleSection(section);
        });
    });

    setupImageDescription();
    setupTextToImage();
    setupImageInspired();
    setupDescriptionToArt();
    toggleSection('home');
});