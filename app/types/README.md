# The Type System

Sinap is an IDE and a framework for interpreters. A plugin fills in the blanks to make a complete IDE interpreter. At the bare minimum, a plugin my provide:

1. Type information. This tells sinap what constitutes a valid graph so that sinap can allow users to generate valid graphs and feed them to the interpreter. 
2. The interpreter. This allows sinap to actually run the graph

The type system is what allows the first part. In general types are something that exist only at compile time. It can be more complicated than that (see Python) but this mostly true in TypeScript. We need plugins to be able to discuss types at their compile time, which is runtime for sinap. Because of this, we need to at least partially implement a type checker. Before going into how everything works, heres a rundown of the goal:

### example.sinapdef

(currently the type parser doesn't support comments, so I'm writing my comments via markdown)

Declares an interface `Classything` that doesn't inherit from anything and has one field `Stringyding` of type `String`. 

    Classything = class {
        Stringyding: String
    }

Declares an interface `Classyfoo` that inherits from `Classything` from anything and adds one field `Stringyfoo` of type `String`. 

    Classyfoo = class Classything {
        Stringyfoo: String
    }

Multiple inheritance is okay.

    C = class A, B {
        c: String
    }

In addition to class types, enums, tuples, lists, and primitives are supported. 

    ImAnAlias = Number
    Directions = enum { Left, Right}
    Pair = (Number, Number)
    Colors = List<Color>

The full list of primitives is: `String`, `File`, `Number`, `Color`, `Integer`, and `Boolean`.

### Creating types of Nodes and Edges

When loading a sinapdef file, all types are checked to see if they are a subtype of `Node`, `Edge`, or `Graph`. If they are, they are added to the list of valid `Node`, `Edge`, or `Graph` types. The tool's menu allows sinap users to create instances of any of these types when editing the graph. 

TODO: Implement isValidEdge to respect possible subtype arrangements
TODO: Figure out what it means to have multiple graph types

#### Example dfa.sinapdef file:

    DFANode = class Node {
        StartState : Boolean
        AcceptState : Boolean
    }
    
    DFAGraph = class Graph {
        ExampleTuple : (Number, Color)
        StartState : Node
    }

## Implementation

### type-parser.pegjs and type-parser-inner.js
The grammar is described by a PEG.js file type-parser.pegjs. This generates type-parser-inner.js, a pure Javascript parser that allows for parsing *scopes* (things that contain some number of definitions) and *types* things that could be a RHS in a scope.

type-parser-inner.js defines a function `parse` that takes a string to be parsed and a flag indicating whether it should parse as a `Type` or a `TypeScope`.

### types.ts

types.ts defines `parseScope` and `parseType`. You should import types.ts most often as `Type`. 

    import * as Type from "../../types/types.ts"

 All the code blocks in the example section were scopes and can be parsed with `Type.parseScope`. There is also `Type.parseType` which works on subsets of the above such as:

```TypeScript
Type.parseType("List<Number>")

// Anonomous class that inherits from A, before using
// this, we'd need to feed it a scope containing A or it would
// crash when we validate a type
Type.parseType("class A { a : String }")
```

### type-structures.ts

type-structures.ts defines sinap's internal representation of what a type is. All types conform to the `Type` interface (re-exported by types.ts). This is essentially the parse tree and is what is spit out by `parseXX`. There are a couple of types in here (FunctionType and ThunkType that may eventually be used but currently have no syntax).



