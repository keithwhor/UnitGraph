'use strict';

const UG = require('../module.js');

let graph = new UG.Graph();

graph.nodes('person').createIndex('id');
graph.nodes('house').createIndex('id');

graph.createNode('person', {name: 'Tim', id: 1});
graph.createNode('person', {name: 'Dave', id: 2});
graph.createNode('person', {name: 'John', id: 3});

graph.createNode('house', {color: 'Red', id: 1});
graph.createNode('house', {color: 'Green', id: 2});
graph.createNode('house', {color: 'Blue', id: 3});

graph.createEdge('owns').link(
  graph.nodes('person').find(1),
  graph.nodes('house').find(1)
);

graph.createEdge('lived_at').link(
  graph.nodes('person').find(2),
  graph.nodes('house').find(1)
);

graph.createEdge('owns').link(
  graph.nodes('person').find(2),
  graph.nodes('house').find(2)
);

graph.createEdge('lived_at').link(
  graph.nodes('person').find(3),
  graph.nodes('house').find(3)
);

graph.createEdge('owns').link(
  graph.nodes('person').find(3),
  graph.nodes('house').find(2)
);

console.log(
  graph.trace(
    graph.nodes('person').find(1),
    graph.nodes('house').find(3)
  ).prettify()
)

console.log('Closest:');

graph.closest(graph.nodes('person').find(1), 'house', 5).map(function(v) {
  console.log(v.distance(), v.end().toString());
});
