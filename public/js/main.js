// Set language and update UI
function setLanguage(lang) {
    console.log('Setting language:', lang); // Debug
    localStorage.setItem('language', lang);
    document.documentElement.lang = lang;
    document.body.setAttribute('lang', lang);

    // Update text content for non-tooltip elements
    document.querySelectorAll('[data-translate-key]:not(.tooltip-icon)').forEach(elem => {
        const key = elem.getAttribute('data-translate-key');
        elem.textContent = translations[lang][key];
    });

    // Update tooltip titles for tooltip-icon elements
    document.querySelectorAll('.tooltip-icon[data-translate-key]').forEach(elem => {
        const key = elem.getAttribute('data-translate-key');
        elem.setAttribute('data-bs-title', translations[lang][key]);
    });

    document.getElementById('languageToggle').textContent = translations[lang][lang === 'ar' ? 'switch_to_english' : 'switch_to_arabic'];
    document.getElementById('textPrompt').placeholder = lang === 'ar' ? 'مثال: شاطئ غروب هادئ' : 'e.g., A serene sunset beach';
    document.getElementById('additionalInstructions').placeholder = lang === 'ar' ? 'مثال: استخدم ألوانًا نابضة بالحياة' : 'e.g., Use vibrant colors';
    document.getElementById('descriptionInput').placeholder = lang === 'ar' ? 'مثال: رجل يجلس على جدار خرساني ليلاً بجوار مسطح مائي' : 'e.g., A man sitting on a concrete wall at night by a body of water';
    // NEW: Placeholder for photo-to-painting image input
    const photoToPaintingFileInput = document.getElementById('photoToPaintingImageFile');
    if (photoToPaintingFileInput) {
        photoToPaintingFileInput.placeholder = lang === 'ar' ? 'ارفع صورة' : 'Upload an image';
    }

    // Re-initialize tooltips to apply updated titles
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
}

// Utility: Toggle Loading State
function toggleLoading(form, isLoading) {
    const submitBtn = form.querySelector('button[type="submit"]');
    const loader = form.querySelector('.loader-overlay');
    submitBtn.disabled = isLoading;
    loader.style.display = isLoading ? 'flex' : 'none';
}

// Debounce Utility for Touch Events
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
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

        // Ensure the tooltip title is set
        elem.setAttribute('data-bs-title', tooltipText);

        const tooltip = new bootstrap.Tooltip(elem, {
            title: tooltipText,
            trigger: isTouchDevice ? 'manual' : 'hover focus',
            placement: 'top',
            customClass: 'custom-tooltip'
        });

        if (isTouchDevice) {
            const debouncedToggle = debounce((e) => {
                e.preventDefault();
                e.stopPropagation();

                const isVisible = tooltip.tip && tooltip.tip.classList.contains('show');
                if (!isVisible) {
                    tooltip.show();
                } else {
                    tooltip.hide();
                }

                // Set up outside tap listener to hide tooltip
                const hideTooltip = (event) => {
                    if (!elem.contains(event.target) && (!tooltip.tip || !tooltip.tip.contains(event.target))) {
                        tooltip.hide();
                        document.removeEventListener('touchstart', hideTooltip);
                    }
                };

                if (!isVisible) {
                    setTimeout(() => {
                        document.addEventListener('touchstart', hideTooltip);
                    }, 100);
                }
            }, 200);

            elem.addEventListener('touchstart', debouncedToggle);
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
                copyBtn.onclick = () => copyToClipboard(data.description);
            }
        } catch (error) {
            showAlert('server_error', {}, 'danger');
        } finally {
            toggleLoading(form, false);
        }
    });
}

// Section 2: Text to Image Generator
function setupTextToImage() {
    const form = document.getElementById('textToImageForm');
    if (!form) return;

    const promptInput = document.getElementById('textPrompt');
    const image = document.getElementById('generatedImage');
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
                body: JSON.stringify({
                    prompt,
                    language: localStorage.getItem('language') || 'ar'
                }),
            });
            const data = await response.json();
            if (data.error) {
                showAlert('error', { error: data.error }, 'danger');
            } else {
                image.src = data.url;
                downloadBtn.style.display = 'block';
                downloadBtn.onclick = () => downloadImage(data.url, 'generated-art.png');
            }
        } catch (error) {
            showAlert('server_error', {}, 'danger');
        } finally {
            toggleLoading(form, false);
        }
    });
}

