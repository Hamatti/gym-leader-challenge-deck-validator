const fs = require("fs");
const inquirer = require("inquirer");
const fetch = require("node-fetch");

const dotenv = require("dotenv");
dotenv.config();

const API_BASE_URL = `https://api.pokemontcg.io/v2/`;
const HEADERS = {
  headers: { "X-Api-Key": process.env.API_KEY },
};

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
  const response = await fetch(
    `${API_BASE_URL}sets?q=legalities.expanded:legal`,
    HEADERS
  );

  let data = await response.json();
  data = Object.values(data.data);

  const sets = data
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

  const response = await fetch(
    `${API_BASE_URL}/cards?q=set.ptcgoCode:${setCode}`,
    HEADERS
  );

  // @TODO:
  // Add paging support since now we are not getting all the cards

  const json = await response.json();
  const cards = json.data;

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
