const fs = require("fs");
const inquirer = require("inquirer");
const pokemon = require("pokemontcgsdk");

pokemon.configure({
  apiKey: process.env.API_KEY,
});

const dotenv = require("dotenv");
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
      if (!set.ptcgoCode) {
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

  const cards = await pokemon.card.all({ q: `set.ptcgoCode:${setCode}` });

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

    const setLegal = legalities.expanded === "Legal";
    const ptcgoCode = set.ptcgoCode;

    let ruleBox = false;

    if (
      subtypes &&
      (subtypes.includes("EX") ||
        subtypes.includes("GX") ||
        subtypes.includes("BREAK") ||
        subtypes.includes("V") ||
        subtypes.includes("VMAX") ||
        subtypes.includes("VSTAR") ||
        rarity === "Rare ACE" ||
        name.includes("◇"))
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

module.exports = { listSets, downloadSet };
