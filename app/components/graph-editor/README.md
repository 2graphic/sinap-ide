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
starts a timer to determine whether or not a node or edge should be created
[^This behavior is set to be changed so that creating an edge does not require a
timer.]. The `mousemove` event either activates hovering on graph elements,
creates a selection box, moves a node, or moves an edge. The `mouseup` event
either finishes selecting graph elements, drops a node being dragged, drops an
edge being dragged, or creates an edge if possible.

For deleting graph components, it would be better to have a global keybinding
with the keybind activation event calling some method to delete the selected
components. It may be better to have such functionality outside of the graph
editor component.


# Resources
- System colors:
  https://www.w3.org/TR/REC-CSS2/ui.html#system-colors


# Discussion
- Special drawing start/final nodes should be the concern of the plugin; the
  graph editor should not have to be aware of _any_ type information or behavior
  properties of any of the drawable elements.
- `backgroundColor` should not be a property of a `DrawableGraph`; it should be
  a property of the graph editor component.


# TODO
- Update hit detection.
- Drawable elements need to update geometry based on properties [^This is
  related to property binding.].
  - Node Position
  - Node Shape
  - Edge Arrows
  - Label
  - LineWidth
  - LineStyle
- Zoom and Pan
  - pinch to zoom/two-touch drag to pan [^For now, scroll to zoom/right click
    drag to pan.]
- Snap to grid.
- More shapes/custom images for nodes.
- Anchor points on nodes for edges.
- Orthogonal Lines. [^Should users be able to have full control over bezier
  curves?]
- Make sure to handle hit testing of custom shapes.
- Make it so that if any part of a component is caught within the selection box,
  it is selected.
- @Input height/width?
- Change edge creation behavior.
  Highlight edge creation region around the boundary of a node [or nearby anchor
  points if those get implemented] to indicate that an edge will be created if
  the user clicks and drags from within the region.
- Have a visual indication for determining if an edge can be moved from one node
  to another.
- Text location options. [Maybe]
  - Top, Left, Bottom, Right, Center
  - Inside, Outside, Center
- Consolidate code duplication. [Ongoing]
- Update documentation. [Ongoing]
