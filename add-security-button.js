const fs = require('fs');
const path = require('path');

const baseDir = '/Users/neonone/Downloads/moltdirectory';

// Find all skill pages (two levels deep from base)
function findSkillPages() {
    const skillPages = [];
    const categories = fs.readdirSync(baseDir, { withFileTypes: true });

    categories.forEach(category => {
        if (!category.isDirectory() || category.name.startsWith('.') || category.name === 'node_modules') return;

        const categoryPath = path.join(baseDir, category.name);
        const skills = fs.readdirSync(categoryPath, { withFileTypes: true });

        skills.forEach(skill => {
            if (!skill.isDirectory()) return;
            const skillIndexPath = path.join(categoryPath, skill.name, 'index.html');
            if (fs.existsSync(skillIndexPath)) {
                skillPages.push(skillIndexPath);
            }
        });
    });

    return skillPages;
}

const skillPages = findSkillPages();
console.log(`Found ${skillPages.length} skill pages`);

let modifiedCount = 0;

const securityCheckButton = `                <button onclick="sendToSecurityAuditor()" class="sidebar-btn sidebar-btn-security">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  Security Check
                </button>`;

const securityScript = `
    async function sendToSecurityAuditor() {
      try {
        // Get content from the rendered markdown in the DOM
        const contentElement = document.querySelector('.markdown-content');
        if (!contentElement) throw new Error('Could not find markdown content');
        
        const skillContent = contentElement.innerText || contentElement.textContent;
        
        // Store in localStorage
        localStorage.setItem('skillAuditContent', skillContent);
        
        // Open security auditor in new tab (go up two levels)
        window.open('../../security-auditor.html', '_blank');
      } catch (error) {
        alert('Error: ' + error.message);
      }
    }`;

skillPages.forEach(skillPage => {
    let content = fs.readFileSync(skillPage, 'utf8');
    const originalContent = content;

    // Check if button already exists - if so we might need to update the function
    if (content.includes('sendToSecurityAuditor')) {
        // Replace the existing function with the new one
        // We regex match the async function block
        const oldFunctionPattern = /async function sendToSecurityAuditor\(\) \{[\s\S]*?^\    \}/m;

        if (oldFunctionPattern.test(content)) {
            content = content.replace(oldFunctionPattern, securityScript.trim());
            if (content !== originalContent) {
                fs.writeFileSync(skillPage, content, 'utf8');
                console.log(`✓ Updated function: ${path.relative(baseDir, skillPage)}`);
                modifiedCount++;
            }
            return;
        }

        console.log(`  Skipped (structure mismatch): ${path.relative(baseDir, skillPage)}`);
        return;
    }

    // Add button after "Download SKILL.md" button and before closing </div> of sidebar-card
    content = content.replace(
        /(<a href="[^"]*" download="SKILL\.md" class="sidebar-btn sidebar-btn-secondary">[\s\S]*?<\/a>)\s*(<\/div>)/,
        `$1\n${securityCheckButton}\n              $2`
    );

    // Add the security script before the toggleTheme function
    content = content.replace(
        /(function toggleTheme\(\))/,
        `${securityScript}\n    $1`
    );

    if (content !== originalContent) {
        fs.writeFileSync(skillPage, content, 'utf8');
        console.log(`✓ Modified: ${path.relative(baseDir, skillPage)}`);
        modifiedCount++;
    }
});

console.log(`\nModified ${modifiedCount} skill pages`);
