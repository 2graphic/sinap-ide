import { Interpreter } from '../services/plugin.service';
import { Graph } from '../models/graph'


function coerceBoolean(s){
    return !!s && s != "false" && s != "0" && s != "f" && s != "no";
}

export class DFAInterpreter implements Interpreter {

	transitions : Map<number, Map<string, number>>;
	start_state : number
	accept_states : Set<number>
    error_message : string = null;
    alphabet : Set<string> = new Set<string>();

    constructor(graph: Graph) {
        this.translate(graph);
    }

    check(){
        if (this.error_message){
            return this.error_message;
        }
        if (this.start_state == null){
            return "No start state"
        }
        if (this.accept_states.size == 0){
            return "No accept states"
        }
        return null;
    }

    message(){
        let check = this.check();
        if(check){
            return check;
        }
        let a = [...this.alphabet.values()]
        a.sort()

        return "Alphabet: " + a.join(" ");
    }

    translate(g : Graph){
    	let nodes = [...g.nodes];

		this.transitions = new Map<number, Map<string, number>>();

    	for (let edge of g.edges){
    		let sym : string = edge.label;
            if (sym.length != 1){
                this.error_message = "Symbols must be one character"
                return
            }

            this.alphabet.add(sym);

    		let src = nodes.indexOf(edge.propertyValues["Source"]);
    		let dst = nodes.indexOf(edge.propertyValues["Destination"]);

            if (src == -1 || dst == -1){
                this.error_message = "Unknown node referenced";
                return;
            }

    		let map2 : Map<string, number>;
    		if (this.transitions.has(src)){
    			map2 = this.transitions.get(src);
    		} else {
    			map2 = new Map<string, number>();
    			this.transitions.set(src, map2);
    		}
    		map2.set(sym, dst);
    	}

    	this.accept_states = new Set<number>();

    	for (let n of nodes){
    		if (coerceBoolean(n.propertyValues["Start State"])){
                if (this.start_state != null){
                    this.error_message = "Too many start states";
                    return;
                }
    			this.start_state = nodes.indexOf(n);
    		}
    		if (coerceBoolean(n.propertyValues["Accept State"])){
    			this.accept_states.add(nodes.indexOf(n));
    		}
    	}
    }

	interpret<Sym,Sta>(transitions : Map<Sta, Map<Sym, Sta>>,
                       start_state : Sta,
                       accept_states : Set<Sta>,
                       input : Iterable<Sym>){
	    let state = start_state;
	    for (const symbol of input){
            if (!(transitions.has(state) && transitions.get(state).has(symbol))){
                return false;
            }
	        state = transitions.get(state).get(symbol);
	    }
	    return accept_states.has(state);
	}


    public run(input: String):boolean {
        return this.interpret(this.transitions, this.start_state, this.accept_states, input);
    }
}