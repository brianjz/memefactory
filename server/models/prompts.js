import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class prompts extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      primaryKey: true
    },
    prompt: {
      type: DataTypes.STRING(2000),
      allowNull: false
    },
    generator: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: "sd15"
    }
  }, {
    sequelize,
    tableName: 'prompts',
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
    ]
  });
  }
}
