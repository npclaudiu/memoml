const kSchemaName = "MemoML";
const kSchemaVersion = "0.1.0";

export type Value = string | number | boolean | null;

export interface Node {
    key: string;
    value?: Value;
    children?: Node[];
}

export const enum TokenKind {
    EOF = 1,                            // \0
    LEFT_BRACE,                         // {
    RIGHT_BRACE,                        // }
    SEMICOLON,                          // ;
    IDENTIFIER,                         // name
    STRING,                             // "string"
    NUMBER,                             // 2, -1, 23.5, .4, 1.23e+5
    TRUE,                               // true
    FALSE,                              // false
    NULL,                               // null
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
        private _lexeme?: string,
        private _value?: Value,
        private _location?: Location,
    ) { }

    get kind(): TokenKind { return this._kind; }
    get lexeme(): string | undefined { return this._lexeme; }
    get value(): Value | undefined { return this._value; }
    get location(): Location | undefined { return this._location; }

    get isLiteral(): boolean {
        switch (this._kind) {
            case TokenKind.STRING:
            case TokenKind.NUMBER:
            case TokenKind.TRUE:
            case TokenKind.FALSE:
            case TokenKind.NULL:
                return true;
            default:
                return false;
        }
    }

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

type KeywordInfo = { kind: TokenKind, value?: Value };

const kReservedKeywords: Map<string, KeywordInfo> = new Map<string, KeywordInfo>([
    ["false", { kind: TokenKind.FALSE, value: false }],
    ["null", { kind: TokenKind.NULL, value: null }],
    ["true", { kind: TokenKind.TRUE, value: true }],
]);

function isDot(c: string): boolean {
    return c === '.';
}

function isDigit(c: string): boolean {
    return c >= '0' && c <= '9';
}

function isAlpha(c: string): boolean {
    return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c === '_';
}

function isAlphaNumeric(c: string): boolean {
    return isAlpha(c) || isDigit(c);
}

export class Scanner {
    private _start: number = 0;
    private _current: number = 0;
    private _line: number = 1;
    private _source: string = '';
    private _listener: ScannerListener;

    constructor(listener: ScannerListener) {
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

    private emit(kind: TokenKind, lexeme?: string, value?: Value, location?: Location) {
        const token = new Token(kind, lexeme, value, location);
        this._listener(token);
    }

    private isAtEnd() {
        return this._current >= this._source.length;
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
            case '{':
                this.emit(TokenKind.LEFT_BRACE, c, c);
                break;
            case '}':
                this.emit(TokenKind.RIGHT_BRACE, c, c);
                break;
            case ';':
                this.emit(TokenKind.SEMICOLON, c, c);
                break;
            case '#':
                while (this.peek() !== '\n' && !this.isAtEnd()) {
                    this.advance();
                }
                break;
            case ' ':
                break;
            case '\r':
                break;
            case '\t':
                break;
            case '\n':
                this._line++;
                break;
            case '"':
                this.string();
                break;
            default:
                if (isDigit(c) || isDot(c)) {
                    this.number();
                } else if (isAlpha(c)) {
                    this.identifier();
                } else {
                    throw new MemoSyntaxError("Unexpected character.");
                }
        }
    }

    private string(): void {
        while (this.peek() != '"' && !this.isAtEnd()) {
            if (this.peek() == '\n') this._line++;
            this.advance();
        }

        if (this.isAtEnd()) {
            throw new MemoSyntaxError("Unterminated string.", Location.from(this._line));
        }

        this.advance();
        const value = this._source.substring(this._start + 1, this._current - 1);
        this.emit(TokenKind.STRING, "", value);
    }

    private number(): void {
        while (isDigit(this.peek())) this.advance();

        if (this.peek() == '.' && isDigit(this.peekNext())) {
            this.advance();
            while (isDigit(this.peek())) this.advance();
        }

        const text = this._source.slice(this._start, this._current);
        this.emit(TokenKind.NUMBER, text, parseFloat(text));
    }

