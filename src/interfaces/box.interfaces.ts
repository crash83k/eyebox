import { TextOptions } from './'

export interface BoxCharacters {
    topLeft?: string,
    topRight?: string,
    bottomRight?: string,
    bottomLeft?: string,
    vertical?: string,
    horizontal?: string,
    titleLeft?: string,
    titleRight?: string,
}

export interface BoxOptions {
    x?: number
    y?: number
    w?: number
    h?: number
    xPadding?: number
    yPadding?: number
    titleFgColor?: string | number
    titleBgColor?: string | number
    borderFgColor?: string | number
    borderBgColor?: string | number
    contentFgColor?: string | number
    contentBgColor?: string | number
    drawLineNumbers?: boolean
    title?: string
    box?: BoxCharacters
}

export interface BoxWriteQueueItem {
    x: number,
    y: number,
    text: string
}

export interface BoxLineFns {
    write: (text?: string, options?: TextOptions) => void
    getWidth: () => number
    getBoxHeight: () => number
}
