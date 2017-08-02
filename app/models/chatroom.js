var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var chatroomSchema = new Schema({
    name1: { type: String, default: "", required: true },
    name2: { type: String, default: "", required: true },
    members: [],
    lastactive: { type: Date, default: Date.now },
    created: { type: Date, default: Date.now }
});
mongoose.model('Chatroom', chatroomSchema);