import express from 'express'
import { Sequelize, Op } from 'sequelize';
import initModels from '../models/init-models.js';
import fs from 'fs'
import path from 'path'
import seedrandom from 'seedrandom'
import * as dotenv from 'dotenv';

dotenv.config(); 

const sequelize = new Sequelize('misc', process.env.DBUSER, process.env.DBPASSWORD, {
  host: process.env.DBSERVER,
  dialect: 'mysql' 
});

const models = initModels(sequelize); 

const indexRouter = express.Router();

let replacedWords = [];
let includesBadWord = false;

async function replaceBracketedWords(msg, models, seed) {
  // console.log("ORIG SEED: "+seed)
  const rng = seedrandom(seed);
  const pattern = /\[([\w\!\|\s|;|\-]+)\]/g;
  const promises = [];

  msg = "Ok, [PERSON!;PROPERNAME|boomer]||"
  console.log("ORIG MSG => "+msg)
  // First pass: Find all bracketed sections and create Promises
  msg.replace(pattern, (match, foundString) => {
    const promise = (async () => {
      let orig = "";
      let spl = [];
      let singularModifier = false
      if (foundString.includes("|")) {
        spl = foundString.split("|");
        foundString = spl[0];
        orig = spl[1];
      }
      // console.log(foundString)
      if (foundString.indexOf("!") > -1) {
        // foundString = foundString.substring(0, foundString.length-1)
        singularModifier = true
      }

      // Fetch a random word from the database based on the type
      let randomWord = orig
      const chance = Math.floor(rng() * 101);
      if(chance > 50 || orig === "" || spl.length > 2) {
        // seed++
        // console.log("SPL => "+spl)
        // console.log("ReplW => "+replacedWords)
        const wordseed = rng.int32() // debugging seed issues
        const randomWordData = await getRandomWordFromDatabase(foundString, models, wordseed, singularModifier)
        if(spl.length > 2) { // if repeating an existing replacement
          let loc = parseInt(spl[2])
          randomWord = replacedWords[loc];
          if(randomWord === undefined) {
            randomWord = orig // stopgap to prevent undefined
          }
        } else {
          if(randomWordData["useInPrompt"] === 0) {
            includesBadWord = true
          }
          randomWord = randomWordData["word"]
          if(singularModifier) {
            randomWord = randomWord.substring(randomWord.indexOf(" ")+1)
          }
          // console.log("RW => "+randomWord)
          replacedWords.push(randomWord)
        }
      }

      return randomWord;
    })();

    promises.push(promise);
    return '';
  });

  // Wait for all Promises to resolve
  const results = await Promise.all(promises);

  // Second pass: Replace the placeholders with the resolved words
  let i = 0;
  return msg.replace(pattern, () => results[i++]);
}

// Helper function to get a random word from the database
async function getRandomWordFromDatabase(type, models, seed) {
  // console.log("SEED: "+seed)
  try {
    let types = [type]
    if(type.indexOf(';') > -1) {
      types = type.split(';').map(item => item.replace('!', ''));
    }
    let randomWord = {"word": "word", "useInPrompt": 1}
    let usedLyric = false
    if(types.includes("LYRIC")) {
      const rng = seedrandom(seed);
      let chance = Math.floor(rng() * 101);
      if(types.length === 1) {
        chance = 100
      }
      if(chance > 50) {
        usedLyric = true
        const randomLyric = await models.lyrics.findOne({
          order: Sequelize.literal('RAND('+seed+')'),
        });
        // console.log(randomLyric)
        const regex = /\[(.*?)\|(.*?)\]/g; // Regular expression to match possible bracketed words
        let result = randomLyric.lyric;
      
        let match;
        while ((match = regex.exec(randomLyric.lyric)) !== null) {
          const fullMatch = match[0];
          const replacementWord = match[2] || match[1]; // Use word after pipe or first word
      
          result = result.replace(fullMatch, replacementWord);
        }
        randomWord = { "word": result, "useInPrompt": randomLyric.flagged === 0 ? 1 : 0}
      }
    }
    if(!usedLyric) {
      randomWord = await models.words.findOne({
        where: { wordtype: { [Op.in]: types } },
        order: Sequelize.literal('RAND('+seed+')'),
      });
    }

    if (randomWord) {
      return randomWord;
    } else {
      // Handle case where no word is found for the given type
      console.log("No word found for type:", type);
      return "[No word found]"; 
    }

  } catch (error) {
    console.error("Error fetching random word:", error);
    return "[Error fetching word]";
  }
}

indexRouter.get('/', function(req, res, next) {
  res.send({ title: 'Index' });
});

indexRouter.get('/api/memes', async (req, res) => {
  try {
    const users = await models.memes.findAll({
      order: ['topline', 'bottomline']
    });  

    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch memes' });
  }
});

