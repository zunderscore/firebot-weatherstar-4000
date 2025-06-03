// regional forecast and observations
// type 0 = observations, 1 = first forecast, 2 = second forecast

import STATUS from './status.mjs';
import { distance as calcDistance } from './utils/calc.mjs';
import { json } from './utils/fetch.mjs';
import { temperature as temperatureUnit } from './utils/units.mjs';
import { getSmallIcon } from './icons.mjs';
import { DateTime, Interval } from '../vendor/auto/luxon.mjs';
import WeatherDisplay from './weatherdisplay.mjs';
import { registerDisplay } from './navigation.mjs';
import * as utils from './regionalforecast-utils.mjs';
import { getPoint } from './utils/weather.mjs';

// map offset
const mapOffsetXY = {
	x: 240,
	y: 117,
};

class RegionalForecast extends WeatherDisplay {
	constructor(navId, elemId) {
		super(navId, elemId, 'Regional Forecast');

		// timings
		this.timing.totalScreens = 3;
	}

	async getData(weatherParameters, refresh) {
		if (!super.getData(weatherParameters, refresh)) return;
		// regional forecast implements a silent reload
		// but it will not fall back to previously loaded data if data can not be loaded
		// there are enough other cities available to populate the map sufficiently even if some do not load

		// pre-load the base map
		let baseMap = 'basemap';
		if (this.weatherParameters.state === 'HI') {
			baseMap = 'hawaii';
		} else if (this.weatherParameters.state === 'AK') {
			baseMap = 'alaska';
		}
		const mapImageElem = this.elem.querySelector('.map img');
		mapImageElem.classList.remove(...mapImageElem.classList);
		mapImageElem.classList.add(baseMap);

		// get user's location in x/y
		const sourceXY = utils.getXYFromLatitudeLongitude(this.weatherParameters.latitude, this.weatherParameters.longitude, mapOffsetXY.x, mapOffsetXY.y, this.weatherParameters.state);

		// get latitude and longitude limits
		const minMaxLatLon = utils.getMinMaxLatitudeLongitude(sourceXY.x, sourceXY.y, mapOffsetXY.x, mapOffsetXY.y, this.weatherParameters.state);

		// get a target distance
		let targetDistance = 2.5;
		if (this.weatherParameters.state === 'HI') targetDistance = 1;

		// make station info into an array
		const stationInfoArray = Object.values(StationInfo).map((station) => ({ ...station, targetDistance }));
		// combine regional cities with station info for additional stations
		// stations are intentionally after cities to allow cities priority when drawing the map
		const combinedCities = [...RegionalCities, ...stationInfoArray];

		// Determine which cities are within the max/min latitude/longitude.
		const regionalCities = [];
		combinedCities.forEach((city) => {
			if (city.lat > minMaxLatLon.minLat && city.lat < minMaxLatLon.maxLat
				&& city.lon > minMaxLatLon.minLon && city.lon < minMaxLatLon.maxLon - 1) {
				// default to 1 for cities loaded from RegionalCities, use value calculate above for remaining stations
				const targetDist = city.targetDistance || 1;
				// Only add the city as long as it isn't within set distance degree of any other city already in the array.
				const okToAddCity = regionalCities.reduce((acc, testCity) => {
					const distance = calcDistance(city.lon, city.lat, testCity.lon, testCity.lat);
					return acc && distance >= targetDist;
				}, true);
				if (okToAddCity) regionalCities.push(city);
			}
		});

		// get a unit converter
		const temperatureConverter = temperatureUnit();

		// get now as DateTime for calculations below
		const now = DateTime.now();

		// get regional forecasts and observations (the two are intertwined due to the design of api.weather.gov)
		const regionalDataAll = await Promise.all(regionalCities.map(async (city) => {
			try {
				const point = city?.point ?? (await getAndFormatPoint(city.lat, city.lon));
				if (!point || !point.wfo) throw new Error('No pre-loaded point');

				// start off the observation task
				const observationPromise = utils.getRegionalObservation(point, city);

				const forecast = await json(`https://api.weather.gov/gridpoints/${point.wfo}/${point.x},${point.y}/forecast`);

				// get XY on map for city
				const cityXY = utils.getXYForCity(city, minMaxLatLon.maxLat, minMaxLatLon.minLon, this.weatherParameters.state);

				// wait for the regional observation if it's not done yet
				const observation = await observationPromise;

				if (!observation) return false;

				// format the observation the same as the forecast
				const regionalObservation = {
					daytime: !!/\/day\//.test(observation.icon),
					temperature: temperatureConverter(observation.temperature.value),
					name: utils.formatCity(city.city),
					icon: observation.icon,
					x: cityXY.x,
					y: cityXY.y,
				};

				// return a pared-down forecast
				// 0th object should contain the current conditions, but when WFOs go offline or otherwise don't post
				// an updated forecast it's possible that the 0th object is in the past.
				// so we go on a search for the current time in the start/end times provided in the forecast periods
				const { periods } = forecast.properties;
				const currentPeriod = periods.reduce((prev, period, index) => {
					const start = DateTime.fromISO(period.startTime);
					const end = DateTime.fromISO(period.endTime);
					const interval = Interval.fromDateTimes(start, end);
					if (interval.contains(now)) {
						return index;
					}
					return prev;
				}, 0);
				// group together the current observation and next two periods
				return [
					regionalObservation,
					utils.buildForecast(forecast.properties.periods[currentPeriod + 1], city, cityXY),
					utils.buildForecast(forecast.properties.periods[currentPeriod + 2], city, cityXY),
				];
			} catch (error) {
				console.log(`No regional forecast data for '${city.name ?? city.city}'`);
				console.log(error);
				return false;
			}
		}));

		// filter out any false (unavailable data)
		const regionalData = regionalDataAll.filter((data) => data);

		// test for data present
		if (regionalData.length === 0) {
			this.setStatus(STATUS.noData);
			return;
		}

		// return the weather data and offsets
		this.data = {
			regionalData,
			mapOffsetXY,
			sourceXY,
		};

		this.setStatus(STATUS.loaded);
	}

