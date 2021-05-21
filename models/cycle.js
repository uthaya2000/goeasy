const mongoose = require('mongoose');

const cycle_schema = new mongoose.Schema({
    cycle_id: {
        type: String,
    },
    islocked: {
        type: Boolean,
        default: true
    }
})

module.exports = mongoose.model('Cycle', cycle_schema);