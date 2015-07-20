'use strict';

let expect = require('chai').expect;

describe('Test Suite', function() {

  const UG = require('../module.js');

  const Unit = require('../lib/unit/unit.js');
  const Node = require('../lib/unit/node.js');
  const Edge = require('../lib/unit/edge.js');

  const Collection = require('../lib/collection/collection.js');
  const NodeCollection = require('../lib/collection/node_collection.js');
  const EdgeCollection = require('../lib/collection/edge_collection.js');

  describe('UnitGraph', function() {

    describe('Graph', function() {

      let graph = new UG.Graph();

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

    });

    describe('Collections', function() {

      let graph = new UG.Graph();
      graph.createNode('testNode', {id: 1, hello: 'world'});
      graph.createEdge('testEdge', {id: 1, hello: 'world'});

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

    describe('Units', function() {

      let graph = new UG.Graph();
      graph.createNode('testNode', {id: 1, hello: 'world'});
      graph.createNode('testNode', {id: 2, hello: 'earth'});
      graph.createEdge('testEdge', {id: 1, message: 'hello'});

      let n = graph._nodes[0];
      let n2 = graph._nodes[1];
      let e = graph._edges[0];

      describe('Node', function() {

        it('should have expected node properties', function() {

          expect(n.edges).to.be.an('array');
          expect(n.inputEdges).to.be.an('array');
          expect(n.outputEdges).to.be.an('array');

        });

        it('should be able to set a property', function() {

          expect(n.set('a', 'b')).to.equal('b');

        });

        it('should be able to get a property', function() {

          expect(n.get('a')).to.equal('b');

        });

        it('should have the property', function() {

          expect(n.has('a')).to.equal(true);

        });

        it('should unset the property', function() {

          expect(n.unset('a')).to.equal(true);

        });

        it('should return undefined for get of unset property', function() {

          expect(n.get('a')).to.be.undefined;

        });

      });

      describe('Edge', function() {

        it('should have expected edge properties', function() {

          expect(e).to.have.ownProperty('inputNode');
          expect(e).to.have.ownProperty('outputNode');
          expect(e).to.have.ownProperty('duplex');
          expect(e).to.have.ownProperty('distance');

        });

        it('should link two nodes directionally', function() {

          e.link(n, n2);

          expect(n.inputEdges.indexOf(e)).to.equal(-1);
          expect(n.outputEdges.indexOf(e)).to.be.at.least(0);
          expect(n2.inputEdges.indexOf(e)).to.be.at.least(0);
          expect(n2.outputEdges.indexOf(e)).to.equal(-1);

          expect(e.inputNode).to.equal(n);
          expect(e.outputNode).to.equal(n2);

          expect(e.duplex).to.equal(false);

        });

        it('should link two nodes bidirectionally', function() {

          e.link(n, n2, true);

          expect(n.inputEdges.indexOf(e)).to.be.at.least(0);
          expect(n.outputEdges.indexOf(e)).to.be.at.least(0);
          expect(n2.inputEdges.indexOf(e)).to.be.at.least(0);
          expect(n2.outputEdges.indexOf(e)).to.be.at.least(0);

          expect(e.inputNode).to.equal(n);
          expect(e.outputNode).to.equal(n2);

          expect(e.duplex).to.equal(true);

        });

        it('should unlink nodes', function() {

          e.unlink();

          expect(n.inputEdges.indexOf(e)).to.equal(-1);
          expect(n.outputEdges.indexOf(e)).to.equal(-1);
          expect(n2.inputEdges.indexOf(e)).to.equal(-1);
          expect(n2.outputEdges.indexOf(e)).to.equal(-1);

          expect(e.inputNode).to.be.null;
          expect(e.outputNode).to.be.null;

          expect(e.duplex).to.equal(false);

        });

        it('should set distance', function() {

          expect(e.setDistance(2).distance).to.equal(2);

        });

        it('should set weight', function() {

          expect(e.setWeight(2).distance).to.equal(0.5);

        });

        it('should get opposite node', function() {

          e.link(n, n2, true);

          expect(e.oppositeNode(n)).to.equal(n2);

          e.unlink();

        });

      });

    });

    describe('Query', function() {

      let graph = new UG.Graph();

      graph.nodes('person').createIndex('id');
      graph.nodes('food').createIndex('id');

      graph.createNode('person', {id: 1, name: 'Keith'});
      graph.createNode('person', {id: 2, name: 'Scott'});
      graph.createNode('person', {id: 3, name: 'Jules'});
      graph.createNode('person', {id: 4, name: 'Kelly'});
      graph.createNode('person', {id: 5, name: 'Trevor'});
      graph.createNode('person', {id: 6, name: 'Arthur'});

      graph.createNode('food', {id: 1, name: 'Pizza'});
      graph.createNode('food', {id: 2, name: 'Kale'});
      graph.createNode('food', {id: 3, name: 'Ice Cream'});
      graph.createNode('food', {id: 4, name: 'Meatballs'});

      graph.createEdge('likes').link(graph.nodes('person').find(1), graph.nodes('food').find(1));
      graph.createEdge('likes').link(graph.nodes('person').find(1), graph.nodes('food').find(4));

      graph.createEdge('likes').link(graph.nodes('person').find(2), graph.nodes('food').find(1));
      graph.createEdge('likes').link(graph.nodes('person').find(2), graph.nodes('food').find(3));

      graph.createEdge('likes').link(graph.nodes('person').find(3), graph.nodes('food').find(2));
      graph.createEdge('likes').link(graph.nodes('person').find(3), graph.nodes('food').find(3));

      graph.createEdge('likes').link(graph.nodes('person').find(4), graph.nodes('food').find(1));
      graph.createEdge('likes').link(graph.nodes('person').find(4), graph.nodes('food').find(2));

      graph.createEdge('likes').link(graph.nodes('person').find(5), graph.nodes('food').find(2));
      graph.createEdge('likes').link(graph.nodes('person').find(5), graph.nodes('food').find(4));

      graph.createEdge('likes').link(graph.nodes('person').find(6), graph.nodes('food').find(3));
      graph.createEdge('likes').link(graph.nodes('person').find(6), graph.nodes('food').find(4));

      let nc = graph.nodes('person');

      it('should get the first item', function() {

        expect(nc.query().first()).to.equal(nc.find(1));

      });

      it('should get the last item', function() {

        expect(nc.query().last()).to.equal(nc.find(6));

      });

      it('should return an array of units', function() {

        expect(nc.query().units()).to.be.an('array');
        expect(nc.query().units().length).to.equal(6);

      });

      describe('Filters', function () {

        it('should filter is', function() {

          expect(nc.query().filter({name__is: 'Keith'}).first()).to.equal(nc.find(1));

        });

        it('should filter not', function() {

          expect(nc.query().filter({name__not: 'Keith'}).first()).to.equal(nc.find(2));
          expect(nc.query().filter({name__not: 'Keith'}).units().length).to.equal(5);

        });

        it('should filter gt', function() {

          expect(nc.query().filter({id__gt: 1}).first()).to.equal(nc.find(2));
          expect(nc.query().filter({id__gt: 1}).units().length).to.equal(5);

        });

        it('should filter lt', function() {

          expect(nc.query().filter({id__lt: 6}).last()).to.equal(nc.find(5));
          expect(nc.query().filter({id__lt: 6}).units().length).to.equal(5);

        });

        it('should filter gte', function() {

          expect(nc.query().filter({id__gte: 2}).first()).to.equal(nc.find(2));
          expect(nc.query().filter({id__gte: 2}).units().length).to.equal(5);

        });

        it('should filter lte', function() {

          expect(nc.query().filter({id__lte: 5}).last()).to.equal(nc.find(5));
          expect(nc.query().filter({id__lte: 5}).units().length).to.equal(5);

        });

        it('should filter ilike', function() {

          expect(nc.query().filter({name__ilike: 'eit'}).first()).to.equal(nc.find(1));
          expect(nc.query().filter({name__ilike: 'eit'}).units().length).to.equal(1);

        });

        it('should filter like', function() {

          expect(nc.query().filter({name__like: 'Jul'}).first()).to.equal(nc.find(3));
          expect(nc.query().filter({name__like: 'Jul'}).units().length).to.equal(1);

          expect(nc.query().filter({name__like: 'jul'}).first()).to.be.undefined;
          expect(nc.query().filter({name__like: 'jul'}).units().length).to.equal(0);

        });

        it('should filter in', function() {

          expect(nc.query().filter({name__in: ['Keith', 'Scott']}).first()).to.equal(nc.find(1));
          expect(nc.query().filter({name__in: ['Keith', 'Scott']}).units().length).to.equal(2);

        });

        it('should filter not_in', function() {

          expect(nc.query().filter({name__not_in: ['Keith', 'Scott']}).first()).to.equal(nc.find(3));
          expect(nc.query().filter({name__not_in: ['Keith', 'Scott']}).units().length).to.equal(4);

        });

        it('should exclude as expected', function() {

          expect(nc.query().exclude({name__is: 'Keith'}).first()).to.equal(nc.find(2));
          expect(nc.query().exclude({name__is: 'Keith'}).units().length).to.equal(5);

        });

      });


    });

  });

});
