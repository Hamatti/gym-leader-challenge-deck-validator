const banlist = require("./banlist.js");
const databaseCards = require("./cards.js");

function isBanned(card) {
  return banlist[card];
}

function isValidCardLine(line) {
  const pattern = /\* (\d+) (.*) ([A-Z-]{2,6}) (\d+)/;
  const matches = line.match(pattern);

  return matches;
}

function isMonotype(decklist) {
  const types = decklist
    .map((card) => {
      const set = card[3];
      const number = card[4];

      const setData = databaseCards[set];
      if (setData) {
        const cardData = setData[number];
        console.log(cardData);
        return cardData;
      } else {
        return null;
      }
    })
    .filter((card) => card)
    .map((card) => card.types)
    .filter((t) => t);

  let commonTypes = [];
  if (!(types.length === 0)) {
    commonTypes = types.reduce((common, items) =>
      items.filter((item) => common.includes(item))
    );
  } else {
    commonTypes = [true];
  }

  let valid = commonTypes.length !== 0;
  const messages = [];

  if (!valid) {
    messages.push("Not a monotype");
  }

  return {
    valid,
    messages,
  };
}

function isSingleton(decklist) {
  let valid = true;
  const messages = [];
  const basicEnergyTypes = [
    "Fire Energy",
    "Water Energy",
    "Darkness Energy",
    "Fairy Energy",
    "Metal Energy",
    "Grass Energy",
    "Fighting Energy",
    "Lightning Energy",
    "Psychic Energy",
  ];

  decklist.forEach(([fullLine, quantity, name, set]) => {
    // Check for basic energies
    if (basicEnergyTypes.some((bEnergy) => name.startsWith(bEnergy))) {
      return;
    } else if (quantity !== "1") {
      valid = false;
      messages.push(`${quantity} ${name} ${set}`);
    }
  });

  const allNames = decklist.map((c) => c[2]);
  const uniqueNames = new Set([...allNames]);

  if (allNames.length !== uniqueNames.size) {
    valid = false;
    messages.push(`Duplicates`);
  }

  return {
    valid,
    messages,
  };
}

module.exports = {
  isBanned,
  isValidCardLine,
  isMonotype,
  isSingleton,
};
