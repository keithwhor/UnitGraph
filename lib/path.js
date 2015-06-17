module.exports = (function() {

  'use strict';

  class Path {

    constructor(array) {

      this._raw = array.slice();

    }

    distance() {

      return this._raw.length >>> 1;

    }

    prettify() {

      let arr = this._raw;

      return arr.map(function(v, i, arr) {

        let str = v.toString();

        if (i & 1) {

          if (v.duplex) {
            return ['<>', str, '<>'].join(' ');
          }

          let p = arr[i - 1];

          if (v.inputNode === p) {
            return ['>>', str, '>>'].join(' ');
          }

          return ['<<', str, '<<'].join(' ');

        }

        return str;

      }).join(' ');

    }

    toString() {

      return this.prettify();

    }

  }

  return Path;

})();
