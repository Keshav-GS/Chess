
var board = null
var game = new Chess()
var $status = $('#status')
var $fen = $('#fen')
var $pgn = $('#pgn')
var depth=3;
function onDragStart (source, piece, position, orientation) {
  // do not pick up pieces if the game is over
  if (game.isGameOver()){
   
    return false
  } 

  if (piece.search(/^b/) !== -1) return false
}

var whiteSquareGrey = '#a9a9a9'
var blackSquareGrey = '#696969'

function removeGreySquares () {
  $('#myBoard .square-55d63').css('background', '')
}

function greySquare (square) {
  var $square = $('#myBoard .square-' + square)

  var background = whiteSquareGrey
  if ($square.hasClass('black-3c85d')) {
    background = blackSquareGrey
  }

  $square.css('background', background)
}



function onMouseoverSquare (square, piece) {
  // get list of possible moves for this square
  var moves = game.moves({
    square: square,
    verbose: true
  })

  // exit if there are no moves available for this square
  if (moves.length === 0) return

  // highlight the square they moused over
  greySquare(square)

  // highlight the possible squares for this piece
  for (var i = 0; i < moves.length; i++) {
    greySquare(moves[i].to)
  }
}

function onMouseoutSquare (square, piece) {
  removeGreySquares()
}
var minimaxRoot =function(depth, game, isMaximisingPlayer) {

  var newGameMoves = game.moves();
  var bestMove = -9999;
  var bestMoveFound;

  for(var i = 0; i < newGameMoves.length; i++) {
      var newGameMove = newGameMoves[i]
      game.move(newGameMove);
      var value = minimax(depth - 1, game, -10000, 10000, !isMaximisingPlayer);
      game.undo();
      if(value >= bestMove) {
          bestMove = value;
          bestMoveFound = newGameMove;
      }
  }
  return bestMoveFound;
};

var minimax = function (depth, game, alpha, beta, isMaximisingPlayer) {
  positionCount++;
  if (depth === 0) {
      return -evaluateBoard(game.board());
  }

  var newGameMoves = game.moves();

  if (isMaximisingPlayer) {
      var bestMove = -9999;
      for (var i = 0; i < newGameMoves.length; i++) {
          game.move(newGameMoves[i]);
          bestMove = Math.max(bestMove, minimax(depth - 1, game, alpha, beta, !isMaximisingPlayer));
          game.undo();
          alpha = Math.max(alpha, bestMove);
          if (beta <= alpha) {
              return bestMove;
          }
      }
      return bestMove;
  } else {
      var bestMove = 9999;
      for (var i = 0; i < newGameMoves.length; i++) {
          game.move(newGameMoves[i]);
          bestMove = Math.min(bestMove, minimax(depth - 1, game, alpha, beta, !isMaximisingPlayer));
          game.undo();
          beta = Math.min(beta, bestMove);
          if (beta <= alpha) {
              return bestMove;
          }
      }
      return bestMove;
  }
};


var evaluateBoard = function (board) {
  var totalEvaluation = 0;
  for (var i = 0; i < 8; i++) {
      for (var j = 0; j < 8; j++) {
          totalEvaluation = totalEvaluation + getPieceValue(board[i][j], i ,j);
      }
  }
  return totalEvaluation;
};


var reverseArray = function(array) {
  return array.slice().reverse();
};

var pawnEvalWhite =
  [
      [0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0],
      [5.0,  5.0,  5.0,  5.0,  5.0,  5.0,  5.0,  5.0],
      [1.0,  1.0,  2.0,  3.0,  3.0,  2.0,  1.0,  1.0],
      [0.5,  0.5,  1.0,  2.5,  2.5,  1.0,  0.5,  0.5],
      [0.0,  0.0,  0.0,  2.0,  2.0,  0.0,  0.0,  0.0],
      [0.5, -0.5, -1.0,  0.0,  0.0, -1.0, -0.5,  0.5],
      [0.5,  1.0, 1.0,  -2.0, -2.0,  1.0,  1.0,  0.5],
      [0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0]
  ];

var pawnEvalBlack = reverseArray(pawnEvalWhite);

