const gulp = require('gulp');
const uglify = require('gulp-uglify-es').default;
const uglifycss = require('gulp-uglifycss');

function jsViewer() {
    return gulp.src('src/js/viewer.js')
        .pipe(uglify())
        .pipe(gulp.dest('dist/js/'));
}

function jsLibs() {
    return gulp.src([
            'src/libs/model-viewer.js',
            'src/libs/jquery.min.js'
        ])
        .pipe(uglify())
        .pipe(gulp.dest('dist/libs/'));
}

function copyResources() {
    return gulp.src(['src/resources/**/*'])
        .pipe(gulp.dest('dist/resources'));
}

function copyHtml() {
    return gulp.src(['src/index.html', 'src/viewer.html'])
        .pipe(gulp.dest('dist'));
}

exports.default = gulp.parallel(
    jsViewer,
    jsLibs,
    copyResources,
    copyHtml
);