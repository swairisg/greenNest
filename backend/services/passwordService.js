const bcrypt = require("bcrypt");
const ROUNDS = 10;

exports.hashPassword = async (plain) => bcrypt.hash(plain, ROUNDS);
exports.comparePassword = async (plain, hash) => bcrypt.compare(plain, hash);
