import * as clc from 'cli-color'
import { assign } from 'lodash'
import { BehaviorSubject } from 'rxjs'
import { filter } from 'rxjs/operators'

import { BoxOptions, Instruction, TextOptions, WriteLineFn } from '../interfaces'

export class Box {
    private readonly _opts: BoxOptions = {
        w: clc.windowSize.width, h: clc.windowSize.height, x: 0, y: 0,
        xPadding: 1,
        yPadding: 0,
        titleFgColor: 'whiteBright',
        titleBgColor: undefined,
        borderFgColor: 41,
        borderBgColor: undefined,
        contentFgColor: 'whiteBright',
        contentBgColor: undefined,
        drawLineNumbers: false,
    }
    private _title: string = ''
    private _write: BehaviorSubject<Instruction> = new BehaviorSubject(undefined)
    private _bounds: { lines: number, width: number } = {lines: 0, width: 0}

    public box = {
        topLeft: '┌',
        topRight: '┐',
        bottomRight: '┘',
        bottomLeft: '└',
        vertical: '│',
        horizontal: '─',
    }

    public set title(title: string) {
        this._title = title
        this.drawTop()
    }

    public get title(): string {
        return this._title + ''
    }

    constructor(options: BoxOptions = {}) {
        this._opts = assign(this._opts, options)

        this._bounds.lines = this._opts.h - 2 - (this._opts.yPadding * 2)
        this._bounds.width = this._opts.w - (2 * this.box.vertical.length) - (this._opts.xPadding * 2)

        this.title = options.title
        this.start()
        this.drawTop()
        this.drawMiddle()
        this.drawBottom()

        return assign(this, this.constructLines())
    }

    drawTop(): void {
        const posX = this._opts.x
        const posY = this._opts.y
        const box = this.box
        const horizontal = this._opts.w - 2
        let title = this._title

        let hLeftSize = Math.ceil(horizontal / 2)
        let hRightSize = Math.floor(horizontal / 2)

        if (title !== undefined) {
            hLeftSize = Math.floor(((horizontal - 2) - title.length) / 2)
            hRightSize = horizontal - hLeftSize - this._title.length - 2

            title = this.formatText(title, {
                fgColor: this._opts.titleFgColor,
                bgColor: this._opts.titleBgColor,
            })
        }

        // top
        let top = box.topLeft
            + box.horizontal.repeat(hLeftSize)
            + (!!this._title ? '[' + title + ']' : '')
            + box.horizontal.repeat(hRightSize)
            + box.topRight

        top = this.getFgColor(this._opts.borderFgColor, top)
        top = this.getBgColor(this._opts.borderBgColor, top)

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
            left = this.getFgColor(this._opts.borderFgColor, left)
            left = this.getBgColor(this._opts.borderBgColor, left)
            this._write.next({x: posX, y: posY, text: left})

            posX += this._opts.w - 1
            let right = box.vertical
            right = this.getFgColor(this._opts.borderFgColor, right)
            right = this.getBgColor(this._opts.borderBgColor, right)
            this._write.next({x: posX, y: posY, text: right})
        }
    }

    private getLineNumber(boxLine: number): string {
        if (boxLine <= this._opts.yPadding || boxLine >= this._opts.h - 2) {
            return ''
        }
        boxLine -= this._opts.yPadding
        return String(boxLine)
    }

    drawBottom(): void {
        let posX = this._opts.x
        let posY = this._opts.h - 1
        const box = this.box

        let text = box.bottomLeft + box.horizontal.repeat(this._opts.w - 2) + box.bottomRight
        text = this.getFgColor(this._opts.borderFgColor, text)
        text = this.getBgColor(this._opts.borderBgColor, text)
        this._write.next({x: posX, y: posY, text})
    }

    private getFgColor(c: string | number, text: string): string {
        if (c === undefined) {
            return text
        }
        this.checkColor(c)
        return typeof c === 'string'
            ? clc[c](text)
            : clc.xterm(c)(text)
    }

    private getBgColor(c: string | number, text: string): string {
        if (c === undefined) {
            return text
        }

        if (typeof c === 'string' && c.substr(0, 2) !== 'bg') {
            c = 'bg' + c[0].toUpperCase() + c.substr(1)
        }

        this.checkColor(c)
        return typeof c === 'string'
            ? clc[c](text)
            : clc.bgXterm(c)(text)
    }

    private checkColor(c: string | number): void {
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

    private constructLines(): { [line: number]: WriteLineFn } {
        const lines: { [line: number]: WriteLineFn } = {}
        for (let l = 1; l <= this._bounds.lines - (this._opts.yPadding * 2); l++) {
            lines[l] = this.makeLine(l + this._opts.yPadding)
        }
        return lines
    }

    private makeLine(line: number): WriteLineFn {
        const posX = this._opts.x + 1 + this._opts.xPadding
        const posY = this._opts.y + line
        const width = this._bounds.width

        return {
            write: (text?: string, options: TextOptions = {}): void => {
                if (!!text) {
                    const ogTextLen = text.length
                    text = this.formatText(text, options)
                    const lenDelta = text.length - ogTextLen
                    this._write.next({x: posX, y: posY, text: text.substr(0, width + lenDelta)})
                } else {
                    this._write.next({x: posX, y: posY, text: ' '.repeat(width)})
                }
            },
            getHeight: () => this._bounds.lines,
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
                    text = this.getFgColor(options[prop], text)
                    break
                case 'bgColor':
                    text = this.getBgColor(options[prop], text)
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
            .subscribe((i: Instruction) => {
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
