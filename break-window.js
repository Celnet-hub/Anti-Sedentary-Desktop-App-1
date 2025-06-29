const { ipcRenderer } = require("electron");

let settings = {};
let countdownIntervals = {};
let originalSettings = {}; // Track original settings for change detection

// Load settings on page load
document.addEventListener("DOMContentLoaded", () => {
	ipcRenderer.send("get-settings");
});

// Receive settings from main process
ipcRenderer.on("settings-data", (event, data) => {
	settings = data;
	originalSettings = JSON.parse(JSON.stringify(data)); // Deep copy
	updateUI();
	startCountdowns();
});

// Handle settings update confirmation
ipcRenderer.on("settings-updated", () => {
	showToast("✅ Settings saved successfully!", "success");
	updateButtonState("saved");

	// Update original settings to new values
	originalSettings = JSON.parse(JSON.stringify(settings));
});

// Toast notification function
function showToast(message, type = "success", duration = 3000) {
	// Remove existing toast if any
	const existingToast = document.querySelector(".toast");
	if (existingToast) {
		existingToast.remove();
	}

	// Create toast element
	const toast = document.createElement("div");
	toast.className = `toast ${type}`;

	const icons = {
		success: "✅",
		info: "ℹ️",
		warning: "⚠️",
		error: "❌",
	};

	toast.innerHTML = `
        <span class="toast-icon">${icons[type] || icons.success}</span>
        <span>${message}</span>
    `;

	// Add to body
	document.body.appendChild(toast);

	// Trigger animation
	setTimeout(() => {
		toast.classList.add("show");
	}, 100);

	// Remove after duration
	setTimeout(() => {
		toast.classList.remove("show");
		setTimeout(() => {
			if (toast.parentNode) {
				toast.parentNode.removeChild(toast);
			}
		}, 400);
	}, duration);
}

// Update button state
function updateButtonState(state) {
	const saveBtn = document.getElementById("save-settings");

	switch (state) {
		case "loading":
			saveBtn.textContent = "Saving...";
			saveBtn.classList.add("loading");
			saveBtn.disabled = true;
			break;
		case "saved":
			saveBtn.textContent = "✅ Saved!";
			saveBtn.classList.remove("loading");
			saveBtn.disabled = false;
			setTimeout(() => {
				saveBtn.textContent = "💾 Save Settings";
			}, 2000);
			break;
		case "changes":
			saveBtn.textContent = "💾 Save Changes";
			saveBtn.classList.remove("loading");
			saveBtn.disabled = false;
			break;
		default:
			saveBtn.textContent = "💾 Save Settings";
			saveBtn.classList.remove("loading");
			saveBtn.disabled = false;
	}
}

// Check if settings have changed
function hasSettingsChanged() {
	const currentValues = getCurrentSettingsFromUI();

	// Compare intervals
	const intervalsChanged =
		currentValues.eyeExerciseInterval !==
			originalSettings.eyeExerciseInterval ||
		currentValues.stretchInterval !== originalSettings.stretchInterval ||
		currentValues.walkInterval !== originalSettings.walkInterval ||
		currentValues.meditationInterval !== originalSettings.meditationInterval ||
		currentValues.callInterval !== originalSettings.callInterval;

	// Compare enabled breaks
	const breaksChanged =
		currentValues.enabledBreaks.eye !== originalSettings.enabledBreaks.eye ||
		currentValues.enabledBreaks.stretch !==
			originalSettings.enabledBreaks.stretch ||
		currentValues.enabledBreaks.walk !== originalSettings.enabledBreaks.walk ||
		currentValues.enabledBreaks.meditation !==
			originalSettings.enabledBreaks.meditation ||
		currentValues.enabledBreaks.call !== originalSettings.enabledBreaks.call;

	return intervalsChanged || breaksChanged;
}

// Get current settings from UI
function getCurrentSettingsFromUI() {
	return {
		eyeExerciseInterval:
			parseInt(document.getElementById("eye-interval").value) * 60000,
		stretchInterval:
			parseInt(document.getElementById("stretch-interval").value) * 60000,
		walkInterval:
			parseInt(document.getElementById("walk-interval").value) * 60000,
		meditationInterval:
			parseInt(document.getElementById("meditation-interval").value) * 60000,
		callInterval:
			parseInt(document.getElementById("call-interval").value) * 60000,
		enabledBreaks: {
			eye: document.getElementById("enable-eye").checked,
			stretch: document.getElementById("enable-stretch").checked,
			walk: document.getElementById("enable-walk").checked,
			meditation: document.getElementById("enable-meditation").checked,
			call: document.getElementById("enable-call").checked,
		},
	};
}

