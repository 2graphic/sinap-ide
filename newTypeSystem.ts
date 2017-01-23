const util = require("util");

interface Type {
	subtype(that : Type) : boolean;
	rsubtype?(that: Type) : boolean;
}


class TypeVariable implements Type {
	constructor(public type? : Type){

	}
	subtype(that : Type) : boolean{
		if (!this.type){
			this.type = that;
			return true;
		}
		if (this.type.subtype(that)){
			return true;
		}
		if (that.subtype(this.type)){
			this.type = that;
			return true;
		}
		return false;
	}

	rsubtype(that: Type) {
		if (!this.type){
			this.type = that;
			return true;
		}
		if (that.subtype(this.type)){
			return true;
		}
		if (this.type.subtype(that)){
			this.type = that;
			return true;
		}
		return false;
	}
}

// literal: keyword
class PrimitiveType implements Type {
	constructor(readonly name: string){
	}

	/**
	 * true if `this` is a subtype of `that`.
	 **/
	subtype(that : Type) : boolean {
		if (that.rsubtype){
			return that.rsubtype(this);
		}
		return (that instanceof PrimitiveType) && that.name === this.name;
	}
}

// literal (t1, t2, ...)
class TupleType implements Type {
	constructor(readonly types: Type[]){
	}

	subtype(that : Type) : boolean {
		if (that.rsubtype){
			return that.rsubtype(this);
		}
		if (!(that instanceof TupleType)){
			return false;
		}
		if (that.types.length !== this.types.length){
			return false;
		}
		for(let i = 0; i < this.types.length; i ++){
			if (!this.types[i].subtype(that.types[i])){
				return false;
			}
		}
		return true;
	}
}

// literal "class NAME implements t1 { BODY }"
class ClassType implements Type {
	constructor(readonly conformsTo: ClassType[], readonly fields: Map<string, Type>){
		for (const [k, t1] of this.fields.entries()){
			for (const t2 of this.promisedTypes(k)){
				if (! t1.subtype(t2)){
					throw "invalid override";
				}
			}			
		}
	}

	promisedTypes(key : string) : Type[] {
		const result : Type[] = [];
		for (const t of this.conformsTo){
			result.push(...t.promisedTypes(key));
		}
		const myPromise = this.fields.get(key);
		if (myPromise){
			result.push(myPromise);
		}
		return result;
	}

	subtype(that : Type) : boolean{
		if (that.rsubtype){
			return that.rsubtype(this);
		}
		if (this === that){
			return true;
		}
		for (const t of this.conformsTo){
			if (t.subtype(that)){
				return true;
			}
		}
		return false;
	}
}


class FunctionType implements Type {
	constructor(readonly from : Type, readonly to : Type){

	}

	subtype(that : Type) : boolean {
		if (that.rsubtype){
			return that.rsubtype(this);
		}

		if (!(that instanceof FunctionType)){
			return false;
		}
		return that.from.subtype(this.from) && this.to.subtype(that.to);
	}
}

class ThunkType implements Type {
	constructor(readonly to : Type){

	}

	subtype(that : Type) : boolean {
		if (that.rsubtype){
			return that.rsubtype(this);
		}

		if (that instanceof ThunkType){
			if (this.to.subtype(that.to)){
				return true;
			}
		}
		return this.to.subtype(that);
	}
}

const primitives = {
	String: new PrimitiveType("String"),
	Number: new PrimitiveType("Number"),
	Color: new PrimitiveType("Color"),
	Integer: new PrimitiveType("Integer"),
	Boolean: new PrimitiveType("Boolean"),
}

// const builtins = {
// 	Point: new ClassType([], new Map([
// 		["x", primitives.Number],
// 		["y", primitives.Number],
// 	])),
// 	Node: new ClassType([], new Map([
// 		["Label", primitives.String],
// 	])),
// 	Edge: new ClassType([], new Map<string, Type>([
// 		["Label", primitives.String],
// 		["Source", primitives.Node],
// 		["Destination", primitives.Node],
// 	])),
// 	Graph: new ClassType([], new Map()),
// }

class SExpression {
}
class SStringVar extends SExpression {
	constructor(public key: string) { super(); }
	toString(){
		return "S*["+this.key+"]";
	}
}
class SAnyVar extends SExpression {
	constructor(public key: string) { super(); }
	toString(){
		return "A*["+this.key+"]";
	}
}
class SRepeat extends SExpression {
	constructor(public key: string, public s: SExpression) { super(); }
	toString(){
		return "R:"+this.key+"["+this.s.toString()+"]";
	}	
}
class SString extends SExpression {
	constructor(public literal: string) { super(); }
	toString(){
		return this.literal;
	}
}
class SList extends SExpression {
	constructor(public elements: SExpression[]) { super(); }
	toString(){
		const results : string[] = [];
		for (const el of this.elements){
			results.push(el.toString());
		}
		return "("+results.join(" ")+")";
	}	
}

