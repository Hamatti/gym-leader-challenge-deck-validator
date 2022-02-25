const fs = require("fs");

// Copy banlist to serverless function
const banlist = JSON.parse(
  fs.readFileSync("./tooling/data/banlist.json", "utf-8")
);
const formattedBanlist = formatDataForModule(banlist);

const banTemplate = `module.exports = ${formattedBanlist};`;

fs.writeFileSync("./netlify/functions/validate/banlist.js", banTemplate);

// Build database for serverless function
const data = JSON.parse(
  fs.readFileSync("./tooling/data/database.json", "utf-8")
);

const formattedData = formatDataForModule(data);

const template = `module.exports = ${formattedData};`;

fs.writeFileSync("./netlify/functions/validate/cards.js", template);

function formatDataForModule(data) {
  return JSON.stringify(data);
}
