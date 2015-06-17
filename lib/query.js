module.exports = (function() {

  'use strict';

  let comparators = {
    'is': function(a, b) { return a === b; },
    'not': function(a, b) { return a !== b; },
    'gt': function(a, b) { return a > b; },
    'lt': function(a, b) { return a < b; },
    'gte': function(a, b) { return a >= b; },
    'lte': function(a, b) { return a <= b; },
    'ilike': function(a, b) { return a.toLowerCase().indexOf(b.toLowerCase()) > -1; },
    'like': function(a, b) { return a.indexOf(b) > -1; },
    'in': function(a, b) { return b.indexOf(a) > -1; },
    'not_in': function(a, b) { return b.indexOf(a) === -1; }
  };

  class Query {

    constructor(units) {

      this._units = units.slice();

    }

    __filter(filterArray, exclude) {

      exclude = !!exclude;

      for(let i = 0, len = filterArray.length; i < len; i++) {
        if(typeof filterArray[i] !== 'object' || filterArray[i] === null) {
          filterArray[i] = {};
        }
      }

      if(!filterArray.length) {
        filterArray = [{}];
      }

      let data = this._units.slice();
      let filters, keys, key, filterData, filter, filterType;
      let filterArrayLength = filterArray.length;

      for(let f = 0; f !== filterArrayLength; f++) {

        filters = filterArray[f];
        keys = Object.keys(filters);

        filterData = [];

        for(let i = 0, len = keys.length; i < len; i++) {
          key = keys[i];
          filter = key.split('__');
          if(filter.length < 2) {
            filter.push('is');
          }
          filterType = filter.pop();

          if(!comparators[filterType]) {
            throw new Error('Filter type "' + filterType + '" not supported.');
          }
          filterData.push([comparators[filterType], filter, filters[key]]);
        }

        filterArray[f] = filterData;

      }

      let tmpFilter;
      let compareFn, val, datum;

      let filterLength;
      let len = data.length;

      let excludeCurrent;
      let n = 0;
      let tmp = Array(len);

      let flen = 0;
      let d;

      try {

        for(let i = 0; i !== len; i++) {

          let unit = data[i];
          datum = unit.properties;
          excludeCurrent = true;

          for(let j = 0; j !== filterArrayLength && excludeCurrent; j++) {

            excludeCurrent = false;
            filterData = filterArray[j];
            filterLength = filterData.length;

            for(let k = 0; k !== filterLength && !excludeCurrent; k++) {

              tmpFilter = filterData[k];
              compareFn = tmpFilter[0];
              d = datum;
              key = tmpFilter[1];
              for(let f = 0, flen = key.length; f !== flen; f++) {
                d = d[key[f]];
              }
              val = tmpFilter[2];
              (compareFn(d, val) === exclude) && (excludeCurrent = true);

            }

            !excludeCurrent && (tmp[n++] = unit);

          }

        }

      } catch(e) {

        throw new Error('Nested field ' + key.join('__') + ' does not exist');

      }

      tmp = tmp.slice(0, n);

      return new Query(tmp);

    }

    filter() {

      let args = [].slice.call(arguments);
      args = args[0] instanceof Array ? args[0] : args;

      return this.__filter(args, false);

    }

    exclude() {

      let args = [].slice.call(arguments);
      args = args[0] instanceof Array ? args[0] : args;

      return this.__filter(args, true);

    }

    first() {

      return this._units[0];

    }

    last() {

      let u = this._units;
      return u[u.length - 1];

    }

    units() {

      return this._units.slice();

    }

  }

  return Query;

})();
