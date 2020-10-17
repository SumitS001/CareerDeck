require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const findOrCreate = require("mongoose-findorcreate");
const FacebookStrategy = require('passport-facebook').Strategy;

const app = express();

app.set("view engine","ejs");
app.use(bodyParser.urlencoded({extended:true}));

app.use(express.static("public"));


app.use(session({
    secret: "SumitSingh",
    resave: false,
    saveUninitialized: true,
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/myDB",{useNewUrlParser: true, useUnifiedTopology: true});



const userSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String,
    accountType: Number
});

userSchema.plugin(passportLocalMongoose, {usernameField: "email"});
userSchema.plugin(findOrCreate);

const User = new mongoose.model("users",userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
    done(null, user.id);
});
  
passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    var emailaddress = dotr(profile.emails[0].value);
    User.findOrCreate({ email: emailaddress}, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get('/auth/google',
  passport.authenticate('google', { scope: ['email'] }));

app.get('/auth/google/secrets', 
  passport.authenticate('google', {
    successRedirect: "/dashboard",
    failureRedirect: '/login',
    failureFlash: "Invalid username or password"}),
  function(req, res) {
    // Successful authentication, redirect home.
});


passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/callback",
    profileFields: ['id', 'email']
  },
  function(accessToken, refreshToken, profile, done) {
    var emailaddress = dotr(profile.emails[0].value);
    User.findOrCreate({email: emailaddress}, function(err, user) {
      console.log(profile);
        if (err) { return done(err); }
      done(null, user);
    });
  }
));

app.get('/auth/facebook', passport.authenticate('facebook',{scope: ["email"]}));

app.get('/auth/facebook/callback',
  passport.authenticate('facebook', { successRedirect: '/dashboard',failureRedirect: '/login' }));

app.get("/",function(req,res){
    if(req.isAuthenticated()) res.render("dashboard");
    else res.render("index");
});

app.get("/login",function(req,res){
    if(req.isAuthenticated()) res.render("dashboard");
    else res.render("login");
});

app.get("/signup",function(req,res){
    if(req.isAuthenticated()) res.render("dashboard");
    else res.render("signup");
});

app.get("/dashboard",function(req,res){
    if(req.isAuthenticated()) res.render("dashboard");
    else res.render("login");
});

app.get("/about-us",function(req,res){
  res.render("about-us");
});

app.get("/contact-us",function(req,res){
  res.render("contact-us");
});

app.get("/signup-choice",function(req,res){
  if(req.isAuthenticated()) res.render("signup-choice");
    else res.render("login");
});

app.post("/login",function(req,res){
    const user = new User({
        email: req.body.email,
        password: req.body.password
    });
    req.login(user,function(err){
        if(err){
            console.log(err);
            res.redirect("/login");
        }
        else{
            passport.authenticate("local")(req, res, function(){
                res.redirect("/dashboard");
            });
        };
    });
});

app.post("/signup",function(req,res){
    const emailaddress = dotr(req.body.email);
    User.register({email: emailaddress}, req.body.password, function(err, user){
        if(err){
            console.log(err);
            res.redirect("/signup");
        }
        else{
            passport.authenticate("local")(req, res, function(){
                res.redirect("/signup-choice");
            });
        };
    });
});

app.get("/logout", function(req, res){
    req.logout();
    res.redirect("/");
});



app.listen(3000,function(){
    console.log("Server Started");
})


function dotr(name){
    var str = name.split('@');
    str[0] = str[0].replace(/\./g, "");
    name = str[0] + "@" + str[1];
    return name;
}