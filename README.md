# MemoML

> Please note that both the markup language specification and the
> implementation are in an early stage of developmment. Breaking changes
> might be introduced at any time before version 1.0.0 is released.

## Markup Language

MemoML is a simple markup language that allows representing nested key-value
multimaps in text format. This repository provides a MemoML parser library,
written in TypeScript, that can be used in JavaScript environments such as
Node.js and web browsers.

```memo
# example.memo

# This is a comment. Comments are introduced using the '#' character and
# span until the end of line.

# A document represents a hierarchy of nested scopes where each scope is
# an associative container.
#
# Keys in a scope can repeat any number of times. They represent identifier
# names and must start with a letter or an underscore, followed by any
# number of letters, digits or underscores.
#
# MemoML supports four data types: string, number, boolean and null.
# A key-value pair must contain a key and an optional value literal,
# separated by a whitespace character and must be followed by a semicolon.

# A string key-value pair looks like this:
version "1.0.0";

# A number key-value pair is similar:
an_integer 4;
positiveFloat 2.2;
negativeFloat -3.14;
fractional .14;

# Booleans are represented by the `true` and `false` keywords:
enableFoo true;
enableBar false;
enableBaz; # Set to true if no value is specified.

# Finally, null values are supported also:
document null;

# Keys can be seen as variables declared in a scope. Besides a value, they can
# also have a multimap associated with them. Multimaps are defined within
# `{}` blocks, each having its own scope. There is no limit on the scope
# nesting level.
camera "cam-278" {
    enabled;
    position { x: 0; y: 0; z: 0; }
    orientation { x: 1; y: 1; z: 1; }
}
```

## Library

Usage:

```js
import * as MemoML from 'memoml';

const memo = MemoML.parse('             \
    # comment                           \n\
    foo;                                \n\
    bar {                               \n\
        baz "memo" {                    \n\
            x 3;                        \n\
            y null;                     \n\
        }                               \n\
    }                                   \n\
');
```

The code above will translate the MemoML to an object having the following
structure:

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

The library also provides more control over the parsing process. For more
information, please read the implementation for the `Scanner` and
`Parser` classes. Please find examples of how to use them in the unit tests.

The scanner was implemented following the excellently written introductory
guide to parsers and interpreters in
[Crafting Interpreters](https://craftinginterpreters.com/) (no affiliation).

### Limitations

There are some limitations at the moment. Some will be addressed in future
releases of the library.

- The scanner can only process the text representation in one go.
- Numbers cannot be represented in scientific notation for now.

## License

Licensed under the [2-Clause BSD License](LICENSE.txt).

---
© 2023 Claudiu Nedelcu. All rights reserved.
