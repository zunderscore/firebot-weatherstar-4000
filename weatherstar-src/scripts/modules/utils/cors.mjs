// rewrite some urls for local server
const rewriteUrl = (_url) => {
	let url = _url;
	url = url.replace('https://api.weather.gov/', `${window.location.protocol}//${window.location.host}/integrations/weatherstar-4000/weather-api?path=`);
	url = url.replace('https://www.cpc.ncep.noaa.gov/', `${window.location.protocol}//${window.location.host}/integrations/weatherstar-4000/weather-api?path=`);
	return url;
};

export {
	// eslint-disable-next-line import/prefer-default-export
	rewriteUrl,
};