var knightEval =
  [
      [-5.0, -4.0, -3.0, -3.0, -3.0, -3.0, -4.0, -5.0],
      [-4.0, -2.0,  0.0,  0.0,  0.0,  0.0, -2.0, -4.0],
      [-3.0,  0.0,  1.0,  1.5,  1.5,  1.0,  0.0, -3.0],
      [-3.0,  0.5,  1.5,  2.0,  2.0,  1.5,  0.5, -3.0],
      [-3.0,  0.0,  1.5,  2.0,  2.0,  1.5,  0.0, -3.0],
      [-3.0,  0.5,  1.0,  1.5,  1.5,  1.0,  0.5, -3.0],
      [-4.0, -2.0,  0.0,  0.5,  0.5,  0.0, -2.0, -4.0],
      [-5.0, -4.0, -3.0, -3.0, -3.0, -3.0, -4.0, -5.0]
  ];

var bishopEvalWhite = [
  [ -2.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -2.0],
  [ -1.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0, -1.0],
  [ -1.0,  0.0,  0.5,  1.0,  1.0,  0.5,  0.0, -1.0],
  [ -1.0,  0.5,  0.5,  1.0,  1.0,  0.5,  0.5, -1.0],
  [ -1.0,  0.0,  1.0,  1.0,  1.0,  1.0,  0.0, -1.0],
  [ -1.0,  1.0,  1.0,  1.0,  1.0,  1.0,  1.0, -1.0],
  [ -1.0,  0.5,  0.0,  0.0,  0.0,  0.0,  0.5, -1.0],
  [ -2.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -2.0]
];

var bishopEvalBlack = reverseArray(bishopEvalWhite);

var rookEvalWhite = [
  [  0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0],
  [  0.5,  1.0,  1.0,  1.0,  1.0,  1.0,  1.0,  0.5],
  [ -0.5,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0, -0.5],
  [ -0.5,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0, -0.5],
  [ -0.5,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0, -0.5],
  [ -0.5,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0, -0.5],
  [ -0.5,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0, -0.5],
  [  0.0,   0.0, 0.0,  0.5,  0.5,  0.0,  0.0,  0.0]
];

var rookEvalBlack = reverseArray(rookEvalWhite);

var evalQueen = [
  [ -2.0, -1.0, -1.0, -0.5, -0.5, -1.0, -1.0, -2.0],
  [ -1.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0, -1.0],
  [ -1.0,  0.0,  0.5,  0.5,  0.5,  0.5,  0.0, -1.0],
  [ -0.5,  0.0,  0.5,  0.5,  0.5,  0.5,  0.0, -0.5],
  [  0.0,  0.0,  0.5,  0.5,  0.5,  0.5,  0.0, -0.5],
  [ -1.0,  0.5,  0.5,  0.5,  0.5,  0.5,  0.0, -1.0],
  [ -1.0,  0.0,  0.5,  0.0,  0.0,  0.0,  0.0, -1.0],
  [ -2.0, -1.0, -1.0, -0.5, -0.5, -1.0, -1.0, -2.0]
];

var kingEvalWhite = [

  [ -3.0, -4.0, -4.0, -5.0, -5.0, -4.0, -4.0, -3.0],
  [ -3.0, -4.0, -4.0, -5.0, -5.0, -4.0, -4.0, -3.0],
  [ -3.0, -4.0, -4.0, -5.0, -5.0, -4.0, -4.0, -3.0],
  [ -3.0, -4.0, -4.0, -5.0, -5.0, -4.0, -4.0, -3.0],
  [ -2.0, -3.0, -3.0, -4.0, -4.0, -3.0, -3.0, -2.0],
  [ -1.0, -2.0, -2.0, -2.0, -2.0, -2.0, -2.0, -1.0],
  [  2.0,  2.0,  0.0,  0.0,  0.0,  0.0,  2.0,  2.0 ],
  [  2.0,  3.0,  1.0,  0.0,  0.0,  1.0,  3.0,  2.0 ]
];

var kingEvalBlack = reverseArray(kingEvalWhite);




