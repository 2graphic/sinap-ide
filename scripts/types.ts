export class SinapType {
  constructor(public type : string){}

}


export const SinapString = new SinapType("string");
export const SinapNumber = new SinapType("number");
export const SinapBoolean = new SinapType("boolean");
export const SinapNode = new SinapType("node");
export const SinapEdge = new SinapType("edge");

class SinapOptionalType extends SinapType {
	constructor(public baseType : SinapType){
		super("optional(" + baseType.type + ")");
	}
}

class SinapListType extends SinapType {
	constructor(public baseType : SinapType){
		super("listof(" + baseType.type + ")");
	}
}