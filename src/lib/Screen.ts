import * as clc from 'cli-color'
import { assign, get } from 'lodash'
import * as keypress from 'keypress'

// Interfaces
import {
    Component,
    LayoutConfig,
    MappedRow,
    RowElement,
    RowOptions,
    ScreenOptions,
    ScreenOptionsUser
} from '../interfaces/'

// UI Classes
import { Box, ProgressBar } from './'

export class Screen {
    private readonly reservedNames: Array<string> = ['layout']
    private readonly availableComponents: Array<string> = ['Box', 'ProgressBar', 'Space']
    private readonly propertyMatch: { [prop: string]: RegExp } = {
        name: /name\[(.*?)\]/,
        width: /width\[(\d*?)\]/,
    }

    private rowMap: Map<number, MappedRow> = new Map()
    private screen: { [name: string]: Component } = {}
    private _opts: ScreenOptions = {
        x: 0,
        y: 0,
        width: clc.windowSize.width,
        height: clc.windowSize.height,
    }

    public get components(): { [name: string]: Component } { return this.screen }

    constructor(options: ScreenOptionsUser = {}) {
        this.parseScreenOptions(options)
        this._opts = assign(this._opts, options)

        // Adjust available dimensions
        if (!('height' in options)) {
            this._opts.height -= this._opts.y
        }
        if (!('width' in options)) {
            this._opts.width -= this._opts.x
        }
    }

    buildLayout(layoutConfig: LayoutConfig): { [name: string]: Component } {
        const layout = get(layoutConfig, 'layout')
        if (layout === undefined) {
            throw new Error(`Layout error: 'layout' property omitted.`)
        }

        const optionsBlock = get(layoutConfig, 'options', {})

        // Vertical Space
        let heightRemaining = this._opts.height
        let fillRows: number = 0
        let filledRows: number = 0
        let yOffset: number = this._opts.y

        layout.forEach((row: Array<string>, i: number) => {
            let rowItems: Array<RowElement> = []
            row.forEach(block => rowItems.push(this.parseRowItem(block, optionsBlock)))
            rowItems = this.sizeRowItemWidths(rowItems)
            const options: RowOptions = this.parseRowOptions(get(layoutConfig, `options.layout.${i}`, {}))

            if (options.height === 'fill') {
                fillRows++
            } else {
                heightRemaining -= Number(options.height)
            }

            const rowObj: MappedRow = {
                items: rowItems,
                options: options
            }
            this.rowMap.set(i, rowObj)
        })

        this.rowMap.forEach((value: MappedRow, key: number, map: Map<number, MappedRow>) => {
            if (value.options.height === 'fill') {
                filledRows++
                let height = Math.floor(heightRemaining / fillRows)
                heightRemaining -= height
                if (fillRows === filledRows) {
                    height += heightRemaining
                }
                value.options.height = height
                map.set(key, value)
            }

            let hI = 0
            let PosX = this._opts.x
            value.items.forEach((item: RowElement) => {
                const name: string = !!item.name ? item.name : `_d${key}x${hI++}:${Math.floor(Math.random() * 100)}`
                const [el, newPosX] = this.renderRowItem(item, value.options, PosX, yOffset)
                this.screen[name] = el
                PosX = newPosX
            })

            yOffset += Number(value.options.height)
        })

        return this.screen
    }

    parseScreenOptions(opts: ScreenOptionsUser): void {
        Object.keys(opts).forEach(key => {
            if (typeof (opts[key]) === 'string') {
                if (['x', 'width'].includes(key) && opts[key].includes('%')) {
                    opts[key] = Math.floor(clc.windowSize.width * this.toPercent(opts[key]))
                } else if (['y', 'height'].includes(key) && opts[key].includes('%')) {
                    opts[key] = Math.floor(clc.windowSize.height * this.toPercent(opts[key]))
                }
            }
        })

        this._opts = assign(this._opts, opts)
    }

    toPercent(percent: string): number {
        return Number(percent.replace('%', '')) / 100
    }

    private renderRowItem(item: RowElement, rowOptions: RowOptions, PosX: number, PosY: number): [Component, number] {
        let component: Component
        switch (item.type) {
            case 'Box':
                item.options = assign(item.options, {
                    w: item.width,
                    h: rowOptions.height,
                    x: PosX,
                    y: PosY,
                })
                component = new Box(item.options)
                break
            case 'ProgressBar':
                break
            case 'Space':
                break
            default:
                throw new Error(`'${item.type}' is not a valid type.`)
        }

        const xOffset: number = Number(item.width) + PosX
        return [component, xOffset]
    }

    private parseRowOptions(options: RowOptions): RowOptions {
        if ('height' in options) {
            if (typeof options.height === 'string' && (options.height as string).includes('%')) {
                options.height = Math.floor(this._opts.height * (Number(options.height.replace('%', '')) / 100))
            } else if (typeof options.height === 'string' && options.height === 'fill') {
                // Nothing here, yet
            } else if (isNaN(Number(options.height))) {
                throw new Error(`Invalid height value: '${options.height}' is not a number.`)
            } else {
                options.height = Number(options.height)
            }
        } else {
            options.height = 'fill'
        }

        return options
    }

    private sizeRowItemWidths(row: Array<RowElement>): Array<RowElement> {
        // Horizontal Space
        let widthRemaining = this._opts.width
        let fillItems: number = 0
        let filledItems: number = 0
        row.forEach((item: RowElement, i: number) => {
            switch (item.width) {
                case 'fill':
                    fillItems++
                    break
                default:
                    widthRemaining -= item.width
                    break
            }
        })
        row.forEach((item: RowElement, i: number) => {
            if (item.width === 'fill') {
                filledItems++
                let fillWidth = Math.floor(widthRemaining / fillItems)
                widthRemaining -= fillWidth
                if (fillItems === filledItems) {
                    fillWidth += widthRemaining
                }
                row[i].width = fillWidth
            }
        })

        return row
    }

    private parseRowItem(stringBlock: string, optionBlock): RowElement {
        const out: RowElement = {
            type: '',
            name: '',
            width: undefined,
            height: 1,
            options: {}
        }

        const [componentType, properties] = stringBlock.split(':', 2)
        if (!this.availableComponents.includes(componentType)) {
            throw new Error(`Component type '${componentType}' does not exist. Available options are ${this.availableComponents.join(', ')}`)
        }

        out.type = componentType

        // Non-dynamic components
        if (componentType === 'Space') {
            const width: RegExpMatchArray = !!properties ? properties.match(this.propertyMatch.width) : undefined
            const isValidNum: boolean = !!width ? !isNaN(Number(width[1])) : false
            if (!!width && isValidNum) {
                out.width = Number(width[1])
            } else if (!!width && !isValidNum) {
                throw new Error(`The 'width' property value must be numeric.`)
            } else {
                out.width = 1
            }
        }

        // Dynamic components
        const name: RegExpMatchArray = !!properties ? properties.match(this.propertyMatch.name) : undefined
        if (!!name) {
            out.name = name[1]
            if (this.reservedNames.includes(out.name)) {
                throw new Error(`The name '${out.name}' is reserved. The following are reserved names: ${this.reservedNames.join(', ')}`)
            }
            // Check if there are options for this property
            out.options = get(optionBlock, name[1], {})
        }

        if (out.width === undefined) {
            out.width = 'fill'
        }

        return out
    }
}
