//calling modules and invoking event
var socketio = require('socket.io');
var mongoose = require('mongoose');
var events = require('events');
var _ = require('lodash');
var eventEmitter = new events.EventEmitter();

//database models
require('../app/models/user.js');
require('../app/models/chat.js');
require('../app/models/chatroom.js');

//using schema models
var userModel = mongoose.model('User');
var chatModel = mongoose.model('Chat');
var chatroomModel = mongoose.model('Chatroom');

//realtime chat
module.exports.sockets = function (http) {
    io = socketio.listen(http);

    //setting route of chat
    var ioChat = io.of('/chat');
    var userStack = {};
    var oldChats, sendUserStack, setchatroom;
    var userSocket = {};

    //socketio starts
    ioChat.on('connection', function (socket) {
        console.log("Chat connected succesfully");

        //getting username
        socket.on('setuserdata', function (username) {
            console.log(username + " logged in");

            //storing variable
            socket.username = username;
            userSocket[socket.username] = socket.id;
            socket.broadcast.emit('broadcast', { description: username + ' logged in' });

            //users list
            eventEmitter.emit('getallusers');

            //sending users list along with their status(online/offline)
            sendUserStack = function () {
                for (i in userSocket) {
                    for (j in userStack) {
                        if (j == i) {
                            userStack[j] = 'Online';
                        }
                    }
                }

                //connection message
                ioChat.emit('onlineStack', userStack);
            }
        });

        //setting chatroom
        socket.on('setchatroom', function (chatroom) {
            //leaving chatroom
            socket.leave(socket.chatroom);
            //chatroom data
            eventEmitter.emit('getchatroomdata', chatroom);
            //setting both chatroom and joining it
            setchatroom = function (chatroomID) {
                socket.chatroom = chatroomID;
                console.log("chatroomID: " + socket.chatroom);
                socket.join(socket.chatroom);
                ioChat.to(userSocket[socket.username]).emit('setchatroom', socket.chatroom);

            };

        });

        //event to read oldchatsinit from database
        socket.on('oldchatsinit', function (data) {
            eventEmitter.emit('readchat', data);
        });

        //emits event to read old chats from database.
        socket.on('oldchats', function (data) {
            eventEmitter.emit('readchat', data);
        });

        //sending older chats to user
        oldChats = function (result, username, chatroom) {
            ioChat.to(userSocket[username]).emit('oldchats', {
                result: result,
                chatroom: chatroom
            });
        }

        //'user typing' functionality
        socket.on('typing', function () {
            socket.to(socket.chatroom).broadcast.emit('typing', socket.username + " is typing..");
        });

        //showing chat
        socket.on('chatmsg', function (data) {
            //event to save chat in db
            eventEmitter.emit('savechat', {
                msgFrom: socket.username,
                msgTo: data.msgTo,
                msg: data.msg,
                chatroom: socket.chatroom,
                date: data.date
            });

            //event to send chat to all users
            ioChat.to(socket.chatroom).emit('chatmsg', {
                msgFrom: socket.username,
                msg: data.msg,
                date: data.date
            });
        });

        //disconnection message
        socket.on('disconnect', function () {
            console.log(socket.username + " logged out");
            socket.broadcast.emit('broadcast', { description: socket.username + ' logged out' });

            console.log('chat disconnected');
            _.unset(userSocket, socket.username);
            userStack[socket.username] = 'Offline';
            ioChat.emit('onlineStack', userStack);
        });

    });

    //saving chat into db
    eventEmitter.on('savechat', function (data) {
        var newChat = new chatModel({
            msgFrom: data.msgFrom,
            msgTo: data.msgTo,
            msg: data.msg,
            chatroom: data.chatroom,
            created: data.date
        });

        newChat.save(function (err, result) {
            if (err) {
                console.log("Error: " + err);
            }
            else if (result == undefined || result == null || result == "") {
                console.log("Chat not saved");
            }
            else {
                console.log("Chat saved");
            }
        });
    });

    //reading chat
    eventEmitter.on('readchat', function (data) {
        chatModel.find({})
            .where('chatroom').equals(data.chatroom)
            .sort('-created')
            .skip(data.msgCount)
            .lean()
            .limit(5)
            .exec(function (err, result) {
                if (err) {
                    console.log("Error: " + err);
                }
                else {
                    oldChats(result, data.username, data.chatroom);
                }
            });
    });

    //list of all users
    eventEmitter.on('getallusers', function () {
        userModel.find({})
            .select('username')
            .exec(function (err, result) {
                if (err) {
                    console.log("Error: " + err);
                }
                else {
                    for (var i = 0; i < result.length; i++) {
                        userStack[result[i].username] = "Offline";
                    }
                    sendUserStack();
                }
            });
    });

    eventEmitter.on('getchatroomdata', function (chatroom) {
        chatroomModel.find({
            $or: [{
                name1: chatroom.name1
            }, {
                name1: chatroom.name2
            }, {
                name2: chatroom.name1
            }, {
                name2: chatroom.name2
            }]
        }, function (err, result) {
            if (err) {
                console.log("Error: " + err);
            }
            else {
                if (result == "" || result == undefined || result == null) {
                    var today = Date.now();

                    newchatroom = new chatroomModel({
                        name1: chatroom.name1,
                        name2: chatroom.name2,
                        lastactive: today,
                        created: today
                    });
                    newchatroom.save(function (err, newResult) {
                        if (err) {
                            console.log("Error: " + err);
                        }
                        else if (newResult == "" || newResult == undefined || newResult == null) {
                            console.log("Some error in chatroom creation");
                        }
                        else {
                            setchatroom(newResult._id);
                        }
                    });
                }
                else {
                    var jsresult = JSON.parse(JSON.stringify(result));
                    setchatroom(jsresult[0]._id);
                }
            }
        });
    });


    //verifying unique usernames and email during signup
    var ioSignup = io.of('/signup');

    var checkUname, checkEmail; //declaring variables for function.

    ioSignup.on('connection', function (socket) {
        console.log("signup connected.");

        //verifying unique username.
        socket.on('checkUname', function (uname) {
            eventEmitter.emit('findUsername', uname); //event to perform database operation.
        });

        //emit event for checkUname.
        checkUname = function (data) {
            ioSignup.to(socket.id).emit('checkUname', data); //data can have only 1 or 0 value.
        };

        //verifying unique email.
        socket.on('checkEmail', function (email) {
            eventEmitter.emit('findEmail', email); //event to perform database operation.
        });

        //event for checkEmail.
        checkEmail = function (data) {
            ioSignup.to(socket.id).emit('checkEmail', data); //data can have only 1 or 0 value.
        };

        //on disconnection.
        socket.on('disconnect', function () {
            console.log("signup disconnected.");
        });

    });

    //event to find and check username.
    eventEmitter.on('findUsername', function (uname) {

        userModel.find({
            'username': uname
        }, function (err, result) {
            if (err) {
                console.log("Error : " + err);
            } else {

                if (result == "") {
                    checkUname(1); //send 1 if username not found.
                } else {
                    checkUname(0); //send 0 if username found.
                }
            }
        });

    });

    //event to find and check username.
    eventEmitter.on('findEmail', function (email) {

        userModel.find({
            'email': email
        }, function (err, result) {
            if (err) {
                console.log("Error : " + err);
            } else {

                if (result == "") {
                    checkEmail(1); //send 1 if email not found.
                } else {
                    checkEmail(0); //send 0 if email found.
                }
            }
        });

    });

    return io;
};