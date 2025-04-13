const { GoogleGenerativeAI } = require('@google/generative-ai');
const { GoogleAIFileManager } = require('@google/generative-ai/server');
const fs = require('fs');
const mime = require('mime-types');
const path = require('path');

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);
const fileManager = new GoogleAIFileManager(apiKey);

const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-exp-image-generation',
});

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
    const mimeType = mime.lookup(filePath);
    const uploadResult = await fileManager.uploadFile(filePath, {
        mimeType,
        displayName: path.basename(filePath),
    });
    return uploadResult.file;
}

async function generateImageDescription(filePath) {
    const file = await uploadToGemini(filePath);
    const chatSession = model.startChat({ generationConfig });

    const result = await chatSession.sendMessage([
        {
            fileData: {
                mimeType: file.mimeType,
                fileUri: file.uri,
            },
        },
        { text: descriptionPrompt },
    ]);

    const description = result.response.text().replace(/```/g, '');
    fs.unlinkSync(filePath); // Clean up
    return description;
}

async function generateImageFromText(prompt) {
    const chatSession = model.startChat({ generationConfig });
    const result = await chatSession.sendMessage(prompt);

    const filename = `generated-${Date.now()}.png`;
    const outputPath = path.join(__dirname, '../../public/uploads', filename);

    const candidates = result.response.candidates;
    for (const candidate of candidates) {
        for (const part of candidate.content.parts) {
            if (part.inlineData) {
                fs.writeFileSync(outputPath, Buffer.from(part.inlineData.data, 'base64'));
                return filename;
            }
        }
    }
    throw new Error('No image generated.');
}

async function generateInspiredArt(filePath, additionalInstructions = '') {
    const file = await uploadToGemini(filePath);
    const chatSession = model.startChat({ generationConfig });

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
    const description = result.response.text().replace(/```/g, '');

    // Step 2: Generate Art Prompt
    const artPromptRequest = additionalInstructions
        ? `${description}\n\n${additionalInstructions}\n\n${artPromptInstruction}`
        : `${description}\n\n${artPromptInstruction}`;
    result = await chatSession.sendMessage(artPromptRequest);
    const artPrompt = result.response.text().replace(/```/g, '');

    // Step 3: Generate Image from Art Prompt
    const filename = `inspired-${Date.now()}.png`;
    const outputPath = path.join(__dirname, '../../public/uploads', filename);

    result = await chatSession.sendMessage(artPrompt);
    const candidates = result.response.candidates;
    for (const candidate of candidates) {
        for (const part of candidate.content.parts) {
            if (part.inlineData) {
                fs.writeFileSync(outputPath, Buffer.from(part.inlineData.data, 'base64'));
                fs.unlinkSync(filePath); // Clean up
                return { description, prompt: artPrompt, filename };
            }
        }
    }

    fs.unlinkSync(filePath); // Clean up
    return { description, prompt: artPrompt };
}

module.exports = {
    generateImageDescription,
    generateImageFromText,
    generateInspiredArt,
};