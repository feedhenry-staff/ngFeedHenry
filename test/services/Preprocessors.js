'use strict';

// Jasmine, Chai and Angular Mocks will be global

var expect = chai.expect;

describe('PreProcessors', function () {
  var Pre, $timeout, $q;

  beforeEach(module('ngFeedHenry'));
  beforeEach(inject(function (_PreProcessors_, _$timeout_, _$q_) {
    $q = _$q_
    $timeout = _$timeout_;
    Pre = _PreProcessors_;
    $fh.createApiShim('cloud');
  }));

  afterEach(function () {
    $fh.cloud.verifyNoOutstandingRequest();
    $fh.cloud.verifyNoOutstandingExpectation();
  });

  var dummyFn = function (params) {
    var defer = $q.defer();

    $timeout(function () {
      params.data.name = 'Updated Name';

      defer.resolve(params);
    });

    return defer.promise;
  };

  var dummyFn2 = function (params) {
    var defer = $q.defer();

    $timeout(function () {
      params.data.occupation = 'Updated Occupation';

      defer.resolve(params);
    });

    return defer.promise;
  };

  describe('#use', function () {

    it('Should add the given processor function to * the stack', function () {
      Pre.use(dummyFn);
      expect(Pre.preprocessors['*'].stack).to.have.length(1);
      expect(Pre.preprocessors['*'].stack[0].fn).to.equal(dummyFn);
    });

    it('Should add the given route and function to the stack', function () {
      Pre.use('/users', dummyFn);
      expect(Pre.preprocessors['/users'].stack).to.have.length(1);
      expect(Pre.preprocessors['/users'].stack[0].fn).to.equal(dummyFn);
    });

    it('Should add the two given functions to the same route', function () {
      Pre.use('/users', dummyFn);
      Pre.use('/users', dummyFn);

      expect(Pre.preprocessors['/users'].stack).to.have.length(2);
      expect(Pre.preprocessors['/users'].stack[0].fn).to.equal(dummyFn);
      expect(Pre.preprocessors['/users'].stack[1].fn).to.equal(dummyFn);
    });

  });

  describe('#getExistingEntryForRoute', function () {
    it('Should return null', function () {
      var res = Pre.getExistingEntryForRoute('/users');
      expect(res).to.be.null;
    });

    it('Should return an existing entry', function () {
      Pre.use('/users', dummyFn);

      var res = Pre.getExistingEntryForRoute('/users');
      expect(res).to.be.defined;
    });
  });

  describe('#getProcessorsForRoute', function () {
    it('Should return an empty array', function () {
      var arr = Pre.getProcessorsForRoute();
      expect(arr).to.have.length(0);
    });

    it('Should return an array with one entry', function () {
      Pre.use(dummyFn);
      expect(Pre.getProcessorsForRoute()).to.have.length(1);
    });

    it('Should return an array with two entries', function () {
      // These will count toward results
      Pre.use(dummyFn);
      Pre.use('/users', dummyFn);

      // This should not be in returned results
      Pre.use('/api', dummyFn);

      expect(Pre.getProcessorsForRoute('/users')).to.have.length(2);
    });
  });

  describe('#exec', function () {
    var TEST_PARAMS = {
      path: '/users',
      data: {
        name: 'I am the Batman',
        occupation: 'Hero'
      }
    };

    function copy (obj) {
      return JSON.parse(JSON.stringify(obj));
    }

    it('Should not modify the params', function (done) {
      var promise = Pre.exec(copy(TEST_PARAMS));

      promise.then(function (params) {
        expect(params).to.deep.equal(TEST_PARAMS);
        done();
      }, function (/* err */) {
        done({});
      });

      $timeout.flush();
    });

    it('Should not modify the params as routes do not match', function (done) {
      Pre.use('/api', dummyFn)
      var promise = Pre.exec(copy(TEST_PARAMS));

      promise.then(function (params) {
        expect(params).to.deep.equal(TEST_PARAMS);
        done();
      }, function (/* err */) {
        done({});
      });

      $timeout.flush();
    });

    it('Should modify the params as routes match', function (done) {
      Pre.use('/users', dummyFn)
      var promise = Pre.exec(copy(TEST_PARAMS));

      promise.then(function (params) {
        expect(params).to.not.deep.equal(TEST_PARAMS);
        done();
      }, function (/* err */) {
        done({});
      });

      $timeout.flush();
    });

    it('Should modify the params twice as routes match', function (done) {
      Pre.use('/users', dummyFn)
      Pre.use(dummyFn2)
      var promise = Pre.exec(copy(TEST_PARAMS));

      promise.then(function (params) {
        expect(params).to.not.deep.equal(TEST_PARAMS);
        expect(params.data.name).to.equal('Updated Name');
        expect(params.data.occupation).to.equal('Updated Occupation');
        done();
      }, function (/* err */) {
        done({});
      });

      $timeout.flush();
    });
  });

});
