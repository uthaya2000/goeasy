const express = require('express');
const passport = require('passport');
const { body, validationResult} = require('express-validator')
const app     = express.Router();
const User = require("../models/user")
const auth = require('../middlewares/auth');
const Cycle = require('../models/cycle')
const async = require('async')
const nodemailer = require('nodemailer')
const crypto = require('crypto');
const Cus_log = require('../models/cus_log');
const multer = require('multer');
const {storage } = require('../cloudinary')
const upload = multer({ storage })
const Image = require('../models/images')

//home
app.get('/' , auth.isLoggedIn, async(req, res)=>{
    res.render("home");
})


//Scanner
app.get("/scanner",auth.isLoggedIn, (req, res)=>{
    res.render('scanner');
})

//signup
app.get("/signup", (req, res) => {
    
    res.render('signup', {alerts : []});
})

app.post("/signup", [
    body('firstname', 'FirstName is required').not().isEmpty(),
    body('lastname', 'Lastname is required').not().isEmpty(),
    body('password', 'Length should be atleast 5 character').not().isEmpty().isLength({min: 5}),
    body('email', 'E-mail is not valid').isEmail(),
    body('phone', 'Phone number is not valid').not().isEmpty().isLength({ min: 10 }),
    body('dateofBirth', 'Date of birth should not be empty').not().isEmpty(),
    body('role', 'Select User or Admin').not().isEmpty(),
    body('gender', 'Please Select Gender').not().isEmpty()
], (req, res) => {
    const errors = validationResult(req);
    var alerts = [];
    if (!errors.isEmpty())
    {
        alerts = errors.array()
        return res.render('signup', {alerts})
    }
    if(req.body.password != req.body.cpassword)
    {
        alerts.push({
            msg : "Password didn't match"
        })
        return res.render('signup', { alerts })
    }
    var data = {
        firstname: req.body.firstname,
        lastname: req.body.lastname,
        email: req.body.email,
        phonenum: req.body.phone,
        gender: req.body.gender,
        dateofbirth: req.body.dateofBirth,
        username: req.body.email
    }
    if(req.body.role === 'admin')
    {
        if( req.body.password === 'KEC_cycles123')
            data.isAdmin = true;
        else
        {
            alerts.push({
                msg: "You are not Admin"
            })
            return res.render('signup', { alerts })
        }
    }
    User.register(new User(data), req.body.password, function(err,user){
		if(err){
			console.log(err)
			return res.redirect("/signup")
		}
		passport.authenticate("local")
		(req,res,function(){
			res.redirect("/");
		})
	})

})


//login
app.get("/login", (req, res)=>{
    res.render('login' ,{alert: req.query.msg});
})

app.post("/login", passport.authenticate('local', { failureRedirect: '/login?msg=Incorrect Username or password' }), (req, res) => {
    req.flash("alert", "Welcome " + req.user.firstname);
    res.redirect("/");
})

app.get("/logout", (req, res)=>{
    req.logout();
    res.redirect("/login");
})

app.get('/contact', (req, res) => {
    res.render('contact')
})
//after scanning
app.get('/afterscanning/:id', auth.isLoggedIn, async(req, res) => {
    const data1 = await Cycle.findOne({ cycle_id: req.params.id })
    if (!data1) {
        req.flash('alert', 'Invalid cycleid')
        return res.redirect('/');
    }
    if (data1 && data1.islocked) {
        return res.render('rent', { cycleid: req.params.id, key: process.env.RAZER_KEY });
    }

    let curdate = new Date()
    let data = await Cus_log.findOne({cycleid: req.params.id, user: req.user._id, islocked: false})
    if (data.time < curdate && data.extracharges)
    {
        data.extracharges = true;
        await data.save();
        let diff = (curdate - data.time) / 1000;
        const hours = Math.floor(diff / 3600) % 24;
        if(hours > 0)
            return res.render('extra', {hours: hours, log: data._id, key: process.env.RAZER_KEY, cid: req.params.id})
        else
            return res.redirect('/upload/'+ data._id + '/' + req.params.id + '/')
    }
    else
    {
        data.extracharges = false;
        await data.save();
        return res.redirect('/upload/' + data._id + '/' + req.params.id + '/')
    }
})


