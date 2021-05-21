const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose')
const UserSchema = new mongoose.Schema(
    {
        firstname: {
            required: [true, "First Name is neccesary"],
            type: String
        },
        lastname:{
            required: [true, "Last Name is neccesary"],
            type: String
        },
        email:{
            required: [true, "E-mail is neccesary"],
            unique: true,
            type: String
        },
        phonenum:{
            required: [true, "Phone Number is neccesary"],
            unique: true,
            type: String
        },
        gender:{
            required: [true, "Gender is neccesary"],
            type: String
        },
        dateofbirth:{
            type: Date,
            required: [true, "Date of Birth is neccesary"]
        },
        isAdmin:{
            type: Boolean,
            default: false
        },
        resetPasswordToken: String,
        resetPasswordExpires: Date
    }
)
UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', UserSchema);

