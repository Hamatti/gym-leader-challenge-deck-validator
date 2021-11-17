const inquirer = require("inquirer");

const { listSets, downloadSet, adjustBanlist } = require("./utils.js");

async function cli() {
  const { action } = await inquirer.prompt([
    {
      type: "list",
      name: "action",
      question: "What do you want to do?",
      choices: [
        { value: "list", name: "List sets in database" },
        { value: "download", name: "Download a new set from API" },
        { value: "banlist", name: "Adjust banlist" },
      ],
    },
  ]);

  ACTIONS[action]();
}

const ACTIONS = {
  list: listSets,
  download: downloadSet,
  banlist: adjustBanlist,
};

cli();
