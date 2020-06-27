const express = require('express')
const multer = require('multer')
const sharp = require('sharp')
const User = require('../models/user')
const auth = require('../middleware/auth')
const sendEmail = require('../email/account')
const router = new express.Router()


router.post('/users', async (req, res) => {
    const user = new User(req.body)
    try {

        await user.save()
        sendEmail.sendWelcomeEmail(user.email, user.name)
        const token = await user.generateAuthToken();
        res.status(201).send({user, token})
    } catch (e) {
        res.status(400).send(e)
    }
})

router.post('/users/login', async (req, res) => {
    try {

        console.log("ok--")
        console.log(req.body)
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken();

        console.log(user)
        console.log(token)
        res.status(200).send({user, token})
    } catch (e) {
        console.log(e)
        res.status(400).send({"message": "wrong email or password"})
    }
})

router.post('/users/logout', auth, async (req, res) => {
    try {
        console.log("token :: ")
        console.log(req.token)
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token;
        })
        await req.user.save()
        return res.status(200).send({"message": "successfully logout"})
    } catch (e) {
        console.log(e);
        res.status(500).send({"message": "logout unsuccessful.something wrong..."})
    }
})


router.post('/users/logoutAll', auth, async (req, res) => {
    try {
        console.log("token :: ")
        console.log(req.token)
        req.user.tokens = []
        await req.user.save()
        return res.status(200).send({"message": "successfully logout"})
    } catch (e) {
        console.log(e);
        res.status(500).send({"message": "already logout"});
    }
})
router.get('/users/me', auth, async (req, res) => {
    try {
        res.send(req.user)
    } catch (e) {
        res.status(500).send()
    }
})
router.get('/users', auth, async (req, res) => {
    try {
        console.log("from router ")
        const users = await User.find({})
        res.send(users)
    } catch (e) {
        res.status(500).send()
    }
})

router.patch('/users/update/me', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['name', 'email', 'password', 'age']
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

    if (!isValidOperation) {
        return res.status(400).send({error: 'Invalid updates!'})
    }

    try {

        updates.forEach((update) => req.user[update] = req.body[update])
        await req.user.save()
        res.send(req.user)
    } catch (e) {
        res.status(400).send(e)
    }
})

router.delete('/user/delete/me', auth, async (req, res) => {
    try {
        //const user = await User.findByIdAndDelete(req.user.id)
        req.user.remove();
        sendEmail.sendCancelEmail(req.user.email, req.user.name)
        res.send(req.user)
    } catch (e) {
        res.status(500).send({"message": "not deleted"})
    }
})


const upload = multer({
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb(new Error('Please upload an image'))
        }

        cb(undefined, true)
    }
})

router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
    const buffer = await sharp(req.file.buffer).resize({width: 250, height: 250}).png().toBuffer()
    req.user.avatar = buffer
    await req.user.save()
    res.send({"message": "image upload successfully"})
}, (error, req, res, next) => {
    res.status(400).send({error: error.message})
})

router.delete('/users/me/avatar', auth, async (req, res) => {
    req.user.avatar = undefined
    await req.user.save()
    res.send({"message": "image delete successfully"})
})

router.get('/users/avatar', auth, async (req, res) => {
    try {
        //const user = await User.findById(req.params.id)
        const user = req.user

        if (!user || !user.avatar) {
            throw new Error("no image found")
        }

        res.set('Content-Type', 'image/png')
        res.send(user.avatar)
    } catch (e) {
        res.status(404).send({"message": "no image found"})
    }
})


module.exports = router