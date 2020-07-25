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
