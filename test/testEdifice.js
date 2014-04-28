var EventEmitter = require("events").EventEmitter,
    expect = require("expect.js"),
    injectr = require("injectr"),
    mainFile,
    package,
    path = require("path"),
    pretendr = require("pretendr");

package = require("../package.json");
mainFile = path.join("..", package.main);

describe("Edifice", function () {
    var Edifice,
        requires;
    beforeEach(function () {
        file = require("path").join("..", package.main);
        requires = pretendr({
            "util" : {
                inherits : function () {}
            },
            "events" : {
                EventEmitter : function () {}
            },
            "edifice-facade" : {
                Facade : function () {}
            }
        });
        requires.util.inherits.fake(function (a) {
            a.prototype.on = function () {};
            a.prototype.addListener = a.prototype.on;
            a.prototype.removeListener = function () {};
        });
        Edifice = injectr(mainFile, requires.mock).Edifice;
    });
    it("inherits EventEmitter", function () {
        expect(requires.util.inherits.calls).to.have.length(1);
        expect(requires.util.inherits.calls[0].args)
            .to.have.property(0, Edifice)
            .and.to.have.property(1, requires.events.EventEmitter.mock);
    });
    describe("#createFacade", function () {
        var core,
            mockFacade;
        beforeEach(function () {
            mockFacade = requires["edifice-facade"];
            mockFacade.Facade.template({
                on : function () {},
                emit : function () {}
            });
            mockFacade.Facade.template().on.fake(function () {
                return this;
            });
            Edifice = injectr(mainFile, {
                "edifice-facade" : mockFacade.mock
            }).Edifice;
            core = new Edifice();
        });
        it("returns a Facade", function () {
            expect(core.createFacade()).to.be(
                mockFacade.Facade.instances[0].mock);
        });
        it("passes itself to the facade", function () {
            core.createFacade();
            expect(mockFacade.Facade.calls[0].args)
                .to.have.property(0, core);
        });
        it("passes the list of actions to the facade", function () {
            var actions = [];
            core.createFacade(actions);
            expect(mockFacade.Facade.calls[0].args)
                .to.have.property(1, actions);
        });
        it("passes the list of listeners to the facade", function () {
            var listeners = [];
            core.createFacade([], listeners);
            expect(mockFacade.Facade.calls[0].args)
                .to.have.property(2, listeners);
        });
    });
    describe("#on/#emit", function () {
        var core,
            mockFacade;
        beforeEach(function () {
            mockFacade = EventEmitter;
            Edifice = injectr(mainFile, {
                "edifice-facade" : mockFacade.mock
            }).Edifice;
            core = new Edifice();
        });

        it("catches errors in listeners from facades", function () {
            var err = new Error(),
                f = core.createFacade([], ["x"]),
                mockErrorHandler = pretendr(function () {}),
                listener = pretendr(function () {});
            core.on("error", mockErrorHandler.mock);
            listener.mock.facade = f;
            listener.fake(function () {
                throw err;
            });
            core.on("x", listener.mock);
            expect(function () {
                core.emit("x");
            }).to.not.throwError();

            expect(listener.calls).to.have.length(1);
            expect(mockErrorHandler.calls).to.have.length(1);
            expect(mockErrorHandler.calls[0].args)
                .to.have.property(0, err)
                .and.to.have.property(1, "x")
                .and.to.have.property(2, f);
        });
        it("doesn't catch errors in error listeners", function () {
            // stack overflow could make problems difficult to diagnose

            var f = core.createFacade([], ["x"]),
                mockErrorHandler = pretendr(function () {}),
                listener = pretendr(function () {});
            mockErrorHandler.fake(function () {
                throw "error handler error";
            });
            core.on("error", mockErrorHandler.mock);
            listener.mock.facade = f;
            listener.fake(function () {
                throw "error";
            });
            core.on("x", listener.mock);
            expect(function () {
                core.emit("x");
            }).to.throwError(function (e) {
                expect(e).to.be("error handler error");
            });
        });
        it("doesn't catch errors in non-facade listeners", function () {
            var listener = pretendr(function () {});
            listener.fake(function () {
                throw "error";
            });
            core.on("x", listener.mock);
            expect(function () {
                core.emit("x");
            }).to.throwError();
        });
    });
});