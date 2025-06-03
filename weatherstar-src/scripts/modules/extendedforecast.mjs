// display extended forecast graphically
// technically uses the same data as the local forecast, we'll let the browser do the caching of that

import STATUS from './status.mjs';
import { json } from './utils/fetch.mjs';
import { DateTime } from '../vendor/auto/luxon.mjs';
import { getLargeIcon } from './icons.mjs';
import WeatherDisplay from './weatherdisplay.mjs';
import { registerDisplay } from './navigation.mjs';
import settings from './settings.mjs';

class ExtendedForecast extends WeatherDisplay {
	constructor(navId, elemId) {
		super(navId, elemId, 'Extended Forecast');

		// set timings
		this.timing.totalScreens = 2;
	}

	async getData(weatherParameters, refresh) {
		if (!super.getData(weatherParameters, refresh)) return;

		// request us or si units
		try {
			this.data = await json(this.weatherParameters.forecast, {
				data: {
					units: settings.units.value,
				},
				retryCount: 3,
				stillWaiting: () => this.stillWaiting(),
			});
		} catch (error) {
			console.error('Unable to get extended forecast');
			console.error(error.status, error.responseJSON);
			// if there's no previous data, fail
			if (!this.data) {
				this.setStatus(STATUS.failed);
				return;
			}
		}
		// we only get here if there was no error above
		this.screenIndex = 0;
		this.setStatus(STATUS.loaded);
	}

	async drawCanvas() {
		super.drawCanvas();

		// determine bounds
		// grab the first three or second set of three array elements
		const forecast = parse(this.data.properties.periods).slice(0 + 3 * this.screenIndex, 3 + this.screenIndex * 3);

		// create each day template
		const days = forecast.map((Day) => {
			const fill = {
				icon: { type: 'img', class: Day.icon },
				condition: Day.text,
				date: Day.dayName,
			};

			const { low, high } = Day;
			if (low !== undefined) {
				fill['value-lo'] = Math.round(low);
			}
			fill['value-hi'] = Math.round(high);

			// return the filled template
			return this.fillTemplate('day', fill);
		});

		// empty and update the container
		const dayContainer = this.elem.querySelector('.day-container');
		dayContainer.innerHTML = '';
		dayContainer.append(...days);
		this.finishDraw();
	}
}

// the api provides the forecast in 12 hour increments, flatten to day increments with high and low temperatures
const parse = (fullForecast) => {
	// create a list of days starting with today
	const Days = [0, 1, 2, 3, 4, 5, 6];

	const dates = Days.map((shift) => {
		const date = DateTime.local().startOf('day').plus({ days: shift });
		return date.toLocaleString({ weekday: 'short' });
	});

	// track the destination forecast index
	let destIndex = 0;
	const forecast = [];
	fullForecast.forEach((period) => {
		// create the destination object if necessary
		if (!forecast[destIndex]) {
			forecast.push({
				dayName: '', low: undefined, high: undefined, text: undefined, icon: undefined,
			});
		}
		// get the object to modify/populate
		const fDay = forecast[destIndex];
		// high temperature will always be last in the source array so it will overwrite the low values assigned below
		fDay.icon = getLargeIcon(period.icon);
		fDay.text = shortenExtendedForecastText(period.shortForecast);
		fDay.dayName = dates[destIndex];

		if (period.isDaytime) {
			// day time is the high temperature
			fDay.high = period.temperature;
			destIndex += 1;
		} else {
			// low temperature
			fDay.low = period.temperature;
		}
	});

	return forecast;
};

const regexList = [
	[/ and /gi, ' '],
	[/slight /gi, ''],
	[/chance /gi, ''],
	[/very /gi, ''],
	[/patchy /gi, ''],
	[/Areas Of /gi, ''],
	[/areas /gi, ''],
	[/dense /gi, ''],
	[/Thunderstorm/g, 'T\'Storm'],
];
const shortenExtendedForecastText = (long) => {
	// run all regexes
	const short = regexList.reduce((working, [regex, replace]) => working.replace(regex, replace), long);

	let conditions = short.split(' ');
	if (short.indexOf('then') !== -1) {
		conditions = short.split(' then ');
		conditions = conditions[1].split(' ');
	}

	let short1 = conditions[0].substr(0, 10);
	let short2 = '';
	if (conditions[1]) {
		if (short1.endsWith('.')) {
			short1 = short1.replace(/\./, '');
		} else {
			short2 = conditions[1].substr(0, 10);
		}

		if (short2 === 'Blowing') {
			short2 = '';
		}
	}
	let result = short1;
	if (short2 !== '') {
		result += ` ${short2}`;
	}

	return result;
};

// register display
registerDisplay(new ExtendedForecast(8, 'extended-forecast'));
