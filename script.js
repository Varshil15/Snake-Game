const GRID_SIZE = 20;
const DIFFICULTY = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard'
};

const DIFFICULTY_CONFIG = {
  easy: {
    baseSpeed: 230,
    minSpeed: 120,
    speedIncreaseStep: 6
  },
  medium: {
    baseSpeed: 190,
    minSpeed: 80,
    speedIncreaseStep: 7
  },
  hard: {
    baseSpeed: 160,
    minSpeed: 60,
    speedIncreaseStep: 8
  }
};
const DIRECTION = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 }
};

let snake = [];
let food = {};
let direction = DIRECTION.RIGHT;
let nextDirection = DIRECTION.RIGHT;
let score = 0;
let highScore = localStorage.getItem('snakeHighScore') || 0;
let gameLoop = null;
let isGameRunning = false;
let currentDifficulty = DIFFICULTY.MEDIUM;
let currentSpeed = DIFFICULTY_CONFIG[currentDifficulty].baseSpeed;

const gameBoard = document.getElementById('gameBoard');
const currentScoreEl = document.getElementById('currentScore');
const highScoreEl = document.getElementById('highScore');
const finalScoreEl = document.getElementById('finalScore');
const gameOverOverlay = document.getElementById('gameOverOverlay');
const restartBtn = document.getElementById('restartBtn');
const difficultyInputs = document.querySelectorAll('input[name="difficulty"]');
const speedDisplayEl = document.getElementById('speedDisplay');

highScoreEl.textContent = highScore;

function initGame() {
  snake = [
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 }
  ];
  direction = DIRECTION.RIGHT;
  nextDirection = DIRECTION.RIGHT;
  score = 0;
  isGameRunning = true;
  currentScoreEl.textContent = score;
  gameOverOverlay.classList.remove('show');
  updateSpeed(true);
  updateSpeedDisplay();
  
  spawnFood();
  renderGame();
  startGameLoop();
}

function spawnFood() {
  let newFood;
  do {
    newFood = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE)
    };
  } while (snake.some(segment => segment.x === newFood.x && segment.y === newFood.y));
  
  food = newFood;
}

function gameUpdate() {
  if (!isGameRunning) return;

  direction = nextDirection;
  
  // Calculate new head position
  const head = { ...snake[0] };
  head.x += direction.x;
  head.y += direction.y;

  // Check wall collision
  if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
    gameOver();
    return;
  }

  // Check self collision
  if (snake.some(segment => segment.x === head.x && segment.y === head.y)) {
    gameOver();
    return;
  }

  // Add new head
  snake.unshift(head);

  // Check food collision
  if (head.x === food.x && head.y === food.y) {
    score++;
    currentScoreEl.textContent = score;
    currentScoreEl.classList.add('pulse');
    setTimeout(() => currentScoreEl.classList.remove('pulse'), 300);
    
    // Update high score
    if (score > highScore) {
      highScore = score;
      highScoreEl.textContent = highScore;
      localStorage.setItem('snakeHighScore', highScore);
    }
    updateSpeed();
    updateSpeedDisplay();
    startGameLoop();

    spawnFood();
  } else {
    // Remove tail if no food eaten
    snake.pop();
  }

  renderGame();
}

function renderGame() {
  gameBoard.innerHTML = '';

  // Render snake
  snake.forEach((segment, index) => {
    const snakeElement = document.createElement('div');
    snakeElement.classList.add('snake-segment');
    if (index === 0) snakeElement.classList.add('head');
    snakeElement.style.gridColumn = segment.x + 1;
    snakeElement.style.gridRow = segment.y + 1;
    gameBoard.appendChild(snakeElement);
  });

  // Render food if food is defined
  if (food && typeof food.x === 'number' && typeof food.y === 'number') {
    const foodElement = document.createElement('div');
    foodElement.classList.add('food');
    foodElement.style.gridColumn = food.x + 1;
    foodElement.style.gridRow = food.y + 1;
    gameBoard.appendChild(foodElement);
  }
}

function startGameLoop() {
  if (!isGameRunning) return;
  if (gameLoop) clearInterval(gameLoop);
  gameLoop = setInterval(gameUpdate, currentSpeed);
}

function updateSpeed(reset = false) {
  const config = DIFFICULTY_CONFIG[currentDifficulty];
  if (!config) return;

  if (reset) {
    currentSpeed = config.baseSpeed;
  } else {
    const effectiveScore = Math.max(0, score - 3); // start speeding up after score 3
    const target = config.baseSpeed - effectiveScore * config.speedIncreaseStep;
    currentSpeed = Math.max(target, config.minSpeed);
  }
}