indexRouter.post('/api/save-image/:type?', (req, res) => {
  let saveType = req.params.type ?? "final"
  const base64Data = req.body.image; // Get the base64 image data from the request body
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0'); // Month is 0-indexed
  const day = now.getDate().toString().padStart(2, '0');
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');
  const randomNumber = Math.floor(100000 + Math.random() * 900000); // Generate 6-digit random number

  const filename = `${year}${month}${day}${hours}${minutes}${seconds}-${randomNumber}.` + (saveType === "final" ? "jpg" : "png");
  const directoryPath = saveType === "final" ? process.env.FINAL_DIR : process.env.ORIG_DIR;

  try {
    const base64Image = base64Data.replace(/^data:image\/\w+;base64,/, '');

    fs.writeFileSync(directoryPath + filename, base64Image, 'base64');

    res.status(200).json({ message: 'success', "filename": directoryPath+filename });
  } catch (error) {
    console.error('Error saving image:', error);
    res.status(500).json({ error: 'Failed to save image' });
  }
});

export async function getRandomMessage(imageType, seed) {
  // console.log("SEED:"+seed)
  const rng = seedrandom(seed);
  seed = parseInt(seed)
  includesBadWord = false;
  replacedWords = [];

  let title = ""
  let outputString = ""
  let extra = ""

  if(imageType === "message") {
    const chance = Math.floor(rng() * 101)
    let rand = ""
    let msgType = "message"
    if(chance > 60) {
      rand = await models.messages.findOne({
        order: Sequelize.literal('RAND('+seed+')')
      });
    } else {
      msgType = "lyric"
      rand = await models.lyrics.findOne({
        order: Sequelize.literal('RAND('+seed+')')
      });
    }
    outputString = await replaceBracketedWords(msgType === "message" ? rand.message : rand.lyric, models, seed);

    seed = seed + 1;
    const randTitle = await models.words.findOne({
      order: Sequelize.literal('RAND('+seed+')')
    });

    const finalTitle = await replaceBracketedWords(randTitle.word, models, seed);
    
    outputString = outputString.charAt(0).toUpperCase() + outputString.slice(1);
    if(randTitle.useInPrompt === 0 || rand.flagged === 1) {
      includesBadWord = true
    }
    title = finalTitle.toUpperCase();
  } else if(imageType === "meme") {
    const qry = 'SELECT CONCAT(COALESCE(topline, \'\'),\'||\',COALESCE(bottomline, \'\')) AS combined_data, extra FROM misc.memes ORDER BY RAND('+seed+') LIMIT 1'
    const result = await sequelize.query( 
      qry,
      {
        plain: false,
        raw: true,   
      }
    );
  
    let randomMeme = result[0][0].combined_data; // Access the first row of the results
    // console.log("MEME => "+randomMeme)
    extra = result[0][0].extra ? (Math.floor(rng() * 101) > 50 ? result[0][0].extra: "") : ""
    
    randomMeme = await replaceBracketedWords(randomMeme, models, seed);
    randomMeme = randomMeme.toUpperCase()
    // console.log(randomMeme)
    const memeParts = randomMeme.split('||')
    // console.log(memeParts[0] + " -- " + memeParts[1])
    title = memeParts[0]
    outputString = memeParts[1]
  }

  return {title, outputString, includesBadWord, extra}
}

indexRouter.get('/api/random/message/:seed?', async (req, res, next) => {
  let seed = req.params.seed ?? 1234
  console.log(`==> Called /api/random/message/${seed}`)

  try {
      const {title, outputString, includesBadWord} = await getRandomMessage(seed)
      res.json({"message": `${title}|${outputString}`, "includesBadWord": includesBadWord});
  } catch (error) {
    console.error(error);
    next(error)
    // res.status(500).json({ error: 'Failed to process message: ' + error });
  }
});

indexRouter.get('/api/random/lyric/:seed?', async (req, res) => {
  const seed = req.params.seed ?? 1234
  includesBadWord = false;
  replacedWords = [];
  try {
    const rand = await models.lyrics.findOne({
      order: Sequelize.literal('RAND('+seed+')')
    });

    let outputString = await replaceBracketedWords(rand.lyric, models, seed);
    outputString = outputString.charAt(0).toUpperCase() + outputString.slice(1);

    res.json({"message": outputString, "includesBadWord": includesBadWord});

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to process lyric: '+error });
  }
});
indexRouter.get('/api/random/meme/:seed?', async (req, res, next) => {
  const seed = req.params.seed ?? 1234
  includesBadWord = false;
  replacedWords = [];

  try {
    const {title, outputString, _} = await getRandomMessage("meme", seed)
    // outputString = await replaceBracketedWords(outputString, models, seed);
    res.json({title, "message": outputString, "includesBadWord": includesBadWord});

  } catch (error) {
    console.error(error);
    next(error);
    res.status(500).json({ error: 'Failed to process meme: ' + error });
  }
});

export async function getRandomPrompt(generator, seed) {
  const rand = await models.prompts.findOne({
    where: { generator: generator },
    order: Sequelize.literal('RAND('+seed+')')
  });

  console.log("PROMPT => "+rand.prompt)
  return rand.prompt
}

