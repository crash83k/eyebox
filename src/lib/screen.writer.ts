import * as clc from 'cli-color'
import { Box, ProgressBar, Screen } from './'

export const clearScreen = (): void => {
    process.stdout.write(clc.reset)
}

export const drawBox = (options?) => {
    const box = new Box(options)
    const max = Math.floor(Math.random() * 1000)
    const bar = new ProgressBar([
        box[2], box[3]
    ], 0, max)

    let i = 1
    let timer = setInterval(() => {
        bar.value = i
        if (i === max) {
            clearInterval(timer)
            setTimeout(() => {
                setTimeout(() => {
                    process.stdout.write(clc.move.bottom)
                    process.stdout.write(clc.move.up(5))
                    // process.exit()
                }, 2000)
            })
        }
        i++
    }, Math.floor(Math.random() * 100))

    box[1].write('Box dimensions: ' + JSON.stringify(getDims()), {fgColor: 149})

    return Box
}

export const getDims = (): { columns: number, rows: number } => ({
    columns: clc.windowSize.width,
    rows: clc.windowSize.height,
})

export const drawLayout = (layout):  Map<number, any> => {
    const screen = new Screen()
    return screen.buildLayout(layout)
}
