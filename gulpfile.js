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
const webpack = require('webpack-stream');

const sourceDir = './src';
const destDir = './dist';

function clean() {
  return del([`${destDir}/**`]);
}

function copy() {
  return gulp.src(`${sourceDir}/**`)
    .pipe(gulp.dest(destDir));
}

function scripts() {
  return gulp.src(`${destDir}/js/*.js`)
    .pipe(named())
    .pipe(webpack({ mode: 'production' }))
    .pipe(babel({ presets: ['@babel/preset-env'] }))
    .pipe(uglify())
    .pipe(gulp.dest(`${destDir}/js`));
}

function styles() {
  return gulp.src(`${destDir}/scss/*.scss`)
    .pipe(sass({
      functions: sassInlineImages({ base: destDir }),
    }).on('error', sass.logError))
    .pipe(csso())
    .pipe(gulp.dest(`${destDir}/css`));
}

function html() {
  return gulp.src(`${destDir}/**/*.html`)
    .pipe(inlineSource({ compress: false }))
    .pipe(htmlMinifier({ collapseWhitespace: true }))
    .pipe(gulp.dest(destDir));
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
