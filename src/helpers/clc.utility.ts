import * as clc from 'cli-color'

export const getFgColor = (c: string | number, text: string): string => {
    if (c === undefined) {
        return text
    }

    checkColor(c)
    return typeof c === 'string' ? clc[c](text) : clc.xterm(c)(text)
}

export const getBgColor = (c: string | number, text: string): string => {
    if (c === undefined) {
        return text
    }

    if (typeof c === 'string' && c.substr(0, 2) !== 'bg') {
        c = 'bg' + c[0].toUpperCase() + c.substr(1)
    }

    checkColor(c)
    return typeof c === 'string' ? clc[c](text) : clc.bgXterm(c)(text)
}

export const checkColor = (c: string | number): void => {
    switch (typeof c) {
        case 'string':
            if (typeof clc[c] !== 'function') {
                throw new Error(`Color constant '${c}' is not valid.`)
            }
            break

        case 'number':
            if (c < 0 || c > 255) {
                throw new Error(`Color number '${c}' is out of bounds. Acceptable values are 0 through 255.`)
            }
            break

        default:
            throw new Error(`Type error: ${c} is ${typeof c}, and is not a valid. Acceptable types are string and number.`)
    }
}
