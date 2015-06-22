module.exports = (function() {

  'use strict';

  const Node = require('./unit/node.js');
  const Edge = require('./unit/edge.js');

  const Path = require('./path.js');
  const Collection = require('./collection.js');

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

      let node = new Node(entity, properties, uniqid);
      this._nodes.push(node);
      this._lookup[node.__uniqid__] = node;

      let nodeList = this.nodes(entity);
      return nodeList._add(node);

    }

    createEdge(entity, properties) {

      return this._createEdge(entity, properties, (this.__uniqval__--).toString(16));

    }

    _createEdge(entity, properties, uniqid) {

      let edge = new Edge(entity, properties, uniqid);
      this._edges.push(edge);
      this._lookup[edge.__uniqid__] = edge;

      let edgeList = this.edges(entity);
      return edgeList._add(edge);

    }

    find(id) {

      return this._lookup[id];

    }

    dfs(fromNode, toNode, useDirection) {

      let dfsTrace = function(node, toNode, stack, traced) {

        stack.push(node);

        if (node === toNode) {
          return stack;
        }

        traced[node.__uniqid__] = true;

        let edges = node.edges;
        let edgeCount = edges.length;

        for (let i = 0; i < edgeCount; i++) {

          let edge = edges[i];
          let tnode = edges[i].oppositeNode(node);

          stack.push(edge);

          if (!traced[tnode.__uniqid__]) {

            let found = dfsTrace(tnode, toNode, stack, traced);

            if (found.length) {
              return found;
            }

          }

          stack.pop();

        }

        stack.pop();

        return [];

      };

      return dfsTrace(fromNode, toNode, [], Object.create(null));

    }

    nodes(entity) {

      return this._nodeCollections[entity] || (this._nodeCollections[entity] = new Collection(entity));

    }

    edges(entity) {

      return this._edgeCollections[entity] || (this._edgeCollections[entity] = new Collection(entity));

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

    loltrace(fromNode, toNode, direction) {

      // unweighted traced

      function runQueue(queue, visited, traced, direction) {

        let node;

        if (!(node = queue.shift())) {
          return null;
        }

        if (visited[node.__uniqid__]) {
          return node;
        }

        visited[node.__uniqid__] = true;

        let edges = direction === 0 ? node.edges : direction > 0 ? node.outputEdges : node.inputEdges;
        let edgeCount = edges.length;

        for (let i = 0; i < edgeCount; i++) {

          let edge = edges[i];
          let tnode = edges[i].oppositeNode(node);

          if (!traced[tnode.__uniqid__]) {
            traced[tnode.__uniqid__] = [edge, tnode];
            queue.push(tnode);
          }

        }

        return null;

      };

      direction |= 0;

      let queue = [fromNode];
      let rqueue = [toNode];

      let traced = Object.create(null);
      let rtraced = Object.create(null);
      traced[fromNode.__uniqid__] = [fromNode];
      rtraced[toNode.__uniqid__] = [toNode];

      let visited = Object.create(null);

      while (queue.length && rqueue.length) {

        let node = runQueue(queue, visited, traced, +direction) ||
          runQueue(rqueue, visited, rtraced, -direction);

        if (node) {
          return new Path(this._getPath(node, traced).concat(this._getPath(node, rtraced).reverse().slice(1)));
        }

      }

      return new Path([]);

    }

    closest(node, passCondition, count, direction, maxDepth) {

      passCondition = (typeof passCondition === 'function') ? passCondition : function(node) {
        return true;
      };

      return this._search(node, passCondition, count, direction, maxDepth);

    }

    trace(fromNode, toNode, direction) {

      let passCondition = function(node) {
        return node === toNode;
      };

      return this._search(fromNode, passCondition, 1, direction)[0] || new Path([]);

    }

    _search(node, passCondition, count, direction, maxDepth) {

      direction |= 0;

      count = Math.max(0, count | 0);
      maxDepth = Math.max(0, maxDepth | 0);

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
          let depth = curDepth + edge.distance;

          if (maxDepth && depth > maxDepth) {
            continue;
          }

          let tnode = edges[i].oppositeNode(node);

          if (!nodePath[tnode.__uniqid__]) {

            nodePath[tnode.__uniqid__] = [edge, tnode];
            enqueue(tnode, depth);

          }

        }

        if (passCondition(node)) {
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

    serialize() {

      let nodeCollections = this._nodeCollections;
      let nc = Object.keys(nodeCollections).map(function(entity) {
        return nodeCollections[entity].serialize();
      });

      let edgeCollections = this._edgeCollections;
      let ec = Object.keys(edgeCollections).map(function(entity) {
        return edgeCollections[entity].serialize();
      });

      let nodes = this._nodes.map(function(n) {
        return n.serialize();
      });

      let edges = this._edges.map(function(e) {
        return e.serialize();
      });

      return JSON.stringify({nc: nc, ec: ec, n: nodes, e: edges});

    }

    deserialize(json) {

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

      return true;

    }

    save(filename, callback) {

      let buffer = new Buffer(this.serialize());
      callback = callback.bind(this);

      zlib.gzip(buffer, function(err, result) {

        if (err) {
          callback(err);
          return;
        }

        fs.writeFile(filename, result, callback);

      });

    }

    load(filename, callback) {

      callback = callback.bind(this);
      let deserialize = this.deserialize.bind(this);

      fs.readFile(filename, function(err, buffer) {

        if (err) {
          callback(err);
          return;
        }

        zlib.gunzip(buffer, function(err, result) {

          if (err) {
            callback(err);
            return;
          }

          deserialize(result.toString());
          callback();

        });

      });

    }

  }

  return Graph;

})();
