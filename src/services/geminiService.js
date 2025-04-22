const { GoogleGenerativeAI } = require('@google/generative-ai');
const { GoogleAIFileManager } = require('@google/generative-ai/server');
const fs = require('fs').promises;
const mime = require('mime-types');
const path = require('path');
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

const descriptionPrompt = `
Please provide a detailed description of the image you see below, including the following:

Characters:
Number of characters
Gender, age, and ethnicity of each character
Clothing and accessories
Facial expressions and body language
Positions of characters relative to each other and to the background
Objects:
Types of objects
Sizes and shapes of objects
Positions of objects relative to each other and to the background
Background:
Setting (indoor or outdoor, specific location)
Colors and textures
Lighting and shadows
Point of View (POV):
Angle and distance from which the image is taken
Colors:
Dominant colors and color scheme
Use of color to create mood or atmosphere
Spacing:
Use of empty space to create balance and composition
Shades:
Use of light and shadow to create depth and dimension
Style:
Overall style of the image (e.g., realistic, abstract, impressionistic)
Sizes:
Relative sizes of characters and objects
Positions:
Precise placement of characters and objects within the frame
Make your answer only contains the description inside triple backticks block, without any leading or trailing text.
`;

const artPromptInstruction = `
Get inspired by the above description, use your imagination - don't just copy and paste - and artistic abilities and generate a text prompts - don't generate the image - composing a painting artwork.
The prompt should have its own full standalone context, so who reads it doesn't have to return to any prior descriptions or images.
By Get inspired I mean don't draw the same image, I mean use it just as a base for imagination. you don't have to follow the original characters, elements and settings closely, you can add, remove, change or tweak as you like maintaining an artistic touch.
Things should be emphasized or considered when composing the prompt:
• The painting is by hand.
• Should be predominantly realistic with some surreal elements, don't do something totally fantastical and otherworldly.
• Describe how brushstrokes are used to convey artistic depth.
• Well-designed characters and elements and symbolism.
• The prompt should include the name of the style
Make your answer only contains the prompt without any leading or trailing text.
The prompt should begin with the phrase "Generate an image of"
and the prompt should be in a triple backticks block.
`;

async function uploadToGemini(filePath) {
    try {
        // Verify file exists
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
        throw new Error(`Failed to upload file: ${error.message}`);
    }
}

async function translateToArabic(text) {
    try {
        const chatSession = descriptionModel.startChat({ generationConfig: descriptionConfig });
        const prompt = `translate this to Arabic:\n\n${text}\n\nMake your answer only contains the translation inside triple backticks block, without any leading or trailing text.`;
        const result = await chatSession.sendMessage(prompt);
        return result.response.text().replace(/```/g, '');
    } catch (error) {
        console.error('Error translating to Arabic:', error.message, error.stack);
        throw error;
    }
}

async function translateToEnglish(text) {
    try {
        const chatSession = descriptionModel.startChat({ generationConfig: descriptionConfig });
        const prompt = `translate this to English:\n\n${text}\n\nMake your answer only contains the translation inside triple backticks block, without any leading or trailing text.`;
        const result = await chatSession.sendMessage(prompt);
        return result.response.text().replace(/```/g, '');
    } catch (error) {
        console.error('Error translating to English:', error.message, error.stack);
        throw error;
    }
}

