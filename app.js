require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const findOrCreate = require("mongoose-findorcreate");
const e = require('express');
const FacebookStrategy = require('passport-facebook').Strategy;
const time = new Date();
var id = "";
const app = express();
var jobid = "";
var success = "";
var type;

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

mongoose.connect("mongodb://localhost:27017/myDB",{useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false });

const postSchema = new mongoose.Schema({
  name: String,
  description: String,
  company: String,
  jobType: String,
  salary: String,
  location: String,
  appliedUsers: [String]
});

const educationSchema = new mongoose.Schema({
  university: String,
  degree: String,
  specialization: String,
  startyr: Number,
  endyr: Number,
  cgpa: Number,
  adegree:[String]
});

const profiledSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  dob: Date,
  doj: String,
  country:String,
  state: String,
  city: String,
  address:String,
  git:String,
  skills: [String],
  bio: String,
  education: educationSchema,
  experience: String
});

const profilecSchema = new mongoose.Schema({
  name: String,
  doe: Date,
  doj: String,
  address: String,
  website: String,
  bio: String
});

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  accountType: String,
  post:[postSchema],
  profiled: profiledSchema,
  profilec: profilecSchema
});

userSchema.plugin(passportLocalMongoose, {usernameField: "email"});
userSchema.plugin(findOrCreate);

const User = mongoose.model('users', userSchema);
const Post = mongoose.model('posts', postSchema);
const Profiled = mongoose.model('profiled', profiledSchema);
const Education = mongoose.model('education', educationSchema);
const Profilec = mongoose.model('profilec', profilecSchema);

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
    User.findOrCreate({ email: emailaddress}, function (err, user,wasCreated) {
      if(wasCreated) success = "/signup-choice";
      else success = "/dashboard-home";
      id = user._id;
      console.log(user);
      return cb(err, user);
    });
  }
));

app.get('/auth/google',
  passport.authenticate('google', { scope: ['email'] }));

app.get('/auth/google/secrets', 
  passport.authenticate('google', {
    successRedirect: success,
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
    User.findOrCreate({email: emailaddress}, function(err, user,wasCreated) {
      if(wasCreated) success = "/signup-choice";
      else success = "/dashboard-home";
      id = user._id;
        if (err) { return done(err); }
      done(null, user);
    });
  }
));

app.get('/auth/facebook', passport.authenticate('facebook',{scope: ["email"]}));

app.get('/auth/facebook/callback',
  passport.authenticate('facebook', { successRedirect: success ,failureRedirect: '/login' }));

app.get("/",function(req,res){
    if(req.isAuthenticated()) res.redirect("dashboard-home");
    else res.render("index");
});

app.get("/login",function(req,res){
    if(req.isAuthenticated()) res.redirect("dashboard-home");
    else res.render("login");
});

app.get("/signup",function(req,res){
    if(req.isAuthenticated()) res.redirect("dashboard-home");
    else res.render("signup");
});

app.get("/dashboard-home",function(req,res){
    if(req.isAuthenticated()) {
      User.findById(id,function(err,result){
        if(result.accountType)
        res.render("dashboard-home",{profile: result.profiled, user:result, post: result.post});
        else
        res.render("dashboard-company-home",{profile: result.profiled, user:result, post: result.post});
      });
    }
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
    else res.redirect("/login");
});

app.get("/job-search-page",function(req,res){
  if(req.isAuthenticated()) {
  Post.find({},function(err,result){
    res.render("job-search-page",{post: result});
  });    
}
  else res.redirect("login");
});

app.get("/job-view",function(req,res){
  if(req.isAuthenticated()) {
  Post.findById(jobid,function(err,result){
    res.render("job-view",{type:type, job: result});
  });}
  else res.redirect("/login");
});

app.get("/edit-profile-developer",function(req,res){
  if(req.isAuthenticated()&&type){
    res.render("edit-profile-developer");
  }
  else res.redirect("/dashboard-home");
});

