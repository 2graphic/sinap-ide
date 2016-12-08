// File: main.component.ts
// Created by: CJ Dimaano
// Date created: October 10, 2016
//
// This is the main application component. It is used as the main UI display for
// presenting content to the user.
//


import { Component, OnInit, ViewChild } from "@angular/core";
import { MenuService, MenuEventListener, MenuEvent } from "./menu.service"
import { GraphEditorComponent, Drawable } from "./graph-editor.component"
import { PluginService, Interpreter } from "./plugin.service"
import { REPLComponent, REPLDelegate } from "./repl.component"
import { PropertiesPanelComponent } from "./properties-panel.component"
import { StatusBarComponent } from "./status-bar.component"
import { SinapType, SinapNumber } from "./types";
import { Element, Graph, deserializeGraph } from "./graph"
import { SideBarComponent } from "./side-bar.component"

import { remote } from 'electron';
const fs = remote.require('fs');
const {dialog} = remote;

@Component({
  moduleId: module.id,
  selector: "sinap-main",
  templateUrl: "../html/main.component.html",
  providers: [MenuService, PluginService]
})
export class MainComponent implements OnInit, MenuEventListener, REPLDelegate {
  constructor(private menu: MenuService, private pluginService: PluginService) {
    this.newFile();
  }

  ngOnInit(): void {
    this.repl.delegate = this;
    this.menu.addEventListener(this);
  }

  ngAfterViewInit() {
  }

  @ViewChild(GraphEditorComponent)
  private graphEditor: GraphEditorComponent;

  @ViewChild(REPLComponent)
  private repl: REPLComponent;
  
  @ViewChild(PropertiesPanelComponent)
  private propertiesPanel: PropertiesPanelComponent;

  @ViewChild(SideBarComponent)
  private sideBar: SideBarComponent;

  public package = "Finite Automata";
  public barMessages = ["DFA", ""]

  @ViewChild(StatusBarComponent)
  private statusBar: StatusBarComponent;

  graph : Graph;

  onGraphChanged = ()=>{
    console.log(this);
    console.log(this.graphEditor);
    if (this.graphEditor){
      this.graphEditor.redraw();
    }
    if (this.pluginService){
      this.barMessages[1] = this.pluginService.getInterpreter("dfa", this.graph).check();    
    }
  };

  newFile() {
    this.graph = new Graph([], this.onGraphChanged);
    this.onGraphChanged();
  }

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
          this.graph = deserializeGraph(pojo, this.onGraphChanged);
          this.onGraphChanged()
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
      this.propertiesPanel.selectedEntity = newSelectedEntity;
    }
  }
}
