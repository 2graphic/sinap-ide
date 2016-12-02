import { Interpreter } from './plugin.service';
import { Graph } from './graph'


function coerseBoolean(s){
    return !!s && s != "false" && s != "0" && s != "f" && s != "no";
}

export class DFAInterpreter implements Interpreter {

	transitions : Map<number, Map<string, number>>;
	start_state : number
	accept_states : Set<number>
    
    constructor(graph: Graph) {
        this.translate(graph);
    }


    translate(g : Graph){
    	let nodes = [...g.nodes];

		this.transitions = new Map<number, Map<string, number>>();

    	for (let edge of g.edges){
    		let sym = edge.label;
    		let src = nodes.indexOf(edge.source);
    		let dst = nodes.indexOf(edge.destination);

    		let map2 : Map<string, number>;
    		if (this.transitions.has(src)){
    			this.transitions.get(src);
    		} else {
    			map2 = new Map<string, number>();
    			this.transitions.set(src, map2);
    		}
            console.log("a", map2, sym, dst)
    		map2.set(sym, dst);
            console.log("b")
    	}
        console.log("c")

    	this.accept_states = new Set<number>();

    	for (let n of nodes){
    		if (coerseBoolean(n.propertyValues.start_state)){
    			this.start_state = nodes.indexOf(n);
    		}
    		if (coerseBoolean(n.propertyValues.accept_state)){
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


    public run(input: String):Boolean {
        return this.interpret(this.transitions, this.start_state, this.accept_states, input);
    }
}