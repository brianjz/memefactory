import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class words extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      primaryKey: true
    },
    word: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    wordtype: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    useInPrompt: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1
    }
  }, {
    sequelize,
    tableName: 'words',
    timestamps: false,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "id" },
        ]
      },
      {
        name: "words_unique",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "word" },
          { name: "wordtype" },
        ]
      },
    ]
  });
  }
}
