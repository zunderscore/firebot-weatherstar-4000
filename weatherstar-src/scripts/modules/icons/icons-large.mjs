/* spell-checker: disable */
// internal function to add path to returned icon
const addPath = (icon) => `current-conditions ${icon}`;

const largeIcon = (link, _isNightTime) => {
	if (!link) return false;

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
		case 'hot':
		case 'haze':
		case 'cold':
			return addPath('sunny');

		case 'skc-n':
		case 'nskc':
		case 'nskc-n':
		case 'cold-n':
			return addPath('clear');

		case 'sct':
		case 'few':
		case 'bkn':
			return addPath('partly-cloudy');

		case 'bkn-n':
		case 'few-n':
		case 'nfew-n':
		case 'nfew':
		case 'sct-n':
		case 'nsct':
		case 'nsct-n':
			return addPath('mostly-clear');

		case 'ovc':
		case 'novc':
		case 'ovc-n':
			return addPath('cloudy');

		case 'fog':
		case 'fog-n':
			return addPath('fog');

		case 'rain_sleet':
		case 'rain_sleet-n':
			return addPath('rain-sleet');

		case 'sleet':
		case 'sleet-n':
			return addPath('sleet');

		case 'rain_showers':
		case 'rain_showers_high':
		case 'rain_showers-n':
		case 'rain_showers_high-n':
			return addPath('shower');

		case 'rain':
		case 'rain-n':
			return addPath('rain');

		case 'snow':
		case 'snow-n':
			if (value > 50) return addPath('heavy-snow');
			return addPath('light-snow');

		case 'rain_snow':
			return addPath('rain-snow');

		case 'snow_fzra':
		case 'snow_fzra-n':
			return addPath('freezing-rain-snow');

		case 'fzra':
		case 'fzra-n':
		case 'rain_fzra':
		case 'rain_fzra-n':
			return addPath('freezing-rain');

		case 'snow_sleet':
			return addPath('snow-sleet');

		case 'tsra_sct':
		case 'tsra':
			return addPath('scattered-thunderstorms-day');

		case 'tsra_sct-n':
		case 'tsra-n':
			return addPath('scattered-thunderstorms-night');

		case 'tsra_hi':
		case 'tsra_hi-n':
		case 'hurricane':
		case 'tropical_storm':
		case 'hurricane-n':
		case 'tropical_storm-n':
			return addPath('thunderstorm');

		case 'wind_few':
		case 'wind_sct':
		case 'wind_bkn':
		case 'wind_ovc':
		case 'wind_skc':
		case 'wind_few-n':
		case 'wind_bkn-n':
		case 'wind_ovc-n':
		case 'wind_skc-n':
		case 'wind_sct-n':
			return addPath('windy');

		case 'blizzard':
		case 'blizzard-n':
			return addPath('blowing-snow');

		default:
			console.log(`Unable to locate icon for ${conditionName} ${link} ${isNightTime}`);
			return false;
	}
};

export default largeIcon;
