const {
  isValidCardLine,
  isMonotype,
  isSingleton,
  isBanned,
  getSubsettedNumber,
  hasOnlyOneLysandre,
  hasOnlyOneResearch,
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
    checks.research = hasOnlyOneResearch(decklist);
    checks.lysandre = hasOnlyOneLysandre(decklist);

    decklist.forEach((card) => {
      let [fullLine, qty, name, set, number] = card;
      number = getSubsettedNumber(set, number);
      if (isBanned(`${set} ${number}`)) {
        checks.banned.valid = false;
        checks.banned.messages.push(fullLine);
      }

      const setData = databaseCards[set];

      if (!setData) {
        // Zekrom or Reshiram from Celebrations classic collection are legal
        // so we need to skip this step in their case
        if (!(set === "N/A" && (number === "20" || number === "21"))) {
          checks.legal_sets.valid = false;
          checks.legal_sets.messages.push(
            `${set} is either not legal or not yet in the database`
          );
          return;
        }
      }
      const cardData = setData[number];
      console.log(cardData);

      if (!cardData) {
        checks.unknown_cards.valid = false;
        checks.unknown_cards.messages.push(fullLine);
        return;
      }

      if (!cardData.setLegal) {
        checks.legal_sets.valid = false;
        checks.legal_sets.messages.push(
          `${cardData.name} (${cardData.ptcgoCode} ${cardData.number}) is not from a legal set.`
        );
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
          checks.banned.valid &&
          checks.legal_sets.valid,
        checks,
      }),
    };
  } catch (error) {
    return { statusCode: 500, body: error.toString() };
  }
};

module.exports = { handler };
