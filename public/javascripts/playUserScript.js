let randomBoard = null;
let randomGame = new Chess();
const socket = io();

async function makeRandomMove () {
    let possibleMoves = randomGame.moves();

    if (randomGame.isGameOver()) return; /*exit if the game is over*/

    let randomIdx = Math.floor(Math.random() * possibleMoves.length);
    randomGame.move(possibleMoves[randomIdx]);
    randomBoard.position(randomGame.fen());

    if(document.getElementById('contentBeforeGameJoin').style.display != 'none') 
        window.setTimeout(makeRandomMove, 1000);
}

randomBoard = ChessBoard('myBoardBeforeGameJoin', 'start');
window.setTimeout(makeRandomMove, 1000);

const button = document.getElementById('pairButton');

button.addEventListener('click', async () => {
    socket.emit('participate-in-game');
});

let myGameDetails;
socket.on('game-joined', (gameDetails) => {
    const newContent = document.getElementById('content');
    const oldContent = document.getElementById('contentBeforeGameJoin');
    oldContent.style.display = 'none';
    newContent.style.display = 'flex';

    /*Display name and rating of players in UI*/
    myGameDetails = gameDetails;
    document.getElementById('myInfo').innerText = myGameDetails.myName + "[" + myGameDetails.myRating + "]";
    document.getElementById('opponentInfo').innerText = myGameDetails.opName + "[" + myGameDetails.opRating + "]";
    playGame(myGameDetails);
});

