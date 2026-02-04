const axios = require('axios');

async function getAllSkills() {
    let allSkills = [];
    let nextCursor = null;
    let page = 1;

    do {
        console.log(`Fetching page ${page}...`);
        const url = `https://clawdhub.com/api/v1/skills${nextCursor ? `?cursor=${nextCursor}` : ''}`;
        const response = await axios.get(url);
        const { items, nextCursor: newCursor } = response.data;

        allSkills.push(...items);
        nextCursor = newCursor;
        page++;
    } while (nextCursor);

    console.log(`Total skills found on ClawdHub: ${allSkills.length}`);
    return allSkills;
}

getAllSkills().catch(console.error);
