# Notes
## Drawing Behavior
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

## Input Behavior
Input to the graph editor is handled through mouse events. The `mousedown` event
starts a timer to determine whether or not a node should be created. The
`mousemove` event either activates hovering on graph elements, creates a
selection box, moves a node, or moves an edge. The `mouseup` event either
finishes selecting graph elements, drops a node being dragged, or drops an edge
being dragged.

## Delegates
In order to avoid having to check if the graph object has been set in the
editor, event handler methods and public methods that depend on the graph are
set to be delegates. Events are just registered and unregistered as needed.


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
- Make sure to handle hit testing of custom shapes.
- @Input height/width?
- Text location options. [Maybe]
  - Top, Left, Bottom, Right, Center
  - Inside, Outside, Center
- Consolidate code duplication. [Ongoing]
- Update documentation. [Ongoing]
