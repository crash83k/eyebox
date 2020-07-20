import { clearScreen, drawBox, getDims, drawLayout } from './lib/screen.writer'

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

const layout: Map<number, any> = drawLayout({
    layout: [
        ['Box:name[leftBox]', 'Space:width[1]', 'Box:name[rightBox]'],
        ['Box:name[debugBox]'],
    ],
    options: {
        layout: [
            {height: '80%'},
            {height: '20%'},
        ],
        leftBox: {},
        rightBox: {},
    }
})

console.log(layout)