function updateSpeedDisplay() {
  if (!speedDisplayEl) return;
  const movesPerSecond = 1000 / currentSpeed;
  speedDisplayEl.textContent = movesPerSecond.toFixed(1) + ' moves/s';
}

function gameOver() {
  isGameRunning = false;
  clearInterval(gameLoop);
  finalScoreEl.textContent = score;
  gameOverOverlay.classList.add('show');
  renderGame(); // Ensure fruit is hidden after death
}

difficultyInputs.forEach(input => {
  input.addEventListener('change', () => {
    if (!input.checked) return;
    currentDifficulty = input.value;
    updateSpeed(true);
    updateSpeedDisplay();
    if (isGameRunning) {
      startGameLoop();
    }
  });
});

document.addEventListener('keydown', (e) => {
  // Restart game on Space or Enter when game is over
  if (!isGameRunning && (e.key === ' ' || e.key === 'Enter')) {
    initGame();
    e.preventDefault();
    return;
  }

  if (!isGameRunning) return;

  switch(e.key) {
    case 'ArrowUp':
      if (direction !== DIRECTION.DOWN) nextDirection = DIRECTION.UP;
      e.preventDefault();
      break;
    case 'ArrowDown':
      if (direction !== DIRECTION.UP) nextDirection = DIRECTION.DOWN;
      e.preventDefault();
      break;
    case 'ArrowLeft':
      if (direction !== DIRECTION.RIGHT) nextDirection = DIRECTION.LEFT;
      e.preventDefault();
      break;
    case 'ArrowRight':
      if (direction !== DIRECTION.LEFT) nextDirection = DIRECTION.RIGHT;
      e.preventDefault();
      break;
  }
});

let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;

gameBoard.addEventListener('touchstart', (e) => {
  touchStartX = e.changedTouches[0].screenX;
  touchStartY = e.changedTouches[0].screenY;
}, false);

gameBoard.addEventListener('touchend', (e) => {
  if (!isGameRunning) return;
  
  touchEndX = e.changedTouches[0].screenX;
  touchEndY = e.changedTouches[0].screenY;
  handleSwipe();
}, false);

function handleSwipe() {
  const deltaX = touchEndX - touchStartX;
  const deltaY = touchEndY - touchStartY;
  const minSwipeDistance = 30;

  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    // Horizontal swipe
    if (Math.abs(deltaX) > minSwipeDistance) {
      if (deltaX > 0 && direction !== DIRECTION.LEFT) {
        nextDirection = DIRECTION.RIGHT;
      } else if (deltaX < 0 && direction !== DIRECTION.RIGHT) {
        nextDirection = DIRECTION.LEFT;
      }
    }
  } else {
    // Vertical swipe
    if (Math.abs(deltaY) > minSwipeDistance) {
      if (deltaY > 0 && direction !== DIRECTION.UP) {
        nextDirection = DIRECTION.DOWN;
      } else if (deltaY < 0 && direction !== DIRECTION.DOWN) {
        nextDirection = DIRECTION.UP;
      }
    }
  }
}

restartBtn.addEventListener('click', initGame);

// D-Pad controls for mobile
const dpadUp = document.getElementById('dpadUp');
const dpadDown = document.getElementById('dpadDown');
const dpadLeft = document.getElementById('dpadLeft');
const dpadRight = document.getElementById('dpadRight');

if (dpadUp) {
  dpadUp.addEventListener('click', (e) => {
    e.preventDefault();
    if (isGameRunning && direction !== DIRECTION.DOWN) {
      nextDirection = DIRECTION.UP;
    }
  });
}

if (dpadDown) {
  dpadDown.addEventListener('click', (e) => {
    e.preventDefault();
    if (isGameRunning && direction !== DIRECTION.UP) {
      nextDirection = DIRECTION.DOWN;
    }
  });
}

if (dpadLeft) {
  dpadLeft.addEventListener('click', (e) => {
    e.preventDefault();
    if (isGameRunning && direction !== DIRECTION.RIGHT) {
      nextDirection = DIRECTION.LEFT;
    }
  });
}

if (dpadRight) {
  dpadRight.addEventListener('click', (e) => {
    e.preventDefault();
    if (isGameRunning && direction !== DIRECTION.LEFT) {
      nextDirection = DIRECTION.RIGHT;
    }
  });
}

initGame();
