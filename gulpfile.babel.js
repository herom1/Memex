import fs from 'fs'
import path from 'path'
import { exec as nodeExec} from 'child_process'
import pify from 'pify'
import gulp from 'gulp'
import addsrc from 'gulp-add-src'
import clipEmptyFiles from 'gulp-clip-empty-files'
import concatCss from 'gulp-concat-css'
import identity from 'gulp-identity'
import source from 'vinyl-source-stream'
import buffer from 'vinyl-buffer'
import uglify from 'gulp-uglify'
import eslint from 'gulp-eslint'
import browserify from 'browserify'
import watchify from 'watchify'
import babelify from 'babelify'
import envify from 'loose-envify/custom'
import uglifyify from 'uglifyify'
import cssModulesify from 'css-modulesify'
import cssnext from 'postcss-cssnext'

const exec = pify(nodeExec)


// === Tasks for building the source code; result is put into ./extension ===

const staticFiles = {
    'src/manifest.json': 'extension',
    'src/*.html': 'extension',
    'node_modules/webextension-polyfill/dist/browser-polyfill.js': 'extension/lib',
    'node_modules/pdfjs-dist/build/pdf.worker.min.js': 'extension/lib',
    'node_modules/semantic-ui-css/semantic.min.css': 'extension/lib/semantic-ui',
    'node_modules/semantic-ui-css/themes/**/*': 'extension/lib/semantic-ui/themes',
}

const sourceFiles = [
    'background.js',
    'content_script.js',
    'overview/overview.jsx',
    'local-page/local-page.js',
    'popup/popup.js',
]

const browserifySettings = {
    debug: true,
    extensions: ['.jsx', '.css'],
    paths: ['.'],
}

function createBundle({filePath, watch = false, production = false}) {
    const { dir, name, ext } = path.parse(filePath)
    const entries = [path.join('src', filePath)]
    const destination = path.join('extension', dir)
    const output = `${name}.js` // ignore original filename extension, to replace jsx with js.

    // Hard-code the inclusion of any css file with the same name as the script.
    // We append any css-modules imported from the script to this css file.
    const cssInputPath = path.join('src', dir, `${name}.css`)
    const cssOutput = `${name}.css`

    let b = watch
        ? watchify(browserify({...watchify.args, ...browserifySettings, entries}))
            .on('update', bundle)
        : browserify({...browserifySettings, entries})
    b.transform(babelify)
    b.transform(envify({
        NODE_ENV: production ? 'production' : 'development',
    }), {global: true})

    b.plugin(cssModulesify, {
        global: true, // for importing css modules from e.g. react-datepicker.
        rootDir: path.join('src', dir),
        // output: path.join(destination, cssOutput), // We read the stream instead (see below)
        postcssBefore: [
            cssnext,
        ],
    })
    b.on('css stream', stream => {
        // Append the css-modules output to the script's eponymous plain css file (if any).
        // TODO resolve & copy @import and url()s
        stream
            .pipe(source('css-modules-output.css')) // pretend the streamed data had this filename.
            .pipe(buffer()) // concatCss & clipEmptyFiles do not support streamed files.
            .pipe(addsrc.prepend(cssInputPath))
            .pipe(concatCss(cssOutput, {inlineImports: false}))
            .pipe(clipEmptyFiles()) // Drop file if no output was produced (e.g. no background.css)
            .pipe(gulp.dest(destination))
    })

    if (production) {
        b.transform(uglifyify, {global: true})
    }

    function bundle() {
        let startTime = Date.now()
        b.bundle()
            .on('error', error => console.error(error.message))
            .pipe(source(output))
            .pipe(buffer())
            .pipe(production ? uglify({output: {ascii_only: true}}) : identity())
            .pipe(gulp.dest(destination))
            .on('end', () => {
                let time = (Date.now() - startTime) / 1000
                console.log(`Bundled ${output} in ${time}s.`)
            })
    }

    bundle()
}

gulp.task('copyStaticFiles', () => {
    for (let filename in staticFiles) {
        console.log(`Copying '${filename}' to '${staticFiles[filename]}'..`)
        gulp.src(filename)
            .pipe(gulp.dest(staticFiles[filename]))
    }
})

gulp.task('lint', () => {
    return gulp.src(['src/**/*.js', 'src/**/*.jsx'])
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.results(results => {
            console.log(`Total Errors: ${results.errorCount}`)
        }))
})

gulp.task('build-prod', ['copyStaticFiles', 'lint'], () => {
    sourceFiles.forEach(filePath => createBundle({filePath, watch: false, production: true}))
})

gulp.task('build', ['copyStaticFiles', 'lint'], () => {
    sourceFiles.forEach(filePath => createBundle({filePath, watch: false}))
})

gulp.task('build-watch', ['copyStaticFiles'], () => {
    sourceFiles.forEach(filePath => createBundle({filePath, watch: true}))
})

gulp.task('lint-watch', ['lint'], () => {
    gulp.watch(['src/**/*.js', 'src/**/*.jsx'])
    .on('change', (file) => {
        return gulp.src(file.path)
        .pipe(eslint())
        .pipe(eslint.format())
    })
})

gulp.task('watch', ['build-watch', 'lint-watch'])


// === Tasks for packaging the extension; results go into ./dist/{browser} ===

function getManifest() {
    const manifest = JSON.parse(fs.readFileSync('./extension/manifest.json'))
    return manifest
}

function getFilename() {
    const { name, version } = getManifest()
    const filename = `${name.toLowerCase()}-${version}`
    return filename
}

gulp.task('package-firefox', async () => {
    const filename = getFilename()
    const buildXpiCommand = `web-ext -s ./extension -a ./dist/firefox build`
    await exec(buildXpiCommand)
    // web-ext will have named the file ${filename}.zip. Change .zip to .xpi.
    await exec(`rename -f "s/\\.zip$/.xpi/" dist/firefox/${filename}.zip`)
})

gulp.task('package-chromium', async () => {
    const filename = getFilename()
    const buildCrxCommand = (
        `crx pack ./extension`
        + ` -o ./dist/chromium/${filename}.crx`
        + ` -p .chrome-extension-key.pem`
    )
    await exec(buildCrxCommand)
})

gulp.task('package', ['package-firefox', 'package-chromium'])
