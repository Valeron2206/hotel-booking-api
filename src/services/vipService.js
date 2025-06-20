const axios = require('axios');
const { Client } = require('../models');

class VipService {
  constructor() {
    this.vipApiUrl = process.env.VIP_API_URL || 'http://mock-vip-api:3001/check-vip';
    this.timeout = parseInt(process.env.VIP_API_TIMEOUT) || 5000;
    this.defaultDiscount = parseFloat(process.env.DEFAULT_VIP_DISCOUNT) || 15;
    
    // Configure axios instance
    this.axiosInstance = axios.create({
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Hotel-Booking-API/1.0'
      }
    });
  }

  /**
   * Check VIP status from external API
   * @param {string} email - Client email
   * @returns {Promise<Object>} VIP status data
   */
  async checkVipStatusFromApi(email) {
    try {
      console.log(`🔍 Checking VIP status for email: ${email}`);
      
      const response = await this.axiosInstance.post(this.vipApiUrl, {
        email: email.toLowerCase().trim()
      });

      const vipData = response.data;
      
      console.log(`✅ VIP API response for ${email}:`, vipData);
      
      return {
        isVip: vipData.isVip || false,
        tier: vipData.tier || 'standard',
        discount: vipData.discount || (vipData.isVip ? this.defaultDiscount : 0),
        apiResponse: true
      };
      
    } catch (error) {
      console.error(`❌ VIP API check failed for ${email}:`, error.message);
      
      // Return default non-VIP status on API failure
      return {
        isVip: false,
        tier: 'standard',
        discount: 0,
        apiResponse: false,
        error: error.message
      };
    }
  }

  /**
   * Get or update client VIP status
   * @param {Object} client - Client instance
   * @param {boolean} forceRefresh - Force API check even if recently checked
   * @returns {Promise<Object>} Updated client with VIP status
   */
  async getClientVipStatus(client, forceRefresh = false) {
    try {
      // Check if we need to refresh VIP status
      const needsCheck = forceRefresh || client.needsVipCheck();
      
      if (!needsCheck) {
        console.log(`📋 Using cached VIP status for ${client.email}`);
        return {
          client,
          fromCache: true
        };
      }

      // Get VIP status from external API
      const vipData = await this.checkVipStatusFromApi(client.email);
      
      // Update client VIP status
      await client.updateVipStatus(vipData);
      
      console.log(`🔄 Updated VIP status for ${client.email}: ${vipData.isVip ? 'VIP' : 'Standard'}`);
      
      return {
        client,
        fromCache: false,
        vipData
      };
      
    } catch (error) {
      console.error(`❌ Error updating VIP status for ${client.email}:`, error.message);
      
      // Return client as-is if update fails
      return {
        client,
        fromCache: true,
        error: error.message
      };
    }
  }

  /**
   * Process VIP status for booking
   * @param {Object} clientData - Client information
   * @returns {Promise<Object>} Client with updated VIP status
   */
  async processVipForBooking(clientData) {
    try {
      // Find or create client
      const { client, created } = await Client.findOrCreateByEmail(clientData);
      
      if (created) {
        console.log(`👤 Created new client: ${client.email}`);
      }

      // Get VIP status (force refresh for new clients)
      const { client: updatedClient, vipData } = await this.getClientVipStatus(client, created);
      
      return {
        client: updatedClient,
        isNewClient: created,
        vipData
      };
      
    } catch (error) {
      console.error('❌ Error processing VIP for booking:', error.message);
      throw error;
    }
  }

  /**
   * Calculate pricing with VIP discount
   * @param {number} basePrice - Base room price per night
   * @param {number} nights - Number of nights
   * @param {Object} client - Client with VIP status
   * @returns {Object} Pricing calculation
   */
  calculateVipPricing(basePrice, nights, client) {
    const originalPrice = basePrice * nights;
    const discount = client.is_vip ? client.vip_discount : 0;
    const totalPrice = originalPrice * (100 - discount) / 100;
    
    return {
      original_price: parseFloat(originalPrice.toFixed(2)),
      total_price: parseFloat(totalPrice.toFixed(2)),
      vip_discount_applied: discount,
      savings_amount: parseFloat((originalPrice - totalPrice).toFixed(2)),
      is_vip: client.is_vip,
      vip_tier: client.vip_tier
    };
  }

  /**
   * Get VIP service status
   * @returns {Promise<Object>} Service status
   */
  async getServiceStatus() {
    try {
      const healthResponse = await this.axiosInstance.get(
        this.vipApiUrl.replace('/check-vip', '/health')
      );
      
      return {
        available: true,
        status: healthResponse.data,
        url: this.vipApiUrl
      };
      
    } catch (error) {
      return {
        available: false,
        error: error.message,
        url: this.vipApiUrl
      };
    }
  }

  /**
   * Refresh VIP status for all clients (maintenance task)
   * @param {number} batchSize - Number of clients to process at once
   * @returns {Promise<Object>} Refresh results
   */
  async refreshAllVipStatuses(batchSize = 10) {
    try {
      console.log('🔄 Starting VIP status refresh for all clients...');
      
      const clients = await Client.findAll({
        where: {
          // Only refresh clients that need checking
        },
        order: [['vip_checked_at', 'ASC NULLS FIRST']]
      });

      let updated = 0;
      let errors = 0;
      
      // Process in batches to avoid overwhelming the VIP API
      for (let i = 0; i < clients.length; i += batchSize) {
        const batch = clients.slice(i, i + batchSize);
        
        const promises = batch.map(async (client) => {
          try {
            await this.getClientVipStatus(client, true);
            updated++;
          } catch (error) {
            errors++;
            console.error(`❌ Failed to refresh VIP status for ${client.email}:`, error.message);
          }
        });
        
        await Promise.all(promises);
        
        // Add delay between batches
        if (i + batchSize < clients.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      console.log(`✅ VIP refresh completed: ${updated} updated, ${errors} errors`);
      
      return {
        total: clients.length,
        updated,
        errors,
        success: true
      };
      
    } catch (error) {
      console.error('❌ VIP refresh failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Create singleton instance
const vipService = new VipService();

module.exports = vipService;
