import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class messages extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      primaryKey: true
    },
    message: {
      type: DataTypes.STRING(2000),
      allowNull: true
    },
    msgtype: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    flagged: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1
    }
  }, {
    sequelize,
    tableName: 'messages',
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
