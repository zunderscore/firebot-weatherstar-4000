// internal function to add path to returned icon
const addPath = (icon) => `regional-maps ${icon}`;

const hourlyIcon = (skyCover, weather, iceAccumulation, probabilityOfPrecipitation, snowfallAmount, windSpeed, isNight = false) => {
	// possible phenomenon
	let thunder = false;
	let snow = false;
	let ice = false;
	let fog = false;
	let wind = false;

	// test the phenomenon for various value if it is provided.
	weather.forEach((phenomenon) => {
		if (!phenomenon.weather) return;
		if (phenomenon.weather.toLowerCase().includes('thunder')) thunder = true;
		if (phenomenon.weather.toLowerCase().includes('snow')) snow = true;
		if (phenomenon.weather.toLowerCase().includes('ice')) ice = true;
		if (phenomenon.weather.toLowerCase().includes('fog')) fog = true;
		if (phenomenon.weather.toLowerCase().includes('wind')) wind = true;
	});

	// first item in list is highest priority, units are metric where applicable
	if (iceAccumulation > 0 || ice) return addPath('freezing-rain-1992');
	if (snowfallAmount > 10) {
		if (windSpeed > 30 || wind) return addPath('blowing-snow');
		return addPath('heavy-snow-1994');
	}
	if ((snowfallAmount > 0 || snow) && thunder) return addPath('thundersnow');
	if (snowfallAmount > 0 || snow) return addPath('light-snow');
	if (thunder) return (addPath('thunderstorm'));
	if (probabilityOfPrecipitation > 70) return addPath('rain-1992');
	if (probabilityOfPrecipitation > 30) {
		if (!isNight) return addPath('scattered-showers-1994');
		return addPath('scattered-showers-night-1994');
	}
	if (fog) return addPath('fog');
	if (skyCover > 70) return addPath('cloudy');
	if (skyCover > 50) {
		if (!isNight) return addPath('mostly-cloudy-1994');
		return addPath('partly-clear-1994');
	}
	if (skyCover > 30) {
		if (!isNight) return addPath('partly-cloudy');
		return addPath('partly-cloudy-night');
	}
	if (isNight) return addPath('clear-1992');
	return addPath('sunny');
};

export default hourlyIcon;
