// File: main.component.ts
// Created by: CJ Dimaano
// Date created: October 10, 2016
//
// This is the main application component. It is used as the main UI display for
// presenting content to the user.
//


import { Component, OnInit, ViewChild, ChangeDetectorRef } from "@angular/core";
import { MenuService, MenuEventListener, MenuEvent } from "./menu.service"
import { GraphEditorComponent, Drawable } from "./graph-editor.component"
import { PluginService, Interpreter } from "./plugin.service"
import { REPLComponent, REPLDelegate } from "./repl.component"
import { PropertiesPanelComponent, PropertiedEntity } from "./properties-panel.component"
import { TestPanelComponent } from "./test-panel.component"
import { StatusBarComponent } from "./status-bar.component"
import { SinapType, SinapNumber, SinapFile } from "./types";
import { Element, Graph, deserializeGraph } from "./graph"
import { SideBarComponent } from "./side-bar.component"
import { TabBarComponent, TabDelegate } from "./tab-bar.component"

import { remote } from 'electron';
const fs = remote.require('fs');
const {dialog} = remote;

@Component({
  moduleId: module.id,
  selector: "sinap-main",
  templateUrl: "../html/main.component.html",
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
    this.newFile("machine_learning.sinap", new Graph([["Input File", SinapFile],
                                                      ["Weights File", SinapFile]], this.onGraphChanged));
    this.newFile();
    this.changeDetectorRef.detectChanges(); //http://stackoverflow.com/a/35243106 sowwwwwy...
  }

  @ViewChild(GraphEditorComponent)
  private graphEditor: GraphEditorComponent;

  @ViewChild(REPLComponent)
  private repl: REPLComponent;
  
  @ViewChild(PropertiesPanelComponent)
  private propertiesPanel: PropertiesPanelComponent;

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
  private context: TabContext;

  @ViewChild(StatusBarComponent)
  private statusBar: StatusBarComponent;

  // TODO: Probably always refer to the graph in the tab's context
  graph : Graph;

  onGraphChanged = ()=>{ // arrow syntax to bind correct "this"
    if (this.graph) {
      if (this.graphEditor){
      this.graphEditor.redraw();
    }
    if (this.pluginService){
      if (this.context.filename == "machine_learning.sinap") {
        this.barMessages = []
        this.package = "Machine Learning"
      } else {
        let interp = this.pluginService.getInterpreter("dfa", this.graph);
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
    let filename = f?f:"Untitled";
    let tabNumber = this.tabBar.newTab(f?f:"Untitled");
    this.tabs.set(tabNumber, 
      new TabContext((g ? g : (new Graph([], this.onGraphChanged))), null, filename));
    this.selectedTab(tabNumber);
  }


  /* ---------- TabBarDelegate ---------- */

  deletedTab(i: Number) {
    this.tabs.delete(i);
  }

  selectedTab(i: Number) {
    if (i == -1) {
      // No tabs
      this.graph = undefined;
      this.context = undefined;
      this.onGraphChanged();
    } else if (this.tabs.has(i)) {
      this.context = this.tabs.get(i);
      this.graph = this.context.graph;
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
          'graph': this.graph.serialize()
      };
      fs.writeFile(filename, JSON.stringify(graph), 'utf8', (err) => {
        if (err)
          alert(`Error occured while saving to file ${filename}: ${err}.`);
      });
    })
  }

  loadFile() {
    dialog.showOpenDialog({}, (files) => {
      // TODO: Make this actually handle multiple files.
      let filename = files[0];
      fs.readFile(filename, 'utf8', (err, data) => {
        if (err) {
          alert(`Error reading file ${filename}: ${err}`);
        }
        try {
          let pojo = JSON.parse(data);
          
          this.newFile(filename.substring(filename.lastIndexOf("/") + 1), deserializeGraph(pojo, this.onGraphChanged));
        } catch (e) {
          alert(`Could not serialize graph: ${e}.`);
        }
      })
    });
  }

  run(input: String):String {
    let interpreter = this.pluginService.getInterpreter("dfa", this.graph);
    return interpreter.run(input)+"";
  }

  graphSelectionChanged(selected) {
    let newSelectedEntity : Element;
    if (selected.size > 0){
      for (let x of selected){
        // this cast is safe because we know that the only Drawables that we
        // ever give the `graphEditor` are `Element`s
        newSelectedEntity = x as Element;
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
  constructor(public graph: Graph, public selectedEntity: PropertiedEntity, public filename?) {};
}