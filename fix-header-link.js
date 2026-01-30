const fs = require('fs');
const path = require('path');

const baseDir = '/Users/neonone/Downloads/moltdirectory';

// Regex to find the broken link variations
// matches href="./security-auditor/index.html" or href="../security-auditor/index.html" etc.
const brokenLinkRegex = /href="[\.\/]*security-auditor\/index\.html"/g;

// The correct link
const correctLink = 'href="/security-auditor"';

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

    if (brokenLinkRegex.test(content)) {
        content = content.replace(brokenLinkRegex, correctLink);
        fs.writeFileSync(file, content, 'utf8');
        modifiedCount++;
    }
});

console.log(`\nFixed Security Auditor link in ${modifiedCount} files.`);
