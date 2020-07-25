import { sample } from 'lodash'

import { clearScreen, drawBox, getDims, drawLayout, quit } from './lib/screen.writer'
import { Component } from './interfaces'
import { Box, Logger } from './lib'

const {columns = 100, rows = 50} = getDims()

clearScreen()
// drawBox('left box2', {})

// const box = {
//     w: (columns / 2) - 2,
//     h: rows - 8,
//     yPadding: 1,
//     drawLineNumbers: true,
// }

// drawBox(Object.assign(box, {
//     contentFgColor: 'redBright',
//     // w: columns,
//     title: 'left box',
// }))
// drawBox(Object.assign(box, {
//     x: box.w + 3,
//     contentFgColor: 'blueBright',
//     title: 'right box',
// }))

const layoutConfig = {
    layout: [
        ['Box:name[leftBox]', 'Space', 'Box:name[rightBox]'],
        ['Box:name[debugBox]'],
    ],
    options: {
        layout: [
            {height: '60%'},
            {height: 'fill'},
        ],
        leftBox: {drawLineNumbers: true, title: 'Left Top Box'},
        rightBox: {drawLineNumbers: true, title: 'Right Top Box'},
        debugBox: {
            drawLineNumbers: true,
            title: 'Bottom Debug Log Box',
            box: {
                topLeft: '╔',
                topRight: '╗',
                bottomRight: '╝',
                bottomLeft: '╚',
                vertical: '║',
                horizontal: '═',
                titleLeft: '╡',
                titleRight: '╞',
            },
        },
    }
}
const screenConfig = {y: '5%', height: '90%'}
const layout: { [name: string]: Component } = drawLayout(layoutConfig, screenConfig)

const leftBox = layout.leftBox as Box
const rightBox = layout.rightBox as Box
const debugBox = layout.debugBox as Box

const logger = new Logger(debugBox)
leftBox.title = 'First box to get drawn'

logger.log('test')
logger.warn('test 2')

const loggers = ['log', 'warn', 'success', 'error', 'info', 'debug']
let logNum = 0

function randomLog() {
    const method = sample(loggers)
    logNum++
    logger[method](`${method}:${logNum} ${Math.random()}`)
    rightBox.line(1).write('Log Number: ' + logNum)
}

const stopper = logger.time('First timer test')
setTimeout(stopper, 1000)
// setInterval(randomLog, 1000)
