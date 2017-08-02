var mongoose=require('mongoose');

//checked if he is logged in.if not,redirect to login page else next function
module.exports.checkLogin=function(req,res,next){
    if(!req.user && !req.session.user){
        res.redirect('/user/login');
    }
    else{
        next();
    }
};

//what happens if he is logged in
module.exports.loggedIn=function(req,res,next){
    if(!req.user && !req.session.user){
        next();
    }
    else{
        res.redirect('/chat');
    }
};