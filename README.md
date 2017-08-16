# codelike

Codelike is a utility for creating code-like obects in javascript. For example:

```
import Codelike from codelike;

const codelike = new Codelike('Action', []);
const site = codelike.builder;

const action = site.authenticate('jonathan', 'password1').then(site.popup.close().when(site.authenticated);
```

This looks like ordinary code but the resulting `action` object does not actually do anything. The structure of the statement is simply stored away in a format we can use for our own purposes. The 'codelike' object can be used to convert the structure into a string, so:

```
codelike.stringify(action)
```

will return a string that looks very like the original statement used to create action. So far, so useless. To really use codelike we need to create a formatter object.

```
class myOwnStringify {

    constructor()   { this.out=""; }
    visitRoot(name) { this.out += name; }
    result()        { return this.out; }

    visitThen(first, then) { 
        first.visit(this); this.out+=';' then.visit(this); 
    }
    
    visitWhen(action, condition) {
        this.out+="if("; condition.visit(this); this.out+=")"
        this.out+="then"; action.visit(this);
    }
    
    visitGet(first, name) {
        first.visit(this);
        this.out+=`\${name}`;
    }

    visitCall(accessor, name, parameters) {
        accessor.visit(this); this.out+=':';
        this.out+=`\${name}(${parameters.join(','))`
    }
}
```

This formatter object will output the code in an entirely different syntax. To use your own formatters, simply do:

```
const codelike = new Codelike('MyAction', [ myOwnStringify ]);

then codelike.myOwnStringify(action) will return a formatted string (or any other type of object) to your own requirements as formatted by myOwnStringify.
```
