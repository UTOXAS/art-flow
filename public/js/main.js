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
        .then(() => showAlert('Copied to clipboard!', 'success'))
        .catch(() => showAlert('Failed to copy.', 'danger'));
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
            preview.classList.add('img-preview');
            resultDiv.textContent = '';
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const file = fileInput.files[0];
        if (!file) {
            showAlert('Please upload an image.', 'danger');
            return;
        }

        const formData = new FormData();
        formData.append('image', file);

        try {
            const response = await fetch('/api/image-description', {
                method: 'POST',
                body: formData,
            });
            const data = await response.json();
            if (data.error) {
                showAlert(data.error, 'danger');
            } else {
                resultDiv.textContent = data.description;
                copyBtn.style.display = 'block';
            }
        } catch (err) {
            showAlert('An error occurred.', 'danger');
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
            showAlert('Please enter a prompt.', 'danger');
            return;
        }

        try {
            const response = await fetch('/api/text-to-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt }),
            });
            const data = await response.json();
            if (data.error) {
                showAlert(data.error, 'danger');
            } else {
                preview.src = `/uploads/${data.filename}`;
                preview.classList.add('img-preview');
                downloadBtn.style.display = 'block';
                downloadBtn.href = preview.src;
            }
        } catch (err) {
            showAlert('An error occurred.', 'danger');
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

    fileInput.addEventListener('change', () => {
        const file = fileInput.files[0];
        if (file) {
            preview.src = URL.createObjectURL(file);
            preview.classList.add('img-preview');
            descriptionDiv.textContent = '';
            promptDiv.textContent = '';
            imagePreview.src = '';
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const file = fileInput.files[0];
        const instructions = additionalInput.value.trim();

        if (!file) {
            showAlert('Please upload an image.', 'danger');
            return;
        }

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
                showAlert(data.error, 'danger');
            } else {
                descriptionDiv.textContent = data.description;
                promptDiv.textContent = data.prompt;
                if (data.filename) {
                    imagePreview.src = `/uploads/${data.filename}`;
                    imagePreview.classList.add('img-preview');
                    downloadBtn.style.display = 'block';
                    downloadBtn.href = imagePreview.src;
                }
                copyDescBtn.style.display = 'block';
                copyPromptBtn.style.display = 'block';
            }
        } catch (err) {
            showAlert('An error occurred.', 'danger');
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
    setupImageDescription();
    setupTextToImage();
    setupImageInspired();
});