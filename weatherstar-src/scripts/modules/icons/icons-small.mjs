// internal function to add path to returned icon
const addPath = (icon) => `regional-maps ${icon}`;

const smallIcon = (link, _isNightTime) => {
	// extract day or night if not provided
	const isNightTime = _isNightTime ?? link.indexOf('/night/') >= 0;

	// grab everything after the last slash ending at any of these: ?&,
	const afterLastSlash = link.toLowerCase().match(/[^/]+$/)[0];
	let conditionName = afterLastSlash.match(/(.*?)[&,.?]/)[1];
	// using probability as a crude heavy/light indication where possible
	const value = +(link.match(/,(\d{2,3})/) ?? [0, 100])[1];

	// if a 'DualImage' is captured, adjust to just the j parameter
	if (conditionName === 'dualimage') {
		const match = link.match(/&j=(.*)&/);
		[, conditionName] = match;
	}

	// find the icon
	switch (conditionName + (isNightTime ? '-n' : '')) {
		case 'skc':
			return addPath('sunny');

		case 'skc-n':
		case 'nskc':
		case 'nskc-n':
		case 'cold-n':
			return addPath('clear-1992');

		case 'bkn':
			return addPath('mostly-cloudy-1994');

		case 'bkn-n':
		case 'few-n':
		case 'nfew-n':
		case 'nfew':
			return addPath('partly-clear-1994');

		case 'sct':
		case 'few':
			return addPath('partly-cloudy');

		case 'sct-n':
		case 'nsct':
		case 'nsct-n':
			return addPath('partly-cloudy-night');

		case 'ovc':
		case 'ovc-n':
			return addPath('cloudy');

		case 'fog':
		case 'fog-n':
			return addPath('fog');

		case 'rain_sleet':
			return addPath('rain-sleet');

		case 'rain_showers':
		case 'rain_showers_high':
			return addPath('scattered-showers-1994');

		case 'rain_showers-n':
		case 'rain_showers_high-n':
			return addPath('scattered-showers-night-1994');

		case 'rain':
		case 'rain-n':
			return addPath('rain-1992');

		case 'snow':
		case 'snow-n':
			if (value > 50) return addPath('heavy-snow-1994');
			return addPath('light-snow');

		case 'rain_snow':
		case 'rain_snow-n':
			return addPath('rain-snow-1992');

		case 'snow_fzra':
		case 'snow_fzra-n':
			return addPath('freezing-rain-snow-1994');

		case 'fzra':
		case 'fzra-n':
		case 'rain_fzra':
		case 'rain_fzra-n':
			return addPath('freezing-rain-1992');

		case 'snow_sleet':
		case 'snow_sleet-n':
			return addPath('snow-sleet');

		case 'sleet':
		case 'sleet-n':
			return addPath('sleet');

		case 'tsra_sct':
		case 'tsra':
			return addPath('scattered-tstorms-1994');

		case 'tsra_sct-n':
		case 'tsra-n':
			return addPath('scattered-tstorms-night-1994');

		case 'tsra_hi':
		case 'tsra_hi-n':
		case 'hurricane':
		case 'tropical_storm':
		case 'hurricane-n':
		case 'tropical_storm-n':
			return addPath('thunderstorm');

		case 'wind':
		case 'wind_':
		case 'wind_few':
		case 'wind_sct':
		case 'wind-n':
		case 'wind_-n':
		case 'wind_few-n':
			return addPath('wind');

		case 'wind_bkn':
		case 'wind_ovc':
		case 'wind_bkn-n':
		case 'wind_ovc-n':
			return addPath('cloudy-wind');

		case 'wind_skc':
			return addPath('sunny-wind-1994');

		case 'wind_skc-n':
		case 'wind_sct-n':
			return addPath('clear-wind-1994');

		case 'blizzard':
		case 'blizzard-n':
			return addPath('blowing-snow');

		case 'cold':
			return addPath('cold');

		case 'smoke':
		case 'smoke-n':
			return addPath('smoke');

		case 'hot':
			return addPath('hot');

		case 'haze':
			return addPath('haze');

		default:
			console.log(`Unable to locate regional icon for ${conditionName} ${link} ${isNightTime}`);
			return false;
	}
};

export default smallIcon;
