const mongoose = require("mongoose");
const { Schema } = mongoose;

const contactUsSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      maxlength: [100, "Name cannot be more than 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please fill a valid email address",
      ],
    },
    message: {
      type: String,
      required: [true, "Message is required"],
      trim: true,
      maxlength: [1000, "Message cannot be more than 1000 characters"],
    },
    status: {
      type: String,
      enum: ["new", "read", "closed", "replied"],
      default: "new",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ContactUs", contactUsSchema);
