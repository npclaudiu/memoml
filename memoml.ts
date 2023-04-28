const kSchemaName = "MemoML";
const kSchemaVersion = "0.1.0";

export type Value = string | number | boolean | null;

export interface Node {
    key: string;
    value?: Value;
    children?: Node[];
}

export enum TokenKind {
    EOF = "EOF",                    // \0
    LEFT_BRACE = "LEFT_BRACE",      // {
    RIGHT_BRACE = "RIGHT_BRACE",    // }
    SEMICOLON = "SEMICOLON",        // ;
    IDENTIFIER = "IDENTIFIER",      // name
    STRING = "STRING",              // "string"
    NUMBER = "NUMBER",              // 2, -1, 23.5, .4, 1.23e+5
    TRUE = "TRUE",                  // true
    FALSE = "FALSE",                // false
    NULL = "NULL",                  // null
}

export class Location {
    constructor(private _line: number, private _column: number = 0) { }
    get line() { return this._line; }
    get column() { return this._column; }
    static from(line: number, column: number = 0) { return new Location(line, column); }
    toString(): string { return `${this._line}:${this._column}`; }
}

export class Token {
    constructor(
        private _kind: TokenKind,
        private _lexeme: string | undefined = undefined,
        private _value: Value | undefined = undefined,
        private _location: Location | undefined = undefined,
    ) { }

    get kind(): TokenKind { return this._kind; }
    get lexeme(): string | undefined { return this._lexeme; }
    get value(): Value | undefined { return this._value; }
    get location(): Location | undefined { return this._location; }

    toString(): string {
        const location = this._location ? `${this._location} ` : '';
        return `${location}${this._kind} "${this._lexeme || ''}" ${this._value}`;
    }
}

export class MemoSyntaxError extends Error {
    constructor(message: string, location?: Location) {
        super(message);
    }
}

export type ScannerListener = (token: Token) => void;

type Keyword = { kind: TokenKind, value?: Value };

export class Scanner {
    private _start: number = 0;
    private _current: number = 0;
    private _line: number = 1;
    private _source: string = '';
    private _listener: ScannerListener;

    private static _keywords: Map<string, Keyword> = new Map<string, Keyword>([
        ["false", { kind: TokenKind.FALSE, value: false }],
        ["null", { kind: TokenKind.NULL, value: null }],
        ["true", { kind: TokenKind.TRUE, value: true }],
    ]);

    constructor(fileName: string | undefined, listener: ScannerListener) {
        this._listener = listener;
    }

    scan(source: string): void {
        this._source = source;

        while (!this.isAtEnd()) {
            this._start = this._current;
            this.scanToken();
        }

        this.emit(TokenKind.EOF);
    }

    private emit(
        kind: TokenKind,
        lexeme: string | undefined = undefined,
        value: Value | undefined = undefined,
        location: Location | undefined = undefined,
    ) {
        const token = new Token(kind, lexeme, value, location);
        this._listener(token);
    }

    private isAtEnd() {
        return this._current >= this._source.length;
    }

    private match(expected: string): boolean {
        if (this.isAtEnd()) return false;
        if (this._source.charAt(this._current) !== expected) return false;
        this._current++;
        return true;
    }

    private peek(): string {
        if (this.isAtEnd()) return '\0';
        return this._source.charAt(this._current);
    }

    private peekNext(): string {
        if (this._current + 1 >= this._source.length) return '\0';
        return this._source.charAt(this._current + 1);
    }

    private advance() {
        return this._source.charAt(this._current++);
    }

    private scanToken() {
        const c = this.advance();
        switch (c) {
            case '{': this.emit(TokenKind.LEFT_BRACE, c, c); break;
            case '}': this.emit(TokenKind.RIGHT_BRACE, c, c); break;
            case ';': this.emit(TokenKind.SEMICOLON, c, c); break;
            case '#': while (this.peek() !== '\n' && !this.isAtEnd()) this.advance();
            case ' ':
            case '\r':
            case '\t':
                break;
            case '\n':
                this._line++;
                break;
            case '"': this.string(); break;
            default:
                if (this.isDigit(c) || this.isDot(c)) {
                    this.number();
                } else if (this.isAlpha(c)) {
                    this.identifier();
                } else {
                    throw new MemoSyntaxError("Unexpected character.");
                }
        }
    }

    private isDot(c: string): boolean {
        return c === '.';
    }

    private isDigit(c: string): boolean {
        return c >= '0' && c <= '9';
    }

    private isAlpha(c: string): boolean {
        return (c >= 'a' && c <= 'z') ||
            (c >= 'A' && c <= 'Z') ||
            c == '_';
    }

    private isAlphaNumeric(c: string): boolean {
        return this.isAlpha(c) || this.isDigit(c);
    }

    private string(): void {
        while (this.peek() != '"' && !this.isAtEnd()) {
            if (this.peek() == '\n') this._line++;
            this.advance();
        }

        if (this.isAtEnd()) {
            throw new MemoSyntaxError("Unterminated string.", Location.from(this._line));
        }

        // The closing ".
        this.advance();

        // Trim the surrounding quotes.
        const value = this._source.substring(this._start + 1, this._current - 1);

        this.emit(TokenKind.STRING, "", value);
    }

    private number(): void {
        while (this.isDigit(this.peek())) this.advance();

        // Look for a fractional part.
        if (this.peek() == '.' && this.isDigit(this.peekNext())) {
            // Consume the "."
            this.advance();

            while (this.isDigit(this.peek())) this.advance();
        }

        const text = this._source.slice(this._start, this._current);
        this.emit(TokenKind.NUMBER, text, parseFloat(text));
    }

    private identifier(): void {
        while (this.isAlphaNumeric(this.peek())) {
            this.advance();
        }

        const text = this._source.slice(this._start, this._current);
        const { kind, value } = Scanner._keywords.get(text) || { kind: TokenKind.IDENTIFIER, value: text };

        this.emit(kind, text, value);
    }
}

/**
 * Converts a MemoML object into an object.
 */
export function parse(text: string) {
    if (arguments.length !== 1) throw new TypeError("Invalid number of arguments.");
    if (typeof text !== 'string') throw new TypeError("Invalid argument type.");

    const scanner = new Scanner(undefined, handleToken);
    scanner.scan(text);

    const memo = {
        key: kSchemaName,
        value: kSchemaVersion,
    };

    return memo;

    function handleToken(token: Token) {
        console.log(token);
    }
}
