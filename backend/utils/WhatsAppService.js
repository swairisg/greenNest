const twilio = require("twilio");
//const climateAlertService = require('./climateAlertService');

class WhatsAppService {
  constructor() {
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      this.client = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );
    } else {
      console.log(
        "Twilio credentials not found"
      );
      this.client = null;
    }
  }

  async sendLowStockAlert(item, currentStock, minStockLevel) {
    try {
      const message = `LOW STOCK ALERT\n\nItem: ${item.name}\nSKU: ${item.sku}\nCurrent Stock: ${currentStock}\nMinimum Required: ${minStockLevel}\n\nPlease reorder immediately.`;

      if (this.client) {
        await this.client.messages.create({
          body: message,
          from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
          to: `whatsapp:${process.env.MANAGER_PHONE_NUMBER}`,
        });
        console.log("WhatsApp low stock alert sent");
      } else {
        console.log("DEMO WhatsApp Message:", message);
      }
    } catch (error) {
      console.error("WhatsApp error:", error);
    }
  }

  async sendPOStatusUpdate(po, supplier) {
    try {
      const message = `PURCHASE ORDER UPDATE\n\nPO Number: ${po.poNumber}\nSupplier: ${supplier.companyName}\nStatus: ${po.status}\nTotal Amount: $${po.totalAmount}\n\nThank you for your business!`;

      await this.client.messages.create({
        body: message,
        from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
        to: `whatsapp:${supplier.phone}`,
      });

      console.log("WhatsApp PO update sent");
    } catch (error) {
      console.error("WhatsApp error:", error);
    }
  }

  async sendAlertNotification(phoneNumber, message) {
    try {
      if (this.client) {
        await this.client.messages.create({
          body: message,
          from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
          to: `whatsapp:${phoneNumber}`,
        });
        console.log("WhatsApp alert sent to:", phoneNumber);
      } else {
        console.log("DEMO WhatsApp Alert to", phoneNumber, ":", message);
      }

      return { success: true, message: "Alert notification sent" };
    } catch (error) {
      console.error("WhatsApp alert error:", error);
      return { success: false, error: error.message };
    }
  }
  // Send delivery update
  async sendDeliveryUpdate(delivery, driver) {
    try {
      const message = `DELIVERY UPDATE\n\nDelivery: ${delivery.deliveryNumber}\nDriver: ${driver.name}\nStatus: ${delivery.status}\nExpected Delivery: ${delivery.scheduledDeliveryTime}\n\nTrack your delivery in real-time.`;

      await this.client.messages.create({
        body: message,
        from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
        to: `whatsapp:${process.env.CUSTOMER_PHONE_NUMBER}`,
      });

      console.log("WhatsApp delivery update sent");
    } catch (error) {
      console.error("WhatsApp error:", error);
    }
  }
}

module.exports = new WhatsAppService();
