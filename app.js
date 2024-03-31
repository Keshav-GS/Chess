/*Imports*/
require("dotenv").config();
const express = require('express');
const userRouter = require("./RCS-logic/users/user.router");
const { setUpSession } = require("./auth/session");
const { Server } = require("socket.io");
const { listenSocket } = require("./RCS-logic/users/user.socket.controller");

/*Create server*/
const app = express();
const server = app.listen(process.env.APP_PORT, (req, res) => {
    console.log("Server up and running ON PORT", process.env.APP_PORT);
});
let io = new Server(server);

/*Use some middleware*/
app.set("view engine", "ejs");
app.use(express.static("./public")); 
app.use(express.json());
app.use(express.urlencoded({ extended: true })); /*To get username and password from body*/
app.use(setUpSession);

/*Routing code is defined in user.router file which is imported here as userRouter*/
app.use("/ChessWebsite", userRouter);

/*Use middleware for socket connection*/
io.engine.use(setUpSession);

/*Listen for events*/
listenSocket(io);

