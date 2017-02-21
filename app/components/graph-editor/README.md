_Last updated: February 20, 2017_

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
`DrawableNode` entities. All drawable classes raise `PropertyChanged` events.
The `DrawableGraph` class also raises `Creating`, `Created`, `Deleted`, and
`SelectionChanged` events. Users of the drawable objects can subscribe to these
events by invoking the `addListener` methods. The `Creating`, `Created`, and
`Deleted` event payloads include a reference to the `DrawableElement` that is
being created, has been created, or has been deleted. Listeners of these events
can then add event listeners to the `PropertyChanged` events of these drawables.

## Example
The following example code is an extension of the previous example. As with the
first example, `MyComponent` binds to `graph` and initializes `myGraph` to a new
`DrawableGraph` object with a default edge validator. Then, in the constructor
of `MyComponent`, event listeners are added to the `DrawableGraph` for the
`CreatedNode` and `DeletedNode` events.

In the event listener for the `CreatedNode` event, a `PropertyChanged` event is
registered for the created `DrawableNode`. This event handler just logs the
event payload of the `PropertyChanged` event to the console. The `DeletedNode`
event handler removes the `PropertyChanged` event handler from the node.

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
    this.myGraph.addCreatedNodeListener(this.registerNode);
    this.myGraph.addDeletedNodeListener(this.unregisterNode);
  }

  private registerNode = (evt) {
    evt.drawable.addPropertyChangedListener(this.nodePropertyChanged);
  }

  private unregisterNode = (evt) {
    evt.drawable.removePropertyChangedListener(this.nodePropertyChanged);
  }

  private nodePropertyChanged = (evt) {
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
The graph editor contains a list of drawable elements which maintains the order
in which elements should be drawn. Drawable elements are watched for property
changes so that the editor can give the drawable a canvas in order to update
itself.

Certain areas of the editor flood property changed events. For these cases,
public methods are provided to suspend and resume redrawing of the canvas.
Invoking the `resumeRedraw` method will force a redraw of the canvas.

### Hit Detection
The graph editor gives priority to nodes when processing hit detection. The
first drawable node that is successfully hit by a point is captured; if no nodes
are captured, then the first drawable edge is captured. Drawable elements handle
their own hit detection logic for both point hit detection and rectangle hit
detection.

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
Handling clipboard events uses some techniques outlined in this blog post:
https://www.lucidchart.com/techblog/2014/12/02/definitive-guide-copying-pasting-javascript/

## graph-editor-canvas.ts
The `GraphEditorCanvas` class separates the majority of the drawing logic from
the component class. Note that the trace functions manually add the origin
coordinates to each point. This is by design to accomodate the `drawGrid`
methods.

## drawable-graph.ts
`DrawableGraph` is no longer an interface. It everything it needs in order to
create a visual representation of a graph. The only thing a third party must
supply when constructing a `DrawableGraph` is a validator function for checking
if an edge is valid.

The `DrawableGraph` triggers its own events. Events can be registered by adding
listeners to the object via the `addListener` methods.

## drawable-element.ts
The `DrawableElement` class maintains common functionality between the
`DrawableEdge` and `DrawableNode` classes as well abstract methods that must
be defined for drawable edges and nodes.

The idea is to have each drawable element be in charge of its own hit detection,
update, and draw logic. Updates require a `GraphEditorCanvas` for measuring
text. This is unfortunately unavoidable, so the `GraphEditorComponent` must call
update on an element when any of its properties change.

Point hit detection for drawable elements takes a point as its argument and
returns a point or null. If null is returned, then the element was not hit by
the point of interest. Otherwise, the returned point represents the anchor point
of the element that was hit by the point of interest. For edges, this anchor
point is either its source or destination points. For nodes, this point is
either its origin or some other valid anchor point. If a node returns its,
then the node itself is considered to be captured by the point of interest.
Otherwise, it is assumed that the user is attempting to create an edge.

## drawable-edge.ts
This file contains the `DrawableEdge` class. Each drawable edge contains a list
of points. The first two points are the points that refer to the edge's source
and destination nodes respectively. The third point is the midpoint of the line.
This third point is computed based on the geometry of the line (whether it is
straight, quadratic, or cubic). For cubic curves, the fourth and fifth points
are more points on the line that are used for point hit detection. The remaining
points of the list are control points for bezier curves. For the quadratic, the
control point would be the fourth point; for the cubic, the sixth and seventh
points are the control points.

Point hit detection uses the extra points along the line to essentially perform
linear hit detection across line segments. Hit detection for straight lines is
quite simple; we take an arbitrary point, project it onto the line segment, make
sure that is between the endpoints of the segment, then measure the rejection
vector distance to determine if the point of interest is within acceptible
thresholds.

Hit detection with rectangles is challenging. The goal is to reduce complexity.
First, the edge cheats by checking if any of its points along its like are
within the bounds of the rectangle. If that failes, then the edge checks for
line intersections along its path. These checks become difficult when dealing
with quadratic and cubic bezier curves.

## drawable-node.ts
This file contains the `DrawableNode` class as well as a `HiddenNode` class.
There are two layers of point hit detection on drawable nodes. The first layer
checks if the point is within the outer threshold of the node. The second checks
if it is outside of the inner threshold. If both conditions are true, the the
node will display an anchor point nearest to the point of interest. In the
future, when nodes have their own set of valid anchor points, the closest anchor
point in the set to the point of interest will be returned. If only the outer
threshold check is true, then the origin point of the node is returned.

Rectangle hit detection on nodes just assumes that all nodes are rectangles, and
if any of its corners are within the rectangle, then it is considered hit.

## events.ts
This file contains some definitions for event emitters, listeners, and
arguments.

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
The graph editor no longer emits events `@Output`. Hook into the events on the
`DrawableGraph` object by supplying a listener to any of its `addListener`
methods.


# TODO
- Make sure to handle hit testing of custom shapes.
- Reorder drawable elements on `addSelectedItem`.
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
