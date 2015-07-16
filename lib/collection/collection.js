module.exports = (function() {

  'use strict';

  const Query = require('../query.js');

  class Collection {

    constructor(name) {

      this._name = name;
      this._units = [];
      this._indices = Object.create(null);
      this._indicesList = [];

    }

    name() {

      return this._name;

    }

    indices() {

      return this._indicesList.slice();

    }

    toJSON() {

      return [this._name, this._indicesList.slice()];

    }

    createIndex(field) {

      return this.createIndices([field]);

    }

    createIndices(fieldList) {

      this._indicesList = this._indicesList.concat(fieldList);
      let indices = this._indices;
      let units = this._units;

      for (let i = 0, len = fieldList.length; i < len; i++) {
        let index = fieldList[i];
        let lookup = (indices[index] = Object.create(null));
        for (let u = 0, len = units.length; u < len; u++) {
          let unit = units[u];
          let id = unit.get(index);
          id && (lookup[id] = unit);
        }
      }

      return this;

    }

    _add(unit) {

      if (unit) {

        this._units.push(unit);

        let list = this._indicesList;
        let len = list.length;
        let indices = this._indices;

        for (let i = 0; i < len; i++) {
          let index = list[i];
          let lookup = indices[index];
          let id = unit.get(index);
          id && (lookup[id] = unit);
        }

      }

      return unit;

    }

    _remove(unit) {

      if (unit) {

        let pos = this._units.indexOf(unit);
        pos > -1 && this._units.splice(pos, 1);

        let list = this._indicesList;
        let len = list.length;
        let indices = this._indices;

        for (let i = 0; i < len; i++) {
          let index = list[i];
          let lookup = indices[index];
          let id = unit.get(index);
          delete lookup[id];
        }

      }

      return unit;

    }

    find(index, id) {

      if (!id) {
        id = index;
        index = this._indicesList[0];
      }

      let lookup = this._indices[index];
      return lookup && lookup[id];

    }

    destroy(index, id) {

      if (!id) {
        id = index;
        index = this._indicesList[0];
      }

      let lookup = this._indices[index];
      return lookup && this._remove(lookup[id]);

    }

    query() {

      return new Query(this._units);

    }

  }

  return Collection;

})();
