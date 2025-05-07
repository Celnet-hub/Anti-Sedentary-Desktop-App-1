const { app, BrowserWindow, Notification, ipcMain } = require("electron");

let mainWindow;
let eyeExerciseTimer;
let eyeExerciseInterval = 2 * 60 * 1000; // 30 minutes in milliseconds

const createWindow = () => {
	mainWindow = new BrowserWindow({
		width: 800,
		height: 600,
		// show: false, // hide the window intially
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false,
			enableRemoteModule: true,
		},
	});

	mainWindow.loadFile("index.html");

	// Uncomment to open DevTools
	// mainWindow.webContents.openDevTools();

	mainWindow.on("closed", () => {
		mainWindow = null;
		clearTimeout(eyeExerciseTimer);
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