async function generateImageDescription(filePath, language) {
    try {
        // Verify file exists
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

        // Delete file after processing
        await fs.unlink(filePath).catch(err => console.warn(`Failed to delete file ${filePath}:`, err.message));
        return description;
    } catch (error) {
        console.error('Error generating image description:', error.message, error.stack);
        // Attempt to delete file in case of error
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
        const outputPath = path.join('/tmp/uploads', filename);

        const candidates = result.response.candidates;
        for (const candidate of candidates) {
            for (const part of candidate.content.parts) {
                if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
                    const imageBuffer = Buffer.from(part.inlineData.data, 'base64');
                    if (imageBuffer.length === 0) {
                        throw new Error('Empty image data received from Gemini API.');
                    }
                    await fs.writeFile(outputPath, imageBuffer);
                    // Verify file is written correctly
                    const stats = await fs.stat(outputPath);
                    if (stats.size === 0) {
                        throw new Error('Written image file is empty.');
                    }
                    return filename;
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
    try {
        // Verify file exists
        await fs.access(filePath);
        const file = await uploadToGemini(filePath);
        const chatSession = descriptionModel.startChat({ generationConfig: descriptionConfig });

        // Step 1: Generate Description
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

        // Step 2: Generate Art Prompt
        const artPromptRequest = additionalInstructions
            ? `${description}\n\n${additionalInstructions}\n\n${artPromptInstruction}`
            : `${description}\n\n${artPromptInstruction}`;
        result = await chatSession.sendMessage(artPromptRequest);
        const artPrompt = result.response.text().replace(/```/g, '');
        console.log('Generated art prompt:', artPrompt);

        // Step 3: Generate Image from Art Prompt
        const imageSession = generationModel.startChat({ generationConfig });
        const filename = `inspired-${Date.now()}.png`;
        const outputPath = path.join('/tmp/uploads', filename);

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
                    await fs.writeFile(outputPath, imageBuffer);
                    // Verify file is written correctly
                    const stats = await fs.stat(outputPath);
                    if (stats.size === 0) {
                        throw new Error('Written image file is empty.');
                    }
                    console.log('Image saved successfully:', outputPath);
                    const displayDescription = language === 'ar' ? await translateToArabic(description) : description;
                    const displayPrompt = language === 'ar' ? await translateToArabic(artPrompt) : artPrompt;
                    // Delete uploaded file after all processing
                    await fs.unlink(filePath).catch(err => console.warn(`Failed to delete file ${filePath}:`, err.message));
                    return { description: displayDescription, prompt: displayPrompt, englishPrompt: artPrompt, filename };
                }
            }
        }

        // If no image is generated, return description and prompt without filename
        console.warn('No image generated for prompt:', artPrompt);
        const displayDescription = language === 'ar' ? await translateToArabic(description) : description;
        const displayPrompt = language === 'ar' ? await translateToArabic(artPrompt) : artPrompt;
        // Delete uploaded file after processing
        await fs.unlink(filePath).catch(err => console.warn(`Failed to delete file ${filePath}:`, err.message));
        return { description: displayDescription, prompt: displayPrompt, englishPrompt: artPrompt };
    } catch (error) {
        console.error('Error generating inspired art:', error.message, error.stack);
        // Attempt to delete file in case of error
        await fs.unlink(filePath).catch(err => console.warn(`Failed to delete file ${filePath}:`, err.message));
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

        // Step 1: Generate Art Prompt
        const artPromptRequest = `${effectiveDescription}\n\n${artPromptInstruction}`;
        let result = await chatSession.sendMessage(artPromptRequest);
        const artPrompt = result.response.text().replace(/```/g, '');

        // Step 2: Generate Image from Art Prompt
        const imageSession = generationModel.startChat({ generationConfig });
        const filename = `description-art-${Date.now()}.png`;
        const outputPath = path.join('/tmp/uploads', filename);

        result = await imageSession.sendMessage(artPrompt);
        const candidates = result.response.candidates;
        for (const candidate of candidates) {
            for (const part of candidate.content.parts) {
                if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
                    const imageBuffer = Buffer.from(part.inlineData.data, 'base64');
                    if (imageBuffer.length === 0) {
                        throw new Error('Empty image data received from Gemini API.');
                    }
                    await fs.writeFile(outputPath, imageBuffer);
                    // Verify file is written correctly
                    const stats = await fs.stat(outputPath);
                    if (stats.size === 0) {
                        throw new Error('Written image file is empty.');
                    }
                    const displayPrompt = language === 'ar' ? await translateToArabic(artPrompt) : artPrompt;
                    return { prompt: displayPrompt, englishPrompt: artPrompt, filename };
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
        const outputPath = path.join('/tmp/uploads', filename);

        const candidates = result.response.candidates;
        for (const candidate of candidates) {
            for (const part of candidate.content.parts) {
                if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
                    const imageBuffer = Buffer.from(part.inlineData.data, 'base64');
                    if (imageBuffer.length === 0) {
                        throw new Error('Empty image data received from Gemini API.');
                    }
                    await fs.writeFile(outputPath, imageBuffer);
                    // Verify file is written correctly
                    const stats = await fs.stat(outputPath);
                    if (stats.size === 0) {
                        throw new Error('Written image file is empty.');
                    }
                    console.log('Regenerated image saved successfully:', outputPath);
                    return filename;
                }
            }
        }
        throw new Error('No valid image generated by Gemini API.');
    } catch (error) {
        console.error('Error regenerating image:', error.message, error.stack);
        throw error;
    }
}

module.exports = {
    generateImageDescription,
    generateImageFromText,
    generateInspiredArt,
    generateArtFromDescription,
    regenerateImage,
};