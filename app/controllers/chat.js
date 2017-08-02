var express = require('express');
var router = express.Router();
var authentication = require('../../middlewares/authentication.js');

module.exports.controller = function (app) {
    //routing for chat
    app.get('/chat', authentication.checkLogin, function (req, res) {
        res.render('chat',
            {
                title: "Chat",
                user: req.session.user,
                chat: req.session.chat
            });
    });

    app.use(router);
}