var getPieceValue = function (piece, x, y) {
  if (piece === null) {
      return 0;
  }
  var getAbsoluteValue = function (piece, isWhite, x ,y) {
      if (piece.type === 'p') {
          return 10 + ( isWhite ? pawnEvalWhite[y][x] : pawnEvalBlack[y][x] );
      } else if (piece.type === 'r') {
          return 50 + ( isWhite ? rookEvalWhite[y][x] : rookEvalBlack[y][x] );
      } else if (piece.type === 'n') {
          return 30 + knightEval[y][x];
      } else if (piece.type === 'b') {
          return 30 + ( isWhite ? bishopEvalWhite[y][x] : bishopEvalBlack[y][x] );
      } else if (piece.type === 'q') {
          return 90 + evalQueen[y][x];
      } else if (piece.type === 'k') {
          return 900 + ( isWhite ? kingEvalWhite[y][x] : kingEvalBlack[y][x] );
      }
      throw "Unknown piece type: " + piece.type;
  };

  var absoluteValue = getAbsoluteValue(piece, piece.color === 'w', x ,y);
  return piece.color === 'w' ? absoluteValue : -absoluteValue;
};

flag=0
winb='TBD'
var makeBestMove = function () {
  var bestMove = getBestMove(game);
  game.move(bestMove);
  board.position(game.fen());
  updateStatus()
  if (game.isGameOver()) {
      if(flag===0)
      alert('Game over,New game starting shortly....');
      if (game.isDraw()){
        downloadpdf('draw');
        winb='Draw'
        insertdb('Draw');
        window.setTimeout(restartgame,6000);
      }
      if(flag===0){
        downloadpdf('Black');
        winb='Black'
      insertdb('black');
      window.setTimeout(restartgame,6000);
      }
      
  }
};
var positionCount;
var getBestMove = function (game) {
    if (game.isGameOver()) {
        alert('Game over,New game starting shortly....');
        if (game.isDraw()){
        downloadpdf('draw');
        winb='Draw'
        insertdb('draw');
        window.setTimeout(restartgame,6000);
        }
        else{
        downloadpdf('white');
        winb='White'
        insertdb('white');
        flag=1
        window.setTimeout(restartgame,6000);
        }
    }

    positionCount = 0;
    depth = parseInt($('#search-depth').find(':selected').val());
    var d = new Date().getTime();
    var bestMove = minimaxRoot(depth, game, true);
    var d2 = new Date().getTime();
    var moveTime = (d2 - d);
    var positionsPerS = ( positionCount * 1000 / moveTime);
    return bestMove;
  };
function onDrop (source, target) {
  // see if the move is legal
  var move = game.move({
    from: source,
    to: target,
    promotion: 'q' // NOTE: always promote to a queen for example simplicity
  })
  console.log(source+","+target);

  removeGreySquares();
  // illegal move
  if (move === null) {
    return 'snapback';
}
  window.setTimeout(makeBestMove, 250);
  updateStatus()
  
}

// update the board position after the piece snap
// for castling, en passant, pawn promotion
function onSnapEnd () {
  board.position(game.fen())
}

function updateStatus () {
  var status = ''

  var moveColor = 'White'
  if (game.turn() === 'b') {
    moveColor = 'Black'
  }

  // checkmate?
  if (game.isCheckmate()) {
    status = 'Game over, ' + moveColor + ' is in checkmate.'
  }

  // draw?
  else if (game.isDraw()) {
    status = 'Game over, drawn position'
  }

  // game still on
  else {
    status = moveColor + ' to move'

    // check?
    if (game.inCheck()) {
      status += ', ' + moveColor + ' is in check'
    }
  }

  $status.html(status)
  $fen.html(game.fen())
}



var voiceOn = false;
var voiceAvailable = false;

