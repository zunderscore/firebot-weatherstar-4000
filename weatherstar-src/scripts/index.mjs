import { message as navMessage, latLonReceived } from './modules/navigation.mjs';
import settings from './modules/settings.mjs';

document.addEventListener('DOMContentLoaded', () => {
	init();
});

const init = () => {
	// Delay to give settings time to load
	const settingsCheck = () => {
		if (settings.loaded) {
			loadData(settings.location.value);
		} else {
			setTimeout(settingsCheck, 1000);
		}
	};
	setTimeout(settingsCheck, 250);

	setInterval(() => checkForUpdatedLocation(), 1000);

	// Play immediately as we force kiosk mode
	postMessage('navButton', 'play');
};

const checkForUpdatedLocation = () => {
	if (settings.loaded
		&& (settings.location.value.lat !== settings.location.previousValue.lat
			|| settings.location.value.lon !== settings.location.previousValue.lon)
	) {
		loadData(settings.location.value);
	}
};

const loadData = (_latLon, haveDataCallback) => {
	// if latlon is provided store it locally
	if (_latLon) loadData.latLon = _latLon;
	// get the data
	const { latLon } = loadData;
	// if there's no data stop
	if (!latLon) return;

	latLonReceived(latLon, haveDataCallback);
};

// post a message to the iframe
const postMessage = (type, myMessage = {}) => {
	navMessage({ type, message: myMessage });
};
