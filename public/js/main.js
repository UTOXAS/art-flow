// Utility: Show Alert
function showAlert(message, type = 'success') {
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
        .then(() => showAlert('Copied!', 'success'))
        .catch(() => showAlert('Copy failed.', 'danger'));
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
function toggleLoading(button, isLoading) {
    button.disabled = isLoading;
    button.classList.toggle('is-loading', isLoading);
}

// Section 1: Image Description Generator
function setupImageDescription() {
    const form = document.getElementById('imageDescriptionForm');
    if (!form) return;

    const fileInput = document.getElementById('imageFile');
    const preview = document.getElementById('imagePreview');
    const resultDiv = document.getElementById('descriptionResult');
    const copyBtn = document.getElementById('copyDescription');
    const submitBtn = form.querySelector('button[type="submit"]');

    fileInput.addEventListener('change', () => {
        const file = fileInput.files[0];
        if (file) {
            preview.src = URL.createObjectURL(file);
            resultDiv.textContent = '';
            copyBtn.style.display = 'none';
        } else {
            preview.src = '/images/placeholder.png';
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const file = fileInput.files[0];
        if (!file) {
            showAlert('Upload an image.', 'danger');
            return;
        }

        toggleLoading(submitBtn, true);
        const formData = new FormData();
        formData.append('image', file);

        try {
            const response = await fetch('/api/image-description', {
                method: 'POST',
                body: formData,
            });
            const data = await response.json();
            if (data.error) {
                showAlert(`Error: ${data.error}`, 'danger');
            } else {
                resultDiv.textContent = data.description;
                copyBtn.style.display = 'block';
            }
        } catch (err) {
            showAlert('An error occurred.', 'danger');
        } finally {
            toggleLoading(submitBtn, false);
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
    const submitBtn = form.querySelector('button[type="submit"]');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const prompt = promptInput.value.trim();
        if (!prompt) {
            showAlert('Enter a prompt.', 'danger');
            return;
        }

        toggleLoading(submitBtn, true);
        try {
            const response = await fetch('/api/text-to-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt }),
            });
            const data = await response.json();
            if (data.error) {
                showAlert(`Error: ${data.error}`, 'danger');
            } else {
                preview.src = `/uploads/${data.filename}`;
                downloadBtn.style.display = 'block';
                downloadBtn.href = preview.src;
            }
        } catch (err) {
            showAlert('An error occurred.', 'danger');
        } finally {
            toggleLoading(submitBtn, false);
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
    const submitBtn = form.querySelector('button[type="submit"]');

    fileInput.addEventListener('change', () => {
        const file = fileInput.files[0];
        if (file) {
            preview.src = URL.createObjectURL(file);
            descriptionDiv.textContent = '';
            promptDiv.textContent = '';
            imagePreview.src = '/images/placeholder.png';
            copyDescBtn.style.display = 'none';
            copyPromptBtn.style.display = 'none';
            downloadBtn.style.display = 'none';
        } else {
            preview.src = '/images/placeholder.png';
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const file = fileInput.files[0];
        const instructions = additionalInput.value.trim();

        if (!file) {
            showAlert('Upload an image.', 'danger');
            return;
        }

        toggleLoading(submitBtn, true);
        const formData = new FormData();
        formData.append('image', file);
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
                showAlert(`Error: ${data.error}`, 'danger');
            } else {
                descriptionDiv.textContent = data.description;
                promptDiv.textContent = data.prompt;
                copyDescBtn.style.display = 'block';
                copyPromptBtn.style.display = 'block';
                if (data.filename) {
                    imagePreview.src = `/uploads/${data.filename}`;
                    downloadBtn.style.display = 'block';
                    downloadBtn.href = imagePreview.src;
                }
            }
        } catch (err) {
            showAlert('An error occurred.', 'danger');
        } finally {
            toggleLoading(submitBtn, false);
        }
    });

    copyDescBtn.addEventListener('click', () => {
        copyToClipboard(descriptionDiv.textContent);
    });

    copyPromptBtn.addEventListener('click', () => {
        copyToClipboard(promptDiv.textContent);
    });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.btn-nav, .btn-primary[data-section]').forEach(btn => {
        btn.addEventListener('click', () => {
            const section = btn.getAttribute('data-section');
            if (section) toggleSection(section);
        });
    });

    setupImageDescription();
    setupTextToImage();
    setupImageInspired();
    toggleSection('home');
});