const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    balance: { type: Number, default: 1000 },
    lastBet: {
        channelId: { type: String, default: null },
        bet: { type: String, default: null },
        amount: { type: Number, default: 0 },
    },
});

module.exports = mongoose.model('User', userSchema);
