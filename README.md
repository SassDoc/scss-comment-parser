scss-comment-parser
---

Parse `/** */` comments and extracts context from SCSS.


## Install

```shell
npm install --save scsscommentparser
```

## Usage

```js
var ScssCommentParser = require('scsscommentparser');

var annotations = {
  _: {
    alias: {
      'aliasTest': 'annotationTest'
    }
  },
  annotationTest: function ( commentLine ) {
    return 'Working';
  }
};

var parser = new ScssCommentParser( annotations );


var scss = /* Load Scss */
var comments = parser.parse ( scss );

console.log(comments);
```


## Changelog

#### `0.2.2`
  * Added `context.code` to type `function` and `mixin` containing the whole code. 

### `0.2.1`
  * Fix bug in detection of comment blocks

#### `0.1.2`
  * Update dependencys

#### `0.1.1`
  * Fix multiline annotations to include `@`

#### `0.1.0`
  * Inital release