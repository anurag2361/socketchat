var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var userSchema = new Schema({
    userID: { type: String, default: "", required: true },
    username: { type: String, default: "", required: true },
    email: { type: String, default: "", required: true },
    password: { type: String, default: "", required: true },
    created: { type: Date, default: Date.now },
    updated: { type: Date, default: Date.now }
});
mongoose.model('User', userSchema);