// Add change listeners to all inputs
function addChangeListeners() {
	const inputs = document.querySelectorAll(
		'input[type="number"], input[type="checkbox"]',
	);

	inputs.forEach((input) => {
		input.addEventListener("change", () => {
			// Add visual feedback
			const settingItem = input.closest(".setting-item");
			if (settingItem) {
				settingItem.classList.add("changed");
				setTimeout(() => {
					settingItem.classList.remove("changed");
				}, 600);
			}

			// Update button state
			if (hasSettingsChanged()) {
				updateButtonState("changes");
			} else {
				updateButtonState("default");
			}
		});
	});
}

function updateUI() {
	// Update interval inputs
	document.getElementById("eye-interval").value = Math.round(
		settings.eyeExerciseInterval / 60000,
	);
	document.getElementById("stretch-interval").value = Math.round(
		settings.stretchInterval / 60000,
	);
	document.getElementById("walk-interval").value = Math.round(
		settings.walkInterval / 60000,
	);
	document.getElementById("meditation-interval").value = Math.round(
		settings.meditationInterval / 60000,
	);
	document.getElementById("call-interval").value = Math.round(
		settings.callInterval / 60000,
	);

	// Update checkboxes
	document.getElementById("enable-eye").checked = settings.enabledBreaks.eye;
	document.getElementById("enable-stretch").checked =
		settings.enabledBreaks.stretch;
	document.getElementById("enable-walk").checked = settings.enabledBreaks.walk;
	document.getElementById("enable-meditation").checked =
		settings.enabledBreaks.meditation;
	document.getElementById("enable-call").checked = settings.enabledBreaks.call;

	// Add change listeners after UI is updated
	addChangeListeners();
}

function startCountdowns() {
	// Clear existing intervals
	Object.values(countdownIntervals).forEach((interval) =>
		clearInterval(interval),
	);
	countdownIntervals = {};

	const breakTypes = ["eye", "stretch", "walk", "meditation", "call"];

	breakTypes.forEach((type) => {
		if (settings.enabledBreaks[type]) {
			startCountdown(type);
		} else {
			updateTimerDisplay(type, "Disabled");
		}
	});
}

function startCountdown(breakType) {
	const intervalKey = `${breakType}${
		breakType === "eye" ? "Exercise" : ""
	}Interval`;
	let timeLeft = settings[intervalKey]; // milliseconds

	function updateTimer() {
		if (timeLeft <= 0) {
			updateTimerDisplay(breakType, "Due now!");
			// Reset timer
			timeLeft = settings[intervalKey];
		} else {
			const minutes = Math.floor(timeLeft / 60000);
			const seconds = Math.floor((timeLeft % 60000) / 1000);
			updateTimerDisplay(
				breakType,
				`${minutes}:${seconds.toString().padStart(2, "0")}`,
			);
			timeLeft -= 1000;
		}
	}

	updateTimer(); // Initial call
	countdownIntervals[breakType] = setInterval(updateTimer, 1000);
}

function updateTimerDisplay(breakType, timeText) {
	const timerId = `${breakType}-timer`;
	const element = document.getElementById(timerId);
	if (element) {
		element.textContent = timeText;
	}
}

// Enhanced save settings with validation and feedback
document.getElementById("save-settings").addEventListener("click", () => {
	// Validate inputs
	const intervals = [
		{ id: "eye-interval", name: "Eye Exercise" },
		{ id: "stretch-interval", name: "Stretching" },
		{ id: "walk-interval", name: "Walking" },
		{ id: "meditation-interval", name: "Meditation" },
		{ id: "call-interval", name: "Social Call" },
	];

	let hasError = false;

	for (const interval of intervals) {
		const value = parseInt(document.getElementById(interval.id).value);
		if (isNaN(value) || value < 1 || value > 120) {
			showToast(
				`❌ ${interval.name} interval must be between 1 and 120 minutes`,
				"error",
			);
			hasError = true;
			break;
		}
	}

	if (hasError) return;

	// Check if any break type is enabled
	const anyEnabled = getCurrentSettingsFromUI().enabledBreaks;
	const hasEnabledBreaks = Object.values(anyEnabled).some((enabled) => enabled);

	if (!hasEnabledBreaks) {
		showToast("⚠️ Please enable at least one break type", "warning");
		return;
	}

	// Show loading state
	updateButtonState("loading");

	// Get new settings
	const newSettings = getCurrentSettingsFromUI();
	settings = { ...settings, ...newSettings };

	// Send to main process
	ipcRenderer.send("update-settings", newSettings);

	// Restart countdowns with new settings
	setTimeout(() => {
		startCountdowns();
	}, 500);
});

// Add keyboard shortcut for saving (Ctrl+S)
document.addEventListener("keydown", (event) => {
	if (event.ctrlKey && event.key === "s") {
		event.preventDefault();
		if (hasSettingsChanged()) {
			document.getElementById("save-settings").click();
		}
	}
});
