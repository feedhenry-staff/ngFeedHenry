'use strict';

// Jasmine, Chai and Angular Mocks will be global

var expect = chai.expect;

describe('FHHash', function () {
  var FHHash, $timeout, $rootScope;

  beforeEach(module('ngFeedHenry'));

  beforeEach(function () {
    $fh.createApiShim('hash');
  });

  beforeEach(inject(function (_FHHash_, _$timeout_, _$rootScope_) {
    $rootScope = _$rootScope_
    $timeout = _$timeout_;
    FHHash = _FHHash_;
  }));

  afterEach(function () {
    $fh.hash.verifyNoOutstandingRequest();
    $fh.hash.verifyNoOutstandingExpectation();
  });

  describe('#MD5 and other shortcut functions', function () {

    it('Should run the $fh.hash function', function (done) {
      FHHash.MD5('testtext')
        .catch(done)
        .then(function (result) {
          window.dump('CALLED TEST PRIMSE')
          expect(result).to.be.an('object');
          expect(result.hashvalue).to.be.defined;
          expect(result.hashvalue).to.equal('fakehashvalue');
          done();
        }, done);

      $fh.hash.expect({
        algorithm: 'MD5',
        text: 'testtext'
      })
      .setResponse(null, {
        hashvalue: 'fakehashvalue'
      });

      // Flush queues and trigger promises...yes...I know...
      $timeout.flush();
      $fh.hash.flush();
      $rootScope.$apply();
    });

  });

});
