const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

async function listModels() {
    try {
        const models = await genAI.listModels();
        console.log('Available Models:');
        models.forEach(model => {
            console.log(`- ${model.name} (${model.displayName}): ${model.supportedGenerationMethods.join(', ')}`);
        });
    } catch (error) {
        console.error('Error listing models:', error.message);
    }
}

listModels();