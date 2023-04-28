import * as MemoML from "./memoml";

const { Token, TokenKind, Scanner, } = MemoML;

type Token = MemoML.Token;
type TokenKind = MemoML.TokenKind;
type Scanner = MemoML.Scanner;
type Value = MemoML.Value;

interface TokenDesc {
    kind: TokenKind;
    value?: Value;
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
            // TODO: Check if it's OK to compare values like this when they are floats.
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
                key: "MemoML",
                value: "0.1.0",
            }));
        });

        it('parses memo', () => {
            let memo;
            expect(() => memo = MemoML.parse(' \
            foo; \
            bar { \
                baz "fdfd" { \
                    x 3; \
                    y null; \
                } \
            } \
            ')).not.toThrow();

            expect(memo).toStrictEqual(expect.objectContaining({
                key: "MemoML",
                value: "0.1.0",
            }));
        });
    });

    describe('Scanner', () => {
        beforeAll(() => expect.extend(scannerMatchers));

        function scan(text: string): Token[] {
            const tokens: Token[] = [];

            const scanner = new Scanner(undefined, (token) => tokens.push(token));
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
});
