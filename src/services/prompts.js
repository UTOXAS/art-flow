// MODIFIED: Replaced with new comprehensive description prompt
const descriptionPrompt = `
Please provide a comprehensive and accurate description of the image, detailing the following aspects:

### Characters
* **Number, Gender, Age, and Ethnicity:** Specify the count of characters present, along with the gender, approximate age, and ethnicity of each.
* **Appearance:** Describe their clothing, accessories, hairstyles, and any distinguishing features.
* **Expressions and Body Language:** Detail facial expressions, posture, gestures, and overall body language to convey their emotional state and interactions.
* **Relationships and Poses:** Explain the positions of characters relative to each other, including their proximity, interactions, and whether they are standing, sitting, or in motion.

### Objects
* **Identification and Description:** Identify all prominent objects, describing their type, material, and any notable details.
* **Attributes:** Detail the size, shape, and condition (e.g., new, old, damaged) of each object.
* **Placement:** Describe the precise positioning of objects relative to each other and within the overall scene.

### Background
* **Setting:** Specify whether the scene is indoor or outdoor, and identify the specific location (e.g., a park, a living room, a street).
* **Environment Details:** Describe the architectural features, natural elements, or man-made structures present.
* **Colors and Textures:** Detail the dominant colors and textures of the background elements.
* **Lighting and Shadows:** Explain the light source, its intensity, and how light and shadow are used to define the space and create mood.

### Compositional Elements
* **Point of View (POV):** Describe the camera angle (e.g., eye-level, low, high) and the distance from which the image appears to be taken (e.g., close-up, medium shot, wide shot).
* **Color Palette:** Identify the dominant colors and the overall color scheme (e.g., warm, cool, monochromatic). Discuss how color contributes to the mood or atmosphere.
* **Spacing and Balance:** Analyze the use of empty space (negative space) and its role in creating balance, emphasis, or composition within the frame.
* **Shading and Dimension:** Explain how light and shadow are utilized to create depth, dimension, and contrast within the image.
* **Overall Style:** Characterize the artistic or photographic style of the image (e.g., realistic, abstract, impressionistic, photographic, illustrative).
* **Relative Sizes:** Describe the relative proportions and sizes of characters and objects in relation to each other and the overall frame.
* **Precise Placement:** Detail the exact arrangement and layout of all key elements within the image frame.

Make your answer only contains the description inside triple backticks markdown block, without any leading or trailing text.
`;

const paintingPromptInstruction = `
Get inspired by the above description, use your imagination - don't just copy and paste - and artistic abilities and generate a text prompt - don't generate the image - composing a painting artwork that follows the same theme, angle, and point of view of the original description.
The prompt should have its own full standalone context, so who reads it doesn't have to return to any prior descriptions or images.
By Get inspired I mean don't draw the same image, I mean use it just as a base for imagination. You can add, remove, change or tweak as you like keeping in mind it should be artistic and follow the same theme, angle, and point of view of the original description.
Things should be emphasized or considered when composing the prompt:
• The painting is by hand.
• Should be predominantly realistic with some surreal elements, don't do something totally fantastical and otherworldly.
• Describe how brushstrokes are used to convey artistic depth.
• Well-designed characters and elements and symbolism.
• The prompt should include the name of the art style.
Make your answer only contains the prompt without any leading or trailing text.
The prompt should begin with the phrase "Generate an image of"
and the prompt should be in a triple backticks block.
`;

// NEW: Prompt instruction for photo-to-painting section
const photoToPaintingPromptInstruction = `
I need you to generate a detailed text prompt for a painting, based on the above description. Your output should only be the text prompt, presented within a Markdown block.

The core goal is for the generated prompt to be fully self-contained, meaning anyone reading it should understand the desired artwork without needing any prior context or external references.

Please ensure the text prompt adheres to the following criteria:

Artistic and Evocative Language: Employ rich, descriptive language that conveys an artistic sensibility, suitable for inspiring a painting.
Theme, Angle, and Point of View Consistency: The prompt must clearly establish and consistently maintain the overarching theme, visual angle, and specific point of view as if it were derived from a real painting. your prompt should read as it naturally flowed from the original description.
Emphasis on Hand-Painted Quality: Explicitly convey that the painting is created by hand.
Brushstroke Detail: Describe how the brushstrokes are utilized to achieve artistic depth, texture, and emotional resonance within the painting. This is a crucial element to emphasize.
Prompt Structure:
The prompt must begin with the exact phrase: "Generate an image of".
The entire prompt must be enclosed within a Markdown block.
Your response should contain only the generated text prompt in the specified format, without any additional leading or trailing text or commentary.
`;

module.exports = {
    descriptionPrompt, // MODIFIED: Updated prompt
    paintingPromptInstruction,
    photoToPaintingPromptInstruction, // NEW: Export new prompt
};