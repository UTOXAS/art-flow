// Set language and update UI
function setLanguage(lang) {
    console.log('Setting language:', lang); // Debug
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
    // Re-initialize tooltips to update text
    initializeTooltips();
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

// Utility: Download Image
function downloadImage(url, filename) {
    fetch(url)
        .then(response => response.blob())
        .then(blob => {
            const blobUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = filename || 'art-flow-image.png';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(blobUrl);
        })
        .catch(() => showAlert('image_load_failed', {}, 'danger'));
}

// Section Management: Toggle Active Section
function toggleSection(sectionId) {
    console.log('Toggling section:', sectionId); // Debug
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    document.querySelector(`#${sectionId}`).classList.add('active');

    document.querySelectorAll('.btn-nav').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`.btn-nav[data-section="${sectionId}"]`).classList.add('active');
    // Check footer visibility
    console.log('Footer visible:', document.querySelector('.footer').offsetParent !== null);
}

// Utility: Toggle Loading State
function toggleLoading(form, isLoading) {
    const submitBtn = form.querySelector('button[type="submit"]');
    const loader = form.querySelector('.loader-overlay');
    submitBtn.disabled = isLoading;
    loader.style.display = isLoading ? 'flex' : 'none';
}

// Initialize Bootstrap Tooltips
function initializeTooltips() {
    const lang = localStorage.getItem('language') || 'ar';
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    // Dispose existing tooltips to prevent duplicates
    document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach(elem => {
        const tooltipInstance = bootstrap.Tooltip.getInstance(elem);
        if (tooltipInstance) {
            tooltipInstance.dispose();
        }
    });

    document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach(elem => {
        const key = elem.getAttribute('data-translate-key');
        const tooltipText = translations[lang][key];

        // Set the tooltip title dynamically
        elem.setAttribute('data-bs-title', tooltipText);

        const tooltip = new bootstrap.Tooltip(elem, {
            title: tooltipText,
            trigger: isTouchDevice ? 'click' : 'hover focus',
            placement: 'top',
            customClass: 'custom-tooltip'
        });

        if (isTouchDevice) {
            elem.addEventListener('click', () => {
                tooltip.show();
                setTimeout(() => {
                    tooltip.hide();
                }, 5000);
            });

            // Dismiss on click outside
            document.addEventListener('click', (e) => {
                if (!elem.contains(e.target)) {
                    tooltip.hide();
                }
            }, { once: true });
        }
    });
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
                downloadBtn.onclick = () => downloadImage(data.url, 'text-to-image.png');
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
    const regenerateTooltip = document.getElementById('regenerate-inspired-tooltip');
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
            regenerateTooltip.classList.add('hidden');
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
                    downloadBtn.onclick = () => downloadImage(data.url, 'inspired-art.png');
                    regenerateTooltip.classList.remove('hidden');
                    initializeTooltips(); // Re-initialize tooltips to update text
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

    regenerateTooltip.querySelector('#regenerateInspiredImage').addEventListener('click', async () => {
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
                downloadBtn.onclick = () => downloadImage(data.url, 'inspired-art.png');
                regenerateTooltip.classList.remove('hidden');
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
        regenerateTooltip.classList.add('hidden');
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
    const regenerateTooltip = document.getElementById('regenerate-art-tooltip');
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
                    downloadBtn.onclick = () => downloadImage(data.url, 'description-art.png');
                    regenerateTooltip.classList.remove('hidden');
                    initializeTooltips(); // Re-initialize tooltips to update text
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

    regenerateTooltip.querySelector('#regenerateArtImage').addEventListener('click', async () => {
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
                downloadBtn.onclick = () => downloadImage(data.url, 'description-art.png');
                regenerateTooltip.classList.remove('hidden');
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
        regenerateTooltip.classList.add('hidden');
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
    initializeTooltips();
});