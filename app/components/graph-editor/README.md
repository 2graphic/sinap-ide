_Last updated: March 15, 2017_

# Remarks
The graph editor component is a custom Angular2 component that is intended to be
used with an associated drawable graph object. `GraphEditorComponent` exposes a
public `@Input` binding `graph` that expects a `DrawableGraph`. The
`DrawableGraph` object constructor requires a validator function `isValidEdge`
that determines whether or not an edge is valid for a given source and
destination node. The destination node is an optional parameter; if it is not
supplied by the caller, the intended use is to check if an edge can be created
from the source node.

## Example
The following example code defines a custom Angular2 component `MyComponent`
which binds to the `graph` property of its child element `sinap-graph-editor`.
In `MyComponent`, the field `myGraph` is initialized as a new `DrawableGraph`
object with a supplied edge validating function that always returns true.

```typescript
import { Component } from "@angular/core";
import {
  GraphEditorComponent,
  DrawableGraph
} from "./path/to/graph-editor.component";

@Component({
  selector: "my-component",
  template: `<sinap-graph-editor [graph]="myGraph"></sinap-graph-editor>`
})
export class MyComponent {
  myGraph = new DrawableGraph((src, dst?, like?) => { return true; });
}
```

The `DrawableGraph` object is a container that houses `DrawableEdge` and
`DrawableNode` entities. All drawable classes raise `change` events. The
`DrawableGraph` class also raises `creating`, `created`, `moved`, `deleted`, and
`select` custom events. Users of the drawable objects can subscribe to these
events by invoking the `addEventListener` method in the same way as any other
DOM event. The `creating`, `created`, and `deleted` event payloads include a
reference to the `DrawableElement` collection in the `detail` field. Listeners
of these events can then add event listeners to the `change` events of these
drawables.

## Example
The following example code is an extension of the previous example. As with the
first example, `MyComponent` binds to `graph` and initializes `myGraph` to a new
`DrawableGraph` object with a default edge validator. Then, in the constructor
of `MyComponent`, event listeners are added to the `DrawableGraph` for the
`created` and `deleted` events.

In the event listener for the `created` event, a `change` event is registered
for the created `DrawableElement`. This event handler just logs the event
payload of the `change` event to the console. The `deleted` event handler
removes the `change` event handler from the element.

Note that the event listeners are not methods of the `MyComponent` class. This
is because the event emitters currently do not properly bind to `this` when
invoking each event listener.

```typescript
import { Component } from "@angular/core";
import {
  GraphEditorComponent,
  DrawableGraph
} from "./path/to/graph-editor.component";

@Component({
  selector: "my-component",
  template: `<sinap-graph-editor [graph]="myGraph"></sinap-graph-editor>`
})
export class MyComponent {
  myGraph;
  
  constructor() {
    this.myGraph = new DrawableGraph((src, dst?, like?) => { return true; });
    this.myGraph.addEventListener("created", this.registerNode);
    this.myGraph.addEventListener("deleted", this.unregisterNode);
  }

  private registerElements = (evt) {
    for (const element of evt.detail.drawables)
      element.addEventListener("change", this.propertyChanged)
  }

  private unregisterElements = (evt) {
    for (const element of evt.detail.drawables)
      element.removeEventListener("change", this.propertyChanged)
  }

  private propertyChanged = (evt) {
    console.log(evt);
  }
}
```


# Files

## graph-editor.component.ts
The `GraphEditorComponent` class is the main Angular2 UI component class that
should be imported into other modules. It can be found in
`graph-editor.component.ts`; only import what is exported from this file. All
other `ts` files are intended to be used solely within the graph editor module.

### Drawing Behavior
Drawables are now decoupled from draw logic. The graph editor wraps drawables
to deal with drawing and hit detection without exposing draw and update methods.

A list of nodes is maintained, and drawing is performed by graph traversal
beginning at each node.

Two canvases are used to separate the graph from the grid. Now the grid no
longer needs to be redrawn with the graph.

Certain areas of the editor flood property changed events. For these cases,
public methods are provided to suspend and resume redrawing of the canvas.
Invoking the `resumeRedraw` method will force a redraw of the canvas.

### Hit Detection
Hit detection gives precedence to the hovered element if there is any.
Otherwise, the collection of elements is tested. Hit detection is not guaranteed
to occur in any order between elements.

Hit detection comes in two varieties: hit detection by coordinate and hit
detection by rectangle (or intersection).

