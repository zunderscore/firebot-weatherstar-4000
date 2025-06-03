// hourly forecast list

import STATUS from './status.mjs';
import { json } from './utils/fetch.mjs';
import WeatherDisplay from './weatherdisplay.mjs';
import { registerDisplay } from './navigation.mjs';

const hazardLevels = {
	Extreme: 10,
	Severe: 5,
};

const hazardModifiers = {
	'Hurricane Warning': 2,
	'Tornado Warning': 3,
	'Severe Thunderstorm Warning': 1,
};

class Hazards extends WeatherDisplay {
	constructor(navId, elemId) {
		// special height and width for scrolling
		super(navId, elemId, 'Hazards');
		this.showOnProgress = false;

		// 0 screens skips this during "play"
		this.timing.totalScreens = 0;
	}

	async getData(weatherParameters, refresh) {
		// super checks for enabled
		const superResult = super.getData(weatherParameters, refresh);
		// hazards performs a silent refresh, but does not fall back to a previous fetch if no data is available
		// this is intentional to ensure the latest alerts only are displayed.

		try {
			// get the forecast
			const url = new URL('https://api.weather.gov/alerts/active');
			url.searchParams.append('point', `${this.weatherParameters.latitude},${this.weatherParameters.longitude}`);
			const alerts = await json(url, { retryCount: 3, stillWaiting: () => this.stillWaiting() });
			const allUnsortedAlerts = alerts.features ?? [];
			const unsortedAlerts = allUnsortedAlerts.slice(0, 5);
			const hasImmediate = unsortedAlerts.reduce((acc, hazard) => acc || hazard.properties.urgency === 'Immediate', false);
			const sortedAlerts = unsortedAlerts.sort((a, b) => (calcSeverity(b.properties.severity, b.properties.event)) - (calcSeverity(a.properties.severity, a.properties.event)));
			const filteredAlerts = sortedAlerts.filter((hazard) => hazard.properties.severity !== 'Unknown' && (!hasImmediate || (hazard.properties.urgency === 'Immediate')));
			this.data = filteredAlerts;
		} catch (error) {
			console.error('Get hazards failed');
			console.error(error.status, error.responseJSON);
			if (this.isEnabled) this.setStatus(STATUS.failed);
			// return undefined to other subscribers
			this.getDataCallback(undefined);
			return;
		}

		this.getDataCallback();

		if (!superResult) {
			this.setStatus(STATUS.loaded);
			return;
		}
		this.drawLongCanvas();
	}

	async drawLongCanvas() {
		// get the list element and populate
		const list = this.elem.querySelector('.hazard-lines');
		list.innerHTML = '';

		const lines = this.data.map((data) => {
			const fillValues = {};
			// text
			fillValues['hazard-text'] = `${data.properties.event}<br/><br/>${data.properties.description.replaceAll('\n\n', '<br/><br/>').replaceAll('\n', ' ')}`;

			return this.fillTemplate('hazard', fillValues);
		});

		list.append(...lines);

		// no alerts, skip this display by setting timing to zero
		if (lines.length === 0) {
			this.timing.totalScreens = 0;
			this.setStatus(STATUS.loaded);
			return;
		}

		// update timing
		// set up the timing
		this.timing.baseDelay = 20;
		// 24 hours = 6 pages
		const pages = Math.max(Math.ceil(list.scrollHeight / 400) - 3, 1);
		const timingStep = 400;
		this.timing.delay = [150 + timingStep];
		// add additional pages
		for (let i = 0; i < pages; i += 1) this.timing.delay.push(timingStep);
		// add the final 3 second delay
		this.timing.delay.push(250);
		this.calcNavTiming();
		this.setStatus(STATUS.loaded);
	}

	drawCanvas() {
		super.drawCanvas();
		this.finishDraw();
	}

	showCanvas() {
		// special to hourly to draw the remainder of the canvas
		this.drawCanvas();
		super.showCanvas();
	}

	// screen index change callback just runs the base count callback
	screenIndexChange() {
		this.baseCountChange(this.navBaseCount);
	}

	// base count change callback
	baseCountChange(count) {
		// calculate scroll offset and don't go past end
		let offsetY = Math.min(this.elem.querySelector('.hazard-lines').offsetHeight - 390, (count - 150));

		// don't let offset go negative
		if (offsetY < 0) offsetY = 0;

		// move the element
		this.elem.querySelector('.main').scrollTo(0, offsetY);
	}

	// make data available outside this class
	// promise allows for data to be requested before it is available
	async getCurrentData(stillWaiting) {
		if (stillWaiting) this.stillWaitingCallbacks.push(stillWaiting);
		return new Promise((resolve) => {
			if (this.data) resolve(this.data);
			// data not available, put it into the data callback queue
			this.getDataCallbacks.push(() => resolve(this.data));
		});
	}

	// after we roll through the hazards once, don't display again until the next refresh (10 minutes)
	screenIndexFromBaseCount() {
		const superValue = super.screenIndexFromBaseCount();
		// false is returned when we reach the end of the scroll
		if (superValue === false) {
			// set total screens to zero to take this out of the rotation
			this.timing.totalScreens = 0;
		}
		// return the value as expected
		return superValue;
	}
}

const calcSeverity = (severity, event) => {
	// base severity plus some modifiers for specific types of warnings
	const baseSeverity = hazardLevels[severity] ?? 0;
	const modifiedSeverity = hazardModifiers[event] ?? 0;
	return baseSeverity + modifiedSeverity;
};

// register display
registerDisplay(new Hazards(0, 'hazards'));
