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
      allowNull: true,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    team: {
      type: DataTypes.STRING(10),
      allowNull: false
    },
    hero: {
      type: DataTypes.STRING(255)
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
    experienceContribution: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'experience_contribution'
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
    },
    playerBattleTag: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'player_battle_tag'
    },
    role: {
      type: DataTypes.STRING(50)
    },
    mmrBefore: {
      type: DataTypes.INTEGER,
      defaultValue: 1500,
      field: 'mmr_before'
    },
    mmrAfter: {
      type: DataTypes.INTEGER,
      defaultValue: 1500,
      field: 'mmr_after'
    }
  }, {
    tableName: 'match_participants',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['match_id', 'user_id']
      }
    ]
  });

  return MatchParticipant;
};
