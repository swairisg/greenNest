const AlertConfig = require('../Model/climateCheck/AlertConfigModel');
const AlertHistory = require('../Model/climateCheck/AlertHistoryModel');
const whatsappService = require('./WhatsAppService');

class ClimateAlertService {
  constructor() {
    this.alertCooldowns = new Map();
  }

  async checkClimateAlerts(climateData) {
    try {
      console.log('Checking climate data against alerts...');
      
      const activeAlerts = await AlertConfig.find({ isActive: true });
      const triggeredAlerts = [];

      for (const alertConfig of activeAlerts) {
        const value = climateData[alertConfig.parameter];
        
        if (value !== undefined && value !== null) {
          const isTriggered = await this.checkThreshold(alertConfig, value, climateData);
          
          if (isTriggered) {
            triggeredAlerts.push({
              config: alertConfig,
              value: value,
              climateData: climateData
            });
          }
        }
      }

      for (const triggered of triggeredAlerts) {
        await this.triggerAlert(triggered.config, triggered.value, triggered.climateData);
      }

      return triggeredAlerts.length;

    } catch (error) {
      console.error('Error checking climate alerts:', error);
      return 0;
    }
  }

  async checkThreshold(alertConfig, value, climateData) {
    const isBelowMin = value < alertConfig.minThreshold;
    const isAboveMax = value > alertConfig.maxThreshold;
    
    if (!isBelowMin && !isAboveMax) return false;

    // Check cooldown
    const cooldownKey = `${alertConfig._id}_${isBelowMin ? 'min' : 'max'}`;
    if (this.isInCooldown(cooldownKey, alertConfig.cooldownMinutes)) {
      return false;
    }

    return true;
  }

  // Trigger an alert
  async triggerAlert(alertConfig, value, climateData) {
    try {
      const isBelowMin = value < alertConfig.minThreshold;
      const thresholdType = isBelowMin ? 'min' : 'max';
      const thresholdValue = isBelowMin ? alertConfig.minThreshold : alertConfig.maxThreshold;
      
      // Create alert message
      const message = this.createAlertMessage(alertConfig, value, thresholdValue, thresholdType, climateData);
      
      const alertHistory = new AlertHistory({
        alertConfigId: alertConfig._id,
        parameter: alertConfig.parameter,
        recordedValue: value,
        thresholdType: thresholdType,
        thresholdValue: thresholdValue,
        severity: alertConfig.severity,
        message: message,
        notificationMethods: alertConfig.notificationMethods
      });

      await alertHistory.save();

      await this.sendNotifications(alertConfig, message, alertHistory._id);

      await AlertConfig.findByIdAndUpdate(alertConfig._id, {
        lastTriggered: new Date()
      });

      const cooldownKey = `${alertConfig._id}_${thresholdType}`;
      this.setCooldown(cooldownKey, alertConfig.cooldownMinutes);

      console.log(`Climate alert triggered: ${message}`);
      
      return alertHistory;

    } catch (error) {
      console.error('Error triggering alert:', error);
    }
  }

  createAlertMessage(alertConfig, value, threshold, type, climateData) {
    const parameterNames = {
      temperature: 'Temperature',
      humidity: 'Humidity', 
      soilMoisture: 'Soil Moisture'
    };

    const direction = type === 'min' ? 'below' : 'above';
    const parameter = parameterNames[alertConfig.parameter] || alertConfig.parameter;
    
    let message = `CLIMATE ALERT - ${parameter}\n\n`;
    message += `Current: ${value}${this.getUnit(alertConfig.parameter)}\n`;
    message += `Threshold: ${threshold}${this.getUnit(alertConfig.parameter)} (${direction})\n`;
    message += `Severity: ${alertConfig.severity.toUpperCase()}\n`;
    
    if (climateData.location) {
      message += `Location: ${climateData.location}\n`;
    }
    
    message += `Time: ${new Date().toLocaleString()}\n\n`;
    message += `Action Required: Check ${parameter.toLowerCase()} conditions immediately.`;

    return message;
  }

  getUnit(parameter) {
    const units = {
      temperature: '°C',
      humidity: '%',
      soilMoisture: '%'
    };
    return units[parameter] || '';
  }

  async sendNotifications(alertConfig, message, alertId) {
    try {
      const notificationPromises = [];

      if (alertConfig.notificationMethods.includes('whatsapp') && alertConfig.recipients.length > 0) {
        for (const recipient of alertConfig.recipients) {
          if (this.isPhoneNumber(recipient)) {
            notificationPromises.push(
              whatsappService.sendAlertNotification(recipient, message)
            );
          }
        }
      }

      if (alertConfig.notificationMethods.includes('in_app')) {
        console.log('📱 In-app alert would be sent:', message);
      }

      await Promise.allSettled(notificationPromises);

      await AlertHistory.findByIdAndUpdate(alertId, {
        notificationSent: true
      });

    } catch (error) {
      console.error('Error sending notifications:', error);
    }
  }

  isPhoneNumber(str) {
    return /^\+?[\d\s-()]+$/.test(str);
  }


  isInCooldown(key, cooldownMinutes) {
    const lastTriggered = this.alertCooldowns.get(key);
    if (!lastTriggered) return false;
    
    const cooldownMs = cooldownMinutes * 60 * 1000;
    return (Date.now() - lastTriggered) < cooldownMs;
  }

  setCooldown(key, cooldownMinutes) {
    this.alertCooldowns.set(key, Date.now());

    setTimeout(() => {
      this.alertCooldowns.delete(key);
    }, cooldownMinutes * 60 * 1000);
  }

  async getAlertSummary() {
    const activeAlerts = await AlertConfig.countDocuments({ isActive: true });
    const recentAlerts = await AlertHistory.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });
    const unresolvedAlerts = await AlertHistory.countDocuments({ isResolved: false });

    return {
      activeAlerts,
      recentAlerts24h: recentAlerts,
      unresolvedAlerts
    };
  }
}

module.exports = new ClimateAlertService();