# WeatherStar 4000 for Firebot

This is a *highly* modified version of the [WeatherStar 4000+ emulator](https://github.com/netbymatt/ws4kp), built as a plugin for [Firebot](https://github.com/crowbartools/Firebot) that provides a self-contained overlay.

Once installed and configured in Firebot, you can access the overlay from the internal Firebot web server at `/integrations/weatherstar-4000/overlay` (default URL is `http://localhost:7472/integrations/weatherstar-4000/overlay`).

**NOTE**: This plugin only works for US-based locations as it relies on NWS/NOAA APIs.

## Development

### Setup
1. Clone it
2. `npm install`
3. ???
4. PROFIT

WeatherStar 4000+ source code is in `./weatherstar-src`. Plugin source code is in `./src`.

### Building
Dev:
1. `npm run build:dev`
- Automatically builds WeatherStar 4000+, builds the full Firebot plugin, and copies the compiled .js to Firebot's scripts folder.

Release:
1. `npm run build`
- Copy .js from `/dist`