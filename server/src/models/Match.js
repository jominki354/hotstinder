const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Match = sequelize.define('Match', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    mapName: {
      type: DataTypes.STRING(255),
      field: 'map_name'
    },
    gameMode: {
      type: DataTypes.STRING(100),
      field: 'game_mode'
    },
    status: {
      type: DataTypes.STRING(50),
      defaultValue: 'waiting'
    },
    winner: {
      type: DataTypes.STRING(10),
      allowNull: true,
      comment: 'red, blue, or null for draw/no result'
    },
    isSimulation: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_simulation'
    },
    createdAt: {
      type: DataTypes.DATE,
      field: 'created_at'
    },
    updatedAt: {
      type: DataTypes.DATE,
      field: 'updated_at'
    }
  }, {
    tableName: 'matches',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return Match;
};
