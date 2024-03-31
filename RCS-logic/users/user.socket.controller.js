const { v4: uuidv4 } = require("uuid");
const { Chess } = require("chess.js");
const { 
    getUserRatingByUsername, 
    getUserIdByUsername,
    updateRatingByUsername,
    saveUserVsUserGamedetails
} = require("../users/user.service");

/*Server can handle multiple games at once. 
It can also handle multiple games requests and live games by a single user on tab duplication or multiple logins*/

var IO;

module.exports = {
    messages: [], /*Stores global chat messages*/

    readySocketsMap: new Map(), /*Stores socketId->{name, roomId} pairs*/

    liveSocketIds: new Map(), /*Stores socketId->name currently playing games*/

    liveGames: new Map(), /*Stores details about every ongoing game. Maps GameId(i.e. RoomId) to GameDetails*/

    listenSocket: async (io) => {
        IO = io;
        await io.on('connection', module.exports.executeSocketOperation);
    },

    executeSocketOperation: async (socket) => {
        /*Connection*/
        console.log("A user connected! Username is: " + socket.request.session.userName);
        console.log('Number of games happenning currently are: ' + Math.floor(module.exports.liveSocketIds.size/2));

        /*Listen for events below:*/
        socket.on('disconnecting', async () => {
            console.log(socket.request.session.userName + ' is disconnecting');
            await module.exports.cleanUpBeforeDisconnect(socket);
        });
        socket.on('disconnect', async () => {
            console.log(socket.request.session.userName + ' disconnected');
        });
        socket.on('get-old-messages', async () => {
            await module.exports.sendOldMessages(socket);
        });
        socket.on('chat message', async (msg) => {
            await module.exports.broadcastChatMessage(socket, msg);
        });
        socket.on('participate-in-game', () => {
            console.log(socket.request.session.userName + ' wants to participate in game');
            module.exports.waitGame(socket);
        });
        socket.on('send-move', async (move) => {
            await module.exports.sendMoveToOpponent(socket, move);
        });
    },

    cleanUpBeforeDisconnect: async (socket) => {
        if(module.exports.liveSocketIds.has(socket.id))
            module.exports.liveSocketIds.delete(socket.id);
        if(module.exports.readySocketsMap.has(socket.id))
            module.exports.readySocketsMap.delete(socket.id);
        
        if(socket.rooms === undefined) return;

        let arrRooms = Array.from(socket.rooms);
        if(arrRooms.length <= 1) return;

        let roomId = Array.from(socket.rooms)[1]; /*get room(game) Id. In the program, it is guaranteed a socket can only join 1 extra room (other than it's 'own room')*/
        let gameDetails = module.exports.liveGames.get(roomId);
        if(gameDetails === undefined) return; /*game has not been played at all or is already over and saved.*/
        if(socket.request != undefined) {
            gameDetails.resultComment = 'disconnected';
            socket.to(roomId).emit('game-won-due-to-opponent-disconnect');
            if(gameDetails.whiteName == socket.request.session.userName) await module.exports.gameCleanup(socket, gameDetails, 'b');
            else await module.exports.gameCleanup(socket, gameDetails, 'w');
        }
    },

    sendOldMessages: async (socket) => {
        socket.emit('get-old-messages', module.exports.messages);
    },

    broadcastChatMessage: async (socket, msg) => {
        module.exports.messages.push(msg);
        socket.broadcast.emit('chat message', msg);
    },

    sendMoveToOpponent: async (socket, receivedMove) => {
        try {
            let roomArr = Array.from(socket.rooms);
            if(roomArr.length <= 1) return; /*socket is not in any room. So it is not playing a game. Hence might be a bad actor*/
            let roomId = roomArr[1]; /*get room(game) Id*/

            let gameDetails = module.exports.liveGames.get(roomId);
            if(gameDetails === undefined) return; /*game is over. no more moves must be received/sent */

            /*check if white player has only sent white move or black player has only sent black move*/
            /*if above is not satisfied throw illegal move error and make the player who has sent the move to lose*/

            gameDetails.chess.move(receivedMove); /*to simulate game in server*/
            socket.to(roomId).emit('opponent-move', receivedMove); /*send move to opponent*/

            if(gameDetails.chess.isGameOver()) 
                await module.exports.gameCleanup(socket, gameDetails, receivedMove.color); 
        }
        catch (error) {
            if(error.messages == 'illegal move' || error.name == 'illegal move') {
                /*End game. Perform closure operations*/
                /*Disconnect sockets from room*/
                console.log('Illegal move! You lose the game.');
            }
            else {
                socket.emit("game-participation-failure"); /*not playing any current game as socket not in room. 
                                                            so emit error*/
            }
        }
    },

    gameCleanup: async (socket, gameDetails, lastMoveColor) => {
        /*Set result and comment if not set, appropriately*/
        if(gameDetails.chess.isCheckmate()) {
            gameDetails.resultComment = 'By checkmate';
            if(lastMoveColor == 'w') gameDetails.result = 1;
            else gameDetails.result = -1;
        }
        else if(gameDetails.chess.isDraw()) { 
            gameDetails.resultComment = 'Draw';
            gameDetails.result = 0;
        }
        else if(gameDetails.resultComment == 'Illegal move') {
            /*in this cases, result_comment has to be filled in before entering gameCleanup (this) function*/
            if(lastMoveColor == 'w') gameDetails.result = 1;
            else gameDetails.result = -1;
        }
        else if(gameDetails.resultComment == 'disconnected') {
            /*in this cases, result_comment has to be filled in before entering gameCleanup (this) function*/
            if(lastMoveColor == 'w') gameDetails.result = 1;
            else gameDetails.result = -1;
        }

        /*Get pgn to save in DB*/
        gameDetails.pgn = gameDetails.chess.pgn();

        /*Update player ratings*/
        let whiteResultStatus = 1, blackResultStatus = 0;
        if(gameDetails.result == -1) {
            whiteResultStatus = 0;
            blackResultStatus = 1;
        } 
        else if(gameDetails.result == 0) {
            whiteResultStatus = 0.5;
            blackResultStatus = 0.5;
        }

        //why is deepcopying gamedetails here not working?
        await module.exports.
            updatePlayerRating(gameDetails.whiteName, gameDetails.whiteRtg, gameDetails.blackRtg, whiteResultStatus);
        await module.exports.
            updatePlayerRating(gameDetails.blackName, gameDetails.blackRtg, gameDetails.whiteRtg, blackResultStatus);

        /*Save game to DB*/
        await saveUserVsUserGamedetails(gameDetails);

        let roomId = gameDetails.gameId; /*used to disconnect sockets below*/

        /*Remove the 2 players from live players list*/
        if(module.exports.liveSocketIds.has(gameDetails.whiteSocketId)) 
            module.exports.liveSocketIds.delete(gameDetails.whiteSocketId); 
        if(module.exports.liveSocketIds.has(gameDetails.blackSocketId))
            module.exports.liveSocketIds.delete(gameDetails.blackSocketId);

        /*Remove game from live game*/
        module.exports.liveGames.delete(gameDetails.gameId);

        /*Force disconnect both the players in room*/
        IO.in(roomId).disconnectSockets(true);

        // console.log(gameDetails);
        // console.log(gameDetails.pgn);
    },

    updatePlayerRating: async (playerName, playerRating, opponentRating, score) => {
        /*ELO rating: If a person is 400 points higher rated than their opponent,
        they are 10 times as likely to win*/

        /*ELO updation formulas*/
        /*New rating = rating + 32(score - expected_score);
        Score is one of {1, 0.5, 0}, i.e. win, draw or loss;
        expected_score = probability of player winning = 1/(1 + 10^((opponentRating - playerRating)/400))*/

        const winProbability = 1/(1 + Math.pow(10, (opponentRating - playerRating)/400));
        const newRating = Math.floor(playerRating + 32 * (score - winProbability));
        const change = newRating - playerRating;

        await updateRatingByUsername(playerName, change); 
    },

    isPlaying: (socket) => { 
        let live = module.exports.liveSocketIds;
        const flag = socket.connected && (socket.rooms.size > 1);
        if(!flag && live.has(socket.id)) live.delete(socket.id);
        return flag;
    },

    waitGame: (socket) => { /*If socket does not find anyone to play in readySocketsMap, only then it makes and joins a 
                            room and waits in the same map*/
        let userMap = module.exports.readySocketsMap;
        let name = socket.request.session.userName;

        if (userMap.size == 0 && !module.exports.isPlaying(socket)) { /*person is first one on server*/
            const roomId = uuidv4();
            socket.join(roomId);
            userMap.set(socket.id, {name:name, room: roomId});
        }

        else if (userMap.size == 1 && !module.exports.isPlaying(socket)) { /*just 1 person is already waiting to be paired*/
            if(!module.exports.isPlaying(socket) && userMap.values().next().value != undefined && userMap.values().next().value.name != name) { /*different player is ready*/
                let info = {name: name, room: uuidv4()};
                userMap.set(socket.id, info);
                module.exports.joinGame(socket);
                return;
            }
            else if(!module.exports.isPlaying(socket) && !userMap.has(socket.id)) { /*else if the other request that is ready is just the same user's previous request*/
                const roomId = uuidv4();
                socket.join(roomId);    /*Sidenote: in this function, join room is only called when socket just sits in ready list and joinGame is not called immediately*/
                userMap.set(socket.id, {name:name, room: roomId});
            }
        }

        else if (userMap.size > 1 && !module.exports.isPlaying(socket)) { /*There is more than 1 person waiting to be paired*/
            if(!userMap.has(socket.id)) {
                const roomId = uuidv4();
                socket.join(roomId);    
                userMap.set(socket.id, {name:name, room: roomId});
            }

            module.exports.joinGame(socket);
        }
    },

    getPlayerRatings: async (playerName, opponentName) => {
        try {
            const playerRating = await getUserRatingByUsername(playerName).catch(() => -1); 
            const opponentRating = await getUserRatingByUsername(opponentName).catch(() => -1); 
            return { playerRating, opponentRating };
        } catch (error) {
            console.log('An error occurred:', error);
            return { playerRating: -1, opponentRating: -1 };
        }
    },

    getUserIds: async (whiteName, blackName) => {
        try {
            const whiteId = await getUserIdByUsername(whiteName).catch(() => -1);
            const blackId = await getUserIdByUsername(blackName).catch(() => -1);
            return { whiteId, blackId };
        }
        catch(error) {
            console.log('An error occurred:' + error);
            return { whiteId: -1, blackId: -1 };
        }
    },

    joinGame: async (socket) => {
        let userMap = module.exports.readySocketsMap;
        let playerName = socket.request.session.userName;

        /*In the else block 2 players are popped from userMap always. So the size of map has to be checked before.*/
        if (userMap.size == 1) {
            if(userMap.has(socket.id)) {
                module.exports.waitGame(socket);
                return;
            } 
            else if(module.exports.isPlaying(socket)) {
                return;
            }
            else {
                socket.emit("game-participation-failure");
                socket.disconnect(true);
                return;
            }
        }

        else {
            let opponentName, roomId, opponentSocketId;

            /*Delete from ready list and add to live players*/
            userMap.delete(socket.id);
            module.exports.liveSocketIds.set(socket.id, socket.request.session.userName);

            /*If no opponent available to be paired with*/
            if(userMap.size == 0) {
                socket.emit("game-participation-failure"); 
                socket.disconnect(true);
                return;
            }

            /*Find an opponent*/
            for (let [socketId, info] of Array.from(userMap.entries())) {
                if (info.name !== playerName) {
                    opponentSocketId = socketId;
                    opponentName = info.name;
                    roomId = info.room; /*room-id will be game-id*/
                    break; 
                }
            }

            /*Make player only join room. Opponent would already be in room. But first check if finding opponent was success. Then check for max parallel game limit*/
            if(roomId == undefined) {
                if(module.exports.liveSocketIds.has(socket.id)) module.exports.liveSocketIds.delete(socket.id);
                module.exports.waitGame(socket); /*If no opponent found, send back to readyMap*/
                return;
            }
            socket.join(roomId); /*before this make this socket leave every other room it might have joined or not left*/

            /*If no opponent in room or no opponent (different username) to choose from*/
            if(IO.sockets.adapter.rooms.get(roomId).size <= 1) {
                socket.emit("game-participation-failure"); 
                socket.disconnect(true);
                return;
            }

            /*Delete from ready list and add to live players*/
            userMap.delete(opponentSocketId);
            module.exports.liveSocketIds.set(opponentSocketId, opponentName);

            /*Gather information to save as preliminary game information. First set color of players*/
            whiteName = playerName;
            blackName = opponentName;
            if (Math.floor(Math.random() * 2)) [whiteName, blackName] = [blackName, whiteName];

            /*Get player IDs*/
            let { whiteId, blackId } = await module.exports.getUserIds(whiteName, blackName); 

            /*Get local(server) game date and time. Remove offset to get UTC*/
            let date = new Date();
            let dateString = new Date(date.getTime() - (date.getTimezoneOffset() * 60000 )).toISOString().split("T");
            date = dateString[0];
            let time = dateString[1].slice(0, -5); //remove milliseconds and Z specifier

            /*Create chess game object for simulation*/
            let chess = new Chess();

            /*test output start*/
            // console.log('------------------------------------------------------');
            // console.log('Player name: ' + playerName);
            // console.log('Opponent name[creater of room]: ' + opponentName);
            // console.log('Game room id: '+ roomId);
            // console.log('Number of players in room: ' + IO.sockets.adapter.rooms.get(roomId).size);
            // console.log('Socket.rooms: ' + socket.rooms);
            // console.log('All elements in map: ');
            // for (var [key, value] of userMap) console.log(key + ': ' + value);
            // let x = await IO.in(roomId).fetchSockets(); //get sockets in room and their usernames
            // let p0 = x[0].request.session.userName
            // let p1 = x[1].request.session.userName
            // console.log('Player-1 name: ');
            // console.log(p0);
            // console.log('Player-2 name: ');
            // console.log(p1);
            // console.log('------------------------------------------------------');
            /*test output end*/

            /*Collect details to emit to players*/            
            let { playerRating, opponentRating } = await module.exports.getPlayerRatings(playerName, opponentName);

            let playerDetails = {
                myName: playerName,
                opName: opponentName,
                myRating: playerRating,
                opRating: opponentRating,
                myColor: 'w'
            };

            let opponentDetails = {
                myName: opponentName,
                opName: playerName,
                myRating: opponentRating,
                opRating: playerRating,
                myColor: 'b'
            };

            if(playerName == blackName) {
                playerDetails['myColor'] = 'b';
                opponentDetails['myColor'] = 'w';
            }

            /*Aggregate game details*/
            let result, resultComment, pgn, whiteRtg, blackRtg;
            if(playerName == whiteName) {
                whiteRtg = playerRating;
                blackRtg = opponentRating;
            }
            else {
                whiteRtg = opponentRating;
                blackRtg = playerRating;
            }

            /*Get sockets in room to get socket ids which will be stored as part of game details*/
            let whiteSocketId, blackSocketId;
            let sockets = await IO.in(roomId).fetchSockets(); 
            for(socket of sockets) {
                if(socket.request != undefined && socket.request.session.userName == whiteName) whiteSocketId = socket.id;
                else blackSocketId = socket.id;
            }

            /*If one of the sockets has left the room*/
            if(blackSocketId === undefined || whiteSocketId === undefined) {
                socket.emit("game-participation-failure"); 
                socket.disconnect(true);
                return;
            }

            /*Use all accumulated information to finally create game details object*/
            let gameDetails = {
                gameId: roomId,
                whiteId,
                blackId,
                whiteSocketId,
                blackSocketId,
                whiteName,
                blackName,
                whiteRtg,
                blackRtg,
                date,
                time,
                chess,
                pgn,
                result,
                resultComment
            };

            /*Add game to list of live games*/
            module.exports.liveGames.set(roomId, gameDetails);
            
            /*Send details to both players and make them join game*/
            socket.emit('game-joined', playerDetails);
            socket.to(roomId).emit('game-joined', opponentDetails);
        }
    }
}