export declare type LogTypes = 'debug' | 'log' | 'info' | 'warn' | 'error' | 'assert' | 'time' | 'group' | 'success'

export declare type LogConstructionElement = [(prop?: string | number) => string, string?]

export declare interface LogLine {
    time: number
    type: string
    message: string
    group: number
}
