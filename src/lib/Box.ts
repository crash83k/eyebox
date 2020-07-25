import * as clc from 'cli-color'
import { assign, get } from 'lodash'
import { BehaviorSubject } from 'rxjs'
import { filter } from 'rxjs/operators'
import { getFgColor, getBgColor } from '../helpers/clc.utility'

import { BoxOptions, BoxWriteQueueItem, TextOptions, BoxLineFns, BoxCharacters } from '../interfaces'

export class Box {
    private readonly _opts: BoxOptions = {
        w: clc.windowSize.width,
        h: clc.windowSize.height,
        x: 0,
        y: 0,
        xPadding: 1,
        yPadding: 0,
        titleFgColor: 'whiteBright',
        titleBgColor: undefined,
        borderFgColor: 41,
        borderBgColor: undefined,
        contentFgColor: 'whiteBright',
        contentBgColor: undefined,
        drawLineNumbers: false,
        box: {
            topLeft: '┌',
            topRight: '┐',
            bottomRight: '┘',
            bottomLeft: '└',
            vertical: '│',
            horizontal: '─',
            titleLeft: '[',
            titleRight: ']',
        }
    }
    private _title: string = ''
    private _write: BehaviorSubject<BoxWriteQueueItem> = new BehaviorSubject(undefined)
    private _bounds: { lines: number, width: number } = {lines: 0, width: 0}
    private _lineFunctions: { [line: number]: BoxLineFns } = {}

    public box: BoxCharacters

    public set title(title: string) {
        this._title = title
        this.drawTop()
    }

    public get title(): string {
        return this._title + ''
    }

    public get lineCount(): number { return Number(this._bounds.lines) }

    constructor(options: BoxOptions = {}) {
        this._opts = assign(this._opts, options)
        this.box = get(this._opts, 'box')

        this._bounds.lines = this._opts.h - 2 - (this._opts.yPadding * 2)
        this._bounds.width = this._opts.w - (2 * this.box.vertical.length) - (this._opts.xPadding * 2)

        this.title = options.title
        this.start()
        this.drawTop()
        this.drawMiddle()
        this.drawBottom()
        this.constructLines()
    }

    line(line: number): BoxLineFns {
        return get(this._lineFunctions, line)
    }

    drawTop(): void {
        const posX = this._opts.x
        const posY = this._opts.y
        const box = this.box
        const horizontal = this._opts.w - 2
        let title = get(this, '_title', '').trim()

        let hLeftSize = Math.ceil(horizontal / 2)
        let hRightSize = Math.floor(horizontal / 2)

        if (title !== undefined && typeof title === 'string' && !!title.trim()) {
            // Center Title
            hLeftSize = Math.floor(((horizontal - 2) - title.length) / 2)
            hRightSize = (
                horizontal
                - hLeftSize
                - this._title.length
                - this.box.titleLeft.length
                - this.box.titleRight.length
            )

            title = this.formatText(title, {
                fgColor: this._opts.titleFgColor,
                bgColor: this._opts.titleBgColor,
            })
        }

        // top
        let top = box.topLeft
            + box.horizontal.repeat(hLeftSize)
            + (!!this._title ? this.box.titleLeft + title + this.box.titleRight : '')
            + box.horizontal.repeat(hRightSize)
            + box.topRight

        top = getFgColor(this._opts.borderFgColor, top)
        top = getBgColor(this._opts.borderBgColor, top)

        this._write.next({x: posX, y: posY, text: top})
    }

    drawMiddle(): void {
        let posX = this._opts.x
        let posY = this._opts.y
        const vertical = this._opts.h - 2
        const box = this.box

        for (let v = 1; v <= vertical; v++) {
            posY++
            posX = this._opts.x

            let left = box.vertical + (this._opts.drawLineNumbers ? ' '.repeat(this._opts.xPadding) + this.getLineNumber(v) : '')
            left = getFgColor(this._opts.borderFgColor, left)
            left = getBgColor(this._opts.borderBgColor, left)
            this._write.next({x: posX, y: posY, text: left})

            posX += this._opts.w - 1
            let right = box.vertical
            right = getFgColor(this._opts.borderFgColor, right)
            right = getBgColor(this._opts.borderBgColor, right)
            this._write.next({x: posX, y: posY, text: right})
        }
    }

    private getLineNumber(boxLine: number): string {
        if (boxLine <= this._opts.yPadding || boxLine >= this._opts.h - 1 - this._opts.yPadding) {
            return ''
        }
        boxLine -= this._opts.yPadding
        return String(boxLine)
    }

    drawBottom(): void {
        const posX = this._opts.x
        const posY = this._opts.h + this._opts.y - 1
        const box = this.box

        let text = box.bottomLeft + box.horizontal.repeat(this._opts.w - 2) + box.bottomRight
        text = getFgColor(this._opts.borderFgColor, text)
        text = getBgColor(this._opts.borderBgColor, text)
        this._write.next({x: posX, y: posY, text})
    }

    private constructLines(): { [line: number]: BoxLineFns } {
        const lines: { [line: number]: BoxLineFns } = {}
        for (let l = 1; l <= this._bounds.lines - (this._opts.yPadding * 2); l++) {
            this._lineFunctions[l] = this.makeLine(l + this._opts.yPadding)
        }
        return lines
    }

    private makeLine(line: number): BoxLineFns {
        const posX = this._opts.x + 1 + this._opts.xPadding
        const posY = this._opts.y + line
        const width = this._bounds.width

        return {
            write: (text?: string, options: TextOptions = {}): void => {
                if (!!text) {
                    const ogTextLen = text.length
                    text = this.formatText(text, options)
                    const lenDelta = text.length - ogTextLen
                    text = text.substr(0, width + lenDelta)
                    text += ogTextLen < width ? ' '.repeat(width - ogTextLen) : ''
                    this._write.next({x: posX, y: posY, text})
                } else {
                    this._write.next({x: posX, y: posY, text: ' '.repeat(width)})
                }
            },
            getBoxHeight: () => this._bounds.lines,
            getWidth: () => width
        }
    }

    formatText(text: string, options: TextOptions): string {
        options = assign({
            fgColor: this._opts.contentFgColor,
            bgColor: this._opts.contentBgColor,
        }, options)
        Object.keys(options).forEach(prop => {
            switch (prop) {
                case 'fgColor':
                    text = getFgColor(options[prop], text)
                    break
                case 'bgColor':
                    text = getBgColor(options[prop], text)
                    break
                case 'blink':
                case 'bold':
                case 'inverse':
                case 'italic':
                case 'strike':
                case 'underline':
                    text = clc[prop](text)
                    break
            }
        })

        return text
    }

    private start(): void {
        let t: any
        this._write
            .pipe(filter(i => i !== undefined))
            .subscribe((i: BoxWriteQueueItem) => {
                if (!!t) {
                    clearTimeout(t)
                }

                process.stdout.write(clc.move.to(i.x, i.y))
                process.stdout.write(i.text)
                t = setTimeout(() => this.goToEnd(), 100)
            })
    }

    private goToEnd(): void {
        process.stdout.write(clc.move.bottom)
        process.stdout.write(clc.move.lineBegin)
        process.stdout.write(clc.move.up(2))
    }
}
