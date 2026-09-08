let workTime = 25;
let breakTime = 5;
let longBreakTime = 15;
let currentTime = workTime * 60;
let totalTime = currentTime;
let isRunning = false;
let isWorkSession = true;
let sessionCount = 0;
let completedSessions = 0;
let totalMinutes = 0;
let currentStreak = 0;
let timer = null;
let autoStartBreak = false;

const timeDisplay = document.getElementById('timeDisplay');
const sessionType = document.getElementById('sessionType');
const progress = document.getElementById('progress');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const skipBtn = document.getElementById('skipBtn');
const notification = document.getElementById('notification');
const notificationText = document.getElementById('notifText');

const autoStartBreakDisplay = document.getElementById('autoStartBreak');

const workTimeDisplay = document.getElementById('workTime');
const breakTimeDisplay = document.getElementById('breakTime');
const longBreakTimeDisplay = document.getElementById('longBreakTime');

const completedDisplay = document.getElementById('completedSessions');
const totalTimeDisplay = document.getElementById('totalTime');
const streakDisplay = document.getElementById('currentStreak');

const themes = [
  { name: 'Blue Mood', bg: '#07329B', text: '#1BB5FD', primary: '#AB8BEE', accent: '#E18FE5' },
  { name: 'Neon City', bg: '#1c291e', text: '#e23d8b', primary: '#5dea90', accent: '#45214d' },
  { name: 'Space Dream', bg: '#05012D', text: '#E62662', primary: '#D94DDB', accent: '#1E0685' },
  { name: 'Juicy Boom', bg: '#5C1966', text: '#9BFF6C', primary: '#06F284', accent: '#01595A' },
  { name: 'Deeper Hue', bg: '#1A2059', text: '#2DA6E9', primary: '#B42ECA', accent: '#3C54B8' },
  { name: 'Twilight', bg: '#0E0204', text: '#774972', primary: '#A30E2B', accent: '#7C5D72' },
  { name: 'Sparks', bg: '#C6DB00', text: '#6E2585', primary: '#EC008C', accent: '#00AEC7' },
  { name: 'Soda', bg: '#CC89A6', text: '#4D3D79', primary: '#281E3C', accent: '#DAB0C0' },
  { name: 'Candy', bg: '#840B2A', text: '#F696B3', primary: '#DD1440', accent: '#5A4864' },
  { name: 'Toned Love', bg: '#C5979D', text: '#484D6D', primary: '#488F8C', accent: '#2C365E' },
  { name: 'Choco', bg: '#443025', text: '#EC9C9D', primary: '#AA7F66', accent: '#F2CF2A' },
  { name: 'Sugary', bg: '#fec3df', text: '#9fa3e3', primary: '#a0f3ed', accent: '#ffeea8' },
  { name: 'Love', bg: '#CE4A4A', text: '#E8FFBE', primary: '#FF819C', accent: '#FFB8E3' },
  { name: 'Blue Lime', bg: '#2D90A7', text: '#3FBFC0', primary: '#53F2B8', accent: '#D0FEFF' },
  { name: 'Arcade', bg: '#BC4AC6', text: '#ADF1C6', primary: '#C1B3F1', accent: '#6BBBF6' },
  { name: 'Candy Store', bg: '#F2CED8', text: '#FF65A0', primary: '#B6228B', accent: '#F51772' },
  { name: 'Floral', bg: '#C0B9DD', text: '#80A1D4', primary: '#DED9E2', accent: '#75C9C8' },
  { name: 'Cooled', bg: '#9C7A97', text: '#303633', primary: '#8BE8CB', accent: '#888DA7' }
];

function applyTheme(theme) {
  const root = document.documentElement;
  root.style.setProperty('--bg-color', theme.bg);
  root.style.setProperty('--text-color', theme.text);
  root.style.setProperty('--primary-color', theme.primary);
  root.style.setProperty('--accent-color', theme.accent);
}

function initThemes() {
  const container = document.getElementById('themeOptions');
  if (!container) return;

  themes.forEach(theme => {
    const btn = document.createElement('button');
    btn.className = 'theme-chip';
    btn.textContent = theme.name;
    btn.addEventListener('click', () => {
      applyTheme(theme);
      document.querySelector('.theme-dropdown').removeAttribute('open');
    });
    container.appendChild(btn);
  });
}

const circumference = 2 * Math.PI * 145;
progress.style.strokeDasharray = `${circumference} ${circumference}`;
progress.style.strokeDashoffset = circumference;

function updateDisplay() {
    const minutes = Math.floor(currentTime / 60);
    const seconds = currentTime % 60;
    const timeString = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    
    // 1. Update the main page text layout
    timeDisplay.textContent = timeString;

    // 2. Dynamic state label (Work, Short Break, or Long Break)
    const label = sessionType ? sessionType.textContent : 'Pomodoro';

    // 3. Update the browser tab bar text
    if (isRunning) {
        document.title = `${timeString} ${label}`;
    } else {
        document.title = `▶ ${timeString} Paused`;
    }
}

function updateProgress() {
  const progressValue = totalTime > 0 ? 1 - (currentTime / totalTime) : 0;
  const offset = circumference * (1 - progressValue);
  progress.style.strokeDashoffset = offset;
}

function updateSettingsDisplay() {
  workTimeDisplay.value = workTime;
  breakTimeDisplay.value = breakTime;
  longBreakTimeDisplay.value = longBreakTime;
}

