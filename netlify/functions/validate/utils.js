const banlist = require("./banlist.js");
const databaseCards = require("./cards.js");

function isBanned(card) {
  return banlist[card];
}

function isValidCardLine(line) {
  const pattern = /(?:\* )?(\d+) (.*) ([A-Z-]{2,6}) (\d+)/;
  const matches = line.match(pattern);

  return matches;
}

function isMonotype(decklist) {
  const types = decklist
    .map((card) => {
      const set = card[3];
      const number = getSubsettedNumber(set, card[4]);

      const setData = databaseCards[set];
      if (setData) {
        const cardData = setData[number];
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
    "Basic {",
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

/*
 * There are a few sets that have a differently numbered subset.
 * PTCGO uses its own numbering for those, one that is not consistent
 * with printed cards nor the API so we need to convert those to right
 * format ourselves.
 */

const subsets = {
  LTR: { total: 115, prefix: "RC", leftPad: 0 },
  GEN: { total: 100, prefix: "RC", leftPad: 0 },
  SHF: { total: 73, prefix: "SV", leftPad: 3 },
  BRS: { total: 186, prefix: "TG", leftPad: 2 },
  ASR: { total: 216, prefix: "TG", leftPad: 2 },
  LOR: { total: 217, prefix: "TG", leftPad: 2 },
  "PR-SW": { total: 0, prefix: "SWSH", leftPad: 3 },
  "PR-SM": { total: 0, prefix: "SM", leftPad: 0 },
  "PR-XY": { total: 0, prefix: "XY", leftPad: 2 },
  "PR-BLW": { total: 0, prefix: "BW", leftPad: 2 },
};

function getSubsettedNumber(ptcgoCode, number) {
  if (subsets.hasOwnProperty(ptcgoCode)) {
    const subset = subsets[ptcgoCode];
    let { total, prefix, leftPad } = subset;
    if (number <= total) {
      return number.toString();
    }
    let newNumber = number - total;
    return `${prefix}${newNumber.toString().padStart(leftPad, "0")}`;
  } else {
    return number.toString();
  }
}

module.exports = {
  isBanned,
  isValidCardLine,
  isMonotype,
  isSingleton,
  getSubsettedNumber,
};
