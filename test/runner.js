'use strict';

let expect = require('chai').expect;

describe('Test Suite', function() {

  const UG = require('../module.js');
  let graph = new UG.Graph();

  const Unit = require('../lib/unit/unit.js');
  const Node = require('../lib/unit/node.js');
  const Edge = require('../lib/unit/edge.js');

  const Collection = require('../lib/collection/collection.js');
  const NodeCollection = require('../lib/collection/node_collection.js');
  const EdgeCollection = require('../lib/collection/edge_collection.js');

  describe('UnitGraph', function() {

    describe('Graph', function() {

      it('Should have the appropriate hidden properties', function() {

        expect(graph._lookup).to.be.an('object');
        expect(graph._nodes).to.be.an('array');
        expect(graph._edges).to.be.an('array');
        expect(graph._nodeCollections).to.be.an('object');
        expect(graph._edgeCollections).to.be.an('object');

      });

      it('Should create a NodeCollection', function() {

        expect(graph.nodes('testNode')).to.be.an.instanceof(Collection);
        expect(graph.nodes('testNode')).to.be.an.instanceof(NodeCollection);

      });

      it('Should create an EdgeCollection', function() {

        expect(graph.edges('testEdge')).to.be.an.instanceof(Collection);
        expect(graph.edges('testEdge')).to.be.an.instanceof(EdgeCollection);

      });

      it('Should give 0 node and edge counts', function() {

        expect(graph.nodeCount()).to.equal(0);
        expect(graph.edgeCount()).to.equal(0);

      });

      it('Should create a node', function() {

        expect(graph.createNode('testNode', {id: 1, hello: 'world'})).to.be.an.instanceof(Node);

      });

      it('Should create an edge', function() {

        expect(graph.createEdge('testEdge', {id: 1, hello: 'world'})).to.be.an.instanceof(Edge);

      });

      it('Should give 1 node and edge counts after creating them', function() {

        expect(graph.nodeCount()).to.equal(1);
        expect(graph.edgeCount()).to.equal(1);

      });

      it('Should find its own node', function() {

        let node = graph._nodes[0];

        expect(graph.find(node.__uniqid__)).to.equal(node);

      });

      describe('Collections', function() {

        let nc = graph.nodes('testNode');
        let ec = graph.edges('testEdge');

        describe('NodeCollection', function() {

          it('Should have the correct name', function() {

            expect(nc.name()).to.equal('testNode');

          });

          it('Should not have any indices to begin', function() {

            expect(nc.indices().length).to.equal(0);

          });

          it('Should be able to create an index', function() {

            nc.createIndex('id');
            ec.createIndex('id');

            expect(nc.indices().length).to.equal(1);
            expect(nc.indices()[0]).to.equal('id');
            expect(nc._indices).to.contain.all.keys(['id']);

          });

          it('Should be able to find node by id', function() {

            expect(nc.find(1)).to.equal(graph._nodes[0]);

          });

        });

      });

    });

  });

});
