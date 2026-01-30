const fs = require('fs');

const filePath = '/Users/neonone/Downloads/moltdirectory/index.html';
let content = fs.readFileSync(filePath, 'utf8');

// Find the start and end of the search script
const scriptStartMarker = '<script>\n    // Static search data embedded at build time';
const scriptStart = content.indexOf(scriptStartMarker);
if (scriptStart === -1) {
  console.log('Could not find script start marker');
  process.exit(1);
}

// Find the closing </script> after that
const scriptEndSearch = content.indexOf('</script>', scriptStart);
if (scriptEndSearch === -1) {
  console.log('Could not find script end');
  process.exit(1);
}

// Extract the content between script tags
const scriptContent = content.substring(scriptStart + '<script>'.length, scriptEndSearch);

// Find the JSON array
const jsonStart = scriptContent.indexOf('[');
const jsonEnd = scriptContent.lastIndexOf(']');
if (jsonStart === -1 || jsonEnd === -1) {
  console.log('Could not find JSON array');
  process.exit(1);
}

let jsonStr = scriptContent.substring(jsonStart, jsonEnd + 1);

// Clean up the JSON - fix spacing issues
jsonStr = jsonStr.replace(/" \}/g, '"}');  // Fix "id":"value" }
jsonStr = jsonStr.replace(/\} ,/g, '},');   // Fix } ,
jsonStr = jsonStr.replace(/\}\]/g, '}]');   // Fix end

// Parse and validate
let skillsData;
try {
  skillsData = JSON.parse(jsonStr);
  console.log('Parsed ' + skillsData.length + ' skills successfully');
} catch (e) {
  console.log('JSON parse error:', e.message);
  // Show position of error
  const match = e.message.match(/position (\d+)/);
  if (match) {
    const pos = parseInt(match[1]);
    console.log('Around position ' + pos + ': ...' + jsonStr.substring(pos - 20, pos + 20) + '...');
  }
  process.exit(1);
}

// Build the properly formatted script
const newScript = `<script>
    // Static search data embedded at build time
    const skillsData = ${JSON.stringify(skillsData)};

    const searchInput = document.getElementById('searchInput');
    const categoriesGrid = document.getElementById('categoriesGrid');
    const noResults = document.getElementById('noResults');
    const searchResults = document.getElementById('searchResults');
    const categoryCards = document.querySelectorAll('.category-card');

    // Keyboard shortcut
    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInput.focus();
      }
      if (e.key === 'Escape') {
        searchInput.blur();
        searchInput.value = '';
        handleSearch('');
      }
    });

    searchInput.addEventListener('input', (e) => handleSearch(e.target.value));

    function handleSearch(query) {
      const q = query.toLowerCase().trim();
      if (!q) {
        // Show all categories, hide skill result
        categoryCards.forEach(card => card.style.display = '');
        noResults.style.display = 'none';
        searchResults.style.display = 'none';
        return;
      }

      // Filter categories
      let visibleCount = 0;
      categoryCards.forEach(card => {
        const name = card.dataset.name;
        const desc = card.dataset.desc;
        const matches = name.includes(q) || desc.includes(q);
        card.style.display = matches ? '' : 'none';
        if (matches) visibleCount++;
      });

      // Search skills
      const matchingSkills = skillsData.filter(s =>
        s.name.toLowerCase().includes(q) || s.desc.toLowerCase().includes(q)
      ).slice(0, 8);

      if (matchingSkills.length > 0) {
        searchResults.innerHTML = '<div class="search-results-title">Skills matching "' + q + '"</div>'
          + matchingSkills.map(s =>
            '<a href="./' + s.catId + '/' + s.id + '/index.html" class="search-result-item">'
              + '<div class="search-result-name">' + s.name + '</div>'
              + '<div class="search-result-cat">' + s.catName + '</div>'
            + '</a>'
          ).join('');
        searchResults.style.display = 'block';
      } else {
        searchResults.style.display = 'none';
      }

      noResults.style.display = visibleCount === 0 && matchingSkills.length === 0 ? 'block' : 'none';
    }
  </script>`;

// Replace the script section
const newContent = content.substring(0, scriptStart) + newScript + content.substring(scriptEndSearch + '</script>'.length);

fs.writeFileSync(filePath, newContent, 'utf8');
console.log('Successfully replaced the search script');
