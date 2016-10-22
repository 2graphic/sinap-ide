TODO:
*Feel free to add anything as we progress*

- Graph interpreter / Plugin API

- Implement graph-document
  - Contains the file contents of a graph document
    - graph type
    - set of nodes
      - nodes need to have coordinates
    - set of edges
- Implement dock-panel.component
  - A layout container for providing dock locations for components
  - Locations are Top, Left, Bottom, Right, and Fill
  - Should optionally allow for dragging and dropping other UI components into
    dock locations
- Finish implementation of side-bar.component
  - Static component that remains on the left of the IDE
  - Hides while in full-screen mode
    - The graph-editor component will automatically be put into freehand mode by
      default
    - The user must have a way to change the editor mode (via context menu?)
  - Contains a list of editor tools displayed as icons
    - selection mode
    - pan mode
    - zoom
    - [separator]
    - add node
      - can select node type from here as a popup menu
    - add edge
      - can select edge type from here as a popup menu
    - freehand mode
    - eraser mode
  - Mode tools change the editing state of the graph-editor component
- Implement tab-bar.component
  - Displays the list of open tabs
  - The selected tab will be displayed in the tab-page component
  - Dragging a tab to the side of the tab-page component will allow for viewing
    multiple tabs
- Implement tab-page.component
  - Displays the content of the selected tab
- Implement graph-editor.component
  - Displays the graph of the active tab
    - How the graph is displayed depends on the current "step" of interpretation
      of the graph
    - Editing a graph while it is in the middle of interpretation will
      shortcircuit interpretation and reset the step to the very beginning
      (before input is provided for interpretation)
  - Provides functionality for modifying the selected graph
- Implement inputs.component
  - Can be docked in the left (to the right of the sidebar), right, top, or
    bottom of the IDE
  - Will update its displayed content depending on the active graph
  - Only one will be present throughout the entire IDE at any given time
  - Can be "closed" (hidden); can be shown again from the View main menu
  - Can be minimized
  - Displayed content is determined by the plugin [**discuss**]
- Implement outputs.component
  - Can be docked in the left (to the right of the sidebar), right, top, or
    bottom of the IDE
  - Will update its displayed content depending on the active graph
  - Only one will be present throughout the entire IDE at any given time
  - Can be "closed" (hidden); can be shown again from the View main menu
  - Can be minimized
  - Displayed content is determined by the plugin [**discuss**]

- Command-Line Interface
- Context Menus
- Main Menu
