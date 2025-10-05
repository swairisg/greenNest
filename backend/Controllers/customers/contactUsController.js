const Contact = require("../../Model/customers/contactUsModel");

const getAllContacts = async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    return res.status(200).json({ data: contacts ?? [] });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Server error" });
  }
};

const addContact = async (req, res) => {
  try {
    const { name, email, message } = req.body;
    const contact = new Contact({ name, email, message });
    await contact.save();

    return res.status(200).json({
      message: "Thank you for your message! We will get back to you soon.",
      contact,
    });
  } catch (err) {
    if (err.name === "ValidationError") {
      const errors = Object.fromEntries(
        Object.entries(err.errors).map(([k, v]) => [k, v.message])
      );
      return res.status(400).json({ message: "Validation failed", errors });
    }
    console.log(err);
    return res.status(500).json({ message: "Server error" });
  }
};

const getById = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);
    if (!contact) {
      return res.status(404).json({ message: "Contact message not available" });
    }
    return res.status(200).json({ contact });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Server error" });
  }
};

const updateContact = async (req, res) => {
  try {
    const { status } = req.body;
    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true, context: "query" }
    );
    if (!contact) {
      return res.status(404).json({ message: "Unable to update contact message" });
    }
    return res.status(200).json({ contact });
  } catch (err) {
    if (err.name === "ValidationError") {
      const errors = Object.fromEntries(
        Object.entries(err.errors).map(([k, v]) => [k, v.message])
      );
      return res.status(400).json({ message: "Validation failed", errors });
    }
    console.log(err);
    return res.status(500).json({ message: "Server error" });
  }
};

const deleteContact = async (req, res) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id);
    if (!contact) {
      return res.status(404).json({ message: "Unable to delete contact message" });
    }
    return res.status(200).json({
      message: "Contact message deleted successfully",
      contact,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Server error" });
  }
};

const getContactStats = async (req, res) => {
  try {
    const totalContacts = await Contact.countDocuments();
    const today = new Date();
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const recentContacts = await Contact.countDocuments({
      createdAt: { $gte: lastWeek },
    });

    return res.status(200).json({
      data: { total: totalContacts, recent: recentContacts, lastWeek },
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.getAllContacts = getAllContacts;
exports.addContact = addContact;
exports.getById = getById;
exports.updateContact = updateContact;
exports.deleteContact = deleteContact;
exports.getContactStats = getContactStats;
