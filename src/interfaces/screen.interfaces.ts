import { Box, ProgressBar } from '../lib'
import { BoxOptions } from './'

export declare type Component = Box | ProgressBar | string

export declare interface LayoutConfig {
    layout: Array<Array<string>>
    options: {
        [name: string]: RowOptions | BoxOptions | Array<RowOptions>
        layout: Array<RowOptions>
    }
}

export declare interface RowElement {
    type: string,
    name?: string,
    width: number | 'fill',
    height: number | 'fill',
    options?: { [key: string]: any }
}

export declare interface ScreenOptions {
    x?: number
    y?: number
    width?: number
    height?: number
}

export declare interface ScreenOptionsUser {
    x?: number | string
    y?: number | string
    width?: number | string
    height?: number | string
}

export declare interface RowOptions {
    height?: number | string
}

export declare interface MappedRow {
    items: Array<RowElement>,
    options: RowOptions
}
