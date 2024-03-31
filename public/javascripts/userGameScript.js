function playGame(myGameDetails) {
    var board = null
    var game = new Chess()
    
    function onDragStart(source, piece, position, orientation) {
        // do not pick up pieces if the game is over
        if (game.isGameOver()) return false;
        
        // only pick up pieces for the side to move
        if ((game.turn() === 'w' && piece.search(/^b/) !== -1) ||
            (game.turn() === 'b' && piece.search(/^w/) !== -1) ||
            (game.turn() != myGameDetails.myColor)) 
        {
            return false;
        }
    }
    
    function onDrop(source, target) {
        // see if the move is legal
        var move = game.move({
            from: source,
            to: target,
            promotion: 'q' // NOTE: always promote to a queen for example simplicity
        });
    
        // illegal move
        if (move === null) return 'snapback';

        socket.emit('send-move', move);
        updateStatus();
    }
    
    function updateStatus() { /*status updated after each ply. It is also called once at the starting position before any move is made*/
        var status = ''
    
        var moveColor = 'White'
        if (game.turn() === 'b') {
            moveColor = 'Black'
        }
    
        if (game.isCheckmate()) {
            status = 'Game over, ' + moveColor + ' is in checkmate.'
        }
    
        else if (game.isDraw()) {
            status = 'Game over, drawn position'
        }
    
        /*game still on?*/
        else {
            status = moveColor + ' to move'
    
            /*in check?*/
            if (game.inCheck()) {
                status += ', ' + moveColor + ' is in check'
            }
        }
    
        /*update pgn on screen*/
        const pgnElement = document.querySelector('#pgn');
        pgnElement.innerHTML = formatPgn(game.pgn());
        pgnElement.scrollTop = pgnElement.scrollHeight;

        /*update status on screen*/
        const statusElement = document.querySelector('#status');
        statusElement.innerText = status;
    
        // $fen.html(game.fen())
        // console.log(game.pgn());
        // console.log(game.fen());
    }
    
    function formatPgn(pgn) {
        // Insert a line break before each move number and period
        let formattedPgn = pgn.replace(/(\d+\.) /g, "<br>$1 ");
    
        // Optionally, remove the initial line break if it exists
        if (formattedPgn.startsWith("<br>")) {
            formattedPgn = formattedPgn.substring(4);
        }
    
        return formattedPgn;
    }

    // update the board position after the piece snap
    // for castling, en passant, pawn promotion
    function onSnapEnd() {
        board.position(game.fen());
    }
    
    var config = {
        draggable: true,
        position: 'start',
        onDragStart: onDragStart,
        onDrop: onDrop,
        onSnapEnd: onSnapEnd,
    }
    
    board = ChessBoard('myBoard', config);
    if(myGameDetails.myColor == 'b') board.orientation('black'); /*Flip board if black*/
    updateStatus();

    /*receive and execute opponent's move*/
    socket.on('opponent-move', (move) => {
        game.move(move);
        board.position(game.fen());
        updateStatus();
    });

    function swapTurn() {
        let tokens = game.fen().split(" ");
        tokens[1] = game.turn() === "b" ? "w" : "b";
        tokens[3] = "-";
        game.load(tokens.join(" "));
    }

    /*you win due to opponent disconnecting*/
    socket.on('game-won-due-to-opponent-disconnect', () => {
        /*Display updated status*/
        const statusElement = document.querySelector('#status');
        statusElement.innerText = 'Opponent disconnected. You Win!';
        document.querySelector('#pgn').innerHTML = 'Analyze game';
        alert('Opponent disconnected. You Win!');

        /*Change turn so that player can't pickup pieces after game is over due to disconnection*/
        let tokens = game.fen().split(" ");
        if(game.turn() == myGameDetails.myColor) {
            if(myGameDetails.myColor == 'w') tokens[1] = 'b';
            else tokens[1] = 'w';
        }
        tokens[3] = "-";
        game.load(tokens.join(" "));
        board.position(game.fen());
    });

    /*offer draw*/
    document.getElementById('drawButton').addEventListener('click', () => {
        const btn = document.getElementById('drawButton');
        btn.innerText = 'WIP';
    });

    /*resign*/
    document.getElementById('resignButton').addEventListener('click', () => {
        const btn = document.getElementById('resignButton');
        btn.innerText = 'WIP';
    });
}

