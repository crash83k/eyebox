import { inspect } from 'util'
import * as moment from 'moment'

import { LineComponentIndex, LogConstructionElement, LogLine, LogTypes } from '../interfaces/'
import { Box } from './Box'

export class Logger {
    private readonly templateVariables: Array<string> = ['time', 'typeIcon', 'type', 'message']
    private readonly logTypes: Array<LogTypes> = ['debug', 'log', 'info', 'warn', 'error', 'assert', 'time', 'group', 'success']

    private templateVariable: RegExp = /{[A-z]{1,}(:[A-z0-9:\s-]*)?}/g
    private dynamicComponentRegex: RegExp = /({[A-z]{1,}:?[A-z0-9:\s-]*?})/
    private defaultFormat: string = '[{time:ll - LTS}] {typeIcon} {type}: {message}'
    private lineFormat: Array<LogConstructionElement> = []
    private lines: Array<LogLine> = []
    private timers: { [name: string]: [number, number] } = {}
    private groups: number = 0
    private lineWidth: number = 0

    private _template: string
    private _box: Box
    private _bufferSize: number = 50
    private _direction: 'asc' | 'desc' = 'desc'
    private _objectDepth: number = 3
    private _groupIndent: number = 2
    private _indentChar: { left: string, distance: string } = {left: '└', distance: '─'}

    private icons: { [type: string]: string } = {
        debug: '☼', log: '■', info: 'ℹ', warn: '⚠', error: '✖', assert: '✖', time: '◷', group: '⌂', success: '✔',
    }

    private colors: { [type: string]: [string | number, (string | number)?] } = {
        debug: ['whiteBright'],
        log: ['cyanBright'],
        info: [13],
        warn: [208],
        error: ['redBright'],
        assert: ['redBright'],
        time: ['whiteBright'],
        group: ['whiteBright'],
        success: [46],
    }

    public set format(format: string) {
        this._template = format
        this.redraw()
    }

    constructor(box: Box, format?: string) {
        this._box = box
        this.lineWidth = box.line(1).getWidth()

        // Set template
        if (!!format) {
            this._template = format
        } else {
            this._template = this.defaultFormat
        }

        if (this._template === '' || !this._template) {
            throw new Error(`Format must be a valid string. The following was not valid:\n${this._template}`)
        }

        this.lineFormat = this.fillLineVariables(this._template)
    }

    debug(...args: any[]): void {
        this.appendLine('debug', args)
    }
    log(...args: any[]): void {
        this.appendLine('log', args)
    }
    info(...args: any[]): void {
        this.appendLine('info', args)
    }
    warn(...args: any[]): void {
        this.appendLine('warn', args)
    }
    error(...args: any[]): void {
        this.appendLine('error', args)
    }
    success(...args: any[]): void {
        this.appendLine('success', args)
    }
    assert(...args: any[]): void {
        if (args.length < 2 || typeof args[0] !== 'boolean') {
            throw new Error(`Assertion requires at least 2 parameters. The first parameter must be a boolean.`)
        }

        if (args.shift() === false) {
            this.appendLine('assert', args)
        }
    }
    time(...args: any[]): () => void {
        if (args.length !== 1) {
            throw new Error(`Timer requires a single parameter.`)
        }

        const name = args[0]
        if (!['string', 'number'].includes(typeof name)) {
            throw new Error(`Timer '${inspect(name)}' is not a string or number.`)
        }

        if (!name) {
            throw new Error(`Timer '${name}' is not a valid.`)
        }

        if (name in this.timers) {
            this.warn(`Timer '${name}' already exists. A new timer has not been set. Returning stopper for existing timer.`)
        }

        this.timers[name] = process.hrtime()
        return () => this.timeEnd(name)
    }
    timeEnd(...args: any[]) {
        // Do this ASAP to preserve as much accuracy as possible
        const now = process.hrtime()

        if (args.length !== 1) {
            throw new Error(`Timer requires a single parameter.`)
        }

        const name = args[0]
        if (!['string', 'number'].includes(typeof name)) {
            throw new Error(`Timer '${inspect(name)}' is not a string or number.`)
        }

        if (!name) {
            throw new Error(`Timer '${name}' is not a valid.`)
        }

        if (!(name in this.timers)) {
            this.warn(`Timer '${name}' does not exist.`)
            return
        }

        const newDiff = (
            Number(now[0] + '.' + now[1]) -
            Number(this.timers[name][0] + '.' + this.timers[name][1])
        ) * 1000

        delete this.timers[name]
        const res: string = newDiff + 'ms'
        this.appendLine('time', [`${name}: ${res}`])
        return res
    }
    group(...args: any[]) {
        this.appendLine('group', args)
        this.groups++
    }
    groupEnd(...args: any[]) {
        if (this.groups > 0) {
            this.groups--
        }
    }

