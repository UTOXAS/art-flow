const { GoogleGenerativeAI } = require('@google/generative-ai');
const { GoogleAIFileManager } = require('@google/generative-ai/server');
const fs = require('fs').promises;
const mime = require('mime-types');
const path = require('path');
const { put } = require('@vercel/blob');
// MODIFIED: Updated import to include photoToPaintingPromptInstruction
const { descriptionPrompt, paintingPromptInstruction, photoToPaintingPromptInstruction } = require('./prompts');
require('dotenv').config();

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set in environment variables.');
}
const genAI = new GoogleGenerativeAI(apiKey);
const fileManager = new GoogleAIFileManager(apiKey);

// Models for different tasks
const descriptionModel = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-lite',
});
const generationModel = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-exp-image-generation',
});

// Configuration for description tasks
const descriptionConfig = {
    temperature: 1,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 8192,
    responseModalities: ['text'],
    responseMimeType: 'text/plain',
};

// Configuration for image generation tasks
const generationConfig = {
    temperature: 1,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 8192,
    responseModalities: ['image', 'text'],
    responseMimeType: 'text/plain',
};

async function uploadToGemini(filePath) {
    try {
        await fs.access(filePath);
        const mimeType = mime.lookup(filePath);
        if (!mimeType) {
            throw new Error(`Unknown MIME type for file: ${filePath}`);
        }
        const uploadResult = await fileManager.uploadFile(filePath, {
            mimeType,
            displayName: path.basename(filePath),
        });
        return uploadResult.file;
    } catch (error) {
        console.error('Error uploading to Gemini:', error.message, error.stack);
        throw new Error(`Failed to upload file to Gemini: ${error.message}`);
    }
}

async function uploadImageToVercelBlob(imageBuffer, filename) {
    try {
        const { url } = await put(filename, imageBuffer, {
            access: 'public',
            contentType: 'image/png',
        });
        console.log('Image uploaded to Vercel Blob:', url);
        return url;
    } catch (error) {
        console.error('Error uploading to Vercel Blob:', error.message, error.stack);
        throw new Error(`Failed to upload image to Vercel Blob: ${error.message}`);
    }
}

async function translateToArabic(text) {
    try {
        const chatSession = descriptionModel.startChat({ generationConfig: descriptionConfig });
        const prompt = `translate this to Arabic:\n\n${text}\n\nMake your answer only contains the translation inside triple backticks block, without any leading or trailing text.`;
        const result = await chatSession.sendMessage(prompt);
        const responseText = result.response.text();
        const match = responseText.match(/```(.*?)```/s);
        if (!match || !match[1]) {
            console.warn('No valid translation found in response:', responseText);
            throw new Error('Invalid translation response format.');
        }
        return match[1].trim();
    } catch (error) {
        console.error('Error translating to Arabic:', error.message, error.stack);
        throw error;
    }
}

async function translateToEnglish(text) {
    try {
        const chatSession = descriptionModel.startChat({ generationConfig: descriptionConfig });
        const prompt = `translate this to English:\n\n${text}\n\nMake your answer only contains the translation inside triple backTicks block, without any leading or trailing text.`;
        const result = await chatSession.sendMessage(prompt);
        const responseText = result.response.text();
        const match = responseText.match(/```(.*?)```/s);
        if (!match || !match[1]) {
            console.warn('No valid translation found in response:', responseText);
            throw new Error('Invalid translation response format.');
        }
        return match[1].trim();
    } catch (error) {
        console.error('Error translating to English:', error.message, error.stack);
        throw error;
    }
}

