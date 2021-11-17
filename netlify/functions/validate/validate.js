const {
  isValidCardLine,
  isMonotype,
  isSingleton,
  isBanned,
} = require("./utils.js");

const databaseCards = require("./cards.js");

const handler = async (event) => {
  try {
    const data = event.body;

    const decklist = data
      .split("\n")
      .map((line) => isValidCardLine(line))
      .filter((line) => line);

    const checks = {
      monotype: {
        valid: true,
        messages: [],
      },
      singleton: {
        valid: true,
        messages: [],
      },
      rulebox: {
        valid: true,
        messages: [],
      },
      banned: {
        valid: true,
        messages: [],
      },
      unknown_cards: {
        valid: true,
        messages: [],
      },
      legal_sets: {
        valid: true,
        messages: [],
      },
    };

    checks.monotype = isMonotype(decklist);
    checks.singleton = isSingleton(decklist);

    decklist.forEach((card) => {
      const [fullLine, qty, name, set, number] = card;
      if (isBanned(`${set} ${number}`)) {
        checks.banned.valid = false;
        checks.banned.messages.push(fullLine);
      }

      const setData = databaseCards[set];

      if (!setData) {
        checks.legal_sets.valid = false;
        checks.legal_sets.messages.push(
          `${set} is either not legal or not yet in the database`
        );
        return;
      }
      const cardData = setData[number];

      if (!cardData) {
        checks.unknown_cards.valid = false;
        checks.unknown_cards.messages.push(fullLine);
        return;
      }

      if (cardData.ruleBox) {
        checks.rulebox.valid = false;
        checks.rulebox.messages.push(fullLine);
      }
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        valid:
          checks.monotype.valid &&
          checks.singleton.valid &&
          checks.rulebox.valid &&
          checks.unknown_cards.valid &&
          checks.legal_sets.valid,
        checks,
      }),
    };
  } catch (error) {
    return { statusCode: 500, body: error.toString() };
  }
};

module.exports = { handler };
