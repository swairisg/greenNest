const Delivery = require('../models/InventoryAndSupplychain/DeliveryModel');

class GeolocationService {
  constructor() {
    this.trackingIntervals = new Map();
    this.simulatedDrivers = new Map(); 
  }

  async startTracking(deliveryId, driverId) {
    console.log(` Starting real-time tracking for delivery ${deliveryId}`);
    
    await this.initializeDriverPosition(driverId);
    
    const interval = setInterval(async () => {
      try {
        const location = await this.simulateMovement(driverId);
        await this.updateDeliveryLocation(deliveryId, location);
        
        console.log(`Delivery ${deliveryId} location: ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`);
      } catch (error) {
        console.error('Tracking error:', error);
      }
    }, 30000);

    this.trackingIntervals.set(deliveryId, interval);
  }

  stopTracking(deliveryId) {
    const interval = this.trackingIntervals.get(deliveryId);
    if (interval) {
      clearInterval(interval);
      this.trackingIntervals.delete(deliveryId);
      console.log(`Stopped tracking for delivery ${deliveryId}`);
    }
  }

  async initializeDriverPosition(driverId) {
    const basePosition = {
      lat: 6.9271 + (Math.random() - 0.5) * 0.1, // Colombo area with variation
      lng: 79.8612 + (Math.random() - 0.5) * 0.1,
      lastUpdated: new Date()
    };
    this.simulatedDrivers.set(driverId, basePosition);
    return basePosition;
  }

  async simulateMovement(driverId) {
    const currentPosition = this.simulatedDrivers.get(driverId) || 
                           await this.initializeDriverPosition(driverId);
    
    const newPosition = {
      lat: currentPosition.lat + (Math.random() - 0.5) * 0.001,
      lng: currentPosition.lng + (Math.random() - 0.5) * 0.001,
      lastUpdated: new Date(),
      speed: 30 + Math.random() * 50, // km/h
      heading: Math.random() * 360 // degrees
    };
    
    this.simulatedDrivers.set(driverId, newPosition);
    return newPosition;
  }

  async getCurrentLocation(driverId) {
    return this.simulatedDrivers.get(driverId) || 
           await this.initializeDriverPosition(driverId);
  }

  async updateDeliveryLocation(deliveryId, location) {
    try {
      await Delivery.findByIdAndUpdate(deliveryId, {
        geolocation: location
      });
    } catch (error) {
      console.error('Error updating delivery location:', error);
    }
  }

  async calculateETA(deliveryId) {
    try {
      const delivery = await Delivery.findById(deliveryId);
      if (!delivery || !delivery.geolocation) {
        return 45; 
      }

      const baseETA = 30; // minutes
      const trafficFactor = 1 + Math.random() * 0.5; // 1.0 to 1.5
      const progressFactor = delivery.status === 'In Transit' ? 0.3 : 1.0;
      
      return Math.round(baseETA * trafficFactor * progressFactor);
    } catch (error) {
      console.error('Error calculating ETA:', error);
      return 45;
    }
  }

  //distance between two coordinates
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in km
  }

  toRad(degrees) {
    return degrees * (Math.PI / 180);
  }

  //active trackings
  getActiveTrackings() {
    return Array.from(this.trackingIntervals.keys());
  }
}

module.exports = new GeolocationService();