if (!('webkitSpeechRecognition' in window)) {
	alert("No speech recognition available on this browser. Please try using Chrome.");
} else {
	voiceAvailable = true;

  var SpeechGrammarList = SpeechGrammarList || webkitSpeechGrammarList;

  var grammar ='#JSGF V1.0; grammar chess_moves; public <move> = <source_square> <target_square>; <source_square> = <file><rank>; <target_square> = <file><rank>; <file> = (a | b | c | d | e | f | g | h); <rank> = (1 | 2 | 3 | 4 | 5 | 6 | 7 | 8);'
  var recognition = new webkitSpeechRecognition();
  var speechRecognitionList = new SpeechGrammarList();
  speechRecognitionList.addFromString(grammar, 1);
  recognition.grammars = speechRecognitionList;
  recognition.lang = 'en-US';
	recognition.continuous = false;
	recognition.interimResults = true;
	recognition.onstart = function() {
	};
	recognition.onerror = function(event) {
	};
	recognition.onend = function() {
		if (voiceOn) {
			this.start();
		}
	};
	recognition.onresult = function(event) {
		var interim = "";
		for (var i = event.resultIndex; i < event.results.length; ++i) {
			if (event.results[i].isFinal) {
				var result = event.results[i][0].transcript;
				parseTranscript(result);
				displayInput(interim + "[" + result + "]");
			} else {
				interim += "(" + event.results[i][0].transcript + ")";
			}
		}
	};
}

var voiceToggle = function() {
	if (voiceAvailable) {
		if (voiceOn) {
			recognition.stop();
			voiceOn = false;
			$('#voiceBtn').prop('value', 'Start voice recognition');
		} else {
			recognition.start();
			voiceOn = true;
			$('#voiceBtn').prop('value', 'Stop voice recognition');
		}
	}
}


var parseTranscript = function(transcript) {
	if (game.turn() !== 'w') {
        alert("It's not White's turn to move.");
        return;
    }
	var input = transcript.toLowerCase();
	console.log(input[0]+" + "+input[1]+" + "+input[2]+" + "+input[3]+" + "+input.length);
	if (input.length === 5 ) {
		var move = input[0]+input[1]+'-'+input[2]+input[3]
		console.log(move)
		makeMove(move);
	}
};

var displayInput = function(input) {
	$("#voice").html(input);
}

var makeMove = function(move) {
	console.log(move.substring(0, 2)+","+move.substring(3))
	var result = game.move({
        from: move.substring(0, 2),
        to: move.substring(3),
        promotion: 'q' // assuming promotion to queen for simplicity
    });

    // Check if the move is valid
    if (result === null) {
        // If the move is invalid, show an alert
        alert("Invalid move: " + move);
        return;
    }
	board.move(move);
  window.setTimeout(makeBestMove, 250);
	updateStatus();
}





var config = {
  draggable: true,
  position: 'start',
  onDragStart: onDragStart,
  onDrop: onDrop,
  onMouseoutSquare: onMouseoutSquare,
  onMouseoverSquare: onMouseoverSquare,
  onSnapEnd: onSnapEnd
}
board = ChessBoard('myBoard', config)

updateStatus()


$('#voiceBtn').on('click', voiceToggle);

async function fetchUsernames() {
  try {
      const response = await fetch('/ChessWebsite/playBot/get-username');
      if (!response.ok) {
          throw new Error('Failed to fetch username');
      }
      const { whiteUsername} = await response.json();
      return { whiteUsername};
  } catch (error) {
      console.error('Error:', error);
      return { whiteUsername: ''};
  }
}

async function fetchUserid() {
  try {
      const response = await fetch('/ChessWebsite/playBot/get-userid');
      if (!response.ok) {
          throw new Error('Failed to fetch userid');
      }
      const {uid} = await response.json();
      return uid;
  } catch (error) {
      console.error('Error:', error);
      return {uid: ''};
  }
}

async function insertdb(winner) {
  const gpgn = game.pgn();
  const userId = 1;
  const uid= await  fetchUserid();
  var botId=2;
  if(depth===1)
  botId = 1;
  var currentDate = new Date().toISOString().split('T')[0];
  const currentTime = new Date().toLocaleTimeString();
  try {
    const response = await fetch('/ChessWebsite/playBot/GameOver', {
      method: 'POST', // Corrected method to 'POST'
      headers: {
        'Content-Type': 'application/json' // Set content type to JSON
      },
      body: JSON.stringify({
        User_ID: uid,
        Bot_ID: botId,
        Game_date: currentDate,
        Game_time: currentTime,
        PGN: gpgn,
        Winner: winner
      })
    });

    if (response.ok) {
      console.log("Insertion successful!!");
    } else {
      console.log("Insertion not successful!!");
    }
  } catch (error) {
    console.log("Insertion not successful!!");
  }
}


