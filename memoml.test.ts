import * as MemoML from "./memoml";

const { Parser, Token, TokenKind, Scanner, } = MemoML;

const kExpectedSpecName = "MemoML";
const kExpectedSpecVersion = "0.2.0";

type Node = MemoML.Node;
type Value = MemoML.Value;
type Parser = MemoML.Parser;
type Token = MemoML.Token;
type TokenKind = MemoML.TokenKind;
type Scanner = MemoML.Scanner;
type Location = MemoML.Location;

interface TokenDesc {
    kind: TokenKind;
    value?: Value;
}

/** Factory methods for all types of tokens. Kept separate from the main `Token` class to reduce bundle size. */
class Tokens {
    static eof(lexeme?: string, value?: Value, location?: Location): Token { return new Token(TokenKind.EOF, lexeme, value, location); }
    static leftBrace(lexeme?: string, value?: Value, location?: Location): Token { return new Token(TokenKind.LEFT_BRACE, lexeme, value, location); }
    static rightBrace(lexeme?: string, value?: Value, location?: Location): Token { return new Token(TokenKind.RIGHT_BRACE, lexeme, value, location); }
    static semicolon(lexeme?: string, value?: Value, location?: Location): Token { return new Token(TokenKind.SEMICOLON, lexeme, value, location); }
    static identifier(lexeme?: string, value?: Value, location?: Location): Token { return new Token(TokenKind.IDENTIFIER, lexeme, value, location); }
    static string(lexeme?: string, value?: Value, location?: Location): Token { return new Token(TokenKind.STRING, lexeme, value, location); }
    static number(lexeme?: string, value?: Value, location?: Location): Token { return new Token(TokenKind.NUMBER, lexeme, value, location); }
    static true(lexeme?: string, value?: Value, location?: Location): Token { return new Token(TokenKind.TRUE, lexeme, value, location); }
    static false(lexeme?: string, value?: Value, location?: Location): Token { return new Token(TokenKind.FALSE, lexeme, value, location); }
    static null(lexeme?: string, value?: Value, location?: Location): Token { return new Token(TokenKind.NULL, lexeme, value, location); }
}

declare global {
    namespace jest {
        interface Matchers<R, T = {}> {
            toEmit(tokens: TokenDesc[]): void;
        }
    }
}

const scannerMatchers = {
    toEmit(actual: Token[], expected: TokenDesc[]) {
        if (!Array.isArray(actual) || !Array.isArray(expected)) {
            return {
                pass: false,
                message: () => {
                    return "Invalid arguments.\n"
                        + `actual:\n`
                        + `  ${JSON.stringify(actual)}\n`
                        + `expected:\n`
                        + `  ${JSON.stringify(expected)}\n`
                        ;
                },
            };
        }

        let pass = true;

        for (let i = 0; i < actual.length; ++i) {
            const a = actual[i] || {};
            const e = expected[i] || {};

            let match = a.kind === e.kind;
            // TODO: Check if it's OK to compare values like this when they are floating point numbers.
            if (e.value !== undefined) match &&= (a.value === e.value);

            pass &&= match;
            if (!match) break;
        }

        return {
            pass,
            message: () => {
                return `Expected token sequence ${pass ? 'not ' : ''}to match sample.\n`
                    + `actual:\n`
                    + actual.map(t => `  ${t}`).join('\n') + '\n'
                    + `expected:\n`
                    + expected.map(({ kind, value }) => `  ${kind} ${value}`).join('\n')
                    ;
            },
        };
    }
};

