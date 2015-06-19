module.exports = (function() {

  'use strict';

  const Node = require('./unit/node.js');
  const Edge = require('./unit/edge.js');

  const Path = require('./path.js');
  const Collection = require('./collection.js');

  class Graph {

    constructor() {

      this._nodes = [];
      this._edges = [];

      this._nodeLists = Object.create(null);
      this._edgeLists = Object.create(null);

    }

    nodeCount() {
      return this._nodes.length;
    }

    edgeCount() {
      return this._edges.length;
    }

    createNode(entity, properties) {

      let node = new Node(entity, properties);
      this._nodes.push(node);

      let nodeList = this.nodes(entity);
      return nodeList._add(node);

    }

    createEdge(entity, properties) {

      let edge = new Edge(entity, properties);
      this._edges.push(edge);

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

      return this._nodeLists[entity] || (this._nodeLists[entity] = new Collection());

    }

    edges(entity) {

      return this._edgeLists[entity] || (this._edgeLists[entity] = new Collection());

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

  }

  return Graph;

})();
