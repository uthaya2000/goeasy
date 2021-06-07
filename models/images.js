const mongoose = require('mongoose');

const image_schema = new mongoose.Schema({
    cycle_id: {
        type: String,
    },
    images: [
        {
            url: String,
            filename: String
        }
    ]
})

module.exports = mongoose.model('Image', image_schema)
