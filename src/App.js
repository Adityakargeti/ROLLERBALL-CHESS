import React, { useState, useEffect } from 'react';
import './App.css';

// Unicode symbols for pieces
const PIECE_SYMBOLS = {
  'K': '♔', 'N': '♘', 'R': '♖', 'P': '♙',
  'k': '♚', 'n': '♞', 'r': '♜', 'p': '♟',
  '.': ''
};

// Initial board setup (copied from board.py)
const initialBoard = [
  ['r', 'n', 'k', 'n', 'r'],
  ['p', 'p', 'p', 'p', 'p'],
  ['.', '.', '.', '.', '.'],
  ['.', '.', '.', '.', '.'],
  ['P', 'P', 'P', 'P', 'P'],
  ['R', 'N', 'K', 'N', 'R']
];

// Piece values for evaluation
const PIECE_VALUES = {
  'P': 1, 'N': 3, 'R': 5, 'K': 1000,
  'p': -1, 'n': -3, 'r': -5, 'k': -1000
};

// Generate all legal moves for the current player
function generateMoves(board, whiteToMove) {
  const moves = [];
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 5; c++) {
      const piece = board[r][c];
      if (piece === '.') continue;
      if (whiteToMove && piece === piece.toUpperCase()) {
        moves.push(...pieceMoves(board, r, c, piece, true));
      }
      if (!whiteToMove && piece === piece.toLowerCase()) {
        moves.push(...pieceMoves(board, r, c, piece, false));
      }
    }
  }
  return moves;
}

// Generate moves for a single piece
function pieceMoves(board, r, c, piece, isWhite) {
  const moves = [];
  if (piece.toUpperCase() === 'P') {
    const dr = isWhite ? -1 : 1;
    const nr = r + dr;
    if (nr >= 0 && nr < 6 && board[nr][c] === '.') {
      moves.push([[r, c], [nr, c]]);
    }
    for (let dc of [-1, 1]) {
      const nc = c + dc;
      if (nr >= 0 && nr < 6 && nc >= 0 && nc < 5) {
        const target = board[nr][nc];
        if (target !== '.' && (target === target.toUpperCase()) !== isWhite) {
          moves.push([[r, c], [nr, nc]]);
        }
      }
    }
  } else if (piece.toUpperCase() === 'R') {
    for (let [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
      for (let i = 1; i < 6; i++) {
        const nr = r + dr*i, nc = c + dc*i;
        if (!(nr >= 0 && nr < 6 && nc >= 0 && nc < 5)) break;
        const target = board[nr][nc];
        if (target === '.') {
          moves.push([[r, c], [nr, nc]]);
        } else if ((target === target.toUpperCase()) !== isWhite) {
          moves.push([[r, c], [nr, nc]]);
          break;
        } else {
          break;
        }
      }
    }
  } else if (piece.toUpperCase() === 'N') {
    for (let [dr, dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < 6 && nc >= 0 && nc < 5) {
        const target = board[nr][nc];
        if (target === '.' || (target === target.toUpperCase()) !== isWhite) {
          moves.push([[r, c], [nr, nc]]);
        }
      }
    }
  } else if (piece.toUpperCase() === 'K') {
    for (let dr of [-1,0,1]) {
      for (let dc of [-1,0,1]) {
        if (dr === 0 && dc === 0) continue;
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < 6 && nc >= 0 && nc < 5) {
          const target = board[nr][nc];
          if (target === '.' || (target === target.toUpperCase()) !== isWhite) {
            moves.push([[r, c], [nr, nc]]);
          }
        }
      }
    }
  }
  return moves;
}

// Apply a move to the board
function applyMove(board, move) {
  const [[fromR, fromC], [toR, toC]] = move;
  const piece = board[fromR][fromC];
  const newBoard = board.map(row => [...row]);
  newBoard[toR][toC] = piece;
  newBoard[fromR][fromC] = '.';
  // Pawn promotion
  if (piece === 'P' && toR === 0) newBoard[toR][toC] = 'N';
  if (piece === 'p' && toR === 5) newBoard[toR][toC] = 'n';
  return newBoard;
}

// Evaluate the board (simple material count)
function evaluate(board) {
  let score = 0;
  for (let row of board) {
    for (let cell of row) {
      score += PIECE_VALUES[cell] || 0;
    }
  }
  return score;
}

