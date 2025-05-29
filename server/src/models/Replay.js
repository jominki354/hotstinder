const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Replay = sequelize.define('Replay', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    matchId: {
      type: DataTypes.UUID,
      field: 'match_id',
      references: {
        model: 'matches',
        key: 'id'
      }
    },
    uploaderId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'uploader_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    filename: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    originalFilename: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'original_filename'
    },
    filePath: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'file_path'
    },
    fileSize: {
      type: DataTypes.BIGINT,
      field: 'file_size'
    },
    gameVersion: {
      type: DataTypes.STRING(50),
      field: 'game_version'
    },
    gameLength: {
      type: DataTypes.INTEGER,
      field: 'game_length'
    },
    mapName: {
      type: DataTypes.STRING(255),
      field: 'map_name'
    },
    gameMode: {
      type: DataTypes.STRING(100),
      field: 'game_mode'
    },
    analysisData: {
      type: DataTypes.JSONB,
      field: 'analysis_data'
    },
    uploadedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'uploaded_at'
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
    tableName: 'replays'
  });

  return Replay;
};
