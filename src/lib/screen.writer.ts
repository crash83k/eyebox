import * as clc from 'cli-color'

import { Box, ProgressBar, Screen } from './'
import { Component, LayoutConfig, ScreenOptionsUser } from '../interfaces'

export const clearScreen = (): void => {
    process.stdout.write(clc.reset)
}

export const drawBox = (options?) => {
    const box = new Box(options)
    const max = Math.floor(Math.random() * 1000)
    const bar = new ProgressBar([
        box.line(2), box.line(3)
    ], 0, max)

    let i = 1
    const timer = setInterval(() => {
        bar.value = i
        if (i === max) {
            clearInterval(timer)
        }
        i++
    }, Math.floor(Math.random() * 100))

    box.line(1).write('Box dimensions: ' + JSON.stringify(getDims()), {fgColor: 149})

    return Box
}

export const getDims = (): { columns: number, rows: number } => ({
    columns: clc.windowSize.width,
    rows: clc.windowSize.height,
})

export const drawLayout = (layout: LayoutConfig, screenOptions: ScreenOptionsUser = {}): { [name: string]: Component } => {
    const screen = new Screen(screenOptions)
    return screen.buildLayout(layout)
}

export const quit = () => {
    process.stdout.write(clc.move.bottom)
    process.stdout.write(clc.move.down(5))
    process.exit()
}
