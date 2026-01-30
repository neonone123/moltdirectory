const fs = require('fs');
const path = require('path');

const baseDir = '/Users/neonone/Downloads/moltdirectory';

// 1. The Reddit SVG that accidentally overwrote the ClawdHub icon
// It looks like: <svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 0-.29.06-.39.16l-.07.07c-1.37-.62-2.95-.97-4.63-.99l.79-3.71 2.58.55c.03.58.51 1.05 1.09 1.05.61 0 1.1-.49 1.1-1.1s-.49-1.1-1.1-1.1c-.48 0-.89.31-1.05.74l-2.73-.58a.29.29 0 0 0-.34.22l-.89 4.19c-1.7.04-3.26.4-4.57 1.01l-.05-.05A.55.55 0 0 0 6 8.8c-.3 0-.54.25-.54.55 0 .21.12.38.29.49-.03.18-.05.36-.05.54 0 2.76 2.81 5 6.29 5s6.29-2.24 6.29-5c0-.18-.02-.37-.05-.55.17-.11.29-.28.29-.49.01-.3-.24-.54-.54-.54zM8.52 14.16c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm3.48 1.4c-1.15 0-2.11-.32-2.58-.8h5.16c-.47.48-1.43.8-2.58.8zm2.48-1.4c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/></svg>

// 2. The Original ClawdHub Icon
// <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/><line x1="2" y1="12" x2="22" y2="12"/></svg>
const clawdHubIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/><line x1="2" y1="12" x2="22" y2="12"/></svg>`;

// We need to be very specific to only target the one inside the ClawHub link
// <a href="...clawdhub..." ... class="sidebar-btn sidebar-btn-clawdhub">
//   <svg ... (wrong one) ... />
//   View on ClawdHub
// </a>

// Regex to capture the ClawHub button and its inner SVG
// We want to replace the SVG block inside it.
const clawdHubButtonRegex = /(<a href="[^"]*clawdhub\.com[^"]*"[^>]*class="[^"]*sidebar-btn-clawdhub"[^>]*>)\s*<svg[\s\S]*?<\/svg>/g;

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
    let changed = false;

    // Replace the SVG inside the ClawHub button
    // We use replace with a callback to keep the opening <a> tag and insert the correct SVG
    if (clawdHubButtonRegex.test(content)) {
        content = content.replace(clawdHubButtonRegex, (match, anchorTag) => {
            return `${anchorTag}\n                  ${clawdHubIcon}`;
        });
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(file, content, 'utf8');
        modifiedCount++;
    }
});

console.log(`\nRestored ClawdHub icon in ${modifiedCount} files.`);
