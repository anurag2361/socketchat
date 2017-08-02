var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var chatSchema = new Schema({
    msgFrom: { type: String, default: "", required: true },
    msgTo: { type: String, default: "", required: true },
    msg: { type: String, default: "", required: true },
    chatroom: { type: String, default: "", required: true },
    created: { type: Date, default: Date.now }
});
mongoose.model('Chat', chatSchema);