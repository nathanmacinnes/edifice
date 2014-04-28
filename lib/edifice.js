var Facade = require("edifice-facade").Facade,
    util = require("util"),
    EventEmitter = require("events").EventEmitter;

module.exports.Edifice = Edifice;

util.inherits(Edifice, EventEmitter);

Edifice.prototype.createFacade = createFacade;
Edifice.prototype.on = modifiedOn;
Edifice.prototype.addListener = modifiedOn;

function Edifice() {
    var thisCore = this;
    this.on('error', function () {});
    this.on('afterNewListener', function (event, listener) {

        // only run this for facade-based listeners
        if (listener.toString() === wrappedListener.toString() ||
                event === "afterNewListener" ||
                event === "error") {
            return;
        }

        wrappedListener.facade = listener.facade;

        // remove the listener and add a new one with an error-handling wrapper
        thisCore.removeListener(event, listener);
        thisCore.addListener(event, wrappedListener);

        function wrappedListener() {
            // putting the if statement in the handler itself instead of at the
            // time it is added allows Facade to add the property after the
            // listener has been added.
            // This is a bit of a hack, and a small (internal) security
            // compromise, so we should work out a better way.
            if (listener.hasOwnProperty('facade')) {
                try {
                    listener.apply(thisCore, arguments);
                } catch (e) {
                    thisCore.emit("error", e, event, listener.facade);
                }
            } else {
                listener.apply(thisCore, arguments);
            }
        }
    });
}
function createFacade(actions, listeners, moduleName) {
    var thisCore = this,
        facade = new Facade(this, actions, listeners);
    return facade.on('error', function (e) {
        thisCore.emit('error', e, facade);
    });
}
function modifiedOn(event, listener) {
    // the default newListener runs before the listener is added, so can't
    // remove listeners, and does not provide a way to prevent them being added
    EventEmitter.prototype.on.call(this, event, listener);
    this.emit("afterNewListener", event, listener);
}