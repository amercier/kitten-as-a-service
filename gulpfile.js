const del = require('del');
const gulp = require('gulp');
const babel = require('gulp-babel');
const csso = require('gulp-csso');
const htmlMinifier = require('gulp-html-minifier');
const inlineSource = require('gulp-inline-source');
const sass = require('gulp-sass');
const uglify = require('gulp-uglify');
const sassInlineImages = require('sass-inline-image');
const pump = require('pump');
const named = require('vinyl-named');
const webpack = require('webpack-stream');

const sourceDir = './src';
const destDir = './dist';

gulp.task('clean', () => del([`${destDir}/**`]));

gulp.task('copy', ['clean'], cb => pump([
  gulp.src(`${sourceDir}/**`),
  gulp.dest(destDir),
], cb));

gulp.task('build:js', ['copy'], cb => pump([
  gulp.src(`${destDir}/js/*.js`),
  named(),
  webpack(),
  babel({ presets: ['latest'] }),
  uglify(),
  gulp.dest(`${destDir}/js`),
], cb));

gulp.task('build:scss', ['copy'], cb => pump([
  gulp.src(`${destDir}/scss/*.scss`),
  sass({
    functions: sassInlineImages({ base: destDir }),
  }).on('error', sass.logError),
  csso(),
  gulp.dest(`${destDir}/css`),
], cb));

gulp.task('build:html', ['build:js', 'build:scss'], cb => pump([
  gulp.src(`${destDir}/**/*.html`),
  inlineSource({ compress: false }),
  htmlMinifier({ collapseWhitespace: true }),
  gulp.dest(destDir),
], cb));

gulp.task('build:clean', ['build:html'], () => del([`${destDir}/{css,js,scss,spinner.gif}`]));

gulp.task('build', ['build:clean']);
gulp.task('default', ['build']);
