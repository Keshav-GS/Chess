require("dotenv").config();
const session = require('express-session');

module.exports = {
    setUpSession: session({
        secret: process.env.SESSION_SECRET_KEY,
        resave: false,
        saveUninitialized: false,
        cookie: { 
            secure: false,
            maxAge: 1000 * 60 * 60 * 24
        }
    }),

    requireAuthentication: (req, res, next) => {
        if(req.session.userName) {
            return next();
        } 
        else {
            return res.json({
                success: 0,
                message: "Access denied. Unauthenticated user!"
            });
        }
    },
};