function SExpressionMatch(a: SExpression, b: SExpression, map: any): boolean {
	if (a instanceof SAnyVar){
		map[a.key] = b;
		return true;
	}
	if (a instanceof SStringVar && b instanceof SString){
		map[a.key] = b.literal;
		return true;
	}
	if (a instanceof SString && b instanceof SString){
		if (a.literal === b.literal){
			return true;
		}
	}
	if (a instanceof SRepeat){
		const values : any[] = [];
		if (!(b instanceof SList)){
			return false;
		}
		for (const exp of b.elements){
			const m = {};
			if (! SExpressionMatch(a.s, exp, m)){
				return false;
			}
			values.push(m);
		}
		map[a.key] = values;
		return true;
	}
	if (a instanceof SList && b instanceof SList){
		if (a.elements.length !== b.elements.length){
			return false;
		}
		for (let i = 0; i < a.elements.length; i ++){
			if(!SExpressionMatch(a.elements[i], b.elements[i], map)){
				return false;
			}
		}
		return true;
	}
	return false;
}

function R(key: string, s: SExpression){
	return new SRepeat(key, s);
}
function V(k: string){
	return new SStringVar(k);
}
function L(elements: SExpression[]){
	return new SList(elements);
}
function S(literal: string){
	return new SString(literal);
}
function A(k: string){
	return new SAnyVar(k);
}

const example = L([S("define"), S("DFANode"),
				   L([S("class"), L([S("Node")]),
				      L([
				   	     L([S("Accept State"), S("Boolean")]),
				   	     L([S("Label"), S("String")]),])])]);

const class_definition = L([S("class"), R('superclasses', V('name')),
				            R('fields', L([V('name'), A('type')])),]);

const define_variable = L([S("define"), V('name'), A("value")]);

function parseTypes(a: SExpression){
	let results: any = {};
	if (SExpressionMatch(define_variable, a)){
		
	}
	results = {};
	if (SExpressionMatch(class_definition, a)){
		
	}

}

// console.log(example.toString())
// console.log(match.toString())
// let map = {};

// console.log("success? ", SExpressionMatch(match, example, map));

// console.log(map);



// const dfaNode = new ClassType([node], new Map([["Accept State", boolean], ["Label", string]]));
// const dfaGraph = new ClassType([graph], new Map([["Start State", dfaNode]]));


// const A = new ClassType([], new Map());
// const ASub = new ClassType([A], new Map());

// // Tests 1-3
// {
// 	const B = new ClassType([], new Map([["key", A]]));
// 	const C = new ClassType([], new Map([["key", ASub]]));

// 	const D = new ClassType([B, C], new Map([["key", ASub]]));
// 	console.log("test 1 passed")
// 	try {
// 		const E = new ClassType([B, C], new Map([["key", A]]));
// 	} catch(e) {
// 		console.log("test 2 passed")
// 	}
// 	try {
// 		const F = new ClassType([], new Map([["key", C]]));
// 		const G = new ClassType([B, F], new Map([["key", ASub]]));
// 	} catch(e) {
// 		console.log("test 3 passed")
// 	}
// }

// // Test 4
// {
// 	const example = new ClassType([], new Map([["key", new FunctionType(A, A)]]))
// 	new ClassType([example], new Map([["key", new FunctionType(A, A)]]))
// 	new ClassType([example], new Map([["key", new FunctionType(A, ASub)]]))
// 	try {
// 		new ClassType([example], new Map([["key", new FunctionType(ASub, A)]]))
// 	} catch (e){
// 		console.log("test 4 passed")
// 	}
// }

// // Test 5
// {
// 	const example = new ClassType([], new Map([["key", string]]))
// 	new ClassType([example], new Map([["key", new ThunkType(string)]]))
// 	console.log("test 5 passed")
// }

// console.log("DFANode > Node?", dfaNode.subtype(node));
// console.log("Node > DFANode?", node.subtype(dfaNode));
// console.log("String > String?", string.subtype(string));
// console.log("Number > String?", number.subtype(string));

// console.log("F[DFANode, Number] > F[Node, Number]?", new FunctionType(dfaNode, number).subtype(new FunctionType(node, number)));
// console.log("F[Node, Number] > F[DFANode, Number]?", new FunctionType(node, number).subtype(new FunctionType(dfaNode, number)));

// const tv1 = new TypeVariable();
// console.log(tv1.subtype(dfaNode));
// console.log(tv1.type);

// const tv2 = new TypeVariable();
// console.log(dfaNode.subtype(tv2));
// console.log(tv2.type);





