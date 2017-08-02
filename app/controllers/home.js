var express = require('express');
var mongoose = require('mongoose');
var router = express.Router();
var userModel = mongoose.model('User');

module.exports.controller = function (app) {

    //home router
    router.get('/', function (req, res) {
        res.redirect('/user/login');
    });

    app.use(router);
}