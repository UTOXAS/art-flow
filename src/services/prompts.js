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
    artPromptInstruction
};