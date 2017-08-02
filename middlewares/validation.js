var mongoose = require('mongoose');
var userModel = mongoose.model('User');

//router level middleware to check if user is existing
module.exports.emailExisting = function (req, res, next) {
    userModel.findOne({ 'email': req.body.email }, function (err, result) {
        if (err) {
            res.render('message',
                {
                    title: "Error",
                    msg: "Some error occured",
                    status: 500,
                    error: err,
                    user: req.session.user
                });
        }
        else if (result) {
            res.render('message',
                {
                    title: "Error",
                    msg: "User Exists",
                    status: 500,
                    error: "",
                    user: req.session.user
                });
        }
        else {
            next();
        }
    });
};