const express = require('express');
const app     = express.Router();
const qrcode = require('qrcode');
const auth = require('../middlewares/auth');
const Logs = require('../models/cus_log')
const Cycle = require('../models/cycle')
const { cloudinary } = require('../cloudinary');
const cus_log = require('../models/cus_log');
const Images = require('../models/images')

app.get("/generetor", auth.isLoggedIn, auth.isAdminUser,  (req, res)=>{
    res.render('qrform', {title: 'QR Code Generator', url: null, id: null});
})

app.post('/gen', auth.isLoggedIn, auth.isAdminUser,(req, res)=>{
    var id = req.body.cycleid;
    qrcode.toDataURL(id, async(err, url)=>{
        if (!err) {
            const data = await Cycle.create({ cycle_id: id, cost: 20 });
            res.render('qrform', {title: 'QR Code Generetor', url: url, id: id});
        }
    })
})

app.get('/logs', auth.isLoggedIn, auth.isAdminUser, async (req, res) => {
    const data = await Logs.find();
    res.render('logs', {customers: data})
})

app.get('/moredetails/:id/', auth.isLoggedIn, auth.isAdminUser, async (req, res) => {
    const data = await cus_log.findById(req.params.id)
    if (!data.images)
    {
       return res.render('moreinfo', { customer: data, images: [] })
    }
    const images = await Images.findById(data.images)
    res.render('moreinfo', {customer: data, images: images.images})
})

app.post('/delete/:id', async (req, res) => {
    const log = await cus_log.findById(req.params.id)
    const images = await Images.findById(log.images);
    if (images) {
        images.images.forEach(img => {
            cloudinary.uploader.destroy(img.filename);
        })
    }

    await cus_log.deleteOne({ _id: req.params.id });
    await Images.deleteOne({ _id: log.images });
    req.flash('alert', 'Successfully deleted')
    res.redirect('/')
})

module.exports = app;