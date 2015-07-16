'use strict';

const UG = require('../module.js');

let graph = new UG.Graph();

graph.nodes('node').createIndex('name');

graph.createNode('node', {name: 'A'});
graph.createNode('node', {name: 'B'});
graph.createNode('node', {name: 'C'});
graph.createNode('node', {name: 'D'});
graph.createNode('node', {name: 'E'});
graph.createNode('node', {name: 'F'});

graph.createNode('node', {name: 'Z'});
graph.createNode('node', {name: 'Y'});

graph.createEdge('edge').link(
  graph.nodes('node').find('A'),
  graph.nodes('node').find('Z')
).setDistance(1);

graph.createEdge('edge').link(
  graph.nodes('node').find('C'),
  graph.nodes('node').find('Y')
).setDistance(0.5);

graph.createEdge('edge').link(
  graph.nodes('node').find('A'),
  graph.nodes('node').find('B')
).setDistance(3);

graph.createEdge('edge').link(
  graph.nodes('node').find('A'),
  graph.nodes('node').find('C')
).setDistance(1);

graph.createEdge('edge').link(
  graph.nodes('node').find('A'),
  graph.nodes('node').find('D')
).setDistance(1);

graph.createEdge('edge').link(
  graph.nodes('node').find('A'),
  graph.nodes('node').find('E')
).setDistance(5);

graph.createEdge('edge').link(
  graph.nodes('node').find('C'),
  graph.nodes('node').find('F')
).setDistance(1);


console.log(
  graph.trace(
    graph.nodes('node').find('A'),
    graph.nodes('node').find('E')
  ).prettify()
)

console.log('Closest:');

graph.closest(graph.nodes('node').find('A')).map(function(v) {
  console.log(v.distance(), v.end().toString());
});

// Can load from serialized ?

console.log('Serialize and re-run query');

graph.fromJSON(graph.toJSON());

graph.closest(graph.nodes('node').find('A')).map(function(v) {
  console.log(v.distance(), v.end().toString());
});

console.log('get');

console.log(graph.nodes('node').find('A').get('name'));