    fillLineVariables(template: string): Array<LogConstructionElement> {
        const variables = template.match(this.templateVariable)
        const componentList: Array<LineComponentIndex> = this.constructLine(template, variables)

        return componentList.map(element => {
            if (typeof element === 'string') {
                return [() => element]
            } else {
                element.variable = element.variable.replace(/[{}]/g, '')
                const [variable, format] = element.variable.split(':', 2)
                const method = '_' + variable + 'Mold'
                if (!(method in this)) {
                    throw new Error(`Error: '${method}' was not found. '${variable}' may be wrong and/or malformed.`)
                }
                return [this[method](format), variable]
            }
        })
    }

    redraw(): void {

    }

    private constructLine(lineTemplate: string, variables: Array<string>): Array<LineComponentIndex> {
        let variableIndex = 0
        const components: Array<LineComponentIndex> = []
        lineTemplate.split(this.dynamicComponentRegex).forEach((e, i) => {
            if (this.dynamicComponentRegex.test(e)) {
                components.push({variable: variables[variableIndex], index: variableIndex++})
            } else {
                components.push(e)
            }
        })
        return components.filter(e => e !== '')
    }

    private appendLine(type: string, args: Array<string | number | object>): void {
        args = args.map(arg => {
            switch (typeof arg) {
                case 'object':
                    return inspect(arg, {depth: this._objectDepth})
                default:
                    return arg.toString()
            }
        })

        this.lines.push({time: (new Date()).getTime(), type, message: args.join(' '), group: this.groups})
        if (this.lines.length > this._bufferSize) {
            this.lines = this.lines.slice(this.lines.length - this._bufferSize)
        }
        this.updateLines()
    }

    private updateLines(): void {
        const viewSize = this._box.lineCount
        const isDesc = this._direction === 'desc'
        let lineNo: number = this._direction === 'desc' ? 0 : viewSize
        for (let i = this.lines.length; i > 0; i--) {
            if (isDesc && lineNo === viewSize) {
                break
            } else if (!isDesc && lineNo === 0) {
                break
            }
            const line = this.lines[i - 1]
            const split = this.drawLine(isDesc ? ++lineNo : lineNo--, line)
        }
    }

    private drawLine(lineId: number, line: LogLine): void {
        const extraLines: Array<LogLine> = []
        const msgArr: Array<string> = []
        let prefixLength: number = 0
        if (line.group !== 0) {
            const indent: number = this._groupIndent * line.group
            msgArr.push(
                this._indentChar.left + this._indentChar.distance.repeat(indent - this._indentChar.left.length)
            )
        }
        this.lineFormat.forEach((el: LogConstructionElement) => {
            const method = el[0]
            if (el.length === 1) {
                msgArr.push(method())
            } else {
                switch (el[1]) {
                    case 'time':
                        msgArr.push(method(line.time))
                        break
                    case 'type':
                    case 'typeIcon':
                        msgArr.push(method(line.type))
                        break
                    case 'message':
                        prefixLength = msgArr.join('').length
                        msgArr.push(method(line.message))
                        break
                    default:
                        throw new Error(`The variable '${el[1]}' is not applicable for logging.`)
                }
            }
        })

        let message = msgArr.join('')
        if (message.length > this.lineWidth) {
            const split = this.createWrappedLines(message, prefixLength)
            message = split[0]
        }


        this._box.line(lineId).write(message, {
            fgColor: this.colors[line.type][0],
            bgColor: this.colors[line.type][1],
        })
    }

    private createWrappedLines(message: string, prefixLength: number): Array<string> {
        const msg = []
        const prefix = message.substr(0, prefixLength)
        message = message.substr(prefixLength)
        while (message.length + prefixLength > this.lineWidth) {
            if (message.search(/\s/) !== -1) {
                const [line, remainder] = message.split(' ', 2)
                if (!msg.length) {
                    msg.push(prefix + line)
                } else {
                    msg.push(' '.repeat(prefixLength) + line)
                }
                message = remainder
            } else if (message.search(/[-.]/)) {
                const line = message.substr(0, message.search(/[-.]/))
                const remainder = message.substr(message.search(/[-.]/))
                if (!msg.length) {
                    msg.push(prefix + line)
                } else {
                    msg.push(' '.repeat(prefixLength) + line)
                }
                message = remainder
            } // ToDo: Add full break 'else' here

        }
    }

    /* Molds */
    private _timeMold(format: string = this.defaultFormat): (prop?: string | number) => string {
        return (msEpoch: number) => moment(msEpoch).format(format)
    }

    private _typeIconMold(): (prop?: string) => string {
        return (type: string) => type in this.icons ? this.icons[type] : '?'
    }

    private _typeMold(format: 'full' | 'short' = 'short'): (prop?: string) => string {
        return (type: string) => format === 'short'
            ? type.toUpperCase().substr(0, 3)
            : type.toUpperCase()
    }

    private _messageMold(): (prop?: string) => string {
        return (message: string) => message
    }
}
