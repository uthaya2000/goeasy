const express = require('express')
const app = express.Router();
const Razorpay = require('razorpay')
const middlewares = require('../middlewares/auth')
const Customerlog = require('../models/cus_log')
const Cycle = require('../models/cycle')
const instance = new Razorpay({
    key_id: process.env.RAZER_KEY,
    key_secret: process.env.RAZER_SECRET,
});

app.post("/api/payment/order", middlewares.isLoggedIn, (req, res) => {
    params = req.body.params;
    instance.orders
        .create(params)
        .then((data) => {
            res.send({ sub: data, status: "success" });
        })
        .catch((error) => {
            res.send({ sub: error, status: "failed" });
        });
});


app.post('/save/unlock', async(req, res) => {
    var params = req.body.params;
    var currentDate = new Date()
    var min = Number(params.time) * 60;
  
    var date = new Date(currentDate.getTime() + min * 60000);
    
    const cycle = await Cycle.findOne({ cycle_id: params.cycle_id })
    cycle.islocked = false;
    await cycle.save();
    var data = {
        user: req.user._id,
        username: req.user.firstname + " " + req.user.lastname,
        phone: req.user.phonenum,
        email: req.user.email,
        cycleid: params.cycle_id,
        rent: params.amount / 100,
        time: date,
        paymentid: params.payment_id,
        orderid: params.order_id,
        signature: params.signature
    }
    const log = await Customerlog.create(data)
    if (log)
        res.json({ msg: 'success' });
    else
        res.json({ msg: 'failure' });
})

module.exports = app;