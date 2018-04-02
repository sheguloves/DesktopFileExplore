'use strict'

process.env.NODE_ENV = 'production';

const chalk = require('chalk');
const del = require('del');
const packager = require('electron-packager');
const webpack = require('webpack');
const Multispinner = require('multispinner');

const buildConfig = require('./build.config');
const mainConfig = require('./webpack.main.config');

const doneLog = chalk.bgGreen.white(' DONE ') + ' ';
const errorLog = chalk.bgRed.white(' ERROR ') + ' ';
const okayLog = chalk.bgBlue.white(' OKAY ') + ' ';


if (process.env.BUILD_TARGET === 'clean') {
    clean();
} else {
    build();
}

function clean() {
    del.sync(['build/*', 'dist/*'])
    console.log(`\n${doneLog}\n`)
    process.exit()
}

function build() {
    del.sync(['dist/electron/*'])

    const tasks = ['main']
    const m = new Multispinner(tasks, {
        preText: 'building',
        postText: 'process'
    })

    let results = ''

    m.on('success', () => {
        process.stdout.write('\x1B[2J\x1B[0f')
        console.log(`\n\n${results}`)
        console.log(`${okayLog}take it away ${chalk.yellow('`electron-packager`')}\n`)
        bundleApp()
    })

    pack(mainConfig).then(result => {
        results += result + '\n\n'
        m.success('main')
    }).catch(err => {
        m.error('main')
        console.log(`\n  ${errorLog}failed to build main process`)
        console.error(`\n${err}\n`)
        process.exit(1)
    })
}

function pack(config) {
    return new Promise((resolve, reject) => {
        webpack(config, (err, stats) => {
            if (err) reject(err.stack || err)
            else if (stats.hasErrors()) {
                let err = ''

                stats.toString({
                        chunks: false,
                        colors: true
                    })
                    .split(/\r?\n/)
                    .forEach(line => {
                        err += `    ${line}\n`
                    })

                reject(err)
            } else {
                resolve(stats.toString({
                    chunks: false,
                    colors: true
                }))
            }
        })
    })
}

function bundleApp() {
    packager(buildConfig, (err, appPaths) => {
        if (err) {
            console.log(`\n${errorLog}${chalk.yellow('`electron-packager`')} says...\n`)
            console.log(err + '\n')
        } else {
            console.log(`\n${doneLog}\n`)
        }
    })
}
