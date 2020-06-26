const jwt = require('jsonwebtoken')
const User = require('../models/user')


const auth = async (req, res, next) => {

    try {
        console.log("its from middleware");
        const token = req.header('Authorization')
        if (!token) {
            return res.status(401).send({"error": "please authenticate"})
        }
         console.log(token)
        const decoded = jwt.verify(token, 'secretDoNotOpen')
        console.log(decoded)
        const user = await User.findOne({_id: decoded._is, 'tokens.token': token})
        //   console.log(user)
        if (user === null) {
            console.log("no user found");
            return res.status(401).send({"error": "please authenticate or already logout"})
        }
        req.token = token
        req.user = user
        next()
    } catch (e) {
        console.log(e)
        res.status(401).send({"error": "please authenticate"})
    }
    //console.log("its from middleware");
    //  next();
}

module.exports = auth