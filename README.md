# MemoML

![npm](https://img.shields.io/npm/v/memoml)
![NPM](https://img.shields.io/npm/l/memoml)
![npm bundle size](https://img.shields.io/bundlephobia/min/memoml)
![npm](https://img.shields.io/npm/dm/memoml)

> Please note that both the markup language specification and the parser
> implementation are in an early stage of developmment. Breaking changes
> might be introduced at any time before version 1.0.0 is released.

## Introduction

MemoML is a simple markup language that allows representing nested ordered
[multimaps](https://en.wikipedia.org/wiki/Multimap) in text format. It aims
to provide a way of representing state that is suitable for driving tools
in various automation scenarios. The proposed file extension is `.memo`.

This repository provides a MemoML parser library that can be used in
JavaScript environments such as Node.js and web browsers. It is written
in TypeScript and has no runtime dependencies.

### Example

```memo
# This is a comment.

# string
version "0.2.0";

# number
idx 4;
negativeFloat -3.14;
fractional .14;

# boolean
enableFoo true;
enableBar false;
enableBaz; # Set to true if no value is specified.

# null
document null;

# nested
camera "cam-278" {
    enabled false;
    position { x .0; y .0; z .0; }
    orientation { x .0; y .0; z 1.0; }
}

# shorthand
camera "cam-279" enabled;
```

## Installing the library

Using `npm`:

```sh
npm install --save memoml
```

Or using `yarn`:

```sh
yarn add memoml
```

Or in a HTML page directly:

```html
<script src="https://www.unpkg.com/memoml@0.1.0/memoml.js"></script>
```

The library already ships with Typescript type definitions.

## Usage

To use the library, you can import it as follows:

```js
import * as MemoML from "memoml";
```

When referenced directly from a HTML page, the bundle will define `MemoML`
as a global variable. Then, you can use `parse()` to parse a MemoML-encoded
string, like in the example below.

```js
const memo = MemoML.parse(
  '                                     \n\
    # comment                           \n\
    foo;                                \n\
    bar {                               \n\
        baz "memo" {                    \n\
            x 3;                        \n\
            y null;                     \n\
        }                               \n\
    }                                   \n\
  '
);
```

The code above will translate the MemoML document to an object having the
following structure:

```json
{
  "key": "MemoML",
  "value": "0.1.0",
  "children": [
    {
      "key": "foo",
      "value": true
    },
    {
      "key": "bar",
      "value": true,
      "children": [
        {
          "key": "baz",
          "value": "memo",
          "children": [
            {
              "key": "x",
              "value": 3
            },
            {
              "key": "y",
              "value": null
            }
          ]
        }
      ]
    }
  ]
}
```

## Limitations

There are some limitations at the moment. Some will be addressed in future
releases of the library.

Features not supported yet or have limited support:

- Numbers cannot be represented in scientific notation.
- Plain arrays are not supported yet.
- The scanner can only process the text representation in one go.
- There is no serialization function similar to `JSON.stringify()` yet.
- Diagnostics lack exact location and parsing stops at first error.
- White space and comments are not emitted by the scanner.

## License

Licensed under the [2-Clause BSD](LICENSE.txt) license.