    private identifier(): void {
        while (isAlphaNumeric(this.peek())) {
            this.advance();
        }

        const text = this._source.slice(this._start, this._current);
        const { kind, value } = kReservedKeywords.get(text) || { kind: TokenKind.IDENTIFIER, value: text };

        this.emit(kind, text, value);
    }
}

const enum ParserState {
    KEY = 1,
    VALUE,
    SCOPE,
    EOF,
}

export type ParserTrace = { state: ParserState; token: Token; };

export class Parser {
    private _documentRoot: Node = { key: kSchemaName, value: kSchemaVersion, };
    private _state: ParserState = ParserState.KEY;
    private _scopeStack: Node[] = [this._documentRoot];
    private _nextNode: Node = { key: '' };
    private _trace: ParserTrace[] = [];
    private _enableTrace: boolean = false;

    constructor(trace: boolean = false) {
        this._enableTrace = trace;
    }

    get documentRoot(): Node {
        if (this._state !== ParserState.EOF) { throw new Error('Incomplete document.'); }
        return this._documentRoot;
    }

    get trace() { return this._enableTrace ? this._trace : undefined; }

    parse(token: Token): void {
        if (this._enableTrace) {
            this._trace.push({ state: this._state, token });
        }

        switch (this._state) {
            case ParserState.KEY: {
                if (token.kind === TokenKind.IDENTIFIER) {
                    this._state = ParserState.VALUE;
                    this._nextNode.key = token.value as string;
                    return;
                }
                if (token.kind === TokenKind.RIGHT_BRACE) {
                    if (!this.canPopScope()) { break; }
                    const closingScope = this.currentScope;
                    this.popScope();
                    this.addChild(closingScope);
                    this.newNextNode();
                    return;
                }
                if (token.kind === TokenKind.EOF) {
                    this._state = ParserState.EOF;
                    return;
                }
                break;
            }
            case ParserState.VALUE: {
                if (token.isLiteral) {
                    this._state = ParserState.SCOPE;
                    this._nextNode.value = token.value;
                    return;
                }
                if (token.kind === TokenKind.SEMICOLON || token.kind === TokenKind.LEFT_BRACE) {
                    this._nextNode.value = true;
                    // Fall through to the next case.
                }
                else {
                    break;
                }
            }
            case ParserState.SCOPE: {
                if (token.kind === TokenKind.SEMICOLON) {
                    this._state = ParserState.KEY;
                    this.addChild(this._nextNode);
                    this.newNextNode();
                    return;
                }
                if (token.kind === TokenKind.LEFT_BRACE) {
                    this._state = ParserState.KEY;
                    this.pushScope(this._nextNode);
                    this.newNextNode();
                    return;
                }
                break;
            }
            default: {
                break;
            }
        }

        throw new Error(`Unexpected ${token.kind} token "${token.lexeme}" in state ${this._state}.`);
    }

    private get currentScope(): Node {
        return this._scopeStack[this._scopeStack.length - 1];
    };

    private pushScope(node: Node): void {
        this._scopeStack.push(node);
    }

    private popScope(): Node | undefined {
        return this._scopeStack.pop();
    }

    private canPopScope(): boolean {
        return this._scopeStack.length > 1;
    }

    private addChild(node: Node): void {
        const scope = this.currentScope;
        scope.children = scope.children || [];
        scope.children.push(node);
    }

    private newNextNode(): void {
        this._nextNode = { key: '' };
    }
}

/**
 * Converts a MemoML object into an object.
 */
export function parse(text: string) {
    if (arguments.length !== 1) throw new TypeError("Invalid number of arguments.");
    if (typeof text !== 'string') throw new TypeError("Invalid argument type.");

    const parser = new Parser();
    const scanner = new Scanner((token) => parser.parse(token));
    scanner.scan(text);

    return parser.documentRoot;
}
