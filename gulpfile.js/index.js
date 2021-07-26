'use strict';
/*
* credit:
* https://gulpjs.com/docs/en/api/watch/
* https://github.com/dlmanning/gulp-sass#readme
* https://github.com/gonsakon/gulpDemo3
* */

const sass = require('gulp-sass')(require('node-sass'))
const gulp = require('gulp');
const { series, parallel } = require('gulp');
const nunjucksRender = require('gulp-nunjucks-render')
const $ = require('gulp-load-plugins')({ lazy: false });
const autoprefixer = require('autoprefixer');
const minimist = require('minimist');
const browserSync = require('browser-sync').create();
const { env } = require('./env');

let options = minimist(process.argv.slice(2), env);
console.log(`Current mode：${options.env}`);

function copyFile() {
  return gulp.src(env.copyFile.src)
    .pipe(gulp.dest(env.copyFile.path))
    .pipe(
      browserSync.reload({
        stream: true,
      }),
    );
}
function buildHTML() {
  return gulp.src(env.html.src)
    .pipe($.plumber())
    .pipe($.frontMatter())
    .pipe(nunjucksRender({
      path: [
        'src/views/',
        'src/views/_layouts/',
        'src/views/_includes/',
      ]
    }))
    .pipe(gulp.dest(env.html.path))
    .pipe(
      browserSync.reload({
        stream: true,
      })
    );
}

function buildScss() {
  const plugins = [
    autoprefixer(),
  ];
  return gulp.src(env.style.src)
    .pipe($.sourcemaps.init())
    .pipe(sass.sync({
      outputStyle: 'compressed'
    }).on('error', sass.logError))
    .pipe($.postcss(plugins))
    .pipe($.concat(env.style.concat))
    .pipe($.sourcemaps.write('.'))
    .pipe(gulp.dest(env.style.path))
    .pipe(
      browserSync.reload({
        stream: true,
      }),
    );
}

function buildBabel() {
  return gulp.src(env.javascript.src)
    .pipe($.sourcemaps.init())
    .pipe($.babel({
      presets: ['@babel/env'],
    }))
    .pipe($.concat(env.javascript.concat))
    .pipe($.sourcemaps.write('.'))
    .pipe(gulp.dest(env.javascript.path))
    .pipe(
      browserSync.reload({
        stream: true,
      }),
    );
}

function vendorsJs() {
  return gulp.src(env.vendors.src)
    .pipe($.concat(env.vendors.concat))
    .pipe(gulp.dest(env.vendors.path));
}

function browser() {
  browserSync.init({
    server: {
      baseDir: env.browserDir,
    },
    port: 8080,
  });
}

function clean() {
  return gulp.src(env.clean.src, {
    read: false,
    allowEmpty: true,
  })
    .pipe($.clean());
}

function deploy() {
  return gulp.src(env.deploySrc)
    .pipe($.ghPages());
}

function watch() {
  gulp.watch(env.html.src, gulp.series(buildHTML));
  gulp.watch(env.html.watch, series(buildHTML));
  gulp.watch(env.javascript.src, gulp.series(buildBabel));
  gulp.watch(env.img.src, gulp.series(copyFile));
  gulp.watch(env.style.src, gulp.series(buildScss));
}

exports.deploy = deploy;

exports.clean = clean;

exports.build = gulp.series(clean, copyFile, buildHTML, buildScss, buildBabel, vendorsJs);

exports.default = gulp.series(clean, copyFile, buildHTML, buildScss, buildBabel, vendorsJs, gulp.parallel(browser, watch));
