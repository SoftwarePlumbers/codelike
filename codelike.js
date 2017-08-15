/***
 * Generates codelike objexts  using Javascript syntax.
 *
 * e.g. action = Codelike.user.name.setFirstName('Jonathan')
 *
 * will generate an object tree than can be easily walked and used for any purpose
 *
 * See the unit tests for examples.
 */

const logger = require('simple-console-logger');

const log = logger.getLogger('codelike');


/** Need a safe tostring because we are playing with proxies */
function _string(a) {
    if (typeof a === 'symbol') return 'symbol';
    if (a && a.__target) return `proxy(${a.__target})`;
    return a;
}


class stringify {

    constructor() {
        this._result="";
    }
  
    visitRoot(name) { this._result += name; }

    visitThen(first, then) { 
        first.visit(this); 
        this._result+='.then('; 
        then.visit(this); 
        this._result+=')'; 
    }
    
    visitWhen(action, condition) {
        action.visit(this);
        this._result+='.when(';
        condition.visit(this);
        this._result+=')'
    }
    
    visitGet(first, name) {
        first.visit(this);
        this._result+='.';
        this._result+=name;
    }

    visitCall(accessor, name, parameters) {
        accessor.visit(this);
        this._result+='.';
        this._result+=name;
        this._result+='(';
        this._result+=parameters.join(',');
        this._result+=')';
    }

    result() {
        return this._result;
    } 
}

class ActionException extends Error {
}

class BaseAction {

    then(next) {
        log.trace('then', _string(next));
        return new SequentialAction(this, next);
    }

    when(condition) {
        log.trace('when', _string(condition));
        return new ConditionalAction(this, condition);
    }
}

class AccessorElement {

}


class SequentialAction extends BaseAction {
    constructor(first, then) {
        console.assert(first instanceof BaseAction, `${_string(first)} should be an Action`);
        console.assert(then instanceof BaseAction, `${_string(then)} should be an Action`);
        super();
        this._then = then;
        this._first = first;
    }
    
    visit(visitor) { visitor.visitThen(this._first, this._then); }

}

class ConditionalAction extends BaseAction {
    constructor(action, condition) {
        condition = condition.__target || condition;
        log.trace('ConditionalAction - constructor', _string(action), _string(condition));
        console.assert(action instanceof BaseAction, `${_string(action)} should be an Action`);
        console.assert(condition instanceof AccessorElement, `${_string(condition)} should be an accessor`);
        super();
        this.action = action;
        this.condition = condition;
    }
    
    visit(visitor) {
        visitor.visitWhen(this.action, this.condition);
    }
}

class GetterAction extends AccessorElement {

    constructor(first, name) {
        log.trace("GetterAction - constructor", _string(first), _string(name));
        console.assert(first instanceof AccessorElement, `${_string(first)} should be an Accessor`);
        console.assert(typeof name === 'string', `${_string(name)} should be an string`);
        super();
        this.first = first;
        this.name = name;
    }

    visit(visitor) {
        visitor.visitGet(this.first, this.name);
    }
        
}

class MethodCallAction extends BaseAction {

    
    constructor(accessor, name, parameters) {
        log.trace('MethodCallAction - constructor', _string(accessor), _string(name), _string(parameters));
        console.assert(accessor instanceof AccessorElement, `${_string(accessor)} should be an AccessorElement`);
        console.assert(typeof name === 'string', `${_string(name)} should be a string`);
        console.assert(parameters instanceof Array, `${_string(parameters)} should be an array`);
        super();
        this.accessor = accessor;
        this.name = name;
        this.parameters = parameters;
    }

    visit(visitor) {
        visitor.visitCall(this.accessor, this.name, this.parameters);
    } 
}


function wrap(action) {
    return new Proxy(() => action, HANDLER);
}

function unwrap(target) {
    return target();
}



const HANDLER = {
    get: (target, val) => { 
        target = unwrap(target);
        if (val === '__target') return target;
        let real_property = target[val]; 
        if (real_property === undefined) return wrap(new GetterAction(target, val)); 
        if (typeof real_property === 'function') {
            log.trace('Action - HANDLER.get', real_property.name);
            return real_property.bind(target);
        }
        return real_property;
    },

    apply: (target, thisArg, arglist) => {
        target = unwrap(target);
        return new MethodCallAction(target.first, target.name, arglist); 
    }
}

class Builder extends AccessorElement { 

    visit(visitor) { visitor.visitRoot(this.name); }

    static apply(visitor, element) { 
        let v = new visitor();
        element.visit(v);
        return v.result();
    }
    

    constructor(name, visitors) {
        super();
        this.name = name;
        this.stringify = element => Builder.apply(stringify, element);

        for (let visitor of visitors) 
            this[visitor.name] = element => Builder.apply(visitor, element);
    }

    get builder() { return wrap(this); }
}

module.exports = Builder;

