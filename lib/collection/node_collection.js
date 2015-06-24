module.exports = (function() {

  'use strict';

  const Collection = require('./collection.js');

  class NodeCollection extends Collection {}

  return NodeCollection;

})();
