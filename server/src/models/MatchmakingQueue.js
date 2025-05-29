const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const MatchmakingQueue = sequelize.define('MatchmakingQueue', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    preferredRole: {
      type: DataTypes.STRING(50),
      field: 'preferred_role'
    },
    gameMode: {
      type: DataTypes.STRING(100),
      field: 'game_mode'
    },
    mmr: {
      type: DataTypes.INTEGER
    },
    queueTime: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'queue_time'
    },
    status: {
      type: DataTypes.STRING(50),
      defaultValue: 'waiting'
    }
  }, {
    tableName: 'matchmaking_queue',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['user_id']
      }
    ]
  });

  return MatchmakingQueue;
};
