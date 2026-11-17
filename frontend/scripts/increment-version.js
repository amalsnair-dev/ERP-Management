import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const packageJsonPath = path.resolve(__dirname, '../package.json');

try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const currentVersion = packageJson.version;
    const versionParts = currentVersion.split('.').map(Number);

    if (versionParts.length === 3) {
        versionParts[2] += 1; // Increment patch version
        const newVersion = versionParts.join('.');
        packageJson.version = newVersion;
        
        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
        console.log(`Version automatically updated: ${currentVersion} -> ${newVersion}`);
    } else {
        console.error('Invalid version format in package.json');
    }
} catch (error) {
    console.error('Error updating version:', error);
    process.exit(1);
}
