const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    bnetId: {
      type: DataTypes.STRING(50),
      unique: true,
      field: 'bnet_id'
    },
    battleTag: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'battle_tag'
    },
    nickname: {
      type: DataTypes.STRING(255)
    },
    email: {
      type: DataTypes.STRING(255)
    },
    password: {
      type: DataTypes.STRING(255) // 관리자 계정용
    },
    role: {
      type: DataTypes.STRING(50),
      defaultValue: 'user'
    },
    isProfileComplete: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_profile_complete'
    },
    preferredRoles: {
      type: DataTypes.JSONB,
      defaultValue: ['전체'],
      field: 'preferred_roles'
    },
    previousTier: {
      type: DataTypes.STRING(50),
      defaultValue: 'placement',
      field: 'previous_tier'
    },
    mmr: {
      type: DataTypes.INTEGER,
      defaultValue: 1500
    },
    wins: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    losses: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    lastLoginAt: {
      type: DataTypes.DATE,
      field: 'last_login_at'
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
    tableName: 'users',
    timestamps: false,
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          user.password = await bcrypt.hash(user.password, 10);
        }
        if (!user.nickname && user.battleTag) {
          user.nickname = user.battleTag.split('#')[0];
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          user.password = await bcrypt.hash(user.password, 10);
        }
      }
    }
  });

  // 인스턴스 메서드: 비밀번호 비교
  User.prototype.comparePassword = async function(password) {
    if (!this.password) return false;
    return await bcrypt.compare(password, this.password);
  };

  // 인스턴스 메서드: JWT 토큰 생성
  User.prototype.generateAuthToken = function() {
    const payload = {
      id: this.id,
      bnetId: this.bnetId,
      battleTag: this.battleTag,
      role: this.role
    };

    return jwt.sign(
      payload,
      process.env.JWT_SECRET || 'dev_jwt_secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
  };

  // 인스턴스 메서드: 승률 계산
  User.prototype.getWinRate = function() {
    const total = this.wins + this.losses;
    if (total === 0) return 0;
    return Math.round((this.wins / total) * 100 * 10) / 10; // 소수점 한 자리까지
  };

  return User;
};
