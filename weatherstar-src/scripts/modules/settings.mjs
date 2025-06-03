// default speed
const settings = {
	location: { value: { lat: 0.0, lon: 0.0 } },
	wide: { value: true },
	speed: { value: 1.0 },
	scanLines: { value: false },
	units: { value: 'us' },
	refreshTime: { value: 600_000 },
	screens: { value: ['hazards', 'current-conditions'] },
	loaded: false,
};

function wideScreenChange() {
	const container = document.querySelector('#divTwc');
	if (settings.wide?.value) {
		container.classList.add('wide');
	} else {
		container.classList.remove('wide');
	}
}

function scanLineChange() {
	const container = document.getElementById('container');
	if (settings.scanLines?.value) {
		container.classList.add('scanlines');
	} else {
		container.classList.remove('scanlines');
	}
}

function unitChange() {
	if (settings.loaded && settings.units.value !== settings.units.previousValue) {
		window.location.reload();
	}
}

async function getSettings() {
	const response = await fetch(`${window.location.protocol}//${window.location.host}/integrations/weatherstar-4000/settings`);

	if (response.ok) {
		const responseData = await response.json();

		Object.keys(responseData).forEach((v) => {
			settings[v] = {
				value: responseData[v],
				previousValue: settings.loaded ? settings[v].value : responseData[v],
			};
		});

		settings.loaded = true;

		wideScreenChange();
		scanLineChange();
		unitChange();
	}
}

async function init() {
	await getSettings();

	setInterval(async () => { await getSettings(); }, 1000);
}

document.addEventListener('DOMContentLoaded', async () => {
	await init();
});

export default settings;
