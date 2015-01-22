'use strict';

// Jasmine, Chai and Angular Mocks will be global

var expect = chai.expect;

describe('Act', function () {
  var Act;

  beforeEach(module('ngFeedHenry'));
  beforeEach(inject(function (_Act_) {
    Act = _Act_;
    Act.disableLogging();
    $fh.createApiShim('act');
  }));

  afterEach(function () {
    $fh.act.verifyNoOutstandingRequest();
    $fh.act.verifyNoOutstandingExpectation();
    $fh.createApiShim('act');
  });


  describe('#request', function () {

    it('Should successfully call a cloud function', function (done) {
      $fh.act.expect({
          act: 'login',
          req: {
            u: 'USER',
            p: 'PASS'
          }
      })
      .setResponse(null, {
        status: 'ok'
      });

      Act.request({
        act: 'login',
        req: {
          u: 'USER',
          p: 'PASS'
        }
      }).then(function (res) {
        expect(res).to.be.defined;
        expect(res).to.be.an('object');
        expect(res.status).to.equal('ok');
        done();
      }, done);

      $fh.act.flush();
    });

    it('Should call the cloud but receive an error response', function (done) {
      $fh.act.expect({
          act: 'login',
          req: {
            u: 'USER',
            p: 'PASS'
          }
      })
      .setResponse('Invalid user name and/or password', null);

      Act.request({
        act: 'login',
        req: {
          u: 'USER',
          p: 'PASS'
        }
      }).then(function (res) {
        done(new Error('Success callback should not fire!'));
      }, function(err) {
        expect(err).to.be.defined;
        done();
      });

      $fh.act.flush();
    });
  });

  describe('#getDefaultTimeout', function () {
    it('Should return the default timeout value', function () {
      var t = Act.getDefaultTimeout();

      expect(t).to.be.equal(30 * 1000);
      expect(t).to.be.a('number');
    });
  });

  describe('#setDefaultTimeout', function () {
    it('Set the default timeout to a new value', function () {
      expect(Act.getDefaultTimeout()).to.be.equal(30 * 1000);
      Act.setDefaultTimeout(2);

      expect(Act.getDefaultTimeout()).to.be.equal(2);
    });
  });

});
