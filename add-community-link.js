const fs = require('fs');
const path = require('path');

const baseDir = '/Users/neonone/Downloads/moltdirectory';

// HTML snippet for the new link
const communityLink = `        <a href="https://www.reddit.com/r/OpenClawDirectory/" class="header-link" target="_blank" rel="noopener">\n          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M17 13c-.8.8-1.7 1-2.6 1s-1.8-.3-2.6-1"/><path d="m8 9 .7 1"/><path d="m16 9-.7 1"/></svg>\n          Community\n        </a>`;

// Helper: Get all HTML files recursively
function getAllHtmlFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            if (file !== 'node_modules' && !file.startsWith('.')) {
                getAllHtmlFiles(filePath, fileList);
            }
        } else if (file.endsWith('.html')) {
            fileList.push(filePath);
        }
    });

    return fileList;
}

const allHtmlFiles = getAllHtmlFiles(baseDir);
console.log(`Found ${allHtmlFiles.length} HTML files.`);

let modifiedCount = 0;

allHtmlFiles.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');

    // Check if link already exists
    if (content.includes('r/OpenClawDirectory')) {
        console.log(`Skipping ${path.relative(baseDir, file)} (already present)`);
        return;
    }

    // Find the header links container start
    const headerLinksStart = '<nav class="header-links">';

    if (content.includes(headerLinksStart)) {
        // Insert the link right after the opening tag
        const newContent = content.replace(headerLinksStart, `${headerLinksStart}\n${communityLink}`);

        fs.writeFileSync(file, newContent, 'utf8');
        modifiedCount++;
        console.log(`Updated ${path.relative(baseDir, file)}`);
    } else {
        console.warn(`Warning: Could not find header-links in ${path.relative(baseDir, file)}`);
    }
});

console.log(`\nModified ${modifiedCount} files.`);