async function generateImageDescription(filePath, language) {
    try {
        await fs.access(filePath);
        const file = await uploadToGemini(filePath);
        const chatSession = descriptionModel.startChat({ generationConfig: descriptionConfig });

        const result = await chatSession.sendMessage([
            {
                fileData: {
                    mimeType: file.mimeType,
                    fileUri: file.uri,
                },
            },
            { text: descriptionPrompt },
        ]);

        let description = result.response.text().replace(/```/g, '');
        if (language === 'ar') {
            description = await translateToArabic(description);
        }

        await fs.unlink(filePath).catch(err => console.warn(`Failed to delete file ${filePath}:`, err.message));
        return description;
    } catch (error) {
        console.error('Error generating image description:', error.message, error.stack);
        await fs.unlink(filePath).catch(err => console.warn(`Failed to delete file ${filePath}:`, err.message));
        throw error;
    }
}

async function generateImageFromText(prompt, language) {
    try {
        let effectivePrompt = prompt;
        if (language === 'ar') {
            effectivePrompt = await translateToEnglish(prompt);
        }

        const chatSession = generationModel.startChat({ generationConfig });
        const result = await chatSession.sendMessage(effectivePrompt);

        const filename = `generated-${Date.now()}.png`;

        const candidates = result.response.candidates;
        for (const candidate of candidates) {
            for (const part of candidate.content.parts) {
                if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
                    const imageBuffer = Buffer.from(part.inlineData.data, 'base64');
                    if (imageBuffer.length === 0) {
                        throw new Error('Empty image data received from Gemini API.');
                    }
                    const url = await uploadImageToVercelBlob(imageBuffer, filename);
                    return url;
                }
            }
        }
        throw new Error('No valid image generated by Gemini API.');
    } catch (error) {
        console.error('Error generating image from text:', error.message, error.stack);
        throw error;
    }
}

async function generateInspiredArt(filePath, additionalInstructions = '', language = 'en') {
    let fileDeleted = false;
    try {
        try {
            await fs.access(filePath);
        } catch (error) {
            throw new Error(`Image file not found at ${filePath}: ${error.message}`);
        }

        const file = await uploadToGemini(filePath);
        const chatSession = descriptionModel.startChat({ generationConfig: descriptionConfig });

        let result = await chatSession.sendMessage([
            {
                fileData: {
                    mimeType: file.mimeType,
                    fileUri: file.uri,
                },
            },
            { text: descriptionPrompt },
        ]);
        let description = result.response.text().replace(/```/g, '');
        console.log('Generated description:', description);

        const artPromptRequest = additionalInstructions
            ? `${description}\n\n${additionalInstructions}\n\n${paintingPromptInstruction}`
            : `${description}\n\n${paintingPromptInstruction}`;
        result = await chatSession.sendMessage(artPromptRequest);
        const artPrompt = result.response.text().replace(/```/g, '');
        console.log('Generated art prompt:', artPrompt);

        const imageSession = generationModel.startChat({ generationConfig });
        const filename = `inspired-${Date.now()}.png`;

        result = await imageSession.sendMessage(artPrompt);
        const candidates = result.response.candidates;
        console.log('Image generation candidates:', candidates.length);

        for (const candidate of candidates) {
            for (const part of candidate.content.parts) {
                if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
                    const imageBuffer = Buffer.from(part.inlineData.data, 'base64');
                    if (imageBuffer.length === 0) {
                        throw new Error('Empty image data received from Gemini API.');
                    }
                    const url = await uploadImageToVercelBlob(imageBuffer, filename);
                    console.log('Image uploaded successfully:', url);
                    const displayDescription = language === 'ar' ? await translateToArabic(description) : description;
                    const displayPrompt = language === 'ar' ? await translateToArabic(artPrompt) : artPrompt;
                    await fs.unlink(filePath).catch(err => console.warn(`Failed to delete file ${filePath}:`, err.message));
                    fileDeleted = true;
                    return { description: displayDescription, prompt: displayPrompt, englishPrompt: artPrompt, url };
                }
            }
        }

        console.warn('No image generated for prompt:', artPrompt);
        const displayDescription = language === 'ar' ? await translateToArabic(description) : description;
        const displayPrompt = language === 'ar' ? await translateToArabic(artPrompt) : artPrompt;
        await fs.unlink(filePath).catch(err => console.warn(`Failed to delete file ${filePath}:`, err.message));
        fileDeleted = true;
        return { description: displayDescription, prompt: displayPrompt, englishPrompt: artPrompt };
    } catch (error) {
        console.error('Error generating inspired art:', error.message, error.stack);
        if (!fileDeleted) {
            await fs.unlink(filePath).catch(err => console.warn(`Failed to delete file ${filePath}:`, err.message));
        }
        throw new Error(`Failed to generate inspired art: ${error.message}`);
    }
}

async function generateArtFromDescription(description, language) {
    try {
        let effectiveDescription = description;
        if (language === 'ar') {
            effectiveDescription = await translateToEnglish(description);
        }

        const chatSession = descriptionModel.startChat({ generationConfig: descriptionConfig });

        const artPromptRequest = `${effectiveDescription}\n\n${paintingPromptInstruction}`;
        let result = await chatSession.sendMessage(artPromptRequest);
        const artPrompt = result.response.text().replace(/```/g, '');

        const imageSession = generationModel.startChat({ generationConfig });
        const filename = `description-art-${Date.now()}.png`;

        result = await imageSession.sendMessage(artPrompt);
        const candidates = result.response.candidates;
        for (const candidate of candidates) {
            for (const part of candidate.content.parts) {
                if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
                    const imageBuffer = Buffer.from(part.inlineData.data, 'base64');
                    if (imageBuffer.length === 0) {
                        throw new Error('Empty image data received from Gemini API.');
                    }
                    const url = await uploadImageToVercelBlob(imageBuffer, filename);
                    const displayPrompt = language === 'ar' ? await translateToArabic(artPrompt) : artPrompt;
                    return { prompt: displayPrompt, englishPrompt: artPrompt, url };
                }
            }
        }

        const displayPrompt = language === 'ar' ? await translateToArabic(artPrompt) : artPrompt;
        return { prompt: displayPrompt, englishPrompt: artPrompt };
    } catch (error) {
        console.error('Error generating art from description:', error.message, error.stack);
        throw error;
    }
}

