# Edifice #

_A simple core for your modular app._

````javascript
var core = new Edifice();
var uiModuleFacade = core.createFacade(permittedActions, permittedListeners);
uiModule.init(uiModuleFacade);
````

Each facade can be treated as an event emitter. `emit` events from your module,
and if they're listed in your module's actions (and other modules' listeners)
they'll be passed between modules. Modules can then be kept completely out of
each others' scopes.