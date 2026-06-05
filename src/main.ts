import firebot, { Plugin } from "@crowbartools/firebot-types";

const packageInfo = require("../package.json");
const indexPage = require("../weatherstar-dist/index.html");
const radarWorkerJs = require("../weatherstar-dist/radar-worker.min.js");

type Settings = {
    location: string;
    wide: boolean;
    speed: string;
    scanLines: boolean;
    units: string;
    refreshTime: number;
    screens: string[];
}

const WEATHER_API_USER_AGENT = "Firebot WeatherStar 4000 Plugin; zwilliamson@outlook.com";

let settings: Settings;
let cachedLocation: {
    name?: string,
    lat?: number,
    lon?: number
} = {};

const round2 = (value: number, decimals: number) => Math.trunc(value * 10 ** decimals) / 10 ** decimals;

async function updateLocationData() {
    if (cachedLocation?.name !== settings.location) {
        firebot.logger.debug(`Location changed from ${cachedLocation?.name ?? "none"} to ${settings.location}. Updating location cache.`);

        const locationSearchCategories = [
            'Land Features',
            'Bay', 'Channel', 'Cove', 'Dam', 'Delta', 'Gulf', 'Lagoon', 'Lake', 'Ocean', 'Reef', 'Reservoir', 'Sea', 'Sound', 'Strait', 'Waterfall', 'Wharf', // Water Features
            'Amusement Park', 'Historical Monument', 'Landmark', 'Tourist Attraction', 'Zoo', // POI/Arts and Entertainment
            'College', // POI/Education
            'Beach', 'Campground', 'Golf Course', 'Harbor', 'Nature Reserve', 'Other Parks and Outdoors', 'Park', 'Racetrack',
            'Scenic Overlook', 'Ski Resort', 'Sports Center', 'Sports Field', 'Wildlife Reserve', // POI/Parks and Outdoors
            'Airport', 'Ferry', 'Marina', 'Pier', 'Port', 'Resort', // POI/Travel
            'Postal', 'Populated Place',
        ];

        const suggestionParams: Record<string, string> = {
            f: "json",
            countryCode: "USA",
            category: locationSearchCategories.join(','),
            maxSuggestions: "10",
            text: settings.location,
        };

        const suggestionUrl = `https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/suggest?${new URLSearchParams(suggestionParams).toString()}`;
        const suggestedResults = await fetch(suggestionUrl);

        if (suggestedResults.ok) {
            const suggestionData = (await suggestedResults.json())["suggestions"][0];

            const locationParams: Record<string, string> = {
                text: suggestionData.text,
                magicKey: suggestionData.magicKey,
                f: "json"
            };

            const locationUrl = `https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/find?${new URLSearchParams(locationParams).toString()}`;
            const locationResult = await fetch(locationUrl);

            if (locationResult.ok) {
                const locationData = (await locationResult.json())["locations"][0];

                cachedLocation = {
                    name: settings.location,
                    lat: round2(locationData.feature.geometry.y, 4),
                    lon: round2(locationData.feature.geometry.x, 4)
                }
            } else {
                firebot.logger.error(`Error getting location data: ${await locationResult.text()}`);
            }
        } else {
            firebot.logger.error(`Error getting suggestion data: ${await suggestedResults.text()}`);
        }
    } else {
        firebot.logger.debug("Location hasn't changed. Retaining cached value.");
    }
}

async function updateSettings(parameters: Settings) {
    settings = parameters;

    await updateLocationData();
}

async function convertSettings() {
    let speed = 1.0;

    switch (settings.speed) {
        case "Very Fast":
            speed = 0.5;
            break;

        case "Fast":
            speed = 0.75;
            break;

        case "Slow":
            speed = 1.25;
            break;

        case "Very Slow":
            speed = 1.5;
            break;

        default:
            speed = 1.0;
            break;
    }

    const convertedSettings: Record<string, any> = {
        location: cachedLocation,
        wide: settings.wide,
        speed,
        scanLines: settings.scanLines,
        units: settings.units === 'US' ? 'us' : 'si',
        refreshTime: settings.refreshTime * 60 * 1000,
        screens: settings.screens
    };

    return convertedSettings;
}

