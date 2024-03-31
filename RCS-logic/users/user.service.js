const pool = require("../../config/database");

module.exports = {
    create: (data, callBack) => {
        pool.query(
            `INSERT INTO USER(userName, password, joinDate, rating) VALUES(?, ?, ?, ?)`,
            [
                data.username,
                data.password,
                data.joinDate,
                1500
            ],
            (error, results, fields) => {
                if(error) {
                    return callBack(error);
                }
                return callBack(null, results);
            }
        );
    },

    getUserRatingByUsername: (name) => {
        return new Promise ((resolve, reject) => {
            pool.query(
                `SELECT rating FROM USER WHERE userName = ?`,
                [
                    name
                ],
                (error, results, fields) => {
                    if(error) reject(error);
                    resolve(results[0].rating);
                }
            );
        });
    },

    getJoinDate: (name) => {
        return new Promise((resolve, reject) => {
            pool.query(
                `SELECT joinDate FROM USER WHERE userName = ?`,
                [
                    name
                ],
                (error, results, fields) => {
                    if(error) reject(error);
                    resolve(results[0].joinDate);
                }
            );
        });
    },

    getCountWhiteGames: (name) => {
        return new Promise((resolve, reject) => {
            pool.query(
                `SELECT COUNT(whiteId) FROM USER
                INNER JOIN USER_VS_USER_GAME
                ON userName = ? AND userId = whiteId`,
                [
                    name
                ],
                (error, results, fields) => {
                    if(error) reject(error);
                    resolve(results[0]['COUNT(whiteId)']);
                }
            );
        });
    },

    getCountBlackGames: (name) => {
        return new Promise((resolve, reject) => {
            pool.query(
                `SELECT COUNT(blackId) FROM USER
                INNER JOIN USER_VS_USER_GAME
                ON userName = ? AND userId = blackId`,
                [
                    name
                ],
                (error, results, fields) => {
                    if(error) reject(error);
                    resolve(results[0]['COUNT(blackId)']);
                }
            );
        });
    },

    getCountWins: (name) => {
        return new Promise((resolve, reject) => {
            pool.query(
                `SELECT COUNT(result) FROM USER
                INNER JOIN USER_VS_USER_GAME
                ON (userName = ?) AND ((userId = blackId AND result = -1) OR (userId = whiteId AND result = 1))`,
                [
                    name
                ],
                (error, results, fields) => {
                    if(error) reject(error);
                    resolve(results[0]['COUNT(result)']);
                }
            );
        });
    },

    getCountLosses: (name) => {
        return new Promise((resolve, reject) => {
            pool.query(
                `SELECT COUNT(result) FROM USER
                INNER JOIN USER_VS_USER_GAME
                ON (userName = ?) AND ((userId = blackId AND result = 1) OR (userId = whiteId AND result = -1))`,
                [
                    name
                ],
                (error, results, fields) => {
                    if(error) reject(error);
                    resolve(results[0]['COUNT(result)']);
                }
            );
        });
    },

    updateRatingByUsername: (name, change) => {
        return new Promise((resolve, reject) => {
            pool.query(
                `UPDATE USER
                SET rating = rating + ?
                WHERE userName = ?`,
                [
                    change,
                    name
                ],
                (error, results, fields) => {
                    if(error) reject(error);
                    resolve("success"); /*We don't use the return data of this function*/
                }
            );
        });
    },

    saveUserVsUserGamedetails: (gameDetails) => {
        return new Promise((resolve, reject) => {
            pool.query(
                `INSERT INTO USER_VS_USER_GAME
                VALUES(?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    gameDetails.gameId,
                    gameDetails.whiteId,
                    gameDetails.blackId,
                    gameDetails.date,
                    gameDetails.time,
                    gameDetails.pgn,
                    gameDetails.result,
                    gameDetails.resultComment
                ],
                (error, results, fields) => {
                    if(error) reject(error);
                    resolve("success");
                }
            );
        });
    },

    getUserIdByUsername: async (name) => {
        return new Promise((resolve, reject) => {
            pool.query(
                `SELECT userId FROM USER WHERE userName = ?`,
                [
                    name
                ],
                (error, results, fields) => {
                    if(error) reject(error);
                    resolve (results[0].userId);
                }
            );
        });
    },

    getUserByUsername: (username, callback) => {
        pool.query(
            `SELECT * FROM USER WHERE username = ?`,
            [username],
            (error, results, fields) => {
                if(error) {
                    return callback(error);
                }  
                return callback(null, results[0]); 
            }
        );
    },

    insertFeedbackByUserId: (userId, details) => {
        return new Promise((resolve, reject) => {
            pool.query(
                `INSERT INTO FEEDBACK(userId, date, time, content) VALUES(?, ?, ?, ?)`,
                [
                    userId,
                    details.date,
                    details.time,
                    details.content,
                ],
                (error, results, fields) => {
                    if(error) reject(error);
                    resolve("success");
                }
            );
        });
    },

    insertuvb: (data, callback) => {
        pool.query(
            `INSERT INTO Gvb1(User_ID, Bot_ID, Game_date, Game_time, PGN, Winner)
            VALUES (?, ?, ?, ?, ?, ?)`, 
            [data.User_ID, data.Bot_ID, data.Game_date, data.Game_time, data.PGN, data.Winner],
            (error, results, fields) => {
                if(error) {
                    return callback(error);
                }
                return callback(null, results);
            }
        );
    },

    // getUsers: (callback) => {
    //     pool.query(
    //         `SELECT id, firstName, lastName, gender, email, number FROM registration`,
    //         [],
    //         (error, results, fields) => {
    //             if(error) {
    //                 return callback(error);
    //             }
    //             return callback(null, results);
    //         }
    //     );
    // },

    // getUserByUserId: (id, callback) => {
    //     pool.query(
    //         `SELECT id, firstName, lastName, gender, email, number FROM registration WHERE id = ?`,
    //         [id],
    //         (error, results, fields) => {
    //             if(error) {
    //                 return callback(error);
    //             }
    //             return callback(null, results[0]);
    //         }
    //     );
    // }, 

    // updateUser: (data, callback) => {
    //     pool.query(
    //         `UPDATE registration
    //         SET firstName = ?, lastName = ?, gender = ?, email = ?, password = ?, number = ? 
    //         WHERE id = ?`,
    //         [
    //             data.first_name,
    //             data.last_name,
    //             data.gender,
    //             data.email,
    //             data.password,
    //             data.number,
    //             data.id
    //         ],
    //         (error, results, fields) => {
    //             if(error) {
    //                 /*Note: The if block should be modified to 
    //                 if(error || 'the id does not exist') because even if the user does not exist 
    //                 we are getting a message saying operation was successful*/
    //                 return callback(error);
    //             }
    //             return callback(null, results[0]);
    //         }
    //     );
    // },

    // deleteUser: (data, callback) => {
    //     pool.query(
    //         `DELETE FROM registration WHERE id = ?`,
    //         [data.id],
    //         (error, results, fields) => {
    //             if(error) {
    //                 /*Make same change to if block as UpdateUser*/
    //                 return callback(error);
    //             }
    //             return callback(null, results[0]);
    //         }
    //     );
    // },
}