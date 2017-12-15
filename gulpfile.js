const del = require('del');
const gulp = require('gulp');
const babel = require('gulp-babel');
const csso = require('gulp-csso');
const inlineSource = require('gulp-inline-source');
const sass = require('gulp-sass');
const uglify = require('gulp-uglify');
const named = require('vinyl-named');
const webpack = require('webpack-stream');

const sourceDir = './src';
const destDir = './dist';

gulp.task('clean', () => del([`${destDir}/**`]));

gulp.task('copy', ['clean'], () => gulp.src(`${sourceDir}/**`)
  .pipe(gulp.dest(destDir)));

gulp.task('build:js', ['copy'], () => gulp.src(`${destDir}/js/*.js`)
  .pipe(babel({ presets: ['env'] }))
  .pipe(named())
  .pipe(webpack())
  .pipe(uglify())
  .pipe(gulp.dest(`${destDir}/js`)));

gulp.task('build:scss', ['copy'], () => gulp.src(`${destDir}/scss/*.scss`)
  .pipe(sass().on('error', sass.logError))
  .pipe(csso())
  .pipe(gulp.dest(`${destDir}/css`)));

gulp.task('build:html', ['build:js', 'build:scss'], () => gulp.src(`${destDir}/**/*.html`)
  .pipe(inlineSource({ compress: false }))
  .pipe(gulp.dest(destDir)));

gulp.task('build:clean', ['build:html'], () => del([`${destDir}/{css,js,scss}`]));

gulp.task('build', ['build:clean']);
gulp.task('default', ['build']);
