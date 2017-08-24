const chai = require('chai');
const debug = require('debug')('codelike~tests');
const Builder =require('../codelike');

const expect = chai.expect;

const ActionBuilder = new Builder('Action', []);
const Action = ActionBuilder.builder;

it('Can create action chain and convert to string', () => {
    let action = Action.abc.def.ghi(123,456);
    expect(action).to.exist;
    expect(Action.stringify(action)).to.equal("Action.abc.def.ghi(123,456)");
});

it('Can create filters', () => {
    const filter = () => false;
    let action = Action.abc.$find(filter);
    expect(action).to.exist;
    expect(Action.stringify(action)).to.equal("Action.abc.$find(() => false)");
});


it('Convert then to string', () => {
    let action = Action.abc().when(Action.def);
    expect(Action.stringify(action)).to.equal("Action.abc().when(Action.def)");
});

it('Can convert complex action to string', () => {
    let a = 1;
    let b = 2;
    let action = Action.clearMessages();
    action = action.then(Action.authenticate(a,b));
    action = action.then(Action.closePopup().when(Action.authenticated));
    expect(Action.stringify(action)).to.equal("Action.clearMessages().then(Action.authenticate(1,2)).then(Action.closePopup().when(Action.authenticated))");
});