app.post('/extra/:id/:cid/', auth.isLoggedIn, async(req, res) => {
    
    const data = await Cus_log.findById(req.params.id)
    data.rent = data.rent + req.body.params.amt;
    data.extracharges = false;
    await data.save()
    res.json({ msg: 'success' });
})


//upload image
app.get('/upload/:log_id/:cid/', auth.isLoggedIn, async(req, res) => {
    const data = await Cus_log.findById(req.params.log_id)
    res.render('uploadpic', {log_id: req.params.log_id, customer: data, cid: req.params.cid})
})

app.post('/upload/:log_id/:cid', auth.isLoggedIn, upload.array('images', 4), async(req, res) => {
    const data = {
        cycle_id: req.params.cid,
        images: req.files.map(f=>({url: f.path, filename: f.filename}))
    }
    const image = await Image.create(data)
    const log = await Cus_log.findById(req.params.log_id)
    log.islocked = true;
    log.images = image._id;
    await log.save();
    const cycle = await Cycle.findOne({ cycle_id: req.params.cid })
    cycle.islocked = true;
    await cycle.save()
    req.flash('alert', 'Cycle locked again thankyou for Using the app')
    res.redirect('/')
})


//forget password

app.get('/forget', (req, res) => {
    res.render('forget', {alerts: []})
})

app.post('/forget', (req, res) => {
    async.waterfall([
        function (done) {
            crypto.randomBytes(20, function (err, buf) {
                var token = buf.toString('hex');
                done(err, token);
            });
        },
        function (token, done) {
            User.findOne({ email: req.body.email }, function (err, user) {
                if (!user) {
                    let alerts = new Array()
                    alerts.push({
                        msg: "Email not registered"
                    })
                    return res.render('/forget', {alerts: alerts});
                }

                user.resetPasswordToken = token;
                user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

                user.save(function (err) {
                    done(err, token, user);
                });
            });
        },
        function (token, user, done) {
            var smtpTransport = nodemailer.createTransport({
                service: 'hotmail',
                auth: {
                    user: process.env.MAILID,
                    pass: process.env.MAILPASS
                }
            });
            var mailOptions = {
                to: user.email,
                from: process.env.MAILID,
                subject: 'Go easy Password Reset',
                text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
                    'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
                    'http://' + req.headers.host + '/reset/' + token + '\n\n' +
                    'If you did not request this, please ignore this email and your password will remain unchanged.\n'
            };
            smtpTransport.sendMail(mailOptions, function (err) {
                let alerts = new Array()
                alerts.push({
                    msg: "Email sent!!!"
                })
                res.render('forget', { alerts: alerts });
                done(err, 'done');
            });
        }
    ], function (err) {
        if (err) return next(err);
        res.redirect('/forget');
    });
})


//reset new password form

app.get('/reset/:token', function (req, res) {
    User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function (err, user) {
        if (!user) {
            return res.redirect('/forget');
        }
        res.render('reset', {
            token: req.params.token
        });
    });
});



app.post('/reset/:token', function (req, res) {
    async.waterfall([
        function (done) {
            User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function (err, user) {
                if (!user) {
                    let alerts = new Array()
                    alerts.push({
                        msg: "Token expired"
                    })
                    return res.redirect('back');
                }

                user.setPassword(req.body.password, (err) => {
                    user.resetPasswordToken = undefined;
                    user.resetPasswordExpires = undefined;

                    user.save(function (err) {
                        req.logIn(user, function (err) {
                            done(err, user);
                        });
                    });
                });
            });
        },
        function (user, done) {
            var smtpTransport = nodemailer.createTransport({
                service: 'hotmail',
                auth: {
                    user: process.env.MAILID,
                    pass: process.env.MAILPASS
                }
            });
            var mailOptions = {
                to: user.email,
                from: process.env.MAILID,
                subject: 'Your password has been changed',
                text: 'Hello,\n\n' +
                    'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
            };
            smtpTransport.sendMail(mailOptions, function (err) {
                done(err);
            });
        }
    ], function (err) {
        res.redirect('/');
    });
});




module.exports = app;