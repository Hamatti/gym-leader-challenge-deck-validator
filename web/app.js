const resultDiv = document.querySelector("#result");
const VALID = `<span class="valid">&#10004;</span>`;
const INVALID = `<span class="invalid">&#10007;</span>`;

function craftSubsection(section, title) {
  const validator = section.valid ? VALID : INVALID;
  const header = `<strong>${validator} ${title}</strong>`;
  let list = "";
  if (!section.valid) {
    list = `<ul>${section.messages.map((msg) => `<li>${msg}</li>`).join("")}`;
  }

  return `<div>${header}${list}</div>`;
}

document.querySelector("#submit-check").addEventListener("click", (event) => {
  event.preventDefault();

  const decklist = document.querySelector("#input").value;

  fetch("/.netlify/functions/validate", {
    method: "POST",
    body: decklist,
  })
    .then((resp) => resp.json())
    .then((data) => {
      const { valid, checks } = data;

      const {
        banned,
        monotype,
        singleton,
        unknown_cards,
        rulebox,
        legal_sets,
      } = checks;
      const maybeValid =
        banned.valid &&
        monotype.valid &&
        singleton.valid &&
        !unknown_cards.valid &&
        rulebox.valid &&
        legal_sets.valid;

      let htmlOutput = `<div><h3>${
        valid
          ? `${VALID} Your deck is valid!`
          : maybeValid
          ? `? Your deck might not be valid`
          : `${INVALID} Your deck is not valid`
      }</h3>`;

      let banHTML = craftSubsection(banned, "Banned cards");
      let monotypeHTML = craftSubsection(monotype, "Monotype");
      let singletonHTML = craftSubsection(singleton, "Singleton");
      let unknown_cardsHTML = craftSubsection(
        unknown_cards,
        "Unverified cards"
      );
      let ruleboxHTML = craftSubsection(rulebox, "Rulebox");
      let setLegalityHTML = craftSubsection(legal_sets, "Set legality");

      resultDiv.innerHTML = `
      ${htmlOutput}
      ${monotypeHTML}
      ${singletonHTML}
      ${ruleboxHTML}
      ${banHTML}
      ${setLegalityHTML}
      ${unknown_cardsHTML}
      `;
    });
});
