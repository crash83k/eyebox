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
}

export interface TextOptions {
    fgColor?: string | number
    bgColor?: string | number
    bold?: boolean
    italic?: boolean
    underline?: boolean
    blink?: boolean
    inverse?: boolean
    strike?: boolean

    // ToDo: Implement throb
    // throb?: { intervalMs: number, timeoutMs: number }
}

export interface Instruction {
    x: number,
    y: number,
    text: string
}

export interface WriteLineFn {
    write: (text?: string, options?: TextOptions) => void
    getWidth: () => number
    getHeight: () => number
}
