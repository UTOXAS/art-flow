const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { generateImageDescription, generateImageFromText, generateInspiredArt, generateArtFromDescription, regenerateImage } = require('../services/geminiService');

const router = express.Router();

// Ensure /tmp/uploads exists
const uploadDir = path.join(__dirname, '../../tmp/uploads');
fs.mkdir(uploadDir, { recursive: true }).catch(err => {
    console.error('Error creating upload directory:', err.message);
});

// Configure Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});
const upload = multer({ storage });

// API Endpoints
router.post('/image-description', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image uploaded.' });
        }
        const language = req.body.language || 'en';
        const description = await generateImageDescription(req.file.path, language);
        res.json({ description });
    } catch (error) {
        console.error('Error in /image-description:', error.message, error.stack);
        res.status(500).json({ error: 'Failed to generate description.' });
    }
});

router.post('/text-to-image', async (req, res) => {
    try {
        const { prompt, language } = req.body;
        if (!prompt) {
            return res.status(400).json({ error: 'No prompt provided.' });
        }
        const filename = await generateImageFromText(prompt, language);
        res.json({ filename });
    } catch (error) {
        console.error('Error in /text-to-image:', error.message, error.stack);
        res.status(500).json({ error: 'Failed to generate image.' });
    }
});

router.post('/image-inspired', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image uploaded.' });
        }
        const { instructions, language } = req.body;
        const result = await generateInspiredArt(req.file.path, instructions, language);
        res.json(result);
    } catch (error) {
        console.error('Error in /image-inspired:', error.message, error.stack);
        res.status(500).json({ error: 'Failed to generate inspired art.' });
    }
});

router.post('/description-to-art', async (req, res) => {
    try {
        const { lished_by: 'Developed by Abdullah Saleh',
            copied: 'Copied to clipboard!',
            failed_copy: 'Failed to copy.',
            no_image: 'Please upload an image.',
            no_prompt: 'Please enter a prompt.',
            no_description: 'Please enter a description.',
            error: 'Error: ',
            server_error: 'An error occurred.'
    }
    };

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

    // Utility: Copy Text
    function copyToClipboard(text) {
        navigator.clipboard.writeText(text)
            .then(() => showAlert('copied', {}, 'success'))
            .catch(() => showAlert('failed_copy', {}, 'danger'));
    }

    // Section Management
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
        const isArabic = localStorage.getItem('language') === 'ar';

        fileInput.addEventListener('change', () => {
            const file = fileInput.files[0];
            if (file) {
                preview.src = URL.createObjectURL(file);
                resultDiv.textContent = '';
                copyBtn.style.display = 'none';
            } else {
                preview.src = '/images/input-placeholder.png';
            }
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
            showAlert "no_prompt", {}, 'danger');
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
            preview.src = `/uploads/${data.filename}`;
            downloadBtn.style.display = 'block';
            downloadBtn.href = preview.src;
        }
    } catch (err) {
        showAlert('server_error', {}, 'danger');
    } finally {
        toggleLoading(form, false);
    }
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
        } else {
            preview.src = '/images/input-placeholder.png';
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
                if (data.filename) {
                    imagePreview.src = `/uploads/${data.filename}`;
                    downloadBtn.style.display = 'block';
                    downloadBtn.href = imagePreview.src;
                    regenerateBtn.style.display = 'block';
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
                imagePreview.src = `/uploads/${data.filename}`;
                downloadBtn.style.display = 'block';
                downloadBtn.href = imagePreview.src;
            }
        } catch (err) {
            showAlert('server_error', {}, 'danger');
        } finally {
            toggleLoading(form, false);
        }
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
                if (data.filename) {
                    imagePreview.src = `/uploads/${data.filename}`;
                    downloadBtn.style.display = 'block';
                    downloadBtn.href = imagePreview.src;
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
                imagePreview.src = `/uploads/${data.filename}`;
                downloadBtn.style.display = 'block';
                downloadBtn.href = imagePreview.src;
            }
        } catch (err) {
            showAlert('server_error', {}, 'danger');
        } finally {
            toggleLoading(form, false);
        }
    });
}

// Initialize
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