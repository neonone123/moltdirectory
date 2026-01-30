const fs = require('fs');
const path = require('path');

// Get all category directories
const baseDir = '/Users/neonone/Downloads/moltdirectory';
const entries = fs.readdirSync(baseDir, { withFileTypes: true });

let fixedCount = 0;
let filesProcessed = 0;

entries.forEach(entry => {
    if (!entry.isDirectory()) return;

    // Skip special directories
    if (entry.name.startsWith('.') || entry.name === 'node_modules') return;

    const categoryIndexPath = path.join(baseDir, entry.name, 'index.html');

    // Check if category has an index.html
    if (!fs.existsSync(categoryIndexPath)) return;

    // Read the file
    let content = fs.readFileSync(categoryIndexPath, 'utf8');
    const originalContent = content;

    // Replace href="./ with href=" ONLY in skill card links
    // This pattern ensures we only target skill card links within the skills-grid section
    content = content.replace(/href="\.\/([^"]+\/index\.html)" class="skill-card"/g, 'href="$1" class="skill-card"');

    // Check if anything changed
    if (content !== originalContent) {
        fs.writeFileSync(categoryIndexPath, content, 'utf8');
        console.log(`✓ Fixed: ${entry.name}/index.html`);
        fixedCount++;
    }

    filesProcessed++;
});

console.log(`\nProcessed ${filesProcessed} category pages`);
console.log(`Fixed ${fixedCount} files`);