// Minimax with depth limit and basic alpha-beta pruning
function minimax(board, depth, alpha, beta, maximizing) {
  // Check for king capture
  const flat = board.flat();
  if (!flat.includes('K')) return [-9999, null]; // Black wins
  if (!flat.includes('k')) return [9999, null];  // White wins
  if (depth === 0) return [evaluate(board), null];
  const moves = generateMoves(board, maximizing);
  if (moves.length === 0) return [evaluate(board), null];
  let bestMove = null;
  if (maximizing) {
    let maxEval = -Infinity;
    for (let move of moves) {
      const newBoard = applyMove(board, move);
      const [evalScore] = minimax(newBoard, depth-1, alpha, beta, false);
      if (evalScore > maxEval) {
        maxEval = evalScore;
        bestMove = move;
      }
      alpha = Math.max(alpha, evalScore);
      if (beta <= alpha) break;
    }
    return [maxEval, bestMove];
  } else {
    let minEval = Infinity;
    for (let move of moves) {
      const newBoard = applyMove(board, move);
      const [evalScore] = minimax(newBoard, depth-1, alpha, beta, true);
      if (evalScore < minEval) {
        minEval = evalScore;
        bestMove = move;
      }
      beta = Math.min(beta, evalScore);
      if (beta <= alpha) break;
    }
    return [minEval, bestMove];
  }
}

function App() {
  const [board, setBoard] = useState(initialBoard.map(row => [...row]));
  const [selected, setSelected] = useState(null);
  const [whiteToMove, setWhiteToMove] = useState(true);
  const [message, setMessage] = useState('White to move');

  // After white moves, let the AI (black) move automatically
  useEffect(() => {
    if (!whiteToMove) {
      // Delay for user experience
      setTimeout(() => {
        const [, bestMove] = minimax(board, 2, -Infinity, Infinity, false);
        if (bestMove) {
          const newBoard = applyMove(board, bestMove);
          setBoard(newBoard);
          setWhiteToMove(true);
          setMessage('White to move');
        } else {
          setMessage('Game over! White wins!');
        }
      }, 500);
    }
    // eslint-disable-next-line
  }, [whiteToMove]);

  // Check for game over (king captured)
  useEffect(() => {
    const flat = board.flat();
    if (!flat.includes('K')) setMessage('Game over! Black wins!');
    if (!flat.includes('k')) setMessage('Game over! White wins!');
  }, [board]);

  function handleSquareClick(row, col) {
    if (!whiteToMove) return; // Only allow user to move as white
    const piece = board[row][col];
    if (!selected) {
      if (piece === '.' || piece !== piece.toUpperCase()) {
        setMessage('Select a valid white piece to move.');
        return;
      }
      setSelected([row, col]);
      setMessage('Select a destination square.');
    } else {
      if (selected[0] === row && selected[1] === col) {
        setSelected(null);
        setMessage('White to move');
        return;
      }
      // Only allow legal moves for white
      const legalMoves = generateMoves(board, true);
      const move = legalMoves.find(m => m[0][0] === selected[0] && m[0][1] === selected[1] && m[1][0] === row && m[1][1] === col);
      if (!move) {
        setMessage('Invalid move!');
        setSelected(null);
        return;
      }
      const newBoard = applyMove(board, move);
      setBoard(newBoard);
      setSelected(null);
      setWhiteToMove(false);
      setMessage('Black (AI) thinking...');
    }
  }

  return (
    <div className="App">
      <h1>Rollerball Chess Visualizer</h1>
      <div className="board">
        {board.map((row, rIdx) => (
          <div className="board-row" key={rIdx}>
            {row.map((cell, cIdx) => {
              const isSelected = selected && selected[0] === rIdx && selected[1] === cIdx;
              return (
                <button
                  key={cIdx}
                  className={`square${isSelected ? ' selected' : ''}`}
                  onClick={() => handleSquareClick(rIdx, cIdx)}
                  disabled={!whiteToMove && cell !== '.'}
                >
                  {PIECE_SYMBOLS[cell]}
                </button>
              );
            })}
          </div>
        ))}
      </div>
      <div className="message">{message}</div>
      <div style={{marginTop: '1em', fontSize: '0.9em', color: '#888'}}>
        <p>Click a white piece, then a destination to move. The AI will play as black. Refresh to reset.</p>
      </div>
    </div>
  );
}

export default App;
