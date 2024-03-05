// models/ChatUser.js
const mongoose = require('mongoose');

const chatUserSchema = new mongoose.Schema({
  userEmail: { type: String, unique: true },
  userGender: String,
  userCollege: String,
  preferredGender: String,
  preferredCollege: String,
  isPaired: Boolean,
  room: String,
  pairedSocketId: String,
  userSocketId: String,
  pairingInProgress: { type: Boolean, default: false },
});

const ChatUser = mongoose.model('ChatUser', chatUserSchema);

module.exports = ChatUser;
