/* eslint-disable import/no-extraneous-dependencies */
import {
	src, dest, series, parallel,
} from 'gulp';
import concat from 'gulp-concat';
import terser from 'gulp-terser';
import postcss from 'gulp-postcss';
import ejs from 'gulp-ejs';
import rename from 'gulp-rename';
import dartSass from 'sass';
import gulpSass from 'gulp-sass';
import htmlmin from 'gulp-html-minifier-terser';
import { deleteAsync } from 'del';
import webpack from 'webpack-stream';
import TerserPlugin from 'terser-webpack-plugin';
import { readFileSync } from 'fs';
import url from 'postcss-url';
import fileInline from 'gulp-file-inline';
import inlineImages from 'gulp-inline-images';

const sass = gulpSass(dartSass);

const RESOURCES_PATH = './weatherstar-dist';

const clean = () => deleteAsync([`${RESOURCES_PATH}/**/*`]);

const jsSourcesData = [
	'weatherstar-src/scripts/data/travelcities.js',
	'weatherstar-src/scripts/data/regionalcities.js',
	'weatherstar-src/scripts/data/stations.js',
];

const webpackOptions = {
	mode: 'production',
	output: {
		filename: 'ws.min.js',
		publicPath: '',
		chunkFilename: '[name].min.js',
	},
	resolve: {
		roots: ['./'],
	},
	module: {
		rules: [
			{
				test: /\.webp$/,
				type: 'asset/inline',
			},
		],
	},
	optimization: {
		minimize: true,
		minimizer: [
			new TerserPlugin({
				extractComments: false,
				terserOptions: {
					// sourceMap: true,
					format: {
						comments: false,
					},
				},
			}),
		],
	},
};

const compressJsData = () => src(jsSourcesData)
	.pipe(concat('data.min.js'))
	.pipe(terser())
	.pipe(dest(RESOURCES_PATH));

const jsVendorSources = [
	'weatherstar-src/scripts/vendor/auto/suncalc.js',
];

const compressJsVendor = () => src(jsVendorSources)
	.pipe(concat('vendor.min.js'))
	.pipe(terser())
	.pipe(dest(RESOURCES_PATH));

const mjsSources = [
	'weatherstar-src/scripts/modules/currentweatherscroll.mjs',
	'weatherstar-src/scripts/modules/hazards.mjs',
	'weatherstar-src/scripts/modules/currentweather.mjs',
	'weatherstar-src/scripts/modules/almanac.mjs',
	'weatherstar-src/scripts/modules/spc-outlook.mjs',
	'weatherstar-src/scripts/modules/icons.mjs',
	'weatherstar-src/scripts/modules/extendedforecast.mjs',
	'weatherstar-src/scripts/modules/hourly.mjs',
	'weatherstar-src/scripts/modules/hourly-graph.mjs',
	'weatherstar-src/scripts/modules/latestobservations.mjs',
	'weatherstar-src/scripts/modules/localforecast.mjs',
	'weatherstar-src/scripts/modules/radar.mjs',
	'weatherstar-src/scripts/modules/regionalforecast.mjs',
	'weatherstar-src/scripts/modules/travelforecast.mjs',
	'weatherstar-src/scripts/modules/progress.mjs',
	'weatherstar-src/scripts/index.mjs',
];

const buildJs = () => src(mjsSources)
	.pipe(webpack(webpackOptions))
	.pipe(dest(RESOURCES_PATH));

const cssSources = [
	'weatherstar-src/styles/scss/main.scss',
];
const buildCss = () => src(cssSources)
	.pipe(sass({ outputStyle: 'compressed' }))
	.pipe(postcss([url({ url: 'inline' })]))
	.pipe(rename('ws.min.css'))
	.pipe(dest(RESOURCES_PATH));

const htmlSources = [
	'weatherstar-src/views/*.ejs',
];
const compressHtml = () => {
	const packageJson = readFileSync('package.json');
	const { weatherstarVersion } = JSON.parse(packageJson);

	return src(htmlSources)
		.pipe(ejs({
			version: weatherstarVersion,
		}))
		.pipe(fileInline())
		.pipe(inlineImages({
			basedir: './weatherstar-src',
		}))
		.pipe(rename({ extname: '.html' }))
		.pipe(htmlmin({ collapseWhitespace: true }))
		.pipe(dest(RESOURCES_PATH));
};

const postClean = () => deleteAsync([
	`${RESOURCES_PATH}/data.min.js`,
	`${RESOURCES_PATH}/vendor.min.js`,
	`${RESOURCES_PATH}/ws.min.js`,
	`${RESOURCES_PATH}/ws.min.css`,
]);

const buildWeatherStar = series(clean, parallel(buildJs, compressJsData, compressJsVendor, buildCss), compressHtml, postClean);

export default buildWeatherStar;
