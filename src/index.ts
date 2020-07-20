import { clearScreen, drawBox, getDims } from './lib/screen.writer'

const {columns = 100, rows = 50} = getDims()

clearScreen()
// drawBox('left box2', {})

const box = {
    w: (columns / 2) - 2,
    h: rows - 8,
    yPadding: 1,
    drawLineNumbers: true,
}

// drawBox('', box)

drawBox(Object.assign(box, {
    contentFgColor: 'redBright',
    // w: columns,
    title: 'left box',
}))
drawBox(Object.assign(box, {
    x: box.w + 3,
    contentFgColor: 'blueBright',
    title: 'right box',
}))
