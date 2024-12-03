# Meme Factory

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

After playing the Jackbox game "Job Job", we found it funny when random absurd motivational posters would appear. I thought I'd try my hand at it, then decided it'd be even funnier if we could use a LLM and image generation to make it even more random and absurd. It, obviously, expanded into memes.

It started as a sort of *proof of concept* in PHP and went from there, so it keeps getting things tacked on. I decided to move it to React to make it easier it update and expand on.

## Details

Example .env files are included showing the enviroment variables that are used.

I use sequelize with a local MySQL server, but you should be able to change it to whatever you need. Models are included for the database tables I use, so you should be able to recreate them. They were built and added on to sort of ranomly, so they don't really follow a standard.

> [!TIP]
Each of the main items: `memes` and `messages` are done in the following formats to allow for random word replacements that add to the fun:

> Challenges are [PLURAL] in disguise.

Where `[PLURAL]` is the type of item in the `word` table that will be replaced. More advanced things can be done like:

> Don't leave [PLACE|home] without it!

A pipe in after the type with the original word will allow the site to give an equal change of pulling the original word or a replacement word.

> Don't compare your [NOUN] to someone else's [NOUN||0].

A second pipe with a number tells the site to use one of the previous (*zero-based*) replacements again.

You can use any "type" of word you want in the `words` table. I have the basics like *noun, plural, adj, verb, verbing, person, place*. It just uses the keyword when querying the table to filter.

I also have a `lyrics` table that I added on a whim that has lyrics from songs that can be added a certain points. It was a pain to add, so I should've done it differently. But, it's set up just like the `memes` and `messages` tables.

The `prompts` table is just a few random prompts that will be used if you don't have an LLM to use or if you have memes/messages with words you'd rather not send to an LLM or Image Generator. :shrug: