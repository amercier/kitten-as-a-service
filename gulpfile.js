const del = require('del');
const gulp = require('gulp');
const babel = require('gulp-babel');
const csso = require('gulp-csso');
const htmlMinifier = require('gulp-html-minifier');
const inlineSource = require('gulp-inline-source');
const sass = require('gulp-sass');
const uglify = require('gulp-uglify');
const sassInlineImages = require('sass-inline-image');
const named = require('vinyl-named');
const pump = require('pump');
const webpack = require('webpack-stream');

const sourceDir = './src';
const destDir = './dist';

function clean() {
  return del([`${destDir}/**`]);
}

function copy() {
  return pump(
    gulp.src(`${sourceDir}/**`),
    gulp.dest(destDir),
  );
}

function scripts() {
  return pump(
    gulp.src(`${destDir}/js/*.js`),
    named(),
    webpack({ mode: 'production' }),
    babel({ presets: ['@babel/preset-env'] }),
    uglify(),
    gulp.dest(`${destDir}/js`),
  );
}

function styles() {
  return pump(
    gulp.src(`${destDir}/scss/*.scss`),
    sass({
      functions: sassInlineImages({ base: destDir }),
    }).on('error', sass.logError),
    csso(),
    gulp.dest(`${destDir}/css`),
  );
}

function html() {
  return pump(
    gulp.src(`${destDir}/**/*.html`),
    inlineSource({ compress: false }),
    htmlMinifier({ collapseWhitespace: true }),
    gulp.dest(destDir),
  );
}

function cleanAfterBuild() {
  return del([`${destDir}/{css,js,scss,spinner.gif}`]);
}

const build = gulp.series(
  clean,
  copy,
  gulp.parallel(scripts, styles),
  html,
  cleanAfterBuild,
);

exports.clean = clean;
exports.default = build;
