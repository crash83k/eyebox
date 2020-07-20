export declare interface LineItem {
    key: string,
    size: string | number,
    template: string
}

export declare type LineElement = () => string

export declare type ConstructorElement = string | { variable: string, index: number }
