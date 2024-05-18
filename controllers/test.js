const fs = require('fs');
const imageThumbnail = require('image-thumbnail');

// Path to the original image
const inputImagePath = '/tmp/files_manager/image.png';
// Path to save the thumbnail
const outputThumbnailPath = '/tmp/files_manager/thumbnail-b330bf72-a682-48f8-9d18-43467fde6897.jpg';

// Thumbnail options (optional)
const options = {
    width: 200,  // Width of the thumbnail (height will be adjusted to maintain aspect ratio)
    responseType: 'base64'  // Specify response type as 'base64' if you want to handle it as a string
};

async function createThumbnail() {
    try {
        // Check if the file exists
        if (!fs.existsSync(inputImagePath)) {
            throw new Error(`Input file does not exist: ${inputImagePath}`);
        }

        // Generate thumbnail
        const thumbnail = await imageThumbnail('/home/edward/alx-files_manager/my-image', options);
        
        // If you set responseType to 'base64', you need to convert it to a Buffer
        const buffer = Buffer.from(thumbnail, 'base64');
        
        // Save the thumbnail to the specified path
        fs.writeFileSync(outputThumbnailPath, buffer);
        
        console.log('Thumbnail created and saved successfully!');
    } catch (err) {
        console.error('Error creating thumbnail:', err);
    }
}

createThumbnail();