document.getElementById("resignBtn").addEventListener("click",function(){
  alert('White Resigned,Black Wins!!\nGame over,New game starting shortly....');
  downloadpdf('Black(White Resigned)');
  winb='Black'
  insertdb('black');
  window.setTimeout(restartgame,6000);

  });

function restartgame(){
  console.log("restart");
  winb='TBD';
  game.reset(); // Reset the game state
  board.position(game.fen()); // Update the board position
}
document.getElementById("generatePdfBtn").addEventListener("click",async function() {
  const {whiteUsername} = await fetchUsernames();
    const blackUsername = depth === 1 ? "Bot-1" : "Bot-2";
    const pdate=new Date().toISOString().split('T')[0];
    const ptime=new Date().toLocaleTimeString();
    generatePdf(game.pgn(), whiteUsername, blackUsername,pdate,ptime,winb);
});

async function downloadpdf(winner){
  const {whiteUsername} = await fetchUsernames();
    const blackUsername = depth === 1 ? "Bot-1" : "Bot-2";
    const pdate=new Date().toISOString().split('T')[0];
    const ptime=new Date().toLocaleTimeString();
    generatePdf(game.pgn(), whiteUsername, blackUsername,pdate,ptime,winner);
}
async function generatePdf(pgn, whiteUsername, blackUsername, pdate, ptime,winner) {
  var docDefinition = {
      content: [
          { text: 'SCORESHEET', style: 'header' },
          {
              columns: [
                  {
                      text: [
                          { text: 'White: ', style: 'username' },
                          {text:`${whiteUsername}\n`,style:'user'},
                          { text: 'Black: ', style: 'username' },
                          {text:`${blackUsername}\n`,style:'user'}
                      ],
                      width: '50%'
                  },
                  {text:'      ',fontsize:4},
                  {
                      text: [
                          { text: 'Date: ', style: 'timestamp' },
                          {text:`${pdate}\n`,style:'dt'},
                          { text: `Time: `, style: 'timestamp' },
                          {text:`${ptime}\n`,style:'dt'}
                      ],
                      alignment: 'right',
                      width: '50%'
                  }
              ]
          },
          {text:'      ',fontsize:10},
          createMovesTable(pgn),
          {text:'      ',fontsize:10},
          {text:`Winner: ${winner}\n`,style:'winner'},

      ],
      styles: {
          header: {
              fontSize: 23,
              bold: true,
              alignment: 'center',
              margin: [0, 0, 0, 10]
          },
          username: {
              fontSize: 15,
              bold: true,
              margin: [0, 0, 0, 20]
          },
          winner: {
            fontSize: 17,
            bold: true,
            alignment: 'center',
            margin: [0, 0, 0, 20]
        },
          user: {
            fontSize: 15,
            margin: [0, 0, 0, 20]
        },
        dt:{
          fontSize: 15,
            margin: [0, 0, 0, 20]
        },
          timestamp: {
              fontSize: 15,
              bold: true,
              margin: [0, 0, 0, 20]
          },
          tableHeader: {
              fontSize: 15,
              alignment: 'center',
              bold: true
          },
          tableContent: {
              alignment: 'center' // Align text in the middle
          }
      }
  };

  try {
      const pdfDocGenerator = pdfMake.createPdf(docDefinition);
      pdfDocGenerator.download("scoresheet_vs_bot.pdf");
  } catch (error) {
      console.error("Error generating PDF: ", error);
  }
}


function createMovesTable(pgn) {
  var moves = pgn.split(/\d+\./).slice(1);
  var tableBody = [];

  tableBody.push([{ text: 'Move', style: 'tableHeader' }, { text: 'White', style: 'tableHeader' }, { text: 'Black', style: 'tableHeader' }]);

  for (var i = 0; i < moves.length; i++) {
      var move = moves[i].trim();
      var moveParts = move.split(/\s/);
      var whiteMove = moveParts[0] || ''; // If white move is missing, replace with empty string
      var blackMove = moveParts[1] || ''; // If black move is missing, replace with empty string

      tableBody.push([(i + 1), whiteMove, blackMove]);
  }

  return {
      table: {
          widths: [45, '*', '*'],
          alignment: 'center',
          body: tableBody
      },
      style: 'tableContent'
  };
}
