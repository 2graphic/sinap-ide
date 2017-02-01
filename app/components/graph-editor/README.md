_Last updated: January 31, 2017_

# Notes

## graph-editor.component.ts
The `GraphEditorComponent` class is the main Angular2 UI component class that
should be imported into other modules. It can be found in
`graph-editor.component.ts`; only import what is exported from this file. All
other `ts` files are intended to be used solely within the graph editor module.

### Drawing Behavior
The graph editor component maps graph elements to draw functions. Draw functions
are designed to minimize conditional branching as much as possible. This is the
reasoning behind the `makeDrawEdge` and `makeDrawNode` functions. These
functions make appropriate draw functions based on whether or not the graph
element is selected, has a label, or is being hovered or dragged by the mouse.
There are additional conditions, such as shapes for nodes and line types for
edges.

In addition to mapping graph elements to draw functions, nodes are mapped to
shape dimensions and sets of edges, and edges are mapped to a list of points.

A list of drawables is used to keep track of the order in which the graph
elements should be drawn.

The geometrical properties of nodes and edges are not recomputed for each call
to `redraw`. These properties should only be recomputed whenever the properties
of a node are changed that affects its geometry or position. Only the affected
graph elements should be updated in this manner.

### Hit Detection
Point-hit detection on nodes, for the time being, is quite simple. Since there
are currently only two kinds of supported shapes, a hit takes place if the point
is within the node geometry. Point-hit detection on edges is a bit more
complicated, especially with distance thresholds in place. Detecting if a point
is near a straight line is fairly simple; it can be done with some projections
and dot products. Doing the same with Bezier curves is a bit more involved and
requires computing roots. To get around this, hit detection for curved lines is
approximated by splitting the curve up into segments and hit testing along the
straight line segments between precomputed points along the curve. This
approximation is good enough, since the threshold for hit detections is large
enough.

### Input Behavior
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

## canvas.ts
The `GraphEditorCanvas` class separates the majority of the drawing logic from
the component class.

## defaults.ts
This file contains default constants for various graph editor properties. In the
future, these properties should be moved to some global user workspace
preferences module.

## drawable-interfaces.ts
This file contains interfaces and other useful functions for the public drawable
interface types required by the graph editor.

## make-draw-edge.ts
Currently a work-in-progress, this file contains functions that return a lambda
for drawing edges.

## make-draw-node.ts
Mostly complete, this file contains functions that return a lambda for drawing
nodes.

## math.ts
This file contains useful constants and linear algebra functions.


# Resources
- System colors:
  https://www.w3.org/TR/REC-CSS2/ui.html#system-colors


# Discussion
For deleting graph components, it would be better to have a global keybinding
with the keybind activation event calling some method to delete the selected
components. It may be better to have such functionality outside of the graph
editor component.

Special drawing start/final nodes should be the concern of the plugin; the graph
editor should not have to be aware of _any_ type information or behavior
properties of any of the drawable elements.

`backgroundColor` should not be a property of a `DrawableGraph`; it should be a
property of the graph editor component.


# TODO
- Change the drawing behavior of `moveEdge`.
- Update hit detection.
- Make it so that if any part of a component is caught within the selection box,
  it is selected.
- Make sure to handle hit testing of custom shapes.
- Reorder drawable elements on `addSelectedItem`.
- Drawable elements need to update geometry based on properties [^This is
  related to property binding.].
  - Node Position
  - Node Shape
  - Edge Arrows
  - Label
  - LineWidth
  - LineStyle
- Zoom and Pan need to be mapped to two-touch gestures.
  - pinch to zoom/two-touch drag to pan
- Snap to grid.
- More shapes/custom images for nodes.
- Orthogonal Lines. [^Should users be able to have full control over bezier
  curves?]
- @Input height/width?
- Text location options. [Maybe]
  - Top, Left, Bottom, Right, Center
  - Inside, Outside, Center
- Consolidate code duplication. [Ongoing]
- Update documentation. [Ongoing]
