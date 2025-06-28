const { app, BrowserWindow, Notification, ipcMain } = require("electron");
const Store = require("electron-store").default;
const path = require("path");

let mainWindow;
let breakWindow; // for displaying the images used during the stretch break
let eyeExerciseTimer;
let stretchTimer;

// Interval
let eyeExerciseInterval = 2 * 60 * 1000; // 30 minutes in milliseconds
const DEFAULT_STRETCH_INTERVAL = 3 * 60 * 1000; // 1 hour in milliseconds
const DEFAULT_EYE_EXERCISE_INTERVAL = 5 * 60 * 1000; // 30 minutes in milliseconds

// store user preferences. By default electron do not persist data. We use electron-store

const store = new Store({
	defaults: {
		eyeExerciseInterval: DEFAULT_EYE_EXERCISE_INTERVAL,
		stretchInterval: DEFAULT_STRETCH_INTERVAL,
	},
});

function createWindow() {
	mainWindow = new BrowserWindow({
		width: 800,
		height: 600,
		// show: false, // hide the window intially
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false,
		},
	});

	mainWindow.loadFile("index.html");

	// Uncomment to open DevTools
	// mainWindow.webContents.openDevTools();

	mainWindow.on("closed", () => {
		mainWindow = null;
		clearTimeout(eyeExerciseTimer);
		clearTimeout(stretchTimer);

		if (breakWindow) {
			breakWindow.close();
		}
	});
}

function createBreakWindow(breakType) {
	if (breakWindow) {
		breakWindow.close(); // Close any existing break window
	}

	breakWindow = new BrowserWindow({
		width: 600,
		height: 400,
		show: false,
		parent: mainWindow, // Make it a child of the main window
		modal: true, // Make it modal (optional, but good for focus)
		webPreferences: {
			nodeIntegration: true, //  consider security implications
			contextIsolation: false,
		},
	});

	breakWindow.loadFile("break-window.html");
	breakWindow.once("ready-to-show", () => {
		if (breakWindow) {
			breakWindow.show();
		}
		// breakWindow.webContents.openDevTools();
	});

	// Send break type to the renderer process
	breakWindow.webContents.on("did-finish-load", () => {
		if (breakWindow) {
			breakWindow.webContents.send("break-type", breakType); // breakType can be "eye" or "strech"
		}
	});

	breakWindow.on("closed", () => {
		breakWindow = null;
	});
}

// EYE NOTIFICATION
function showEyeExerciseNotification() {
	const notification = new Notification({
		title: "Time for an Excercise",
		body: "Look away from your screen for a while",
	});

	notification.show();
	createBreakWindow("eye"); // Show the break window
	resetEyeExerciseTimer();
}

// STRECH NOTIFICATION
function showStretchNotification() {
	const notification = new Notification({
		title: "Time to Stretch!",
		body: "Stand up and stretch your legs.",
	});
	notification.show();
	createBreakWindow("stretch");
	resetStretchTimer();
}

function resetEyeExerciseTimer() {
	clearTimeout(eyeExerciseTimer);
	eyeExerciseTimer = setTimeout(
		showEyeExerciseNotification,
		eyeExerciseInterval,
	);
}

function resetStretchTimer() {
	clearTimeout(stretchTimer);
	const interval = store.get("stretchInterval", DEFAULT_STRETCH_INTERVAL);
	stretchTimer = setTimeout(showStretchNotification, interval);
}

app.whenReady().then(() => {
	createWindow();
	resetEyeExerciseTimer();
	resetStretchTimer();

	// IPC Handlers for snooze and dismiss
	ipcMain.on("snooze", (event, breakType) => {
		if (breakWindow) {
			breakWindow.close(); // if breakWindow is active, close it
		}

		// Snooze for 10 minutes (Defualt time) then re-trigger notifications after 10 mintues
		setTimeout(() => {
			if (breakType == "eye") {
				showEyeExerciseNotification(); // Re-trigger the notification
			} else if (breakType == "stretch") {
				showStretchNotification();
			}
		}, 10 * 60 * 1000);
	});

	ipcMain.on("dismiss", (event, breakType) => {
		if (breakWindow) {
			breakWindow.close();
		}

		// restart the timer
		if (breakType == "eye") {
			resetEyeExerciseTimer();
		} else if (breakType == "stretch") {
			resetStretchTimer();
		}
	});

	app.on("activate", () => {
		if (BrowserWindow.getAllWindows().length === 0) createWindow();
	});

	app.on("window-all-closed", () => {
		if (process.platform !== "darwin") app.quit();
	});
});
