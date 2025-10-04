const mongoose = require("mongoose");
const { Schema } = mongoose;

const productSchema = new Schema(
  {
    productName: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      minlength: [2, "Product name must be at least 2 characters long"],
      maxlength: [200, "Product name cannot exceed 200 characters"],
      validate: {
        validator: function(v) {
          return /^[a-zA-Z0-9\s\-&.,()]+$/.test(v);
        },
        message: "Product name can only contain letters, numbers, spaces, and basic punctuation"
      }
    },
    type: {
      type: String,
      required: [true, "Product type is required"],
      enum: {
        values: [
          "Flagship Section – Premium Strawberries",
          "Leafy Greens Section", 
          "Vegetables Section",
          "Flowering Plants Section",
          "Special Value Packs",
          "Value-Added Products Section"
        ],
        message: "Product type must be one of the allowed values"
      }
    },
    images: [{
      type: String, // Array for multiple images
      required: [true, "At least one product image is required"],
    //  validate: {
    //    validator: function(images) {
    //      if (!Array.isArray(images) || images.length === 0) return false;
          
    //      const urlRegex = /^(https?:\/\/.*\.(?:png|jpg|jpeg|gif|webp))$/i;
    //      return images.every(img => urlRegex.test(img));
    //    },
    //    message: "Images must be valid URLs pointing to image files (PNG, JPG, JPEG, GIF, WEBP)"
    //  }
    }],
    description: {
      type: String,
      required: [true, "Product description is required"],
      minlength: [10, "Description must be at least 10 characters long"],
      maxlength: [2000, "Description cannot exceed 2000 characters"],
      trim: true
    },
    category: {
      type: String,
      required: [true, "Product category is required"],
      enum: {
        values: ["Organic", "Seasonal", "Premium", "Regular"],
        message: "Category must be Organic, Seasonal, Premium, or Regular"
      }
    },
    basePrice: {
      type: Number,
      required: [true, "Base price is required"],
      min: [0.01, "Price must be greater than 0"],
      max: [10000, "Price cannot exceed 10,000"],
      validate: {
        validator: function(v) {
          return /^\d+(\.\d{1,2})?$/.test(v.toString());
        },
        message: "Price must be a valid number with up to 2 decimal places"
      }
    },
    tags: [{
      type: String,
      enum: {
        values: ["Organic", "Seasonal", "Limited Edition", "Premium", "Eco-Friendly", "New Arrival"],
        message: "Invalid tag provided"
      }
    }],
    isVisible: {
      type: Boolean,
      default: true
    },
    isArchived: {
      type: Boolean,
      default: false
    },
    stockQuantity: {
      type: Number,
      required: [true, "Stock quantity is required"],
      min: [0, "Stock quantity cannot be negative"],
      max: [100000, "Stock quantity cannot exceed 100,000"],
      validate: {
        validator: Number.isInteger,
        message: "Stock quantity must be an integer"
      }
    }
  },
  {
    timestamps: true,
  }
);

// Index for better search performance
productSchema.index({ category: 1, tags: 1, basePrice: 1, isVisible: 1 });
productSchema.index({ productName: "text", description: "text" });

module.exports = mongoose.model("ProductModel", productSchema);