// Section 3: Image Inspired Art Generator
function setupImageInspired() {
    const form = document.getElementById('imageInspiredForm');
    if (!form) return;

    const fileInput = document.getElementById('inspiredImageFile');
    const instructionsInput = document.getElementById('additionalInstructions');
    const preview = document.getElementById('inspiredImagePreview');
    const descriptionDiv = document.getElementById('inspiredDescription');
    const promptDiv = document.getElementById('inspiredPrompt');
    const image = document.getElementById('inspiredGeneratedImage');
    const copyDescriptionBtn = document.getElementById('copyInspiredDescription');
    const copyPromptBtn = document.getElementById('copyInspiredPrompt');
    const downloadBtn = document.getElementById('downloadInspiredImage');
    const regenerateBtn = document.getElementById('regenerateInspiredImage');
    const regenerateTooltip = document.getElementById('regenerate-inspired-tooltip');

    let lastPrompt = '';

    fileInput.addEventListener('change', () => {
        const file = fileInput.files[0];
        if (file) {
            preview.src = URL.createObjectURL(file);
            descriptionDiv.textContent = '';
            promptDiv.textContent = '';
            image.src = '/images/generated-placeholder.png';
            copyDescriptionBtn.style.display = 'none';
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
        if (!file) {
            showAlert('no_image', {}, 'danger');
            return;
        }

        toggleLoading(form, true);
        const formData = new FormData();
        formData.append('image', file);
        formData.append('instructions', instructionsInput.value.trim());
        formData.append('language', localStorage.getItem('language') || 'ar');

        try {
            const response = await fetch('/api/image-inspired', {
                method: 'POST',
                body: formData,
            });
            const data = await response.json();
            if (data.error) {
                showAlert('error', { error: data.error }, 'danger');
            } else {
                descriptionDiv.textContent = data.description || '';
                promptDiv.textContent = data.prompt || '';
                copyDescriptionBtn.style.display = data.description ? 'block' : 'none';
                copyPromptBtn.style.display = data.prompt ? 'block' : 'none';
                copyDescriptionBtn.onclick = () => copyToClipboard(data.description);
                copyPromptBtn.onclick = () => copyToClipboard(data.prompt);
                if (data.url) {
                    image.src = data.url;
                    downloadBtn.style.display = 'block';
                    downloadBtn.onclick = () => downloadImage(data.url, 'inspired-art.png');
                    regenerateTooltip.classList.remove('hidden');
                    lastPrompt = data.englishPrompt || data.prompt;
                } else {
                    image.src = '/images/generated-placeholder.png';
                    downloadBtn.style.display = 'none';
                    regenerateTooltip.classList.add('hidden');
                }
            }
        } catch (error) {
            showAlert('server_error', {}, 'danger');
        } finally {
            toggleLoading(form, false);
        }
    });

    regenerateBtn.addEventListener('click', async () => {
        if (!lastPrompt) {
            showAlert('no_prompt', {}, 'danger');
            return;
        }

        toggleLoading(form, true);
        try {
            const response = await fetch('/api/regenerate-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: lastPrompt }),
            });
            const data = await response.json();
            if (data.error) {
                showAlert('error', { error: data.error }, 'danger');
            } else {
                image.src = data.url;
                downloadBtn.style.display = 'block';
                downloadBtn.onclick = () => downloadImage(data.url, 'regenerated-inspired-art.png');
            }
        } catch (error) {
            showAlert('server_error', {}, 'danger');
        } finally {
            toggleLoading(form, false);
        }
    });
}

// Section 4: Description to Art Generator
function setupDescriptionToArt() {
    const form = document.getElementById('descriptionToArtForm');
    if (!form) return;

    const descriptionInput = document.getElementById('descriptionInput');
    const promptDiv = document.getElementById('artPrompt');
    const image = document.getElementById('artGeneratedImage');
    const copyPromptBtn = document.getElementById('copyArtPrompt');
    const downloadBtn = document.getElementById('downloadArtImage');
    const regenerateBtn = document.getElementById('regenerateArtImage');
    const regenerateTooltip = document.getElementById('regenerate-art-tooltip');

    let lastPrompt = '';

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
                body: JSON.stringify({
                    description,
                    language: localStorage.getItem('language') || 'ar'
                }),
            });
            const data = await response.json();
            if (data.error) {
                showAlert('error', { error: data.error }, 'danger');
            } else {
                promptDiv.textContent = data.prompt || '';
                copyPromptBtn.style.display = data.prompt ? 'block' : 'none';
                copyPromptBtn.onclick = () => copyToClipboard(data.prompt);
                if (data.url) {
                    image.src = data.url;
                    downloadBtn.style.display = 'block';
                    downloadBtn.onclick = () => downloadImage(data.url, 'description-art.png');
                    regenerateTooltip.classList.remove('hidden');
                    lastPrompt = data.englishPrompt || data.prompt;
                } else {
                    image.src = '/images/generated-placeholder.png';
                    downloadBtn.style.display = 'none';
                    regenerateTooltip.classList.add('hidden');
                }
            }
        } catch (error) {
            showAlert('server_error', {}, 'danger');
        } finally {
            toggleLoading(form, false);
        }
    });

    regenerateBtn.addEventListener('click', async () => {
        if (!lastPrompt) {
            showAlert('no_prompt', {}, 'danger');
            return;
        }

        toggleLoading(form, true);
        try {
            const response = await fetch('/api/regenerate-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: lastPrompt }),
            });
            const data = await response.json();
            if (data.error) {
                showAlert('error', { error: data.error }, 'danger');
            } else {
                image.src = data.url;
                downloadBtn.style.display = 'block';
                downloadBtn.onclick = () => downloadImage(data.url, 'regenerated-description-art.png');
            }
        } catch (error) {
            showAlert('server_error', {}, 'danger');
        } finally {
            toggleLoading(form, false);
        }
    });
}

