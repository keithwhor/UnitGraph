# UnitGraph

UnitGraph is a simple Graph traversal library for io.js. It is intended for
quick, synchronous in-memory traversals including route tracing and finding
closest nodes to a target.

## Installation

UnitGraph is available via npm. Simply run `npm install ug` and then:

```javascript
let ug = require('ug');
```

To use the package. :)

## Examples

### Find all nodes of type 'person' with name matching 'ea'

```javascript
let ug = require('ug');
let graph = new ug.Graph();

graph.createNode('person', {name: 'Rachael'});
graph.createNode('person', {name: 'Stephanie'});
graph.createNode('person', {name: 'Michael'});
graph.createNode('person', {name: 'Donovan'});

graph.nodes('person').query().filter({name__ilike: 'ae'}).units();

// [ Node (person {name: Rachael}), Node (person {name: Michael}) ]
```

### Find the shortest path between two nodes

```javascript
let ug = require('ug');
let graph = new ug.Graph();

let civilian = graph.createNode('person', {name: 'Clark Kent'});
let superman = graph.createNode('superhero', {name: 'Superman'});
graph.createEdge('wears_glasses').link(superman, civilian);

graph.trace(
  graph.nodes('person').query().filter({name: 'Clark Kent'}).first(),
  graph.nodes('superhero').query().filter({name: 'Superman'}).first()
);
// Path: Node (person {name: "Clark Kent"}) << Edge (wears_glasses {}) << Node (superhero {name: 'Superman'})
```

### Find all closest nodes, ordered by distance, of a certain type

```javascript
let ug = require('ug');
let graph = new ug.Graph();

let classification = graph.createNode('classification', {name: 'Sharing Economy'});

let corps = {
  uber: graph.createNode('corporation', {name: 'Uber'}),
  storefront: graph.createNode('corporation', {name: 'Storefront'}),
  airbnb: graph.createNode('corporation', {name: 'AirBnB'})
};

let industries = {
  vc: graph.createNode('industry', {name: 'Venture Capital'}),
  hospitality: graph.createNode('industry', {name: 'Hospitality'}),
  taxi: graph.createNode('industry', {name: 'Taxi'})
};

graph.createEdge('business_model').link(corps.uber, classification);
graph.createEdge('business_model').link(corps.airbnb, classification);
graph.createEdge('business_model').link(corps.storefront, classification);
graph.createEdge('emotion', {type: 'happy'}).link(industries.vc, classification);
graph.createEdge('emotion', {type: 'sad'}).link(industries.hospitality, classification);
graph.createEdge('emotion', {type: 'sad'}).link(industries.taxi, classification);

graph.closest(
  graph.nodes('classification').query().first(), // grab Sharing Economy node
  {
    compare: function(node) {
      // forget industries and uber!
      return node.entity !== 'industry' && node.get('name') !== 'Uber';
    },
    direction: -1 // only track nodes that feed in to this one
  }
);

// returns two paths, one from Sharing Economy << (business_model) << AirBnB
//    and Sharing Economy << business_model << Storefront,
//    ordered by their distance
```

## Documentation

### Graph

```javascript```
Graph()
```

Constructor. Part of the `ug` namespace. Use with `new` keyword, i.e.

```javascript
let Graph = require('ug').Graph;
let graph = new Graph();
```

#### Graph#unit

```
unit( [Number] uniqid )
  returns [Unit] ([Node] or [Edge])
```

Grabs a unit (node or edge) by their unique id (automatically assigned by
  their parent Graph object).

#### Graph#nodeCount

```
nodeCount()
  returns [Number]
```

Returns the total number of nodes that belong to the graph.

#### Graph#edgeCount

```
edgeCount()
  returns [Number]
```

Returns the total number of edges that belong to the graph.

#### Graph#createNode

```
createNode( [String] entity, [Object] properties )
  returns [Node]
```

Creates a node belonging to the parent graph, with entity type `entity` and
calls `Unit#load` to attach `properties` to the node.

Automatically creates a `NodeCollection` of type `entity` belonging to the
parent graph if one does not yet exist.

#### Graph#createEdge

```
createEdge( [String] entity, [Object] properties )
  returns [Edge]
```

Creates an edge belonging to the parent graph, with entity type `entity` and
calls `Unit#load` to attach `properties` to the edge.

Automatically creates an `EdgeCollection` of type `entity` belonging to the
parent graph if one does not yet exist.

#### Graph#nodes

```
nodes( [String] entity )
  returns [NodeCollection]
```

