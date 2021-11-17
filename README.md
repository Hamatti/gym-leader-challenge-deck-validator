# Gym Leader Challenge: Deck Validator

This web application provides a way to check if your [Pokémon TCG Gym Leader Challenge](https://gymleaderchallenge.com/) deck is valid.

## Deck Building Rules

Per format rules, your deck needs to adhere to following checks:

### Monotype

Only one type of Pokémon is allowed in the deck.

### Singleton

Other than basic energies, you can only play one card of same name. For example, you cannot have two different Pikachu cards in your deck, even if they are a different card.

### No Rule Box Pokémon

Pokémon cards with Rule Boxes are not allowed. This includes Pokémon EX, Mega Evolution, GX, V, VMAX, BREAK and Prism Star cards.

### Black and White-on

Format only allows cards published in Black and White set or after that.

### No ACE SPEC cards

ACE SPEC cards from Black and White era are not allowed.

### Ban list

Cards specifically [banned](https://gymleaderchallenge.com/home/ban-list/) by the format organizers are not allowed.

## Codebase

The codebase is split to three parts:

### Tooling to update the card database

Inside [`/tooling`](/tooling), you'll find instructions how to update the database.

### Serverless API

This application provides a single end-point API using Netlify Functions as serverless functionality. It accepts the deck list and returns validity information. It's inside [`/netlify/functions`](/netlify/functions).

### Frontend Web Application

The web application inside [`/web`](/web) serves a frontend that provides the users a way to provide their decklist and see results of the validity checker.

## License

The code is licensed with MIT license. See [LICENSE](LICENSE).

## Acknowledgements

This project uses [PokemonTCG.io API](https://pokemontcg.io/) for data validation.

This project is a recipient of [Spice Program support](https://spiceprogram.org/).
