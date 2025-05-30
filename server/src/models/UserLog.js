const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const UserLog = sequelize.define('UserLog', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    action: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    details: {
      type: DataTypes.JSONB
    },
    ipAddress: {
      type: DataTypes.INET,
      field: 'ip_address'
    },
    userAgent: {
      type: DataTypes.TEXT,
      field: 'user_agent'
    },
    createdAt: {
      type: DataTypes.DATE,
      field: 'created_at',
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'user_logs',
    timestamps: false
  });

  return UserLog;
};
