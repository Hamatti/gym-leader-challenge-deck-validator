const banlist = require("./banlist.js");
const databaseCards = require("./cards.js");

function isBanned(card) {
  return banlist[card];
}

function isValidCardLine(line) {
  const pattern = /(?:\* )?(\d+) (.*) ([A-Z-/]{2,6}) (\d+)/;
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
  SIT: { total: 215, prefix: "TG", leftPad: 2 },
  CRZ: { total: 160, prefix: "GG", leftPad: 2 },
  "PR-SW": { total: 0, prefix: "SWSH", leftPad: 3 },
  "PR-SM": { total: 0, prefix: "SM", leftPad: 2 },
  "PR-XY": { total: 0, prefix: "XY", leftPad: 2 },
  "PR-BLW": { total: 0, prefix: "BW", leftPad: 2 },
};

function getSubsettedNumber(ptcgoCode, number) {
  if (subsets.hasOwnProperty(ptcgoCode)) {
    const subset = subsets[ptcgoCode];
    let { total, prefix, leftPad } = subset;
    if (number <= total) {
      return number.toString().replace(/^0+/, "");
    }
    let newNumber = number - total;
    return `${prefix}${newNumber.toString().padStart(leftPad, "0")}`;
  } else {
    return number.toString().replace(/^0+/, "");
  }
}

/**
 * Pokemon formats, GLC included have a special rule for
 * Lysandre and Boss's Order cards that you can only have one
 * in total.
 */
function hasOnlyOneLysandre(decklist) {
  const onlyOneOfthese = [
    "RCL 154",
    "RCL 189",
    "RCL 200",
    "SHF 58",
    "BRS 132",
    "LOR 241",
    "AOR 78",
    "FLF 104",
    "FLF 90",
    "PR-SW 251",
    "PAL 172",
    "PAL 248",
    "PAL 265",
  ];
  let count = 0;
  const cards = [];
  decklist.forEach((card) => {
    let cardString = `${card[3]} ${card[4]}`;
    if (onlyOneOfthese.includes(cardString)) {
      count++;
      cards.push(`${card[2]} ${cardString}`);
    }
  });

  if (count > 1) {
    return {
      valid: false,
      messages: [
        `You can only have one Lysandre/Boss's Orders in your deck. You have: ${cards.join(
          ", "
        )}`,
      ],
    };
  } else {
    return {
      valid: true,
      messages: [],
    };
  }
}

/**
 * Pokemon formats, GLC included have a special rule for
 * Professor Juniper, Professor Sycamore and Professor's Research cards that
 * you can only have one in total.
 */
function hasOnlyOneResearch(decklist) {
  const onlyOneOfthese = [
    "SSH 178",
    "SSH 201",
    "SSH 209",
    "CPA 62",
    "SHF 60",
    "CEL 23",
    "CEL 24",
    "BRS 147",
    "PGO 78",
    "PGO 84",
    "CRZ 150",
    "SVI 189",
    "SVI 190",
    "SVI 240",
    "SVI 241",
    "PR-SW 152",
    "PR-SW 178",
    "BLW 101",
    "DEX 98",
    "PLF 116",
    "PLB 84",
    "XY 122",
    "PHF 101",
    "BKP 107",
    "STS 114",
    "PAF 88",
    "PAF 89",
  ];

  let count = 0;
  const cards = [];
  decklist.forEach((card) => {
    let cardString = `${card[3]} ${card[4]}`;
    if (onlyOneOfthese.includes(cardString)) {
      count++;
      cards.push(`${card[2]} ${cardString}`);
    }
  });

  if (count > 1) {
    return {
      valid: false,
      messages: [
        `You can only have one Juniper/Sycamore/Professor's Research in your deck. You have: ${cards.join(
          ", "
        )}`,
      ],
    };
  } else {
    return {
      valid: true,
      messages: [],
    };
  }
}

module.exports = {
  isBanned,
  isValidCardLine,
  isMonotype,
  isSingleton,
  getSubsettedNumber,
  hasOnlyOneLysandre,
  hasOnlyOneResearch,
};
