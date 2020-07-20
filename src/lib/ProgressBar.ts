import { WriteLineFn } from '../interfaces/box.interfaces'
import { ConstructorElement, LineItem, LineElement } from '../interfaces/progress-bar.interfaces'

export class ProgressBar {
    private readonly templateVariables: Array<string> = ['percent', 'bar', 'value', 'total', 'title', 'text']
    private templateVariable: RegExp = /{[A-z]{1,}(:[A-z0-9]*)?}/g
    private dynamicComponentRegex: RegExp = /({[A-z]{1,}:?[A-z0-9]*?})/
    private lines: Array<WriteLineFn>
    private formattedLines: Array<Array<LineElement | string>> = []
    private defaultFormat = {
        1: '.:[{bar:fill}]:. {percent}',
        2: '{value:4}/{total:4} ({percent} complete){nl}-:[{bar:fill}]:-',
    }

    private _template: string
    private _total: number = 0
    private _value: number = 0
    private _percent: number = 0
    private _text: string = ''
    private _title: string = ''
    private _barFilled: string = '*'
    private _barEmpty: string = ' '

    public set title(title: string) {
        this._title = title
        this.redraw()
    }
    public set text(text: string) {
        this._text = text
        this.redraw()
    }
    public set barFill(text: string) {
        this._barFilled = text
        this.redraw()
    }
    public set barEmpty(text: string) {
        this._barEmpty = text
        this.redraw()
    }
    public set format(format: string) {
        this._template = format
        this.formatBar()
        this.redraw()
    }

    public get total(): number { return Number(this._total) }
    public set total(total: number) {
        this._total = total
        this.redraw()
    }

    public get value(): number { return Number(this._value) }
    public set value(value: number) {
        this._value = value
        this.redraw()
    }

    constructor(lines: WriteLineFn[], initialValue?: number, total?: number, format?: string) {
        // Set default template
        if (!!format) {
            this._template = format
        } else if (lines.length > 3) {
            this._template = this.defaultFormat[3]
        } else {
            this._template = this.defaultFormat[lines.length]
        }

        this.lines = lines
        this._value = initialValue || 0
        this._total = total || 0
        this.formatBar()
        this.draw()
    }

    formatBar(): void {
        const fLine = this._template.split(/{nl}/gi)
        if (fLine.length > this.lines.length) {
            throw new Error(`Not enough lines to complete this format. ${fLine.length} line(s) were submitted, but ${this.lines.length} line(s) were provided.`)
        }
        fLine.forEach((template: string, i: number) => {
            this.formattedLines.push(this.fillLineVariables(template, this.lines[i]))
        })
    }

    fillLineVariables(lineTemplate: string, line: WriteLineFn): Array<LineElement | string> {
        const width = line.getWidth()
        const variables = lineTemplate.match(this.templateVariable)
        const componentList: Array<ConstructorElement> = this.constructLine(lineTemplate, variables)
        const mapLine: Array<LineElement | string> = []
        let lengthLeft: number = width
        let fillCount: number = 0
        let filledCount: number = 0

        // Update length monitors with length of static text in the line
        componentList.forEach(ce => {
            if (typeof ce === 'string') {
                lengthLeft -= ce.length
            }
        })

        const lineComponents: Array<LineElement> = variables

            // Pre-compute spacing (Phase 1 - Count the fills, subtract the static spacing)
            .map((template: string): LineItem => {
                const varSet = template.replace(/[{}]/g, '')
                let [variable, len = 'fill'] = varSet.split(':', 2)
                const num = Number(len)

                variable = variable.toLowerCase()

                if (!this.templateVariables.includes(variable)) {
                    throw new Error(`Progress bar variable '${variable}' is not valid. Valid variables are: ${this.templateVariables.join(', ')}`)
                }

                if (variable === 'percent') {
                    len = '4'
                } else if (!isNaN(num)) {
                    lengthLeft -= num
                } else if (len === 'fill') {
                    fillCount++
                }

                return {key: variable, size: len, template}
            })

            // Pre-compute spacing (Phase 2, Divvy up remaining space between 'fill' variables)
            .map((lineItem: LineItem) => {
                if (lineItem.size === 'fill') {
                    lineItem.size = Math.floor(lengthLeft / fillCount)
                    filledCount++
                    if (filledCount === fillCount && (width - lengthLeft) + lineItem.size < width) {
                        lineItem.size += width - ((width - lengthLeft) + lineItem.size)
                    }
                } else {
                    lineItem.size = Number(lineItem.size)
                }

                lineItem.size = Math.floor(lineItem.size)
                lengthLeft -= lineItem.size
                return lineItem
            })

            // Create molds and store them
            .map((lineItem: LineItem) => {
                const method = `_${lineItem.key}Mold`
                if (!(method in this)) {
                    throw new Error(`A mold method for ${lineItem.key} has not been developed.`)
                }
                return <LineElement>this[method](lineItem.size)
            })

        // Push the `LineElements` in place of the `ConstructorElements`
        componentList.forEach(el => {
            if (typeof el === 'object') {
                mapLine.push(lineComponents[el.index])
            } else {
                mapLine.push(el)
            }
        })

        // Return the finished LineElement array
        return mapLine
    }

    redraw(): void {
        this.calcPercent()
        this.draw()
    }

    private calcPercent(): number {
        let percent: number = 0
        if (this._value > 0 && this._total > 0) {
            percent = this._value / this.total * 100
        }

        this._percent = Math.floor(percent)
        return percent
    }

    private buildBar(totalWidth: number): string {
        const barCount = Math.floor(totalWidth * (this._percent / 100))
        return this._barFilled.repeat(barCount) + (totalWidth - barCount > 0 ? this._barEmpty.repeat(totalWidth - barCount) : '')
    }

    private constructLine(lineTemplate: string, variables: Array<string>): Array<ConstructorElement> {
        let variableIndex = 0
        const components: Array<ConstructorElement> = []
        lineTemplate.split(this.dynamicComponentRegex).forEach((e, i) => {
            if (this.dynamicComponentRegex.test(e)) {
                components.push({variable: variables[variableIndex], index: variableIndex++})
            } else {
                components.push(e)
            }
        })
        return components.filter(e => e !== '')
    }

    private adjustLength(text: string, length: number, align: 'left' | 'right' = 'left'): string {
        if (text.length >= length) {
            return text.substr(0, length)
        } else {
            if (align === 'left') {
                return text + ' '.repeat(length - text.length)
            } else if (align === 'right') {
                return ' '.repeat(length - text.length) + text
            }
        }
    }

    private draw(): void {
        this.formattedLines.forEach((line: Array<LineElement>, i: number) => {
            this.lines[i].write(this.renderLine(line))
        })
    }

    private renderLine(line: Array<LineElement>): string {
        return line.map((el: LineElement) => typeof el === 'string' ? el : el()).join('')
    }

    /* -- Template molds -- */

    private _percentMold(length: number): LineElement {
        return () => this.adjustLength(`${this._percent}%`, length)
    }

    private _totalMold(length: number): LineElement {
        return () => this.adjustLength(`${this._total}`, length)
    }

    private _valueMold(length: number): LineElement {
        return () => this.adjustLength(`${this._value}`, length, 'right')
    }

    private _textMold(length: number): LineElement {
        return () => this.adjustLength(`${this._text}`, length)
    }

    private _titleMold(length: number): LineElement {
        return () => this.adjustLength(`${this._title}`, length)
    }

    private _barMold(length: number): LineElement {
        return () => this.buildBar(length)
    }
}