function setManualTime(type, value) {
  if (isRunning) {
    updateSettingsDisplay();
    return;
  }

  let parsedVal = parseInt(value, 10);
  if (isNaN(parsedVal)) return;

  if (type === 'work') {
    workTime = Math.min(60, Math.max(1, parsedVal));
    if (isWorkSession) {
      currentTime = workTime * 60;
      totalTime = currentTime;
    }
  } else if (type === 'break') {
    breakTime = Math.min(30, Math.max(1, parsedVal));
    if (!isWorkSession && (sessionCount === 0 || sessionCount % 4 !== 0)) {
      currentTime = breakTime * 60;
      totalTime = currentTime;
    }
  } else if (type === 'longBreak') {
    longBreakTime = Math.min(60, Math.max(5, parsedVal));
    if (!isWorkSession && sessionCount > 0 && sessionCount % 4 === 0) {
      currentTime = longBreakTime * 60;
      totalTime = currentTime;
    }
  }

  updateSettingsDisplay();
  updateDisplay();
  updateProgress();
}

function updateStats() {
  completedDisplay.textContent = completedSessions;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  totalTimeDisplay.textContent = `${hours}h ${minutes}m`;
  streakDisplay.textContent = currentStreak;
}

function showNotification(text) {
  if (notificationText) {
    notificationText.textContent = text;
    notification.classList.add('show');
    setTimeout(() => notification.classList.remove('show'), 4000);
  }
}

function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.setValueAtTime(600, ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
  } catch (e) {
    console.log('Audio context error');
  }
}

function startTimer() {
  if (!isRunning) {
    isRunning = true;
    startBtn.textContent = 'Running...';
    startBtn.classList.add('pulsing');
    timer = setInterval(() => {
      currentTime--;
      updateDisplay();
      updateProgress();
      updateDisplay();
      if (currentTime <= 0) {
        sessionComplete();
      }
    }, 1000);
  }
}

function pauseTimer() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  isRunning = false;
  startBtn.textContent = 'Start';
  startBtn.classList.remove('pulsing');
  updateDisplay();
}

function resetTimer() {
  pauseTimer();
  if (isWorkSession) {
    currentTime = workTime * 60;
  } else {
    const isLongBreak = sessionCount > 0 && sessionCount % 4 === 0;
    currentTime = isLongBreak ? longBreakTime * 60 : breakTime * 60;
  }
  totalTime = currentTime;
  updateDisplay();
  updateProgress();
}

function skipSession() {
  pauseTimer();
  sessionComplete();
}

function sessionComplete() {
  pauseTimer();
  if (isWorkSession) {
    completedSessions++;
    sessionCount++;
    currentStreak++;
    totalMinutes += workTime;
    showNotification('Work session completed! Time for a break.');
  } else {
    showNotification('Break completed! Ready to work?');
  }

  isWorkSession = !isWorkSession;

  if (isWorkSession) {
    currentTime = workTime * 60;
    progress.classList.remove('break');
    progress.classList.add('work');
    sessionType.textContent = 'Work Session';
  } else {
    const isLongBreak = sessionCount > 0 && sessionCount % 4 === 0;
    currentTime = isLongBreak ? longBreakTime * 60 : breakTime * 60;
    progress.classList.remove('work');
    progress.classList.add('break');
    sessionType.textContent = isLongBreak ? 'Long Break' : 'Short Break';
  }

  totalTime = currentTime;
  updateDisplay();
  updateProgress();
  updateStats();
  playNotificationSound();

  if (autoStartBreak) { 
    startTimer(); 
  }
}

function adjustTime(type, delta) {
  if (isRunning) return;

  if (type === 'work') {
    workTime = Math.min(60, Math.max(1, workTime + delta));
    if (isWorkSession) {
      currentTime = workTime * 60;
      totalTime = currentTime;
    }
  } else if (type === 'break') {
    breakTime = Math.min(30, Math.max(1, breakTime + delta));
    if (!isWorkSession && (sessionCount === 0 || sessionCount % 4 !== 0)) {
      currentTime = breakTime * 60;
      totalTime = currentTime;
    }
  } else if (type === 'longBreak') {
    longBreakTime = Math.min(60, Math.max(5, longBreakTime + delta));
    if (!isWorkSession && sessionCount > 0 && sessionCount % 4 === 0) {
      currentTime = longBreakTime * 60;
      totalTime = currentTime;
    }
  }

  updateSettingsDisplay();
  updateDisplay();
  updateProgress();
}

document.addEventListener('DOMContentLoaded', () => {
  initThemes();
  updateSettingsDisplay();
  updateDisplay();
  updateProgress();

  startBtn.addEventListener('click', startTimer);
  pauseBtn.addEventListener('click', pauseTimer);
  resetBtn.addEventListener('click', resetTimer);
  skipBtn.addEventListener('click', skipSession);

  autoStartBreakDisplay.addEventListener('change', (e) => {
        autoStartBreak = e.target.checked;
  });

  document.getElementById('workPlus').addEventListener('click', () => adjustTime('work', 1));
  document.getElementById('workMinus').addEventListener('click', () => adjustTime('work', -1));
  document.getElementById('breakPlus').addEventListener('click', () => adjustTime('break', 1));
  document.getElementById('breakMinus').addEventListener('click', () => adjustTime('break', -1));
  document.getElementById('longBreakPlus').addEventListener('click', () => adjustTime('longBreak', 1));
  document.getElementById('longBreakMinus').addEventListener('click', () => adjustTime('longBreak', -1));

  workTimeDisplay.addEventListener('change', (e) => setManualTime('work', e.target.value));
  breakTimeDisplay.addEventListener('change', (e) => setManualTime('break', e.target.value));
  longBreakTimeDisplay.addEventListener('change', (e) => setManualTime('longBreak', e.target.value));
});
