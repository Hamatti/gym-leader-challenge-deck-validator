# Gym Leader Challenge: Deck Validator

## Documentation for Tooling

This folder contains tooling required to update the data used by the frontend.

### Prequisites

First you need to get a Developer API key from [PokémonTCG.io's Developer Portal](https://dev.pokemontcg.io/). Then copy `.env.sample` to `.env` and add your API key to the file:

```
API_KEY=[your_api_key_here]
```

_Please note: do not share your API key with anyone and don't add it to version control. If you accidentally do, refresh your key in the developer portal linked above to avoid misuse._

### Add a new set

When new set is published, there are a couple of things that need to be done to update the application:

1. Download the new cards from API:

```
npm run start
```

and select `download` from the command-line menu and input PTCGO code for the new set.

2. Once that is done without errors, run

```
npm run build
```

which will copy the needed files to the serverless function.

3. Add information about the new set to `web/changelog.html` file.

4. Finally, run

```
netlify deploy
```

to deploy a preview of the application, manually check that it works and then publish it with

```
netlify deploy --prod
```

### Manage ban list

After updates are made to [the format's ban list](https://gymleaderchallenge.com/home/ban-list/), run

```
npm run start
```

and select _Adjust banlist_ from the menu. From there, you can add new ones, delete old ones or view the banlist.
