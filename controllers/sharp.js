const sharp = require('sharp');

// Input and output file paths
const inputFile = '/tmp/files_manager/f711d956-60ec-4191-9211-b1596bc86286';
const outputFile = 'output.png';

// Define the desired output format
const outputFormat = 'png';

// Read the input image and perform format conversion
sharp(inputFile)
  .toFormat(outputFormat)
  .toFile(outputFile, (err, info) => {
    if (err) {
      console.error('Error converting image:', err);
    } else {
      console.log('Image converted successfully:', info);
    }
  });