indexRouter.get('/api/random/prompt/:generator/:seed?', async (req, res) => {
  const generator = req.params.generator ?? "sd15";
  const seed = req.params.seed ?? 1234
  try {
    const rand = await getRandomPrompt(generator, seed)

    res.json(rand);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch random prompt' });
  }
});

indexRouter.get('/api/savedimages', async (req, res) => {
  const directoryPath = process.env.FINAL_DIR
  try {
      const allFiles = fs.readdirSync(directoryPath);
      const files = allFiles.filter(file => path.extname(file).toLowerCase() === '.jpg' || path.extname(file).toLowerCase() === '.png').reverse();
      if (files.length === 0) {
        res.status(500).json({ error: 'Failed to fetch random file' });
      }
      return res.json({ files: files}); // Return the full path
    } catch (error) {
      console.error('Error reading directory or selecting files:', error);
      res.status(500).json({ error: 'Failed to fetch file list' });
    }
})

indexRouter.get('/api/random/savedimage/:spot?', async (req, res) => {
  const spot = req.params.spot ?? "random"
  try {
      const allFiles = fs.readdirSync(process.env.FINAL_DIR);
      const files = allFiles.filter(file => path.extname(file).toLowerCase() === '.jpg' || path.extname(file).toLowerCase() === '.png');
      if (files.length === 0) {
        res.status(500).json({ error: 'Failed to fetch random file' });
      }
      const randomIndex = Math.floor(Math.random() * files.length);
      const randomFile = spot === "random" ? files[randomIndex] : files[files.length - 1];
      return res.json({ file: randomFile}); // Return the full path
    } catch (error) {
      console.error('Error reading directory or selecting file:', error);
      res.status(500).json({ error: 'Failed to fetch random file' });
    }
})

indexRouter.get('/api/memes', async (req, res) => {
  try {
    const memes = await models.memes.findAll({
      order: Sequelize.literal('topline ASC') 
    });
    
    res.json(memes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch memes' });
  }
});

indexRouter.post('/api/meme/update', async (req, res) => {
  try {
    const updatedData = Object.fromEntries(
      Object.entries(req.body).map(([key, value]) => 
        [key, value === '' ? null : value]
      )
    );

    const updatedItem = await models.memes.update(updatedData, {
      where: { id: req.body.id }
    });
    res.json(updatedItem);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update meme' });
  }
});

indexRouter.post('/api/meme/new', async (req, res) => {
  try {
    const updatedData = Object.fromEntries(
      Object.entries(req.body).map(([key, value]) => 
        [key, value === '' ? null : value]
      )
    );

    const createdItem = await models.memes.create(updatedData);
    res.json(createdItem);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create new meme' });
  }
});

indexRouter.get('/api/messages', async (req, res) => {
  try {
    const memes = await models.messages.findAll({
      order: Sequelize.literal('message ASC') 
    });
    
    res.json(memes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

indexRouter.post('/api/message/update', async (req, res) => {
  try {
    const updatedData = Object.fromEntries(
      Object.entries(req.body).map(([key, value]) => 
        [key, value === '' ? null : value]
      )
    );

    const updatedItem = await models.messages.update(updatedData, {
      where: { id: req.body.id }
    });
    res.json(updatedItem);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update message' });
  }
});

indexRouter.post('/api/message/new', async (req, res) => {
  try {
    const updatedData = Object.fromEntries(
      Object.entries(req.body).map(([key, value]) => 
        [key, value === '' ? null : value]
      )
    );

    const createdItem = await models.messages.create(updatedData);
    res.json(createdItem);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create new message' });
  }
});

indexRouter.get('/api/words', async (req, res) => {
  try {
    const memes = await models.words.findAll({
      order: Sequelize.literal('wordtype ASC, word ASC') 
    });
    
    res.json(memes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch words' });
  }
});

indexRouter.post('/api/word/update', async (req, res) => {
  try {
    const updatedItem = await models.words.update(req.body, {
      where: { id: req.body.id }
    });
    res.json(updatedItem);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update word' });
  }
});

indexRouter.post('/api/word/new', async (req, res) => {
  try {
    const createdItem = await models.words.create(req.body);
    res.json(createdItem);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create new word' });
  }
});

indexRouter.get('/api/lyrics', async (req, res) => {
  try {
    const memes = await models.lyrics.findAll({
      order: Sequelize.literal('lyric ASC') 
    });
    
    res.json(memes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch lyrics' });
  }
});

indexRouter.post('/api/lyric/update', async (req, res) => {
  try {
    const updatedItem = await models.lyrics.update(req.body, {
      where: { id: req.body.id }
    });
    res.json(updatedItem);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update lyric' });
  }
});

indexRouter.post('/api/lyric/new', async (req, res) => {
  try {
    const createdItem = await models.lyrics.create(req.body);
    res.json(createdItem);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create new lyric' });
  }
});


export default indexRouter;
