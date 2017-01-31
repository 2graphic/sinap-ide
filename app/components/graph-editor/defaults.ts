// File: defaults.ts
// Created by: CJ Dimaano
// Date created: January 9, 2016
//
// THIS FILE IS INTENDED TO BE IMPORTED ONLY INTO graph-editor.component.ts
//
// Note:
// These values should probably be defined in some user/workspace preferences
// file.
//


import { DrawableEdge, DrawableNode, LineStyles } from "./drawable-interfaces";


/**
 * FONT_FAMILY  
 *   Default font family.
 */
export const FONT_FAMILY: string = "monospace";

/**
 * FONT_SIZE  
 *   Default font size.
 */
export const FONT_SIZE: number = 10;

/**
 * GRID_SPACING  
 *   Grid spacing between ticks.
 */
export const GRID_SPACING: number = 40;

/**
 * GRID_MAJOR_COLOR  
 *   Color of major grid tickmarks.
 */
export const GRID_MAJOR_COLOR: string = "#c3c3c3";

/**
 * GRID_MAJOR_STYLE  
 *   Linestyle of major grid tickmarks.
 */
export const GRID_MAJOR_STYLE: string = "solid";

/**
 * GRID_MAJOR_WIDTH  
 *   Linewidth of major grid tickmarks.
 */
export const GRID_MAJOR_WIDTH: number = 1;

/**
 * GRID_MINOR_OFFSET  
 *   Offset for minor grid ticks.
 */
export const GRID_MINOR_OFFSET: number = 20;

/**
 * GRID_MINOR_COLOR  
 *   Color of minor grid tickmarks.
 */
export const GRID_MINOR_COLOR: string = "#c3c3c3";

/**
 * GRID_MINOR_STYLE  
 *   Linestyle of minor grid tickmarks.
 */
export const GRID_MINOR_STYLE: string = "dotted";

/**
 * GRID_MINOR_WIDTH  
 *   Linewidth of minor grid tickmarks.
 */
export const GRID_MINOR_WIDTH: number = 0.5;

/**
 * NUDGE  
 *   The distance the cursor must move by in order to cancel waiting for
 *   dragging a node.
 */
export const NUDGE: number = 3;

/**
 * STICKY_DELAY  
 *   Number of miliseconds to wait for sticking a graph element to the cursor.
 */
export const STICKY_DELAY: number = 500;

/**
 * NODE_DEFAULTS  
 *   Default property values for drawable nodes.
 */
export const NODE_DEFAULTS: DrawableNode = {
    position: { x: 0, y: 0 },
    label: "",
    shape: "circle",
    color: "#fff200",
    borderColor: "#000",
    borderStyle: "solid",
    borderWidth: 1
};

/**
 * NODE_DRAG_SHADOW_COLOR  
 *   Shadow color of dragging nodes.
 */
export const NODE_DRAG_SHADOW_COLOR: string = "#000";

/**
 * EDGE_HIT_MARGIN  
 *   Margin away from an edge for hit detection.
 */
export const EDGE_HIT_MARGIN: number = 20;

/**
 * EDGE_DRAG_LINESTYLE  
 *   Linestyle for dragging an edge.
 */
export const EDGE_DRAG_LINESTYLE: LineStyles = "dotted";

/**
 * EDGE_DEFAULTS  
 *   Default property values for drawable edges.
 */
export const EDGE_DEFAULTS: DrawableEdge = {
    source: null,
    destination: null,
    label: "",
    color: "#000",
    lineStyle: "solid",
    lineWidth: 2,
    showDestinationArrow: false,
    showSourceArrow: false
};

/**
 * SELECTION_COLOR  
 *   Color for selection box and selection highlighting.
 */
export const SELECTION_COLOR: string = "#3af";
