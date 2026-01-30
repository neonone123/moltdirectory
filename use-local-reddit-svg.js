const fs = require('fs');
const path = require('path');

const baseDir = '/Users/neonone/Downloads/moltdirectory';

// 1. Get the content of the local reddit.svg
const rSvgPath = path.join(baseDir, 'reddit.svg');
let rawSvg = fs.readFileSync(rSvgPath, 'utf8');

// 2. Process the SVG to be theme-aware and inline-friendly
// - Remove <?xml...>, <!-- comments -->
// - Remove id, version, xmlns (optional but good for cleanup)
// - Change fill="#000000" to fill="currentColor"
// - Remove hardcoded width/height="800px"
// - Keep viewBox

let cleanSvg = rawSvg
    .replace(/<\?xml.*?\?>/g, '')
    .replace(/<!--.*?-->/g, '')
    .replace(/<svg.*?>/s, (match) => {
        // Extract viewBox
        const viewBoxMatch = match.match(/viewBox="[^"]+"/);
        const viewBox = viewBoxMatch ? viewBoxMatch[0] : 'viewBox="0 0 512 512"';
        return `<svg ${viewBox} fill="currentColor" width="22" height="22">`; // Header icons are usually small
    })
    .replace(/(\r\n|\n|\r)/gm, "") // Remove newlines for cleaner HTML usage
    .trim();

// 3. Define the regex to find the icon we JUST added (the standard reddit one)
// The previous one was <svg viewBox="0 0 24 24" fill="currentColor" ...
const oldIconRegex = /<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2C6\.48.*?<\/svg>/;

// Also include the "smiley face" one just in case some files weren't updated or user reverted
const smileyIconRegex = /<svg viewBox="0 0 24 24" fill="none" stroke="currentColor".*?<\/svg>/;

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

    // Try replacing the "Standard Reddit" icon we added last
    if (oldIconRegex.test(content)) {
        content = content.replace(oldIconRegex, cleanSvg);
        changed = true;
    }
    // Try replacing the "Smiley" icon if it still exists
    else if (smileyIconRegex.test(content) && content.includes('aria-label="Community"')) {
        // Only replace if it's the specific community link (to avoid breaking other smileys)
        // BUT regex matching across the span is tricky. 
        // We verified previously that 571 files were updated to the new icon.
        // So the main target is oldIconRegex.
        content = content.replace(smileyIconRegex, cleanSvg);
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(file, content, 'utf8');
        modifiedCount++;
    }
});

console.log(`\nUpdated Reddit icon in ${modifiedCount} files.`);
console.log(`New SVG Start: ${cleanSvg.substring(0, 50)}...`);