// NEW: Section 5: Photo to Painting Generator
function setupPhotoToPainting() {
    const form = document.getElementById('photoToPaintingForm');
    if (!form) return;

    const fileInput = document.getElementById('photoToPaintingImageFile');
    const preview = document.getElementById('photoToPaintingImagePreview');
    const descriptionDiv = document.getElementById('photoToPaintingDescription');
    const promptDiv = document.getElementById('photoToPaintingPrompt');
    const image = document.getElementById('photoToPaintingGeneratedImage');
    const copyDescriptionBtn = document.getElementById('copyPhotoToPaintingDescription');
    const copyPromptBtn = document.getElementById('copyPhotoToPaintingPrompt');
    const downloadBtn = document.getElementById('downloadPhotoToPaintingImage');
    const regenerateBtn = document.getElementById('regeneratePhotoToPaintingImage');
    const regenerateTooltip = document.getElementById('regenerate-photo-to-painting-tooltip');

    let lastPrompt = '';

    fileInput.addEventListener('change', () => {
        const file = fileInput.files[0];
        if (file) {
            preview.src = URL.createObjectURL(file);
            descriptionDiv.textContent = '';
            promptDiv.textContent = '';
            image.src = '/images/generated-placeholder.png';
            copyDescriptionBtn.style.display = 'none';
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
        if (!file) {
            showAlert('no_image', {}, 'danger');
            return;
        }

        toggleLoading(form, true);
        const formData = new FormData();
        formData.append('image', file);
        formData.append('language', localStorage.getItem('language') || 'ar');

        try {
            const response = await fetch('/api/photo-to-painting', {
                method: 'POST',
                body: formData,
            });
            const data = await response.json();
            if (data.error) {
                showAlert('error', { error: data.error }, 'danger');
            } else {
                descriptionDiv.textContent = data.description || '';
                promptDiv.textContent = data.prompt || '';
                copyDescriptionBtn.style.display = data.description ? 'block' : 'none';
                copyPromptBtn.style.display = data.prompt ? 'block' : 'none';
                copyDescriptionBtn.onclick = () => copyToClipboard(data.description);
                copyPromptBtn.onclick = () => copyToClipboard(data.prompt);
                if (data.url) {
                    image.src = data.url;
                    downloadBtn.style.display = 'block';
                    downloadBtn.onclick = () => downloadImage(data.url, 'photo-to-painting.png');
                    regenerateTooltip.classList.remove('hidden');
                    lastPrompt = data.englishPrompt || data.prompt;
                } else {
                    image.src = '/images/generated-placeholder.png';
                    downloadBtn.style.display = 'none';
                    regenerateTooltip.classList.add('hidden');
                }
            }
        } catch (error) {
            showAlert('server_error', {}, 'danger');
        } finally {
            toggleLoading(form, false);
        }
    });

    regenerateBtn.addEventListener('click', async () => {
        if (!lastPrompt) {
            showAlert('no_prompt', {}, 'danger');
            return;
        }

        toggleLoading(form, true);
        try {
            const response = await fetch('/api/regenerate-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: lastPrompt }),
            });
            const data = await response.json();
            if (data.error) {
                showAlert('error', { error: data.error }, 'danger');
            } else {
                image.src = data.url;
                downloadBtn.style.display = 'block';
                downloadBtn.onclick = () => downloadImage(data.url, 'regenerated-photo-to-painting.png');
            }
        } catch (error) {
            showAlert('server_error', {}, 'danger');
        } finally {
            toggleLoading(form, false);
        }
    });
}

// Initialize Application
function init() {
    const savedLang = localStorage.getItem('language') || 'ar';
    setLanguage(savedLang);

    document.getElementById('languageToggle').addEventListener('click', toggleLanguage);

    document.querySelectorAll('.btn-nav, .btn[data-section]').forEach(btn => {
        btn.addEventListener('click', () => {
            const sectionId = btn.getAttribute('data-section');
            toggleSection(sectionId);
        });
    });

    setupImageDescription();
    setupTextToImage();
    setupImageInspired();
    setupDescriptionToArt();
    setupPhotoToPainting(); // NEW: Initialize photo-to-painting section
}

document.addEventListener('DOMContentLoaded', init);