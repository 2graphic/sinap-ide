export class SinapType {
  constructor(public type : string){
  }

  typeEqual(t : SinapType) : boolean{
  	return this.type == t.type;
  }

  get topLevelKind(){
  	return (this instanceof SinapCompositeType) ? this.compositeKind : this.type;
  }
}

export class SinapCompositeType extends SinapType {
	constructor(public compositeKind : string, body : string){
		super(compositeKind + "of(" + body + ")")
	}
}

export class SinapOptionalType extends SinapCompositeType {
	constructor(public baseType : SinapType){
		super("option", baseType.type);
	}
}

export class SinapListType extends SinapCompositeType {
	constructor(public baseType : SinapType){
		super("list", baseType.type);
	}
}

export class SinapEnumType extends SinapCompositeType {
	constructor(public literals : Array<string>){
		super("enum", "'" + literals.join("','") + "'");
	}
}

export class SinapUnionType extends SinapCompositeType {
	constructor(public baseTypes : Array<SinapType>){
		super("union", baseTypes.map(x=>x.type).join(","));
	}
}

export class SinapTupleType extends SinapCompositeType {
	constructor(public baseTypes : Array<SinapType>){
		super("tuple", baseTypes.map(x=>x.type).join(","));
	}
}

export class SinapStructType extends SinapCompositeType {
	constructor(public baseTypes : Map<string,SinapType>){
		super("struct", [...baseTypes.entries()].map(p=>p[0] + ":" + p[1].type).join(","));
	}
}

export const SinapString = new SinapType("string");
export const SinapNumber = new SinapType("number");
export const SinapFile = new SinapType("file");
export const SinapBoolean = new SinapType("boolean");
export const SinapNode = new SinapType("node");
export const SinapEdge = new SinapType("edge");
export const SinapColor = new SinapType("color");
export const SinapShape = new SinapType("shape");
export const SinapLineStyles = new SinapEnumType(["dotted", "solid", "dashed"]);
