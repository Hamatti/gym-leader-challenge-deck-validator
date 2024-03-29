const fs = require("fs");
const inquirer = require("inquirer");
const pokemon = require("pokemontcgsdk");

pokemon.configure({
  apiKey: process.env.API_KEY,
});

const dotenv = require("dotenv");
let banlist = require("../netlify/functions/validate/banlist");
dotenv.config();

function getSets() {
  const database = JSON.parse(fs.readFileSync("./tooling/data/database.json"));
  return Object.keys(database);
}

function listSets() {
  console.log("Current sets in the database:");
  const sets = getSets();
  sets.forEach((set) => {
    console.log(`${set}`);
  });
}

async function getAllSets() {
  let sets = await pokemon.set.all({ q: "legalities.expanded:legal" });

  sets = sets
    .map((set) => {
      if (!set.ptcgoCode && !set.series !== "Scarlet & Violet") {
        return null;
      } else {
        return {
          value: set.ptcgoCode,
          name: set.name,
        };
      }
    })
    .filter((s) => s); // Remove nulls

  return sets;
}

async function downloadSet() {
  let { setCode } = await inquirer.prompt([
    {
      name: "setCode",
      type: "string",
      message: "Which set do you want to download? (press 0 for a list)",
    },
  ]);

  if (setCode === "0") {
    const sets = await getAllSets();
    setCode = await inquirer.prompt([
      {
        name: "setCode",
        type: "list",
        message: "Which set do you want to download?",
        choices: sets,
      },
    ]);
    setCode = setCode.setCode;
    const setsInDatabase = getSets();
    if (setsInDatabase.includes(setCode)) {
      console.log("This set is already downloaded");
      let { redownload } = await inquirer.prompt([
        {
          name: "redownload",
          type: "confirm",
          message: "Do you want to redownload?",
        },
      ]);
      if (redownload) {
        download(setCode, { force: true });
      }
    } else {
      console.log(`Downloading cards for set ${setCode}`);
      download(setCode, { force: false });
    }
  } else if (setCode === "100") {
    const allAvailableSets = await getAllSets();
    allAvailableSets.forEach(async (set) => {
      await download(set.value, { force: true });
    });
  } else {
    const setsInDatabase = getSets();
    if (setsInDatabase.includes(setCode)) {
      console.log("This set is already downloaded");
      let { redownload } = await inquirer.prompt([
        {
          name: "redownload",
          type: "confirm",
          message: "Do you want to redownload?",
        },
      ]);
      if (redownload) {
        download(setCode, { force: true });
      }
    } else {
      console.log(`Downloading cards for set ${setCode}`);
      download(setCode, { force: false });
    }
  }
}

function isAlreadyInDatabase(setCode) {
  const setsInDatabase = getSets();
  return setsInDatabase.includes(setCode);
}

async function download(setCode, { force }) {
  const setAlreadyDownloaded = isAlreadyInDatabase(setCode);
  if (!force && setAlreadyDownloaded) {
    return;
  }

  /**
   * For sets that were published only on Pokemon TCG Live,
   * the API does not contain ptcgoCode attribute so we
   * need to do the mapping manually.
   *
   * Both Celebrations and Celebrations: Classic Collection
   * have the same CEL code in PTCGO. Since Classic Collection
   * cards are not legal in GLC, we download only the main set
   */
  const liveCodes = {
    SVI: "sv1",
    PAL: "sv2",
    OBF: "sv3",
    MEW: "sv3pt5",
    CEL: "cel25",
    PAR: "sv4",
    PAF: "sv4pt5",
    TEF: "sv5",
  };

  let cards;
  if (setCode in liveCodes) {
    let setId = liveCodes[setCode];
    cards = await pokemon.card.all({ q: `set.id:${setId}` });
    cards = cards.map((card) => ({ ...card, ptcgoCode: setCode }));
  } else {
    cards = await pokemon.card.all({ q: `set.ptcgoCode:${setCode}` });
  }

  const cardDetails = cards.map((card) => {
    const {
      name,
      types,
      set,
      supertype,
      subtypes,
      number,
      legalities,
      ancientTrait,
      rarity,
    } = card;

    // The API keeps list of expanded format ban list by stating it as "Banned" in
    // legalities and since GLC uses a different ban list, it would make cards show up
    // as "from non-legal sets" if the latter part of this or is missing.
    const setLegal =
      legalities.expanded === "Legal" || legalities.expanded === "Banned";
    const ptcgoCode = set.ptcgoCode;

    let ruleBox = false;

    if (
      (subtypes &&
        (subtypes.includes("EX") ||
          subtypes.includes("GX") ||
          subtypes.includes("BREAK") ||
          subtypes.includes("V") ||
          subtypes.includes("VMAX") ||
          subtypes.includes("VSTAR") ||
          subtypes.includes("Tera ex") ||
          subtypes.includes("ex"))) ||
      subtypes.includes("ACE SPEC") ||
      rarity === "Rare ACE" ||
      rarity === "Radiant Rare" ||
      name.includes("◇")
    ) {
      ruleBox = true;
    }

    return {
      name,
      types,
      supertype,
      subtypes,
      number,
      setLegal,
      ruleBox,
      ptcgoCode,
      ancientTrait,
    };
  });

  const setCards = {};
  cardDetails.forEach((card) => {
    setCards[card.number] = card;
  });

  const db = JSON.parse(
    fs.readFileSync("./tooling/data/database.json", "utf-8")
  );

  db[setCode] = setCards;

  fs.writeFileSync("./tooling/data/database.json", JSON.stringify(db));
}

async function adjustBanlist() {
  banlist = JSON.parse(fs.readFileSync("./tooling/data/banlist.json", "utf-8"));
  const { banlistAction } = await inquirer.prompt({
    name: "banlistAction",
    type: "list",
    choices: ["Add", "Remove", "View"],
    message: "What do you want to do with banlist?",
  });

  if (banlistAction === "View") {
    console.log("Current banlist");
    Object.keys(banlist).forEach((card) => {
      const [set, number] = card.split(" ");
      const db = JSON.parse(
        fs.readFileSync("./tooling/data/database.json", "utf-8")
      );

      const cardData = db[set][number];

      console.log(`${card} ${cardData.name}`);
    });
  } else if (banlistAction === "Add") {
    const { newBan } = await inquirer.prompt({
      name: "newBan",
      type: "string",
      message: "Which card to add to banlist? (in format [SET_CODE] [NUMBER]",
    });

    banlist[newBan] = true;

    fs.writeFileSync("./tooling/data/banlist.json", JSON.stringify(banlist));
  } else if (banlistAction === "Remove") {
    const { removed } = await inquirer.prompt({
      name: "removed",
      type: "list",
      choices: Object.keys(banlist),
      message: "Which card is unbanned?",
    });

    delete banlist[removed];

    fs.writeFileSync("./tooling/data/banlist.json", JSON.stringify(banlist));
  }
}

module.exports = { listSets, downloadSet, adjustBanlist };
