const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const MatchParticipant = sequelize.define('MatchParticipant', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    matchId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'match_id',
      references: {
        model: 'matches',
        key: 'id'
      }
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    team: {
      type: DataTypes.INTEGER
    },
    hero: {
      type: DataTypes.STRING(255)
    },
    role: {
      type: DataTypes.STRING(50)
    },
    joinedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'joined_at'
    },
    kills: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    deaths: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    assists: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    heroDamage: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'hero_damage'
    },
    siegeDamage: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'siege_damage'
    },
    healing: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    experience: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    mmrChange: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'mmr_change'
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
    tableName: 'match_participants',
    indexes: [
      {
        unique: true,
        fields: ['match_id', 'user_id']
      }
    ]
  });

  return MatchParticipant;
};