async function regenerateImage(prompt) {
    try {
        const chatSession = generationModel.startChat({ generationConfig });
        const result = await chatSession.sendMessage(prompt);

        const filename = `regenerated-${Date.now()}.png`;

        const candidates = result.response.candidates;
        for (const candidate of candidates) {
            for (const part of candidate.content.parts) {
                if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
                    const imageBuffer = Buffer.from(part.inlineData.data, 'base64');
                    if (imageBuffer.length === 0) {
                        throw new Error('Empty image data received from Gemini API.');
                    }
                    const url = await uploadImageToVercelBlob(imageBuffer, filename);
                    return url;
                }
            }
        }
        throw new Error('No valid image generated by Gemini API.');
    } catch (error) {
        console.error('Error regenerating image:', error.message, error.stack);
        throw error;
    }
}

async function generatePhotoToPainting(filePath, language = 'en') {
    let fileDeleted = false;
    try {
        try {
            await fs.access(filePath);
        } catch (error) {
            throw new Error(`Image file not found at ${filePath}: ${error.message}`);
        }

        const file = await uploadToGemini(filePath);
        const chatSession = descriptionModel.startChat({ generationConfig: descriptionConfig });

        // MODIFIED: Use descriptionPrompt instead of photoToPaintingDescriptionPrompt
        let result = await chatSession.sendMessage([
            {
                fileData: {
                    mimeType: file.mimeType,
                    fileUri: file.uri,
                },
            },
            { text: descriptionPrompt },
        ]);
        let description = result.response.text().replace(/```/g, '');
        console.log('Generated photo-to-painting description:', description);

        // MODIFIED: Use photoToPaintingPromptInstruction
        const paintingPromptRequest = `${description}\n\n${photoToPaintingPromptInstruction}`;
        result = await chatSession.sendMessage(paintingPromptRequest);
        const paintingPrompt = result.response.text().replace(/```/g, '');
        console.log('Generated painting prompt:', paintingPrompt);

        const imageSession = generationModel.startChat({ generationConfig });
        const filename = `photo-to-painting-${Date.now()}.png`;

        result = await imageSession.sendMessage(paintingPrompt);
        const candidates = result.response.candidates;
        console.log('Image generation candidates:', candidates.length);

        for (const candidate of candidates) {
            for (const part of candidate.content.parts) {
                if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
                    const imageBuffer = Buffer.from(part.inlineData.data, 'base64');
                    if (imageBuffer.length === 0) {
                        throw new Error('Empty image data received from Gemini API.');
                    }
                    const url = await uploadImageToVercelBlob(imageBuffer, filename);
                    console.log('Image uploaded successfully:', url);
                    const displayDescription = language === 'ar' ? await translateToArabic(description) : description;
                    const displayPrompt = language === 'ar' ? await translateToArabic(paintingPrompt) : paintingPrompt;
                    await fs.unlink(filePath).catch(err => console.warn(`Failed to delete file ${filePath}:`, err.message));
                    fileDeleted = true;
                    return { description: displayDescription, prompt: displayPrompt, englishPrompt: paintingPrompt, url };
                }
            }
        }

        console.warn('No image generated for prompt:', paintingPrompt);
        const displayDescription = language === 'ar' ? await translateToArabic(description) : description;
        const displayPrompt = language === 'ar' ? await translateToArabic(paintingPrompt) : paintingPrompt;
        await fs.unlink(filePath).catch(err => console.warn(`Failed to delete file ${filePath}:`, err.message));
        fileDeleted = true;
        return { description: displayDescription, prompt: displayPrompt, englishPrompt: paintingPrompt };
    } catch (error) {
        console.error('Error generating photo-to-painting:', error.message, error.stack);
        if (!fileDeleted) {
            await fs.unlink(filePath).catch(err => console.warn(`Failed to delete file ${filePath}:`, err.message));
        }
        throw new Error(`Failed to generate photo-to-painting: ${error.message}`);
    }
}

module.exports = {
    generateImageDescription,
    generateImageFromText,
    generateInspiredArt,
    generateArtFromDescription,
    regenerateImage,
    generatePhotoToPainting,
};