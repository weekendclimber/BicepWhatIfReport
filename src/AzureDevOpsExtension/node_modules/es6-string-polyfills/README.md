## Polyfills for ES6 string methods.

Based primarily on the implementations by [Mathias Bynens](https://github.com/mathiasbynens).

`String.raw` is loosely based on [59naga](https://github.com/59naga/string-raw)'s ponyfill, but the original doesn't correctly handle substitutions. This one binds to the String object (the original does not.)

`String.normalize` is not covered. It is simply too big (~140kb minified).

It covers:

- `String.prototype.codePointAt`
- `String.prototype.repeat`
- `String.prototype.includes`
- `String.prototype.startsWith`
- `String.prototype.endsWith`
- `String.prototype.fromCodePoint`
- `String.raw`

### Install
Install with
```javascript
npm install es6-string-polyfills --save-dev
```

### Usage
Load it in your code with an import statement:
```javascript
import "es6-string-polyfills";
```
Or from a script tag:
```html
<script src="../node_modules/es6-string-polyfills/polyfill.min.js"></script>
```

The polyfills will be applied automatically if necessary.