describe('MemoML', () => {
    describe('parse()', () => {
        it('parses empty strings', () => {
            let memo;
            expect(() => memo = MemoML.parse('')).not.toThrow();
            expect(memo).toStrictEqual(expect.objectContaining({
                key: kExpectedSpecName,
                value: kExpectedSpecVersion,
            }));
        });

        it('parses memo', () => {
            let memo;
            expect(() => memo = MemoML.parse('  \
                # comment                     \n\
                foo;                          \n\
                bar {                         \n\
                    baz "memo" {              \n\
                        x 3;                  \n\
                        y null;               \n\
                    }                         \n\
                }                             \n\
            ')).not.toThrow();

            expect(memo).toStrictEqual(expect.objectContaining({
                key: kExpectedSpecName,
                value: kExpectedSpecVersion,
                children: [
                    {
                        key: "foo",
                        value: true,
                    },
                    {
                        key: "bar",
                        value: true,
                        children: [
                            {
                                key: "baz",
                                value: "memo",
                                children: [
                                    {
                                        key: "x",
                                        value: 3,
                                    },
                                    {
                                        key: "y",
                                        value: null,
                                    },
                                ]
                            },
                        ]
                    },
                ]
            } as Node));
        });
    });

    describe('Scanner', () => {
        beforeAll(() => expect.extend(scannerMatchers));

        function scan(text: string): Token[] {
            const tokens: Token[] = [];

            const scanner = new Scanner((token) => tokens.push(token));
            scanner.scan(text);

            return tokens;
        }

        const cases: [string, TokenDesc[]][] = [
            [
                '',
                [
                    { kind: TokenKind.EOF },
                ]
            ],
            [
                '{',
                [
                    { kind: TokenKind.LEFT_BRACE },
                    { kind: TokenKind.EOF },
                ]
            ],
            [
                '}',
                [
                    { kind: TokenKind.RIGHT_BRACE },
                    { kind: TokenKind.EOF },
                ]
            ],
            [
                ';',
                [
                    { kind: TokenKind.SEMICOLON },
                    { kind: TokenKind.EOF },
                ]
            ],
            [
                'ident1',
                [
                    { kind: TokenKind.IDENTIFIER, value: 'ident1' },
                    { kind: TokenKind.EOF },
                ]
            ],
            [
                'i',
                [
                    { kind: TokenKind.IDENTIFIER, value: 'i' },
                    { kind: TokenKind.EOF },
                ]
            ],
            [
                'I',
                [
                    { kind: TokenKind.IDENTIFIER, value: 'I' },
                    { kind: TokenKind.EOF },
                ]
            ],
            [
                '_',
                [
                    { kind: TokenKind.IDENTIFIER, value: '_' },
                    { kind: TokenKind.EOF },
                ]
            ],
            [
                'X_',
                [
                    { kind: TokenKind.IDENTIFIER, value: 'X_' },
                    { kind: TokenKind.EOF },
                ]
            ],
            [
                '""',
                [
                    { kind: TokenKind.STRING, value: '' },
                    { kind: TokenKind.EOF },
                ]
            ],
            [
                '"str"',
                [
                    { kind: TokenKind.STRING, value: 'str' },
                    { kind: TokenKind.EOF },
                ]
            ],
            [
                '3',
                [
                    { kind: TokenKind.NUMBER, value: 3 },
                    { kind: TokenKind.EOF },
                ]
            ],
            [
                '2.5',
                [
                    { kind: TokenKind.NUMBER, value: 2.5 },
                    { kind: TokenKind.EOF },
                ]
            ],
            [
                '.75',
                [
                    { kind: TokenKind.NUMBER, value: .75 },
                    { kind: TokenKind.EOF },
                ]
            ],
            [
                'true',
                [
                    { kind: TokenKind.TRUE, value: true },
                    { kind: TokenKind.EOF },
                ]
            ],
            [
                'false',
                [
                    { kind: TokenKind.FALSE, value: false },
                    { kind: TokenKind.EOF },
                ]
            ],
            [
                'null',
                [
                    { kind: TokenKind.NULL, value: null },
                    { kind: TokenKind.EOF },
                ]
            ],
            [
                'ident2;',
                [
                    { kind: TokenKind.IDENTIFIER, value: 'ident2' },
                    { kind: TokenKind.SEMICOLON },
                    { kind: TokenKind.EOF },
                ]
            ],
            [
                '# comment',
                [
                    { kind: TokenKind.EOF },
                ]
            ],
            [
                '\t',
                [
                    { kind: TokenKind.EOF },
                ]
            ],
        ];

        test.each(cases)('passes #%#', (source: string, tokens: TokenDesc[]) => {
            expect(scan(source)).toEmit(tokens);
        });
    });

    describe('Parser', () => {
        function parse(tokens: Token[]): Parser {
            const parser = new Parser(true);
            try {
                for (const token of tokens) { parser.parse(token); }
            } catch (ex) {
                console.error(ex);
            }
            return parser;
        }

        it('parses key value pairs for all literal types supported', () => {
            const parser = parse([
                // string_id "str";
                Tokens.identifier("string_id", "string_id"),
                Tokens.string("str", "str"),
                Tokens.semicolon(";", ";"),

                // number_id -2.7;
                Tokens.identifier("number_id", "number_id"),
                Tokens.string("-2.7", -2.7),
                Tokens.semicolon(";", ";"),

                // bool_true_id true;
                Tokens.identifier("bool_true_id", "bool_true_id"),
                Tokens.true("true", true),
                Tokens.semicolon(";", ";"),

                // bool_default_true_id;
                Tokens.identifier("bool_default_true_id", "bool_default_true_id"),
                Tokens.semicolon(";", ";"),

                // bool_false_id false;
                Tokens.identifier("bool_false_id", "bool_false_id"),
                Tokens.false("false", false),
                Tokens.semicolon(";", ";"),

                // null_id null;
                Tokens.identifier("null_id", "null_id"),
                Tokens.null("null", null),
                Tokens.semicolon(";", ";"),

                Tokens.eof(),
            ]);

            expect(parser.documentRoot).toStrictEqual(expect.objectContaining({
                key: kExpectedSpecName,
                value: kExpectedSpecVersion,
                children: [
                    { key: 'string_id', value: 'str', },
                    { key: 'number_id', value: -2.7, },
                    { key: 'bool_true_id', value: true, },
                    { key: 'bool_default_true_id', value: true, },
                    { key: 'bool_false_id', value: false, },
                    { key: 'null_id', value: null, },
                ]
            }));
        });

        it('parses nested scopes', () => {
            // parent "parent_value" { child "child_value"; }
            const parser = parse([
                Tokens.identifier("parent", "parent"),
                Tokens.string("parent_value", "parent_value"),
                Tokens.leftBrace("{", "{"),
                Tokens.identifier("child", "child"),
                Tokens.string("child_value", "child_value"),
                Tokens.semicolon(";", ";"),
                Tokens.rightBrace("}", "}"),
                Tokens.eof(),
            ]);

            expect(parser.documentRoot).toStrictEqual(expect.objectContaining({
                key: kExpectedSpecName,
                value: kExpectedSpecVersion,
                children: [
                    {
                        key: 'parent',
                        value: 'parent_value',
                        children: [
                            {
                                key: 'child',
                                value: 'child_value',
                            }
                        ]
                    },
                ]
            }));
        });
    });
});
