var express = require('express');
var mongoose = require('mongoose');
var shortid = require('shortid');

//calling middlewares
var authentication = require('../../middlewares/authentication.js');
var validation = require('../../middlewares/validation.js');
var encryption = require('../../libraries/encryption.js');

var router = express.Router();
var userModel = mongoose.model('User');

module.exports.controller = function (app) {

    //routing singup
    router.get("/signup", authentication.loggedIn, function (req, res) {
        res.render('signup',
            {
                title: "User Signup",
                user: req.session.user,
                chat: req.session.chat
            });
    });

    //create new user
    router.post("/api/v1/signup", authentication.loggedIn, validation.emailExisting, function (req, res) {
        var today = Date.now();
        var id = shortid.generate();
        var encryptPass = encryption.encryptPassword(req.body.password);

        //creating user
        var newUser = new userModel({
            userID: id,
            username: req.body.username,
            email: req.body.email,
            password: encryptPass,
            created: today,
            updated: today
        });

        newUser.save(function (err, result) {
            if (err) {
                console.log(err);
                res.render('message',
                    {
                        title: "Error",
                        msg: "Some error in creation",
                        status: 500,
                        error: err,
                        user: req.session.user,
                        chat: req.session.chat
                    });
            }
            else if (result == undefined || result == null || result == "") {
                res.render('message',
                    {
                        title: "Empty",
                        msg: "User not created",
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