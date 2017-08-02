var express = require('express');
var mongoose = require('mongoose');

//invoking middleware
var authentication = require('../../middlewares/authentication.js');
var encryption = require('../../libraries/encryption.js');

var router = express.Router();
var userModel = mongoose.model('User');
module.exports.controller = function (app) {
    //login route
    router.get('/login', authentication.loggedIn, function (req, res) {
        res.render('login',
            {
                title: "User login",
                user: req.session.user,
                chat: req.session.chat
            });
    });

    //logout route
    router.get('/logout', function (req, res) {
        delete req.session.user;
        res.redirect('/user/login');
    });




    //login route
    router.post('/api/v1/login', authentication.loggedIn, function (req, res) {
        var encryptPassword = encryption.encryptPassword(req.body.password);
        userModel.findOne({ $and: [{ 'email': req.body.email }, { 'password': encryptPassword }] }, function (err, result) {
            if (err) {
                res.render('message',
                    {
                        title: "Error",
                        msg: "Some error in login",
                        status: 500,
                        error: err,
                        user: req.session.user,
                        chat: req.session.chat
                    });
            }
            else if (result == null || result == undefined || result == "") {
                res.render('message',
                    {
                        title: "Error",
                        msg: "User not found. Check username",
                        status: 404,
                        error: "",
                        user: req.session.user,
                        chat: req.session.chat
                    });
            }
            else {
                req.user = result;
                delete req.user.password;
                req.session.user = result;
                delete req.session.user.password;
                res.redirect('/chat');
            }
        });
    });

    app.use('/user', router);
}