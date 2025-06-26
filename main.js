const { app, BrowserWindow, Notification, ipcMain } = require("electron");
const Store = require('electron-store');
const path = require('path');

let mainWindow;
let breakWindow; // for displaying the images used during the stretch break
let eyeExerciseTimer;
let stretchTimer;

// Interval
let eyeExerciseInterval = 2 * 60 * 1000; // 30 minutes in milliseconds
const DEFAULT_STRETCH_INTERVAL = 60 * 60 * 1000; // 1 hour in milliseconds
const DEFAULT_EYE_EXERCISE_INTERVAL = 30 * 60 * 1000; // 30 minutes in milliseconds

// store user preferences. By default electron do not persist data. We use electron-store

const store = new Store ({
    defaults: {
        eyeExerciseInterval: DEFAULT_EYE_EXERCISE_INTERVAL,
        stretchInterval: DEFAULT_STRETCH_INTERVAL,

    },
});

const createWindow = () => {
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
};

function showEyeExerciseNotification() {
	const notification = new Notification({
		title: "Time for an Excercise",
		body: "Look away from your screen for a while",
	});

	notification.show();
	resetEyeExerciseTimer();
}

function resetEyeExerciseTimer() {
	clearTimeout(eyeExerciseTimer);
	eyeExerciseTimer = setTimeout(
		showEyeExerciseNotification,
		eyeExerciseInterval,
	);
}

app.whenReady().then(() => {
	createWindow();
	resetEyeExerciseTimer();

	app.on("activate", () => {
		if (BrowserWindow.getAllWindows().length === 0) createWindow();
	});

	app.on("window-all-closed", () => {
		if (process.platform !== "darwin") app.quit();
	});
});
