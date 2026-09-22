const SIZE = 15;
const DIRECTIONS = [[1, 0], [0, 1], [1, 1], [1, -1]];
const boardElement = document.querySelector("#board");
const turnLabel = document.querySelector("#turn-label");
const turnDot = document.querySelector("#turn-dot");
const turnCount = document.querySelector("#turn-count");
const lastMoveLabel = document.querySelector("#last-move");
const undoButton = document.querySelector("#undo");
const toast = document.querySelector("#toast");
const authDialog = document.querySelector("#auth-dialog");
const authForm = document.querySelector("#auth-form");
const authError = document.querySelector("#auth-error");
const authConfirm = document.querySelector("#auth-confirm");
const confirmPasswordLabel = document.querySelector("#confirm-password-label");
const authTitle = document.querySelector("#auth-title");
const authEyebrow = document.querySelector("#auth-eyebrow");
const authSubmit = document.querySelector("#auth-submit");
const authSwitch = document.querySelector("#auth-switch");
const logoutButton = document.querySelector("#logout-button");
const accountLabel = document.querySelector("#account-label");
const accountAvatar = document.querySelector("#account-avatar");
const boardArea = document.querySelector(".board-area");
const boardFrame = document.querySelector(".board-frame");

let board = [];
let currentPlayer = 1;
let moves = [];
let gameOver = false;
let mode = "local";
let soundOn = true;
let scores = { black: 0, white: 0 };
let toastTimer;
let authMode = "login";
let currentUser = localStorage.getItem("gomoku-current-user") || "";

function updateBoardTilt(event) {
  if (window.matchMedia("(max-width: 500px), (prefers-reduced-motion: reduce)").matches) return;
  const bounds = boardArea.getBoundingClientRect();
  const x = (event.clientX - bounds.left) / bounds.width - 0.5;
  const y = (event.clientY - bounds.top) / bounds.height - 0.5;
  boardFrame.style.setProperty("--tilt-x", `${(-y * 5).toFixed(2)}deg`);
  boardFrame.style.setProperty("--tilt-y", `${(x * 5).toFixed(2)}deg`);
}

function resetBoardTilt() {
  boardFrame.style.setProperty("--tilt-x", "0deg");
  boardFrame.style.setProperty("--tilt-y", "0deg");
}

function newGame() {
  board = Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
  currentPlayer = 1;
  moves = [];
  gameOver = false;
  boardElement.innerHTML = "";
  for (let row = 0; row < SIZE; row += 1) {
    for (let col = 0; col < SIZE; col += 1) {
      const cell = document.createElement("button");
      cell.className = "cell";
      cell.type = "button";
      cell.dataset.row = row;
      cell.dataset.col = col;
      cell.setAttribute("role", "gridcell");
      cell.setAttribute("aria-label", `${row + 1}行${col + 1}列，空位`);
      cell.addEventListener("click", () => play(row, col));
      boardElement.appendChild(cell);
    }
  }
  updateStatus();
}

function play(row, col, isComputer = false) {
  if (gameOver || board[row][col] || (!isComputer && mode === "computer" && currentPlayer === 2)) return;
  board[row][col] = currentPlayer;
  moves.push({ row, col, player: currentPlayer });
  renderCell(row, col);
  playSound(currentPlayer === 1 ? 520 : 340);
  const winningLine = getWinningLine(row, col);
  if (winningLine) {
    finishGame(currentPlayer, winningLine);
    return;
  }
  if (moves.length === SIZE * SIZE) {
    gameOver = true;
    lastMoveLabel.textContent = "棋盘已满，本局和棋";
    showToast("本局和棋，再来一局吧");
    updateStatus();
    return;
  }
  currentPlayer = currentPlayer === 1 ? 2 : 1;
  updateStatus();
  if (mode === "computer" && currentPlayer === 2) {
    lastMoveLabel.textContent = "电脑思考中…";
    setTimeout(computerMove, 360);
  }
}

function renderCell(row, col) {
  const cell = getCell(row, col);
  const stone = document.createElement("span");
  stone.className = `stone ${board[row][col] === 1 ? "black" : "white"}`;
  cell.appendChild(stone);
  cell.classList.add("last");
  document.querySelector(".cell.last:not([data-row='" + row + "'][data-col='" + col + "'])")?.classList.remove("last");
  cell.setAttribute("aria-label", `${row + 1}行${col + 1}列，${board[row][col] === 1 ? "黑子" : "白子"}`);
}