app.get("/edit-profile-company",function(req,res){
  if(req.isAuthenticated()&&(!type)){
    res.render("edit-profile-company");
  }
  else res.redirect("/dashboard-home");
});

app.get("/logout", function(req, res){
  req.logout();
  res.redirect("/");
});

app.get("/:test", function(req, res){
if(req.isAuthenticated())
  res.render(req.params.test);
else
res.redirect("/")
});

app.post("/signup-choice",function(req,res){
  type = req.body.accountType;
  User.findById(id,function(err,result){
    result.accountType = type;
    result.save();
  } );
  console.log(id);
  if(type) res.redirect("/signup-create-profile");
  else res.redirect("signup-create-profile-company");
});


app.post("/login",function(req,res){
   const emailid = dotr(req.body.email);
    const user = new User({
        email: emailid,
        password: req.body.password
    });
    User.findOne({email: emailid},function(err,result){
      if(err || result == null){
        res.redirect("/login");
      }
      else id=result._id;
    });
    req.login(user,function(err){
        if(err){
            console.log(err);
            res.redirect("/login");
        }
        else{
            passport.authenticate("local")(req, res, function(){
                res.redirect("/dashboard-home");
            });
        };
    });
});

app.post("/signup",function(req,res){
    const emailaddress = dotr(req.body.email);
    User.register({email: emailaddress}, req.body.password, function(err, user){
        id = user._id;
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

app.post("/create-profile",function(req,res){
  const options={
    year:"numeric",
    day:"numeric",
    month:"long"
};

let day=time.toLocaleDateString("en-US",options);

  const newprofiled = new Profiled({
  firstName: req.body.first_name,
  lastName: req.body.last_name,
  doj: day,
  dob: req.body.dob,
  country: req.body.country,
  state: req.body.state,
  city: req.body.city,
  address: req.body.address,
  git: req.body.githubusername,
  skills: req.body.skills.split(","),
  bio: req.body.bio
  });

  User.findById(id, function(err,result){
    result.profiled = newprofiled;
    result.save();
    res.redirect("/signup-add-education");
  });
});

app.post("/signup-add-education",function(req,res){
  const newEducation = new Education({
  university: req.body.college_university,
  degree: req.body.degree,
  specialization: req.body.Specialization,
  startyr: req.body.start_year,
  endyr: req.body.end_year,
  cgpa: req.body.cgpa,
  adegree: req.body.adegree.split(",")
  });

  User.findById(id,function(err,result){
    result.profiled.education = newEducation;
    result.save();
    res.redirect("/signup-add-experience");
  });
});

app.post("/signup-add-experience",function(req,res){
  User.findByIdAndUpdate(id,{experience: req.body.bio});
    res.redirect("/dashboard-home");
});

app.post("/signup-create-profile-company",function(req,res){
  const options={
    year:"numeric",
    day:"numeric",
    month:"long"
};

let day=time.toLocaleDateString("en-US",options);

  const newprofilec = new Profilec({
  name: req.body.company_name,
  doj: day,
  doe: req.body.doe,
  address: req.body.company_address,
  website: req.body.company_website,
  bio: req.body.bio
  });

  User.findById(id, function(err,result){
    result.profilec = newProfilec;
    result.save();
  });
});

app.post("/post-a-job",function(req,res){
  const newPost = new Post({
  name: req.body.title,
  description: req.body.descrition,
  company: req.body.company,
  jobType: req.body.job_type,
  location: req.body.location,
  salary: req.body.salary
  });

  User.findById(id,function(err,result){
    result.post.push(newPost);
    result.save();
    newPost.save();
  });
});

app.post("/job-view",function(req,res){
  jobid=req.body.jobid;
  res.redirect("/job-view");
});

app.post("/apply",function(req,res){
  jobid = req.body.jobid;
  Post.findById(jobid,function(err,result){
    result.appliedUsers.push(id);
    result.save();
  });
  res.redirect("/dashboard-home");
});

app.post("delete-a-job",function(req,res){
  Post.deleteOne({_id:jobid});
  res.redirect("/dashboard-home")
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