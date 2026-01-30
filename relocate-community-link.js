const fs = require('fs');
const path = require('path');

const baseDir = '/Users/neonone/Downloads/moltdirectory';

// HTML snippet for the new icon-only link (no text, with aria-label)
const iconLink = `        <a href="https://www.reddit.com/r/OpenClawDirectory/" class="header-link" target="_blank" rel="noopener" aria-label="Community">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M17 13c-.8.8-1.7 1-2.6 1s-1.8-.3-2.6-1"/><path d="m8 9 .7 1"/><path d="m16 9-.7 1"/></svg>
        </a>`;

// Regex to find and remove the old link (multiline match)
// Matches <a ... href="...reddit...">...Community...</a>
// Be careful to match specific indentation and structure we added previously
const oldLinkRegex = /\s*<a href="https:\/\/www\.reddit\.com\/r\/OpenClawDirectory\/" class="header-link" target="_blank" rel="noopener">\s*<svg[\s\S]*?<\/svg>\s*Community\s*<\/a>/;

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

    // 1. Remove the old link if present
    if (oldLinkRegex.test(content)) {
        content = content.replace(oldLinkRegex, '');
        changed = true;
    }

    // 2. Add the new icon-only link after the theme toggle
    // Look for the closing theme toggle button: </button>
    // and insert before the closing </nav> 
    // We want it to be the last item, after the toggle

    // Check if we already have the icon-only version (simple check)
    if (!content.includes('aria-label="Community"')) {
        const themeToggleEnd = '</button>';
        const navEnd = '</nav>';

        // We want to insert after </button> but before </nav>
        // Regex to find the theme toggle button block
        // It ends with </button> followed by whitespace and </nav>

        // Simpler approach: replace </button>\s*</nav> with </button>\n${iconLink}\n      </nav>

        const replaceTargetRegex = /(<\/button>)\s*(<\/nav>)/;

        if (replaceTargetRegex.test(content)) {
            content = content.replace(replaceTargetRegex, `$1\n${iconLink}\n      $2`);
            changed = true;
        } else {
            console.warn(`Could not find insertion point in ${path.relative(baseDir, file)}`);
        }
    }

    if (changed) {
        fs.writeFileSync(file, content, 'utf8');
        modifiedCount++;
        // console.log(`Updated ${path.relative(baseDir, file)}`);
    }
});

console.log(`\nModified ${modifiedCount} files.`);
