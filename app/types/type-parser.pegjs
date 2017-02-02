// This represents a scope
// currently it doesn't make any sense to have a nested scope

Definitions = _ "{" _ dfns:Definition* _ "}" _ { return new types.TypeScope(new Map(dfns)); }

// this is the binding of a name to a type
Definition = _ name:Variable _ "=" _ value: Type _ { return [name, value]; }

// a type is either one of the literals (Class, Tuple, List, Enum) or a reference 
// which is a type variable. A type variable is a type defined elsewhere
Type = Class / Tuple / List / Enum / Reference

// literal: 
// class t1, t2, t3 ... {
//     f1: ft1
//     f2: ft2
//     ....	
// }
Class = "class" _ conformsTo:ClassTypeList ? _ "{" _ fields:FieldList * "}" {
	return new types.ClassType(conformsTo!==null?conformsTo:[], fields);
}
FieldList = _ f:Field _ {
	return f;
}
Field = name:Variable _ prettyName:("=" p:(a:[^:]+ {return a.join("")}) {return p})? ":" _ type:Type {
   	return [name, [prettyName, type]];
}

// literal: List<t1>
List = "List<" _ t:Type _ ">" {
	return new types.ListType(t)
}

// literal: (t1, t2, ...)
Tuple = "(" ts:TypeList ")" {
	return new types.TupleType(ts);
}

// literal: enum {S1, S2, S3...}
Enum = "enum" _ "{" _ v1:Variable vrest:( _ "," _ v:Variable {return v;})* _ "}" {
	let results = [v1];
    results.push(...vrest);
	return new types.EnumType(results);
}

TypeList = _ type1: Type rest:(_ "," _ t:Type {return t;}) * _ {
	let results = [type1];
    results.push(...rest);
	return results;
}

ClassTypeList = _ type1: (Class/Reference) rest:(_ "," _ t:(Class/Reference) {return t;}) * _ {
	let results = [type1];
    results.push(...rest);
	return results;
}

// literals (either):
// 1. `name` (reference a type by lookup name)
// 2. `varName?lookupName` (reference a type by lookup name and remember what this type is called)
Reference = mn:((mn:Variable "?"){return mn;}) ? n:Variable { return new types.TypeVariable(null, n, mn); }

// any case where we match a "variable" value, use this pattern
Variable = name:([A-Za-z][A-Za-z0-9_-]*) { return name[0] + (name[1]? name[1].join('') : "") }

_ = [ \t\n\r]*