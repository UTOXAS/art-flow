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

// NEW: Prompt for detailed photo-to-painting description
const photoToPaintingDescriptionPrompt = `
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

// MODIFIED: Renamed for clarity and consistency
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

module.exports = {
    descriptionPrompt,
    photoToPaintingDescriptionPrompt, // NEW: Export new prompt
    paintingPromptInstruction, // MODIFIED: Updated export name
};