function getWinningLine(row, col) {
  const player = board[row][col];
  for (const [dr, dc] of DIRECTIONS) {
    const line = [{ row, col }];
    for (const sign of [1, -1]) {
      let r = row + dr * sign;
      let c = col + dc * sign;
      while (r >= 0 && r < SIZE && c >= 0 && c < SIZE && board[r][c] === player) {
        line.push({ row: r, col: c });
        r += dr * sign;
        c += dc * sign;
      }
    }
    if (line.length >= 5) return line;
  }
  return null;
}

function finishGame(player, line) {
  gameOver = true;
  line.forEach(({ row, col }) => getCell(row, col).classList.add("winner"));
  const name = player === 1 ? "黑方" : "白方";
  scores[player === 1 ? "black" : "white"] += 1;
  document.querySelector(`#${player === 1 ? "black" : "white"}-score`).textContent = scores[player === 1 ? "black" : "white"];
  turnLabel.textContent = `${name}获胜`;
  turnDot.className = `turn-dot ${player === 1 ? "black" : "white"}`;
  lastMoveLabel.textContent = "本局结束";
  showToast(`${name}五子连珠，恭喜获胜！`);
  updateStatus();
}

function undo() {
  if (!moves.length || gameOver) return;
  const count = mode === "computer" && moves.at(-1).player === 2 ? 2 : 1;
  for (let i = 0; i < count && moves.length; i += 1) {
    const move = moves.pop();
    board[move.row][move.col] = 0;
    const cell = getCell(move.row, move.col);
    cell.innerHTML = "";
    cell.classList.remove("last");
    cell.setAttribute("aria-label", `${move.row + 1}行${move.col + 1}列，空位`);
  }
  currentPlayer = 1;
  const last = moves.at(-1);
  if (last) getCell(last.row, last.col).classList.add("last");
  updateStatus();
  lastMoveLabel.textContent = moves.length ? "已悔棋，轮到黑方" : "等待黑方落子";
}

function computerMove() {
  if (gameOver || mode !== "computer" || currentPlayer !== 2) return;
  const choice = findBestMove();
  play(choice.row, choice.col, true);
}

function findBestMove() {
  const empty = [];
  for (let row = 0; row < SIZE; row += 1) {
    for (let col = 0; col < SIZE; col += 1) if (!board[row][col]) empty.push({ row, col });
  }
  const winning = findTacticalMove(2) || findTacticalMove(1);
  if (winning) return winning;
  return empty.sort((a, b) => scorePosition(b, 2) - scorePosition(a, 2))[0] || { row: 7, col: 7 };
}

function findTacticalMove(player) {
  for (let row = 0; row < SIZE; row += 1) {
    for (let col = 0; col < SIZE; col += 1) {
      if (!board[row][col]) {
        board[row][col] = player;
        const wins = getWinningLine(row, col);
        board[row][col] = 0;
        if (wins) return { row, col };
      }
    }
  }
  return null;
}

function scorePosition(rowOrMove, player) {
  const row = typeof rowOrMove === "object" ? rowOrMove.row : rowOrMove;
  const col = typeof rowOrMove === "object" ? rowOrMove.col : arguments[1];
  let score = 0;
  const center = (SIZE - 1) / 2;
  score += (SIZE - Math.abs(row - center) - Math.abs(col - center)) * 2;
  for (const [dr, dc] of DIRECTIONS) {
    for (const sign of [1, -1]) {
      let r = row + dr * sign;
      let c = col + dc * sign;
      let length = 0;
      while (r >= 0 && r < SIZE && c >= 0 && c < SIZE && board[r][c] === player) {
        length += 1; r += dr * sign; c += dc * sign;
      }
      score += length * length * 4;
    }
  }
  return score;
}

function updateStatus() {
  const label = currentPlayer === 1 ? "黑方落子" : (mode === "computer" ? "电脑落子" : "白方落子");
  if (!gameOver) turnLabel.textContent = label;
  turnDot.className = `turn-dot ${currentPlayer === 1 ? "black" : "white"}`;
  turnCount.textContent = `${moves.length} / ${SIZE * SIZE}`;
  undoButton.disabled = !moves.length || gameOver;
}

function getCell(row, col) {
  return boardElement.children[row * SIZE + col];
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
}

function getUsers() {
  try {
    return JSON.parse(localStorage.getItem("gomoku-users") || "{}");
  } catch {
    return {};
  }
}

