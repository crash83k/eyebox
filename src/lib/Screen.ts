import * as clc from 'cli-color'
import { assign, get } from 'lodash'

// Interfaces
import { ScreenOptions } from '../interfaces/'

// UI Classes
import { Box, ProgressBar } from '.'

declare interface RowElement {
    type: string,
    name?: string,
    width: number,
    height: number,
    options?: { [key: string]: any }
}

export class Screen {
    private readonly components: Array<string> = ['Box', 'ProgressBar', 'Space']
    private readonly propertyMatch: { [prop: string]: RegExp } = {
        name: /name\[(.*?)\]/,
        width: /width\[(\d*?)\]/,
    }
    private readonly _opts: ScreenOptions = {
        width: clc.windowSize.width,
        height: clc.windowSize.height,
    }

    private rowMap: Map<number, any> = new Map()

    constructor(options: ScreenOptions = {}) {
        this._opts = assign(this._opts, options)
    }

    buildLayout(layoutConfig): Map<number, any> {
        const layout = get(layoutConfig, 'layout')
        if (layout === undefined) {
            throw new Error(`Layout error: 'layout' property omitted.`)
        }

        const optionsBlock = get(layoutConfig, 'options', {})

        layout.forEach((row: Array<string>, i: number) => {
            let rowItems: Array<RowElement> = []
            row.forEach(block => rowItems.push(this.parseRowItem(block, optionsBlock)))
            this.rowMap.set(i, rowItems)
        })

        return this.rowMap
    }

    private parseRowItem(stringBlock: string, optionBlock): RowElement {
        const out: RowElement = {
            type: '',
            name: '',
            width: 0,
            height: 1,
            options: {}
        }

        const [componentType, properties] = stringBlock.split(':', 2)
        if (!this.components.includes(componentType)) {
            throw new Error(`Component type '${componentType}' does not exist. Available options are ${this.components.join(', ')}`)
        }

        out.type = componentType

        if (componentType === 'Space') {
            const width: RegExpMatchArray = properties.match(this.propertyMatch.width)
            if (!!width && !isNaN(Number(width[1]))) {
                out.width = Number(width[1])
            } else {
                throw new Error(`Space components require a 'width' property with a numeric value.`)
            }
        }

        const name: RegExpMatchArray = properties.match(this.propertyMatch.name)
        if (!!name) {
            out.name = name[1]
            // Check if there are options for this property
            out.options = get(optionBlock, name[1], {})
        }

        return out
    }
}
