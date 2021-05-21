const mongoose = require('mongoose');

const log_schema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users'
    },
    username: {
        type: String
    },
    email: {
        type: String
    },
    phone: {
        type: String
    },
    cycleid: {
        type: String
    },
    rent: {
        type: Number
    },
    time: {
        type: Date
    },
    paymentid: {
        type: String,
        required: true
    },
    orderid: {
        type: String,
        required: true
    },
    signature: {
        type: String,
        required: true
    },
    extracharges: {
        type: Boolean,
        default: true
    },
    islocked: {
        type: Boolean,
        default: false
    },
    images: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'images',
        default: undefined
    }
})

module.exports = mongoose.model('Customerlog', log_schema)