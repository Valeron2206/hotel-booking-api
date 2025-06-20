const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Client = sequelize.define('Client', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    first_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 100]
      }
    },
    last_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 100]
      }
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
        notEmpty: true
      }
    },
    phone: {
      type: DataTypes.STRING(50),
      allowNull: true,
      validate: {
        is: /^[+]?[0-9\s\-\(\)]{7,20}$/
      }
    },
    is_vip: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    vip_tier: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: 'standard',
      validate: {
        isIn: [['standard', 'silver', 'gold', 'platinum', 'diamond']]
      }
    },
    vip_discount: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0.00,
      validate: {
        min: 0,
        max: 100,
        isDecimal: true
      }
    },
    vip_checked_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'clients',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    hooks: {
      beforeValidate: (client) => {
        if (client.email) {
          client.email = client.email.toLowerCase().trim();
        }
        if (client.first_name) {
          client.first_name = client.first_name.trim();
        }
        if (client.last_name) {
          client.last_name = client.last_name.trim();
        }
        if (client.phone) {
          client.phone = client.phone.trim();
        }
      },
      beforeCreate: (client) => {
        if (!client.is_vip) {
          client.vip_tier = 'standard';
          client.vip_discount = 0.00;
        }
      },
      beforeUpdate: (client) => {
        if (!client.is_vip) {
          client.vip_tier = 'standard';
          client.vip_discount = 0.00;
        }
      }
    }
  });

  // Instance methods
  Client.prototype.getFullName = function() {
    return `${this.first_name} ${this.last_name}`;
  };

  Client.prototype.needsVipCheck = function() {
    if (!this.vip_checked_at) return true;
    
    const now = new Date();
    const lastCheck = new Date(this.vip_checked_at);
    const hoursSinceCheck = (now - lastCheck) / (1000 * 60 * 60);
    
    return hoursSinceCheck > 24;
  };

  Client.prototype.updateVipStatus = async function(vipData) {
    this.is_vip = vipData.isVip || false;
    this.vip_tier = vipData.tier || 'standard';
    this.vip_discount = vipData.discount || 0;
    this.vip_checked_at = new Date();
    
    return await this.save();
  };

  Client.prototype.toJSON = function() {
    const values = Object.assign({}, this.get());
    values.full_name = this.getFullName();
    if (values.vip_discount) {
      values.vip_discount = parseFloat(values.vip_discount);
    }
    return values;
  };

  // Class methods
  Client.findByEmail = async function(email) {
    return await this.findOne({
      where: {
        email: email.toLowerCase().trim()
      }
    });
  };

  Client.findOrCreateByEmail = async function(clientData) {
    const email = clientData.email.toLowerCase().trim();
    
    const [client, created] = await this.findOrCreate({
      where: { email },
      defaults: {
        first_name: clientData.first_name,
        last_name: clientData.last_name,
        phone: clientData.phone || null,
        email: email
      }
    });
    
    return { client, created };
  };

  return Client;
};
