const { app, BrowserWindow, Notification, ipcMain } = require("electron");
const Store = require("electron-store").default;
const path = require("path");

let mainWindow;
let breakWindow;
let eyeExerciseTimer;
let stretchTimer;
let walkTimer;
let meditationTimer;
let callTimer;

// Default intervals (5 minutes each as requested)
const DEFAULT_EYE_EXERCISE_INTERVAL = 5 * 60 * 1000; // 5 minutes
const DEFAULT_STRETCH_INTERVAL = 5 * 60 * 1000; // 5 minutes
const DEFAULT_WALK_INTERVAL = 15 * 60 * 1000; // 15 minutes
const DEFAULT_MEDITATION_INTERVAL = 20 * 60 * 1000; // 20 minutes
const DEFAULT_CALL_INTERVAL = 30 * 60 * 1000; // 30 minutes

const store = new Store({
	defaults: {
		eyeExerciseInterval: DEFAULT_EYE_EXERCISE_INTERVAL,
		stretchInterval: DEFAULT_STRETCH_INTERVAL,
		walkInterval: DEFAULT_WALK_INTERVAL,
		meditationInterval: DEFAULT_MEDITATION_INTERVAL,
		callInterval: DEFAULT_CALL_INTERVAL,
		enabledBreaks: {
			eye: true,
			stretch: true,
			walk: true,
			meditation: true,
			call: true,
		},
	},
});

function createWindow() {
	mainWindow = new BrowserWindow({
		width: 900,
		height: 700,
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false,
		},
	});

	mainWindow.loadFile("index.html");

	mainWindow.on("closed", () => {
		mainWindow = null;
		clearAllTimers();
		if (breakWindow) {
			breakWindow.close();
		}
	});
}

function createBreakWindow(breakType) {
	if (breakWindow) {
		breakWindow.close();
	}

	breakWindow = new BrowserWindow({
		width: 700,
		height: 500,
		show: false,
		parent: mainWindow,
		modal: true,
		resizable: false,
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false,
		},
	});

	breakWindow.loadFile("break-window.html");

	breakWindow.once("ready-to-show", () => {
		if (breakWindow) {
			breakWindow.show();
			breakWindow.focus();
		}
	});

	breakWindow.webContents.on("did-finish-load", () => {
		if (breakWindow) {
			breakWindow.webContents.send("break-type", breakType);
		}
	});

	breakWindow.on("closed", () => {
		breakWindow = null;
	});
}

// Enhanced notification functions with images
function showNotification(breakType) {
	const notificationConfig = {
		eye: {
			title: "👁️ Time for Eye Exercises!",
			body: "Look away from your screen and relax your eyes",
			icon: path.join(__dirname, "media", "eye-icon.png"),
		},
		stretch: {
			title: "🤸‍♀️ Time to Stretch!",
			body: "Stand up and do some stretching exercises",
			icon: path.join(__dirname, "media", "stretch-icon.png"),
		},
		walk: {
			title: "🚶‍♀️ Time for a Walk!",
			body: "Take a short walk to refresh yourself",
			icon: path.join(__dirname, "media", "walk-icon.png"),
		},
		meditation: {
			title: "🧘‍♀️ Time to Meditate!",
			body: "Take a moment to breathe and clear your mind",
			icon: path.join(__dirname, "media", "meditation-icon.png"),
		},
		call: {
			title: "📞 Time to Connect!",
			body: "Reach out to someone and have a conversation",
			icon: path.join(__dirname, "media", "call-icon.png"),
		},
	};

	const config = notificationConfig[breakType];
	const notification = new Notification({
		title: config.title,
		body: config.body,
		// icon: config.icon, // Uncomment if you have icon files
	});

	notification.on("click", () => {
		createBreakWindow(breakType);
	});

	notification.show();
	createBreakWindow(breakType);
}

// Timer functions for each break type
function showEyeExerciseNotification() {
	showNotification("eye");
	resetTimer("eye");
}

function showStretchNotification() {
	showNotification("stretch");
	resetTimer("stretch");
}

function showWalkNotification() {
	showNotification("walk");
	resetTimer("walk");
}

function showMeditationNotification() {
	showNotification("meditation");
	resetTimer("meditation");
}

function showCallNotification() {
	showNotification("call");
	resetTimer("call");
}

function resetTimer(breakType) {
	const timerMap = {
		eye: {
			timer: "eyeExerciseTimer",
			func: showEyeExerciseNotification,
			key: "eyeExerciseInterval",
		},
		stretch: {
			timer: "stretchTimer",
			func: showStretchNotification,
			key: "stretchInterval",
		},
		walk: {
			timer: "walkTimer",
			func: showWalkNotification,
			key: "walkInterval",
		},
		meditation: {
			timer: "meditationTimer",
			func: showMeditationNotification,
			key: "meditationInterval",
		},
		call: {
			timer: "callTimer",
			func: showCallNotification,
			key: "callInterval",
		},
	};

	const config = timerMap[breakType];
	if (config) {
		clearTimeout(eval(config.timer));
		const interval = store.get(config.key);
		const enabledBreaks = store.get("enabledBreaks");

		if (enabledBreaks[breakType]) {
			eval(`${config.timer} = setTimeout(${config.func.name}, ${interval})`);
		}
	}
}

function clearAllTimers() {
	clearTimeout(eyeExerciseTimer);
	clearTimeout(stretchTimer);
	clearTimeout(walkTimer);
	clearTimeout(meditationTimer);
	clearTimeout(callTimer);
}

function initializeAllTimers() {
	const enabledBreaks = store.get("enabledBreaks");

	if (enabledBreaks.eye) resetTimer("eye");
	if (enabledBreaks.stretch) resetTimer("stretch");
	if (enabledBreaks.walk) resetTimer("walk");
	if (enabledBreaks.meditation) resetTimer("meditation");
	if (enabledBreaks.call) resetTimer("call");
}

app.whenReady().then(() => {
	createWindow();
	initializeAllTimers();

	// Enhanced IPC handlers
	ipcMain.on("snooze", (event, breakType) => {
		if (breakWindow) {
			breakWindow.close();
		}

		// Snooze for 5 minutes then re-trigger
		setTimeout(() => {
			showNotification(breakType);
		}, 5 * 60 * 1000);
	});

	ipcMain.on("dismiss", (event, breakType) => {
		if (breakWindow) {
			breakWindow.close();
		}
		resetTimer(breakType);
	});

	// Settings management
	ipcMain.on("update-settings", (event, settings) => {
		store.set(settings);
		clearAllTimers();
		initializeAllTimers();
		event.reply("settings-updated");
	});

	ipcMain.on("get-settings", (event) => {
		event.reply("settings-data", store.store);
	});

	app.on("activate", () => {
		if (BrowserWindow.getAllWindows().length === 0) createWindow();
	});

	app.on("window-all-closed", () => {
		if (process.platform !== "darwin") app.quit();
	});
});