	drawCanvas() {
		super.drawCanvas();
		// break up data into useful values
		const { regionalData: data, sourceXY } = this.data;

		// draw the header graphics

		// draw the appropriate title
		const titleTop = this.elem.querySelector('.title.dual .top');
		const titleBottom = this.elem.querySelector('.title.dual .bottom');
		if (this.screenIndex === 0) {
			titleTop.innerHTML = 'Regional';
			titleBottom.innerHTML = 'Observations';
		} else {
			const forecastDate = DateTime.fromISO(data[0][this.screenIndex].time);

			// get the name of the day
			const dayName = forecastDate.toLocaleString({ weekday: 'long' });
			titleTop.innerHTML = 'Forecast for';
			// draw the title
			titleBottom.innerHTML = data[0][this.screenIndex].daytime
				? dayName
				: `${dayName} Night`;
		}

		// draw the map
		const scale = 640 / (mapOffsetXY.x * 2);
		const map = this.elem.querySelector('.map');
		map.style.transform = `scale(${scale}) translate(-${sourceXY.x}px, -${sourceXY.y}px)`;

		const cities = data.map((city) => {
			const fill = {};
			const period = city[this.screenIndex];

			fill.icon = { type: 'img', class: getSmallIcon(period.icon, !period.daytime) };
			fill.city = period.name;
			const { temperature } = period;
			fill.temp = temperature;

			const { x, y } = period;

			const elem = this.fillTemplate('location', fill);
			elem.style.left = `${x}px`;
			elem.style.top = `${y}px`;

			return elem;
		});

		const locationContainer = this.elem.querySelector('.location-container');
		locationContainer.innerHTML = '';
		locationContainer.append(...cities);

		this.finishDraw();
	}
}

const getAndFormatPoint = async (lat, lon) => {
	const point = await getPoint(lat, lon);
	return {
		x: point.properties.gridX,
		y: point.properties.gridY,
		wfo: point.properties.gridId,
	};
};

// register display
registerDisplay(new RegionalForecast(6, 'regional-forecast'));
