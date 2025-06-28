const { ipcRenderer } = require('electron');

const titleElement = document.getElementById('break-title');
const imageElement = document.getElementById('break-image');
const descriptionElement = document.getElementById('break-description');
const snoozeButton = document.getElementById('snooze');
const dismissButton = document.getElementById('dismiss');

const breakImages = {
  'eye': [
    'eye1.jpg', 'eye2.jpg', 'eye3.jpg'
  ],
  'stretch': [
    'stretch1.jpg', 'stretch2.jpg', 'stretch3.jpg'
  ],
  'meditation': [
      'med1.jpg', 'med2.jpg', 'med3.jpg'
  ],
  'call': [
      'call1.jpg', 'call2.jpg', 'call3.jpg'
  ]
};

const breakDescriptions = {
  'eye': 'Look at a distant object for 20 seconds.',
  'stretch': 'Stand up and do some light stretching.',
  'meditation': 'Take a moment to breathe deeply and clear your mind.',
  'call': 'Take a break to connect with someone.'
};

ipcRenderer.on('break-type', (event, breakType) => {
  let actualBreakType = breakType;
  if (breakType === 'eye') {
    titleElement.textContent = 'Time for an Eye Break!';
  } else if (breakType === 'stretch') {
    titleElement.textContent = 'Time to Stretch!';
  } else if (breakType === 'meditation'){
    titleElement.textContent = 'Time for Meditation!';
  } else if (breakType === 'call'){
    titleElement.textContent = 'Time to Call/Chat!';
  }
  else {
    titleElement.textContent = 'Time for a Break!';
  }


  const images = breakImages[actualBreakType] || breakImages['eye'];
  const randomImage = images[Math.floor(Math.random() * images.length)];
  imageElement.src = randomImage; //  relative path within the app
  imageElement.alt = `${actualBreakType} break tip`;

  descriptionElement.textContent = breakDescriptions[actualBreakType] || 'Take a short break from your screen.';
});

snoozeButton.addEventListener('click', () => {
  // Send a message to the main process to handle snoozing
  ipcRenderer.send('snooze', getBreakType());
});

dismissButton.addEventListener('click', () => {
  // Send a message to the main process to handle dismissing
  ipcRenderer.send('dismiss', getBreakType());
});

function getBreakType() {
    const title = titleElement.textContent;
    if (title.includes('Eye')) return 'eye';
    else if (title.includes('Stretch')) return 'stretch';
    else if (title.includes('Meditation')) return 'meditation';
    else if (title.includes('Call')) return 'call';
    return 'eye';
}