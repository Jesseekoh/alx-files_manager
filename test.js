const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');

// Create a canvas and a drawing context
const width = 500;
const height = 500;
const canvas = createCanvas(width, height);
const ctx = canvas.getContext('2d');

// Draw a red rectangle
ctx.fillStyle = 'red';
ctx.fillRect(100, 100, 200, 200);

// Save the canvas to a file
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync('my-image', buffer);

console.log('The image was created and saved as canvas-image.png');