function setAuthMode(nextMode) {
  authMode = nextMode;
  const registering = nextMode === "register";
  authEyebrow.textContent = registering ? "加入弈的棋局" : "欢迎回来";
  authTitle.textContent = registering ? "创建账号" : "登录账号";
  authSubmit.textContent = registering ? "注册并登录" : "登录";
  authSwitch.textContent = registering ? "已有账号？返回登录" : "还没有账号？立即注册";
  authConfirm.classList.toggle("hidden", !registering);
  confirmPasswordLabel.classList.toggle("hidden", !registering);
  authConfirm.required = registering;
  authError.textContent = "";
}

function updateAccountUI() {
  const loggedIn = Boolean(currentUser);
  accountLabel.textContent = loggedIn ? currentUser : "登录 / 注册";
  accountAvatar.textContent = loggedIn ? currentUser.slice(0, 1).toUpperCase() : "?";
  logoutButton.classList.toggle("hidden", !loggedIn);
  authForm.classList.toggle("hidden", loggedIn);
  authSwitch.classList.toggle("hidden", loggedIn);
  if (loggedIn) {
    authEyebrow.textContent = "当前账号";
    authTitle.textContent = currentUser;
  }
}

function openAuthDialog() {
  setAuthMode(currentUser ? "login" : "login");
  updateAccountUI();
  authDialog.showModal();
}

function handleAuthSubmit(event) {
  event.preventDefault();
  const formData = new FormData(authForm);
  const username = String(formData.get("username") || "").trim();
  const password = String(formData.get("password") || "");
  const users = getUsers();
  if (!/^[\u4e00-\u9fa5A-Za-z0-9_-]{3,20}$/.test(username)) {
    authError.textContent = "用户名需为 3-20 位中英文、数字、下划线或短横线。";
    return;
  }
  if (password.length < 6) {
    authError.textContent = "密码至少需要 6 位。";
    return;
  }
  if (authMode === "register") {
    if (users[username]) {
      authError.textContent = "该用户名已存在，请换一个。";
      return;
    }
    if (password !== String(formData.get("confirm") || "")) {
      authError.textContent = "两次输入的密码不一致。";
      return;
    }
    users[username] = password;
    localStorage.setItem("gomoku-users", JSON.stringify(users));
    showToast("注册成功，欢迎加入棋局！");
  } else if (!users[username] || users[username] !== password) {
    authError.textContent = "用户名或密码不正确。";
    return;
  }
  currentUser = username;
  localStorage.setItem("gomoku-current-user", currentUser);
  updateAccountUI();
  authForm.reset();
  setTimeout(() => authDialog.close(), 120);
}

function playSound(frequency) {
  if (!soundOn) return;
  try {
    const context = new AudioContext();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(.045, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(.001, context.currentTime + .08);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + .08);
  } catch {
    // Audio is optional and can be unavailable in restricted browsers.
  }
}

document.querySelector("#new-game").addEventListener("click", newGame);
boardArea.addEventListener("pointermove", updateBoardTilt);
boardArea.addEventListener("pointerleave", resetBoardTilt);
undoButton.addEventListener("click", undo);
document.querySelector("#sound-toggle").addEventListener("click", (event) => {
  soundOn = !soundOn;
  event.currentTarget.classList.toggle("muted", !soundOn);
  event.currentTarget.setAttribute("aria-label", soundOn ? "关闭音效" : "开启音效");
});
document.querySelector("#rules-button").addEventListener("click", () => document.querySelector("#rules-dialog").showModal());
document.querySelector("#close-rules").addEventListener("click", () => document.querySelector("#rules-dialog").close());
document.querySelector("#rules-dialog").addEventListener("click", (event) => {
  if (event.target === event.currentTarget) event.currentTarget.close();
});
document.querySelector("#account-button").addEventListener("click", openAuthDialog);
document.querySelector("#close-auth").addEventListener("click", () => authDialog.close());
authDialog.addEventListener("click", (event) => {
  if (event.target === event.currentTarget) event.currentTarget.close();
});
authForm.addEventListener("submit", handleAuthSubmit);
authSwitch.addEventListener("click", () => setAuthMode(authMode === "login" ? "register" : "login"));
logoutButton.addEventListener("click", () => {
  currentUser = "";
  localStorage.removeItem("gomoku-current-user");
  authDialog.close();
  updateAccountUI();
  showToast("已安全退出登录");
});
document.querySelectorAll(".mode-button").forEach((button) => button.addEventListener("click", () => {
  mode = button.dataset.mode;
  document.querySelectorAll(".mode-button").forEach((item) => item.classList.toggle("active", item === button));
  newGame();
  updateAccountUI();
  showToast(mode === "computer" ? "人机模式：你执黑先行" : "双人模式已开启");
}));

newGame();
