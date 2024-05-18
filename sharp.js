const sharp = require('sharp');
const fs = require('fs');

const imageBuffer = Buffer.from('SGVsbG8gV2Vic3RhY2shCg==', 'base64');

// Define the path and file name for the output image
const outputPath = 'output-image.png';

console.log(imageBuffer);

// Use sharp to save the image buffer to a file
sharp(imageBuffer)
    .toFile(outputPath, (err, info) => {
        if (err) {
            console.error('Failed to save the image:', err);
        } else {
            console.log('The image was created and saved as', outputPath);
        }
    });

