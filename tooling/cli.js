const inquirer = require("inquirer");

const { listSets, downloadSet } = require("./utils.js");

async function cli() {
  const { action } = await inquirer.prompt([
    {
      type: "list",
      name: "action",
      question: "What do you want to do?",
      choices: ["list", "download"],
    },
  ]);

  ACTIONS[action]();
}

const ACTIONS = {
  list: listSets,
  download: downloadSet,
};

cli();
