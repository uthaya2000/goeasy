if (process.env.NODE_ENV !== 'production')
{
    require('dotenv').config()
}

const express = require('express');
const app = express()
const flash = require('connect-flash')
const path = require('path');
const userRoutes = require('./routes/userroutes');
const adminRoutes = require('./routes/adminRoutes');
const paymentRoutes = require('./routes/payment-gateway');
const mongoose = require('mongoose');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require('./models/user')
//DB connection
mongoose.connect('mongodb://localhost:27017/rentalCycles', {useUnifiedTopology: true , useNewUrlParser: true, useCreateIndex: true})
    .then(()=>{
        console.log("DB Connected");
    })
    .catch(err=>{
        console.log(err);
    })


app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json())
app.use(express.static(__dirname + "/public"))
const session = require("express-session")({
	secret: "Love Towards Travel",
	resave: false,
	saveUninitialized: false
});
app.use(session);
app.use(flash())
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy({usernameField: 'email',},User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next)=>{
    res.locals.curuser = req.user;
    res.locals.alert = req.flash('alert')
    next();
})

app.use(userRoutes);
app.use(adminRoutes);
app.use(paymentRoutes);

app.listen(4000, ()=>{
    console.log('user app server started...');
})