Hit detection by point will either provide a vector or null. If a vector is
provided, it is either the anchor point of a node or its origin. If it is not
the origin of the node, it is assumed to be an anchor point and is drawn
accordingly.

Hit detection by point on an edge is approximated for bezier curves. Linear
algebra is used to test straight line segments. For bezier curves, the curve is
interpolated into straight line segments, and hit detection is performed on the
segments.

Hit detection by rectangle for nodes just assumes the node is a rectangle and
checks if any corner of the rectangle is within the selection box. For edges,
certain points along the edge line is checked to be within the selection box;
if none are in the box, then the boundaries of the box are tested for
intersections with the edge geometry.

### Input Handling
Input to the graph editor is handled through mouse events. The `mousedown` event
starts a timer to determine whether or not a node should be created. The
`mousemove` event either activates hovering on graph elements, creates a
selection box, moves a node, or moves an edge. The `mouseup` event either
finishes selecting graph elements, drops a node being dragged, or drops an edge
being dragged.

### Delegates
In order to avoid having to check if the graph object has been set in the
editor, event handler methods and public methods that depend on the graph are
set to be delegates. Events are just registered and unregistered as needed.

### Clipboard Events
[Needs discussion].

## graph-editor-canvas.ts
The `GraphEditorCanvas` class separates the majority of the drawing logic from
the component class. Note that the trace functions manually add the origin
coordinates to each point. This is by design to accomodate the `drawGrid`
methods.

## graph-editor-element.ts
The `GraphEditorElement` class wraps around a `DrawableElement` and provides
common fields and functionality for the `GraphEditorNode` and `GraphEditorEdge`
classes.

## graph-editor-edge.ts
The `GraphEditorEdge` wraps around a `DrawableEdge` and provides draw, update,
and hit detection logic.

Each `GraphEditorEdge` maintains its own list of vectors. A distinction is made
between a vector and a coordinate. A coordinate is a point on the canvas,
wherease a vector is some arbitrary point relative to some coordinate or other
vector. The first two vectors are the source and destination vectors relative
to the source and destination nodes, respectively; the third vector is the
midpoint vector relative to the source vector; for quadratic bezier curves, the
fourth point is the control vector relative to the source; for cubic bezier
curves, the fourth and fifth vectors are vectors along the curve at t = 1/3 and
t = 2/3 relative to the source vector, and the sixth and seventh vectors are the
control vectors relative to the source vector and destination vector,
respectively.

## graph-editor-node.ts
The `GraphEditorNode` wraps around a `DrawableNode` and provides draw, update,
and hit detection logic.

A special `HIDDEN_NODE` constant is defined for dragging either endpoint of an
edge with the cursor.

## drawable-graph.ts
The `DrawableGraph` class contains everything it needs in order to create a
visual representation of a graph. The only thing a third party must supply when
constructing a `DrawableGraph` is a validator function for checking if an edge
is valid.

The `DrawableGraph` triggers its own events. Events can be registered by adding
listeners to the object via the `addEventListener` method.

## drawable-element.ts, drawable-edge.ts, and drawable-node.ts
The `DrawableElement` class maintains common properties between the
`DrawableEdge` and `DrawableNode` classes. The `DrawableEdge` and `DrawableNode`
classes maintain extra properties unique to each element.

## events.ts
This file contains a typed generic wrapper around the `CustomEvent` DOM class.
The typed generic is then used to emit custom events. The other classes are
for the `detail` field of the `CustomEvent` payload, which provide relevant
data for its associated event.

## generic-functions.ts
This file contains generic functions.

## defaults.ts
This file contains default constants for various graph editor properties. In the
future, these properties should be moved to some global user workspace
preferences module.

## math.ts
This file contains useful constants and linear algebra functions.


# Resources
- Bezier Curves:
  https://en.wikipedia.org/wiki/Bézier_curve
- System colors:
  https://www.w3.org/TR/REC-CSS2/ui.html#system-colors


# Discussion
The graph editor no longer emits events through `@Output`. Hook into the events
on the `DrawableGraph` object by supplying a listener to its `addEventListener`
method.


# TODO
- Make sure to handle hit testing of custom shapes.
- Zoom and Pan need to be mapped to two-touch gestures.
  - pinch to zoom/two-touch drag to pan
- Snap to grid.
- More shapes/custom images for nodes.
- Orthogonal Lines.
- @Input height/width
- Text location options. [Maybe]
  - Top, Left, Bottom, Right, Center
  - Inside, Outside, Center
- Consolidate code duplication. [Ongoing]
- Update documentation. [Ongoing]
