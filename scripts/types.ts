export class SinapType {
  constructor(public type : string){
  }

  typeEqual(t : SinapType) : boolean{
  	return this.type == t.type;
  }
}

export const SinapString = new SinapType("string");
export const SinapNumber = new SinapType("number");
export const SinapBoolean = new SinapType("boolean");
export const SinapNode = new SinapType("node");
export const SinapEdge = new SinapType("edge");

export class SinapOptionalType extends SinapType {
	constructor(public baseType : SinapType){
		super("optional(" + baseType.type + ")");
	}
}

export class SinapListType extends SinapType {
	constructor(public baseType : SinapType){
		super("listof(" + baseType.type + ")");
	}
}

export class SinapUnionType extends SinapType {
	constructor(public baseTypes : Array<SinapType>){
		super("unionof(" + baseTypes.map(x=>x.type).join(",") + ")");
	}
}