Returns the parent graph's `NodeCollection` object of the specified `entity`.
Invoking this method will create a `NodeCollection` if one does not yet exist.

#### Graph#edges

```
edges( [String] entity )
  returns [EdgeCollection]
```

Returns the parent graph's `EdgeCollection` object of the specified `entity`.
Invoking this method will create a `EdgeCollection` if one does not yet exist.

#### Graph#trace

```
trace( [Node] fromNode, [Node] toNode, [Number] direction )
  returns [Path]
```

Finds the shortest distance `Path` from `fromNode` to `toNode`. If there are
multiple paths of the same distance, it will return the first one it finds.

`direction` can be `-1` (incoming nodes only), `0` (doesn't matter) or `1`
(outgoing nodes only).

You should not depend on this method to always return the same `Path`.

For finding all paths of a specific distance, use `Graph#closest`.

#### Graph#closest

```
closest( [Node] node, [Object] options )
  returns [Array] of [Path]
```

Finds all closest nodes to `node` and returns their `Path`s in an array, ordered
by total distance. Nodes are filtered based on the parameters passed in
`options`.

These include:

`options.compare`: A function containing a comparison constraint for the node.

Should return `true` for an inclusion of the target node, and `false` to
ignore it.

Example:

```javascript
let options = {
  compare: function(node) {
    return node.entity === 'person';
  }
}
```

This will make sure only nodes with the entity `'person'` are included in your
results.

`options.count`: A number indicating the amount of results to return. 0 will
return all results.

`options.direction`: Which direction can we traverse the graph in?
Can be `-1` (incoming nodes only), `0` (doesn't matter) or `1`
(outgoing nodes only).

`options.minDepth`: The minimum distance from our target at which to start
counting nodes in our result set.

`options.maxDepth`: The maximum distance from our target at which we can finish
counting nodes in our result set.

#### Graph#toJSON

```
toJSON()
  returns [String]
```

Creates a JSON string representation of our graph using the `toJSON` of graph
consituents.

#### Graph#fromJSON

```
fromJSON( [String] json )
  returns [self: Graph]
```

Synchronously prepares a graph from a `json` string representation.

#### Graph#save

```
save( [String] filename, [Function] callback )
  returns [self: Graph]
```

Save the current graph to a file, asynchronously. Specify full path in `filename`.

`callback` is of the form `function(err) {}`.

#### Graph#load

```
load( [String] filename, [Function] callback )
  returns [self: Graph]
```

Load the current graph to a file, asynchronously, from `filename`.

`callback` is of the form `function(err) {}`.

---

### Unit

```
Unit()
```

*Inaccessible* constructor. Base prototype for `Node` and `Edge`.

#### Unit#load

```
load( [Object] properties )
  returns [self: Unit]
```

Load all properties for the `Unit` from `properties`. Creates a shallow copy
of the object provided.

#### Unit#set

```
set( [String] property, [Any] value )
  returns [Any]
```

Set a specific property of the `Unit`. Returns the set property value.

#### Unit#unset

```
unset( [String] property )
  returns [Boolean]
```

Unsets `property` of the `Unit`. Returns `true` on success, `false` on failure.

#### Unit#has

```
has( [String] property )
  returns [Boolean]
```

Returns `true` if `Unit` has property `property`, otherwise returns `false`.

#### Unit#get

```
get( [String] property )
  returns [Any]
```

Returns the associated property value of `Unit`.

#### Unit#toString

```
toString()
  returns [String]
```

Returns a string representation of the `Unit`.

#### Unit#valueOf

```
valueOf()
  returns [String]
```

See: `Unit#toString`.

---

### Node

```
Node()
  extends [Unit]
```

*Inaccessible* constructor. Inherits from `Unit`.

Use `Graph#createNode` to invoke this constructor.

#### Node#unlink

```
unlink()
  returns true
```

De-references all connected edges from itself, and itself from all connected
edges.

---

### Edge

```
Edge()
  extends [Unit]
```

*Inaccessible* constructor. Inherits from `Unit`.

Use `Graph#createEdge` to invoke this constructor.

#### Edge#link

```
link( [Node] fromNode, [Node] toNode, [Boolean] duplex )
  returns [self: Edge]
```

Links two nodes directionally (`fromNode` to `toNode`) or bi-directionally
if `duplex` is set to `true`.

#### Edge#unlink

```
unlink()
  returns true
```

De-references both connected nodes from itself, and itself from both connected
nodes.

#### Edge#setDistance

```
setDistance( [Number] distance )
  returns [self: Edge]
```

Sets the distance (length) of the edge.

#### Edge#setWeight

```
setWeight( [Number] weight )
  returns [self: Edge]
```

Sets the distance (length) of the edge to 1 / weight.

#### Edge#oppositeNode

```
oppositeNode( [Node] node )
  returns [Node]
```

Returns the node opposite to the one provided (if provided node is connected to
  the edge). Otherwise returns `undefined`.

---

### Collection

```
Collection()
```

*Inaccessible* constructor. Base prototype for `NodeCollection` and `EdgeCollection`.

#### Collection#name

```
name()
  returns [String]
```

Returns the entity name of the collection.

#### Collection#indices

```
indices()
  returns [Array] of [String]
```

Provides an array of all indexed fields in the collection

#### Collection#createIndex

```
createIndex( [String] field )
  returns [self: Collection]
```

Adds `field` as an index on the collection. Useful for `Collection#find` and
`Collection#destroy`.

#### Collection#createIndices

```
createIndex( [Array] fieldList )
  returns [self: Collection]
```

Adds each `fieldList` entry as an index on the collection.
Useful for `Collection#find` and `Collection#destroy`.

#### Collection#find

```
find( [String or Number] id )
find( [String] index, [String or Number] id )
  returns [Unit] ([Node or Edge])
```

Returns the `Unit` (node or edge) associated with the supplied `index` and `id`.

If no `index` is provided, it will use the first index added to the Collection.

#### Collection#destroy

```
destroy( [String or Number] id )
destroy( [String] index, [String or Number] id )
  returns [Unit] ([Node or Edge])
```

Removes the `Unit` (node or edge) associated with the supplied `index` and `id`
from the collection and returns it.

If no `index` is provided, it will use the first index added to the Collection.

#### Collection#query

```
query()
  returns [Query]
```

Creates a new `Query` object with all units in the collection.

---

### NodeCollection

```
NodeCollection()
  extends [Collection]
```

*Inaccessible* constructor. Inherits from `Collection`.

Use `Graph#nodes(entity)` to invoke this constructor automatically.

---

### EdgeCollection

```
EdgeCollection()
  extends [Collection]
```

*Inaccessible* constructor. Inherits from `Collection`.

Use `Graph#edges(entity)` to invoke this constructor automatically.

---

### Query

```
Query()
  extends [Collection]
```

*Inaccessible* constructor. Inherits from `Collection`.

Use `Collection#query` to instantiate this object.

#### Query#filter

```
filter( [Array] filtersObjects )
filter( [Object] filters_1, ..., [Object] filters_n )
  returns [Query]
```

Returns a `Query` object containing a subset of `units` that has been filtered
based on supplied `filtersObjects`. Can be passed in as an array or separate
arguments.

See [DataCollection.js examples](https://github.com/thestorefront/DataCollection.js#more-examples)
for a better idea of how these filters work. Note: the implementations are not
completely identical.

Supported filters for UnitGraph's `Query` object are currently:

```
is
not
gt
lt
gte
lte
ilike
like
in
not_in
```

#### Query#exclude

```
exclude( [Array] filtersObjects )
exclude( [Object] filters_1, ..., [Object] filters_n )
  returns [Query]
```

Returns the complementary set of units when compared to `Query#filter`.
(Excludes instead of includes filter values).

#### Query#first

```
first()
  returns [Unit] ([Node or Edge])
```

Returns the first unit in the query set.

#### Query#last

```
last()
  returns [Unit] ([Node or Edge])
```

Returns the last unit in the query set.

#### Query#units

```
units()
  returns [Array] of [Unit] ([Node or Edge])
```

Returns all units in the query set.

---

### Path

```
Path()
```

*Inaccessible* constructor. Returned from `Graph#trace` and `Graph#closest`.

#### Path#start

```
start()
  returns [Node]
```

Returns the first node in the path.

#### Path#end

```
end()
  returns [Node]
```

Returns the last node in the path.

#### Path#length

```
length()
  returns [Number]
```

Returns an integer indicating the number of edges in the path.

#### Path#distance

```
distance()
  returns [Number]
```

Returns a number indicating the total distance of the path.

#### Path#prettify

```
prettify()
  returns [String]
```

Provides a human-readable string representation of the path.

#### Path#toString

```
toString()
  returns [String]
```

Alias for `Path#prettify`.

## About

UnitGraph is MIT licenced, so have fun with it!

Reach me on Twitter, [@keithwhor](http://twitter.com/keithwhor).

Check out my personal website [keithwhor.com](http://keithwhor.com).
