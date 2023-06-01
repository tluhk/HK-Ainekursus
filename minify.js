import fs from 'fs-extra';
import { minify } from 'terser';

const sourceFolder = 'src/js';
const targetFolder = 'public/js';

// Create the target folder if it doesn't exist
await fs.ensureDir(targetFolder);

// Get a list of files in the source folder
const files = await fs.readdir(sourceFolder);

// Minify each file and write the output to the target folder
for (const file of files) {
  const inputFile = `${sourceFolder}/${file}`;
  const outputFile = `${targetFolder}/${file}`;

  // Read the input file
  const code = await fs.readFile(inputFile, 'utf-8');

  // Minify the code
  const minifiedCode = await minify(code);

  // Write the minified code to the output file
  await fs.writeFile(outputFile, minifiedCode.code, 'utf-8');
}

console.log('Minification complete!');