const plugin: Plugin<Settings> = {
    manifest: {
        name: "WeatherStar 4000 for Firebot",
        description: packageInfo.description,
        author: packageInfo.author,
        version: packageInfo.version,
        icon: "fa-sun",
        color: "#FFFF00",
        repo: "https://github.com/zunderscore/firebot-weatherstar-4000",
        minimumFirebotVersion: { major: 5, minor: 67 },
        type: "plugin",
    },
    parametersSchema: [
        {
            name: "location",
            type: "string",
            default: "Seattle, WA",
            title: "Location",
            description: "Either ZIP Code or City, State"
        },
        {
            name: "wide",
            type: "boolean",
            default: true,
            title: "Widescreen",
        },
        {
            name: "speed",
            type: "enum",
            default: "Normal",
            title: "Speed",
            options: [
                "Very Fast",
                "Fast",
                "Normal",
                "Slow",
                "Very Slow"
            ]
        },
        {
            name: "scanLines",
            type: "boolean",
            default: false,
            title: "Scan Lines"
        },
        {
            name: "units",
            type: "enum",
            default: "US",
            title: "Units",
            options: [
                "US",
                "Metric"
            ]
        },
        {
            name: "refreshTime",
            type: "enum",
            default: 10,
            title: "Refresh Time (in minutes)",
            options: [
                5,
                10,
                15,
                30
            ]
        },
        {
            name: "screens",
            type: "multiselect",
            title: "Screens",
            settings: {
                options: [
                    { id: "hazards", name: "Hazards" },
                    { id: "current-weather", name: "Current Conditions" },
                    { id: "latest-observations", name: "Latest Observations" },
                    { id: "hourly", name: "Hourly Forecast" },
                    { id: "hourly-graph", name: "Hourly Graph" },
                    { id: "travel", name: "Travel Forecast" },
                    { id: "regional-forecast", name: "Regional Forecast" },
                    { id: "local-forecast", name: "Local Forecast" },
                    { id: "extended-forecast", name: "Extended Forecast" },
                    { id: "almanac", name: "Almanac" },
                    { id: "spc-outlook", name: "Storm Prediction Center Outlook" },
                    { id: "radar", name: "Local Radar" },
                ]
            },
            default: [
                "hazards",
                "current-weather",
                "latest-observations",
                "hourly-graph",
                "regional-forecast",
                "local-forecast",
                "extended-forecast",
                "almanac",
                "spc-outlook",
                "radar",
            ]
        }
    ],
    registers: {
        httpRoutes: {
            prefix: "weatherstar-4000",
            routes: [
                {
                    path: "/status",
                    method: "GET",
                    handler: async (_, res) => {
                        res.send({
                            status: "WeatherStar 4000 is running",
                            settings: await convertSettings()
                        })
                    }
                },
                {
                    path: "/settings",
                    method: "GET",
                    handler: async (_, res) => {
                        res.send(await convertSettings());
                    }
                },
                {
                    path: "/weather-api",
                    method: "GET",
                    handler: async (req, res) => {
                        const weatherApiUrl = `https://api.weather.gov/${req.query.path}`;
                        const weatherApiResponse = await fetch(weatherApiUrl, {
                            headers: {
                                "User-Agent": WEATHER_API_USER_AGENT
                            }
                        });

                        if (weatherApiResponse.ok) {
                            const weatherApiResponseBody = await weatherApiResponse.json();
                            res.send(weatherApiResponseBody);
                        } else {
                            const errorData = await weatherApiResponse.json();
                            firebot.logger.warn(`Error retrieving ${req.query.path} from Weather.gov API (${weatherApiResponse.status}): ${JSON.stringify(errorData)}`)
                            res.status(weatherApiResponse.status).send(errorData);
                        }
                    }
                },
                {
                    path: "/overlay",
                    method: "GET",
                    handler: (_, res) => {
                        res.contentType("text/html").send(indexPage);
                    }
                },
                // We host this twice so that both '/overlay' and '/overlay/' work
                {
                    path: "/radar-worker.min.js",
                    method: "GET",
                    handler: (_, res) => {
                        res.contentType("text/javascript").send(radarWorkerJs);
                    }
                },
                {
                    path: "/overlay/radar-worker.min.js",
                    method: "GET",
                    handler: (_, res) => {
                        res.contentType("text/javascript").send(radarWorkerJs);
                    }
                }
            ]
        }
    },
    onLoad: async (context) => {
        await updateSettings(context.parameters);
    },
    onParameterUpdate: async (context) => {
        await updateSettings(context.parameters);
    }
}

export default plugin;