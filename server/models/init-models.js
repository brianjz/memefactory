import _sequelize from "sequelize";
const DataTypes = _sequelize.DataTypes;
import _memes from  "./memes.js";
import _messages from  "./messages.js";
import _prompts from  "./prompts.js";
import _words from  "./words.js";
import _lyrics from  "./lyrics.js";

export default function initModels(sequelize) {
  const memes = _memes.init(sequelize, DataTypes);
  const messages = _messages.init(sequelize, DataTypes);
  const prompts = _prompts.init(sequelize, DataTypes);
  const words = _words.init(sequelize, DataTypes);
  const lyrics = _lyrics.init(sequelize, DataTypes);

  return {
    memes,
    messages,
    prompts,
    words,
    lyrics,
  };
}
