// const passConditionTrue = () => true;

module.exports = (function() {

  'use strict';

  const Node = require('./unit/node.js');
  const Edge = require('./unit/edge.js');

  const NodeCollection = require('./collection/node_collection.js');
  const EdgeCollection = require('./collection/edge_collection.js');

  const Path = require('./path.js');

  const fs = require('fs');
  const zlib = require('zlib');

  class Graph {

    constructor() {

      this.__uniqval__ = Number.MAX_SAFE_INTEGER;
      this.__init__();

    }

    __init__() {

      this._lookup = Object.create(null);

      this._nodes = [];
      this._edges = [];

      this._nodeCollections = Object.create(null);
      this._edgeCollections = Object.create(null);

    }

    unit(uniqid) {
      return this._lookup[uniqid];
    }

    nodeCount() {
      return this._nodes.length;
    }

    edgeCount() {
      return this._edges.length;
    }

    createNode(entity, properties) {

      return this._createNode(entity, properties, (this.__uniqval__--).toString(16));

    }

    _createNode(entity, properties, uniqid) {

      return this._addNode(new Node(entity, properties, uniqid));

    }

    _addNode(node) {

      this._nodes.push(node);
      this._lookup[node.__uniqid__] = node;
      let nodeList = this.nodes(node.entity);
      return nodeList._add(node);

    }

    createEdge(entity, properties) {

      return this._createEdge(entity, properties, (this.__uniqval__--).toString(16));

    }

    _createEdge(entity, properties, uniqid) {

      return this._addEdge(new Edge(entity, properties, uniqid));

    }

    _addEdge(edge) {

      this._edges.push(edge);
      this._lookup[edge.__uniqid__] = edge;
      let edgeList = this.edges(edge.entity);
      return edgeList._add(edge);

    }

    nodes(entity) {

      return this._nodeCollections[entity] || (this._nodeCollections[entity] = new NodeCollection(entity));

    }

    edges(entity) {

      return this._edgeCollections[entity] || (this._edgeCollections[entity] = new EdgeCollection(entity));

    }

    _getPath(node, traced) {

      let path = traced[node.__uniqid__];

      while (path[0] instanceof Edge) {
        let edge = path[0];
        let node = edge.oppositeNode(path[1]);
        path = traced[node.__uniqid__].concat(path);
      }

      return path;

    }

    closest(node, opts) {

      opts = opts || {};

      return this._search(node, opts);
    }

    trace(fromNode, toNode, direction) {
      const compare = node => node === toNode;
      const opts = typeof direction === 'object' ?
        Object.assign({}, direction, { compare }) :
        { compare, direction };

      return this._search(fromNode, opts)[0] || new Path([], false);
    }

    _search(node, opts) {
      const {
        compare: passCondition, // = passConditionTrue, // for bw compat
        compareNode: passConditionNode, // = passConditionTrue,
        compareEdge: passConditionEdge, // = passConditionTrue,
        count = 0,
        direction = 0,
        minDepth = 0,
        maxDepth = 0,
        byLength = false
      } = opts;
      let nodePath = Object.create(null);
      nodePath[node.__uniqid__] = [node];


      let depthMap = new Map();
      depthMap.set(0, [node]);

      let depthList = [0];

      let found = [];
      let getPath = this._getPath;

      function enqueue(node, depth) {
        depthMap.has(depth) ?
          depthMap.get(depth).push(node) :
          depthMap.set(depth, [node]);
        orderedSetInsert(depthList, depth);
      }

      function orderedSetInsert(arr, val) {

        let n = arr.length;
        let i = n >>> 1;

        while(n) {
          n >>>= 1;
          if (arr[i] === val) {
            return arr;
          } else if (arr[i] < val) {
            i += n;
          } else {
            i -= n;
          }
        }

        return arr.splice(i + (arr[i] < val), 0, val);

      }

      function readNode(node, curDepth) {

        let edges = (direction === 0 ? node.edges : direction > 0 ? node.outputEdges : node.inputEdges);

        for (let i = 0, len = edges.length; i < len; i++) {

          let edge = edges[i];

          if (!passConditionEdge || passConditionEdge(edge)) {

            let depth = curDepth + ( byLength ? 1 : edge.distance );

            if (maxDepth && depth > maxDepth) {
              continue;
            }

            let tnode = edge.oppositeNode(node);

            if (!nodePath[tnode.__uniqid__] && (!passConditionNode || passConditionNode(tnode))) {

              nodePath[tnode.__uniqid__] = [edge, tnode];
              enqueue(tnode, depth);

            }

          }

        }

        if (curDepth >= minDepth && (!passCondition || passCondition(node)) && (!passConditionNode || passConditionNode(node))) {
          return new Path(getPath(node, nodePath));
        }

        return false;

      }

      while(depthList.length) {

        let curDepth = depthList.shift();
        let queue = depthMap.get(curDepth);

        while(queue.length) {

          let path = readNode(queue.shift(), curDepth);
          path && found.push(path);

          if (count && found.length >= count) {
            return found;
          }

        }

      }

      return found;

    }

    toJSON() {

      let nodeCollections = this._nodeCollections;
      let nc = Object.keys(nodeCollections).map(function(entity) {
        return nodeCollections[entity].toJSON();
      });

      let edgeCollections = this._edgeCollections;
      let ec = Object.keys(edgeCollections).map(function(entity) {
        return edgeCollections[entity].toJSON();
      });

      let nodes = this._nodes.map(function(n) {
        return n.toJSON();
      });

      let edges = this._edges.map(function(e) {
        return e.toJSON();
      });

      return JSON.stringify({nc: nc, ec: ec, n: nodes, e: edges});

    }

    fromJSON(json) {

      this.__init__();

      let data = JSON.parse(json);

      let nc = data.nc;
      let ec = data.ec;

      for (let i = 0, len = nc.length; i < len; i++) {
        let collection = nc[i];
        this.nodes(collection[0]).createIndices(collection[1]);
      }

      for (let i = 0, len = ec.length; i < len; i++) {
        let collection = ec[i];
        this.edges(collection[0]).createIndices(collection[1]);
      }

      let nodes = data.n;
      let edges = data.e;

      for (let i = 0, len = nodes.length; i < len; i++) {
        let n = nodes[i];
        this._createNode(n[0], n[1], n[2]);
        let uniqval = parseInt(n[2], 16);
        this.__uniqval__ = uniqval < this.__uniqval__ ? uniqval - 1 : this.__uniqval__;
      }

      for (let i = 0, len = edges.length; i < len; i++) {
        let e = edges[i];
        this._createEdge(e[0], e[1], e[2])
          .link(this._lookup[e[3]], this._lookup[e[4]], e[5])
          .setDistance(e[6]);
          let uniqval = parseInt(e[2], 16);
          this.__uniqval__ = uniqval < this.__uniqval__ ? uniqval - 1 : this.__uniqval__;
      }

      return this;

    }

    gzip(callback) {

      let buffer = new Buffer(this.toJSON());
      callback = callback.bind(this);
      zlib.gzip(buffer, callback);

      return this;

    }

    gunzip(buffer, callback) {

      callback = callback.bind(this);
      let fromJSON = this.fromJSON.bind(this);

      if (!Buffer.isBuffer(buffer)) {
        buffer = new Buffer(buffer, 'binary');
      }

      zlib.gunzip(buffer, function(err, result) {

        !err && fromJSON(result.toString());
        callback(err);

      });

    }

    save(filename, callback) {

      callback = callback.bind(this);

      this.gzip(function(err, result) {

        if (err) {
          callback(err);
          return;
        }

        fs.writeFile(filename, result, callback);

      });

      return this;

    }

    load(filename, callback) {

      callback = callback.bind(this);
      let gunzip = this.gunzip.bind(this);

      fs.readFile(filename, function(err, buffer) {

        if (err) {
          callback(err);
          return;
        }

        gunzip(buffer, callback);

      });

      return this;

    }

  }

  return Graph;

})();
