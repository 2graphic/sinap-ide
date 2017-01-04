// File: main.component.ts
// Created by: CJ Dimaano
// Date created: October 10, 2016
//
// This is the main application component. It is used as the main UI display for
// presenting content to the user.
//


import { Component, OnInit, ViewChild, ChangeDetectorRef } from "@angular/core";
import { MenuService, MenuEventListener, MenuEvent } from "../../services/menu.service"
import { GraphEditorComponent } from "../graph-editor/graph-editor.component"
import { PluginService } from "../../services/plugin.service"
import { REPLComponent, REPLDelegate } from "../repl/repl.component"
import { PropertiesPanelComponent, PropertiedEntity } from "../properties-panel/properties-panel.component"
import { ToolsPanelComponent } from "../tools-panel/tools-panel.component"
import { TestPanelComponent } from "../test-panel/test-panel.component"
import { StatusBarComponent } from "../status-bar/status-bar.component"
import { SinapFile } from "../../models/types";
import { Element, Graph, deserializeGraph } from "../../models/graph"
import { SideBarComponent } from "../side-bar/side-bar.component"
import { TabBarComponent, TabDelegate } from "../tab-bar/tab-bar.component"

import { remote } from 'electron';
const fs = remote.require('fs');
const {dialog} = remote;

@Component({
  selector: "sinap-main",
  templateUrl: "./main.component.html",
  styleUrls: [ "./main.component.css" ],
  providers: [MenuService, PluginService]
})
export class MainComponent implements OnInit, MenuEventListener, REPLDelegate, TabDelegate {
  constructor(private menu: MenuService, private pluginService: PluginService, private changeDetectorRef: ChangeDetectorRef) {
  }

  ngOnInit(): void {
    this.repl.delegate = this;
    this.tabBar.delegate = this;
    this.menu.addEventListener(this);
  }

  ngAfterViewInit() {
    this.newFile();
    this.changeDetectorRef.detectChanges(); //http://stackoverflow.com/a/35243106 sowwwwwy...
  }

  @ViewChild(GraphEditorComponent)
  private graphEditor: GraphEditorComponent;

  @ViewChild(REPLComponent)
  private repl: REPLComponent;
  
  @ViewChild(PropertiesPanelComponent)
  private propertiesPanel: PropertiesPanelComponent;

  @ViewChild(ToolsPanelComponent)
  private toolsPanel: ToolsPanelComponent;

  @ViewChild("leftSideBar")
  private leftSideBar: SideBarComponent;

  @ViewChild("bottomSideBar")
  private bottomSideBar: SideBarComponent;

  @ViewChild(TestPanelComponent)
  private testComponent: TestPanelComponent;

  @ViewChild(TabBarComponent)
  private tabBar: TabBarComponent;

  public package = "Finite Automata";
  public barMessages = ["DFA", ""]

  private tabs: Map<Number, TabContext> = new Map<Number, TabContext>();
  private context: TabContext | null;

  @ViewChild(StatusBarComponent)
  private statusBar: StatusBarComponent;

  // TODO: Probably always refer to the graph in the tab's context
  graph : Graph | null;

  onGraphChanged = ()=>{ // arrow syntax to bind correct "this"
    if (this.graph) {
      if (this.graphEditor){
      this.graphEditor.redraw();
    }
    if (this.pluginService){
      if (this.graph.pluginManager.kind == "machine-learning.sinap.graph-kind") {
        this.barMessages = []
        this.package = "Machine Learning"
      } else {
        let interp = this.pluginService.getInterpreter(this.graph);
        this.barMessages = ["DFA", interp.message()]; 
        this.package = "Finite Automata";

        if(interp.check()){
          for (let triplet of this.testComponent.tests){
            triplet[2] = interp.run(triplet[0] as string);
          }
        }
      }
    }
    }
  };

