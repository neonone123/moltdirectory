const axios = require('axios');
const REGISTRY_URL = 'https://raw.githubusercontent.com/VoltAgent/awesome-moltbot-skills/main/README.md';

async function testParse() {
    console.log('Fetching...');
    const response = await axios.get(REGISTRY_URL);
    const markdown = response.data;
    const lines = markdown.split('\n');

    console.log('Total lines:', lines.length);

    let matchCount = 0;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Test header regex
        const headerMatch = line.match(/^(#{2,3})\s+(.*)/);
        if (headerMatch) {
            console.log(`Line ${i} HEADER match: ${headerMatch[2]}`);
        }

        // Test skill regex
        const skillMatch = line.match(/^\s*-\s*\[(.*?)\]\((.*?)\)\s*-\s*(.*)/);
        if (skillMatch) {
            matchCount++;
            if (matchCount < 5) {
                console.log(`Line ${i} SKILL match: ${skillMatch[1]}`);
            }
        }

        if (i > 100 && matchCount === 0) {
            console.log(`Line ${i} sample: ${line}`);
        }
    }
}

testParse();
