const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    _id: {
        type: String
    },
    counter: {
        type: String,
        required: true
    },
    publicKey: {
        type: String,
        required: true
    },
    userID: {
        type: String,
        required: true
    }
})

const UserSchema = mongoose.model('userSchema', userSchema)
module.exports = UserSchema