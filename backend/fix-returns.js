const fs = require('fs');
const path = require('path');

// Function to fix missing return statements in route files
function fixReturnsInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Replace res.json( with return res.json(
    const resJsonRegex = /(\s+)res\.json\(/g;
    if (resJsonRegex.test(content)) {
      content = content.replace(resJsonRegex, '$1return res.json(');
      modified = true;
    }
    
    // Replace res.status().json( with return res.status().json(
    const resStatusJsonRegex = /(\s+)res\.status\([^)]*\)\.json\(/g;
    if (resStatusJsonRegex.test(content)) {
      content = content.replace(resStatusJsonRegex, '$1return res.status(');
      modified = true;
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Fixed returns in: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
}

// Get all route files
const routesDir = path.join(__dirname, 'src', 'routes');
const routeFiles = fs.readdirSync(routesDir)
  .filter(file => file.endsWith('.ts'))
  .map(file => path.join(routesDir, file));

console.log('Fixing missing return statements in route files...');

// Fix each route file
routeFiles.forEach(fixReturnsInFile);

console.log('Done!'); 