  newFile(f?:String, g?: Graph) {
    if (!f && this.toolsPanel.activeGraphType == "Machine Learning"){
      g = new Graph([["Input File", SinapFile],
                     ["Weights File", SinapFile]], this.onGraphChanged,
                     this.pluginService.getManager("machine-learning.sinap.graph-kind"));
    }

    let filename = f?f:"Untitled";
    let tabNumber = this.tabBar.newTab(f?f:"Untitled");
    this.tabs.set(tabNumber, 
      new TabContext((g ? g : (new Graph([], this.onGraphChanged,
        this.pluginService.getManager("dfa.sinap.graph-kind")))), null, filename));
    this.selectedTab(tabNumber);
  }


  /* ---------- TabBarDelegate ---------- */

  deletedTab(i: Number) {
    this.tabs.delete(i);
  }

  selectedTab(i: Number) {
    if (i == -1) {
      // No tabs
      this.graph = null;
      this.context = null;
      this.onGraphChanged();
    } else if (this.tabs.has(i)) {
      this.context = this.tabs.get(i) as TabContext;
      this.graph = this.context.graph;
      this.toolsPanel.manager = this.graph.pluginManager;

      // TODO: GraphEditor needs a way to set selected elements
      this.onGraphChanged();
    }
  }

  createNewTab() {
    this.newFile();
  }

  /* ------------------------------------ */


  menuEvent(e: MenuEvent) {
    switch (e) {
      case MenuEvent.NEW_FILE:
        this.newFile();
        break;
      case MenuEvent.LOAD_FILE:
        this.loadFile();
        break;
      case MenuEvent.SAVE_FILE:
        this.saveFile();
        break;
    }
  }

  saveFile() {
    dialog.showSaveDialog({}, (filename) => {
      let graph = {
          'sinap-file-format-version' : "0.0.1",
          'graph': (this.graph as Graph).serialize()
      };
      fs.writeFile(filename, JSON.stringify(graph), 'utf8', (err: any) => {
        if (err)
          alert(`Error occurred while saving to file ${filename}: ${err}.`);
      });
    })
  }

  loadFile() {
    dialog.showOpenDialog({}, (files) => {
      // TODO: Make this actually handle multiple files.
      let filename = files[0];
      fs.readFile(filename, 'utf8', (err:any, data:string) => {
        if (err) {
          alert(`Error reading file ${filename}: ${err}`);
        }
        try {
          let pojo = JSON.parse(data);
          
          this.newFile(filename.substring(Math.max(filename.lastIndexOf("/"),
                                          filename.lastIndexOf("\\")) + 1),
                       deserializeGraph(pojo, this.onGraphChanged, this.pluginService.getManager("dfa.sinap.graph-kind")));
        } catch (e) {
          alert(`Could not serialize graph: ${e}.`);
        }
      })
    });
  }

  run(input: String):String {
    if (this.graph) {
      let interpreter = this.pluginService.getInterpreter(this.graph);
      return interpreter.run(input)+"";
    } else {
      throw new Error("No Graph to Run");
    }
  }

  graphSelectionChanged(selected: Set<PropertiedEntity>) {
    let newSelectedEntity : PropertiedEntity | null = null;
    if (selected.size > 0){
      for (let x of selected){
        // this cast is safe because we know that the only Drawables that we
        // ever give the `graphEditor` are `Element`s
        newSelectedEntity = x;
        break;
      }
    } else {
      newSelectedEntity = this.graph;
    } 
    // ugly trick to silence the fact that things seem to get emitted too often
    // TODO, reduce the frequency things are emitted
    if (this.propertiesPanel.selectedEntity != newSelectedEntity){
      if (this.context) {
        this.context.selectedEntity = newSelectedEntity;
      }
      this.propertiesPanel.selectedEntity = newSelectedEntity;
    }
  }
}

class TabContext {
  constructor(public graph: Graph, public selectedEntity: PropertiedEntity | null, public filename?: String) {};
}