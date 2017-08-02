var express = require('express');
var app = express();
var http = require('http').Server(app);
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var mongoStore = require('connect-mongo')(session);
var methodOverride = require('method-override');
var path = require('path');
var fs = require('fs');
var logger = require('morgan');

//setting up port by environment variable so that it not only runs on defined default port but whatever you define in terminal by PORT=yourport node server.js
var port = process.env.PORT || 5000;

// including socket.io chat config file
require('./libraries/socketchat.js').sockets(http);

app.use(logger('dev'));//morgan method to give out colored outputs in terminal

//db connection setup
var dbpath = "mongodb://localhost/socketchat";
mongoose.connect(dbpath);
mongoose.connection.once('open', function () {
    console.log("Successfully connected to database");
});

//method override setup. By this, we can use keywords like put, delete to do stuff like deleting passwords.
app.use(methodOverride(function (req, res) {
    if (req.body && typeof req.body === 'object' && '_method' in req.body) {
        var method = req.body._method;
        delete req.body._method;
        return method;
    }
}));

//setting up session
var sessionInit = session({
    name: 'userCookie',
    secret: 'chatsecret',
    resave: true,
    httpOnly: true,
    saveUninitialized: true,
    store: new mongoStore({ mongooseConnection: mongoose.connection }),
    cookie: { maxAge: 80 * 80 * 800 }
});

app.use(sessionInit);

//calling public folder and setting them static(https://expressjs.com/en/starter/static-files.html)
app.use(express.static(path.resolve(__dirname, './public')));

//calling views folder and setting ejs(https://expressjs.com/en/guide/using-template-engines.html)
app.set('views', path.resolve(__dirname, './app/views'));
app.set('view engine', 'ejs');

//bodyparser and cookie parser middlewares
app.use(bodyParser.json({ limit: '10mb', extended: true }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));
app.use(cookieParser());

//including models
fs.readdirSync("./app/models").forEach(function (file) {
    if (file.indexOf(".js")) {
        require("./app/models/" + file);
    }
});

//calling controllers
fs.readdirSync("./app/controllers").forEach(function (file) {
    if (file.indexOf(".js")) {
        var route = require("./app/controllers/" + file);
        route.controller(app);
    }
});

//404 error
app.use(function (req, res) {
    res.status(404).render('message',
        {
            title: "404",
            msg: "Page not found",
            status: 404,
            error: "",
            user: req.session.user,
            chat: req.session.chat
        });
});

//application level middleware for logged in user
var userModel = mongoose.model('User');
app.use(function (req, res, next) {
    if (req.session && req.session.user) {
        userModel.findOne({ 'email': req.session.user.email }, function (err, user) {
            if (user) {
                req.user = user;
                delete req.user.password;
                req.session.user = user;
                delete req.session.user.password;
                next();
            }
        });
    }
    else {
        next();
    }
});

http.listen(port, function () {
    console.log("App started at port: " + port);
});