const { genSaltSync, hashSync, compareSync} = require("bcrypt");
const { spawn } = require("child_process");
const path = require("path");
const { 
    create, 
    getUsers, 
    getUserByUserId, 
    updateUser, 
    deleteUser, 
    getUserByUsername, 
    getUserRatingByUsername,
    getJoinDate,
    getCountWhiteGames,
    getCountBlackGames,
    getCountWins,
    getCountLosses,
    insertuvb,
    getUserIdByUsername,
    insertFeedbackByUserId
} = require("./user.service");

module.exports = {
    createUser: (req, res) => {
        //Extract password from body, hash and salt it
        const body = req.body;
        const salt = genSaltSync(10);
        body.password = hashSync(body.password, salt);

        //This callback is passed to create below, and is called in the pool.query method
        let callBack = function (err, results) {
            if(err) {
                console.log(err);
                return res.status(500).json({
                    success: 0,
                    message: "Database connection error"
                });
            }
            return res.status(200).json({
                success: 1,
                data: results
            });
        };

        create(body, callBack);
    },

    login: (req, res) => {
        const body = req.body;

        let callBack = function (error, results) {
            if(error) {
                console.log(error);
                return;
            }
            if(!results) {
                return res.json({
                    success: 0,
                    message: "Invalid username or password"
                });
            }
            const result = compareSync(body.password, results.password);
            if(result) {
                req.session.userName = body.username;
                return res.redirect("/ChessWebsite/home");
            }
            else {
                return res.json({
                    success: 0,
                    message: "Invalid username or password"
                });
            }
        };
        
        getUserByUsername(body.username, callBack);
    },

    sendProfileDetails: async (req, res) => {
        const name = req.session.userName;

        try {
            let rating = await getUserRatingByUsername(name);
            let joinDate = await getJoinDate(name);
            joinDate = joinDate.toString().slice(4, 15);
            let whiteGames = await getCountWhiteGames(name);
            let blackGames = await getCountBlackGames(name);
            let wins = await getCountWins(name);
            let losses = await getCountLosses(name);   

            let details = {
                userName: name,
                rating,
                joinDate,
                whiteGames,
                blackGames,
                wins,
                losses,
            };

            res.render("profile", details);

        } catch (error) {
            console.log(error);
            return res.render("profile", { error: "something went wrong when fetching profile data" });
        }
    },

    saveFeedback: async (req, res) => {
        const feedbackContent = req.body.feedbackContent;
        const name = req.session.userName;

        let date = new Date();
        let dateString = new Date(date.getTime() - (date.getTimezoneOffset() * 60000 )).toISOString().split("T");
        date = dateString[0];
        let time = dateString[1].slice(0, -5); //remove milliseconds and Z specifier

        const userId = await getUserIdByUsername(name);

        const feedbackDetails = {
            content: feedbackContent,
            date,
            time
        };
        
        await insertFeedbackByUserId(userId, feedbackDetails);

        res.redirect('/ChessWebsite/home');
    },
    
    gameover: (req, res) => {
        const body = req.body;
        let callback = function (error, results) {
            if(error) {
                console.log(error);
                return;
            }
            if(!results) {
                return res.json({
                    success: 0,
                    message: "Missing required Parameters"
                });
            }
            if(results){
                console.log("saved into database");
            }
        };

        insertuvb(body, callback);
    },

    sendFen: (req, res) => {
        // Validate input parameters
        if (!req.file) {
            return res.status(400).send("No image uploaded.");
        }

        // Path of the uploaded image
        const imagePath = req.file.path;
        console.log('Received image for processing:', imagePath);
    
        // Execute Python script using child process
        const pythonProcess = spawn('python', ['preprocess.py', imagePath]);

        // Capture stdout data
        let predictedFen = '';
        pythonProcess.stdout.on('data', (data) => {
            predictedFen += data.toString();
        });

        // Handle process exit
        pythonProcess.on('close', (code) => {
            if (code === 0) {
                // Assuming Python script returns predicted FEN as stdout
                predictedFen = predictedFen.trim(); // Trim whitespace
                console.log('Predicted FEN:', predictedFen);
                res.send(predictedFen); // Send predicted FEN back to client
            } else {
                console.error('Python script execution failed with code:', code);
                res.status(500).send("Error processing image.");
            }
        });
    },

    signUp: (req, res) => {
        /*Extract password from body, hash and salt it*/
        const body = req.body;
        const salt = genSaltSync(10);
        const plainTextPassword = body.password;
        body.password = hashSync(body.password, salt);

        /*Add join date to save*/
        let date = new Date();
        let dateString = new Date(date.getTime() - (date.getTimezoneOffset() * 60000 )).toISOString().split("T");
        body.joinDate = dateString[0];

        /*This callback is passed to create below, and is called in the pool.query method*/
        let callBack = function (err, results) {
            if(err) {
                console.log(err);
                return res.status(500).json({
                    success: 0,
                    message: "Username taken. Choose another username please."
                });
            }
            req.body.password = plainTextPassword;
            return module.exports.login(req, res);
        };

        create(body, callBack);
    },

    logout: (req, res) => {
        req.session.destroy((err) => {
            if(err) throw err;
            res.redirect("/ChessWebsite");
        });
    },

        // getUserByUserId: (req, res) => {
    //     const id = req.params.id;

    //     let callback = function (err, results) {
    //         if(err) {
    //             console.log(err);
    //             return;
    //         }
    //         if(!results) {
    //             return res.json({
    //                 success: 0,
    //                 message: "Record not found"
    //             });
    //         }
    //         return res.json({
    //             success: 1,
    //             data: results
    //         });
    //     };

    //     getUserByUserId(id, callback);
    // },

    // getUsers: (req, res) => {
    //     let callback = function (err, results) {
    //         if(err) {
    //             console.log(err);
    //             return;
    //         }
    //         if(!results) {
    //             return res.json({
    //                 success: 0,
    //                 message: "Table empty"
    //             });
    //         }
    //         return res.json({
    //             success: 1,
    //             data: results
    //         });
    //     };

    //     getUsers(callback);
    // },

    // updateUser: (req, res) => {
    //     const body = req.body;
    //     const salt = genSaltSync(10);
    //     body.password = hashSync(body.password, salt);

    //     let callback = function (err, results) {
    //         if(err) {
    //             console.log(err);
    //             return;
    //         }
    //         return res.json({
    //             success: 1,
    //             message: "Updated successfully"
    //         });
    //     };
        
    //     updateUser(body, callback);
    // },

    // deleteUser: (req, res) => {
    //     const body = req.body;

    //     let callback = function(err, results) {
    //         if(err) {
    //             console.log(err);
    //             return;
    //         }
    //         return res.json({
    //             success: 1,
    //             message: "Record deleted successfully"
    //         });
    //     };

    //     deleteUser(body, callback);
    // },
};