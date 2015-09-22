'use strict';

// Jasmine, Chai and Angular Mocks will be global

var expect = chai.expect;

describe('Processors', function () {
  var Pre, $timeout, $q;

  beforeEach(module('ngFeedHenry'));
  beforeEach(inject(function (_Processors_, _$timeout_, _$q_) {
    $q = _$q_
    $timeout = _$timeout_;
    Pre = _Processors_;
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

    it('Should add given processor fn to before * the stack', function () {
      Pre.use(Pre.preprocessors.before, dummyFn);
      expect(Pre.preprocessors.before['*'].stack).to.have.length(1);
      expect(Pre.preprocessors.before['*'].stack[0].fn).to.equal(dummyFn);
    });

    it('Should add the given route and function to the after stack', function () {
      Pre.use(Pre.preprocessors.after, '/users', dummyFn);
      expect(Pre.preprocessors.after['/users'].stack).to.have.length(1);
      expect(Pre.preprocessors.after['/users'].stack[0].fn).to.equal(dummyFn);
    });

    it('Should add the given route and function to the afterError stack', function () {
      Pre.use(Pre.preprocessors.afterError, '/users', dummyFn);
      expect(Pre.preprocessors.afterError['/users'].stack).to.have.length(1);
      expect(Pre.preprocessors.afterError['/users'].stack[0].fn).to.equal(dummyFn);
    });

    it('Should add th given functions to the same before route', function () {
      Pre.use(Pre.preprocessors.before, '/users', dummyFn);
      Pre.use(Pre.preprocessors.before, '/users', dummyFn);

      expect(Pre.preprocessors.before['/users'].stack).to.have.length(2);
      expect(Pre.preprocessors.before['/users'].stack[0].fn).to.equal(dummyFn);
      expect(Pre.preprocessors.before['/users'].stack[1].fn).to.equal(dummyFn);
    });

  });

  describe('#getExistingEntryForRoute', function () {
    it('Should return null', function () {
      var res = Pre.getExistingEntryForRoute(
        Pre.preprocessors.before, '/users'
      );
      expect(res).to.be.null;
    });

    it('Should return an existing entry', function () {
      Pre.before('/users', dummyFn);

      var res = Pre.getExistingEntryForRoute(
        Pre.preprocessors.before, '/users'
      );
      expect(res).to.be.defined;
    });
  });

  describe('#getProcessorsForRoute', function () {
    it('Should return an empty array', function () {
      var arr = Pre.getProcessorsForRoute(Pre.preprocessors.after);
      expect(arr).to.have.length(0);
    });

    it('Should return an array with one entry', function () {
      Pre.use(Pre.preprocessors.after, dummyFn);
      expect(
        Pre.getProcessorsForRoute(Pre.preprocessors.after)
      ).to.have.length(1);
    });

    it('Should return an array with two entries', function () {
      // These will count toward results
      Pre.use(Pre.preprocessors.after, dummyFn);
      Pre.use(Pre.preprocessors.after, '/users', dummyFn);

      // This should not be in returned results
      Pre.use(Pre.preprocessors.after, '/api', dummyFn);

      expect(
        Pre.getProcessorsForRoute(Pre.preprocessors.after, '/users')
      ).to.have.length(2);
    });
  });

  describe('#execBefore', function () {
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

    var before, after;

    beforeEach(function () {
      before = Pre.preprocessors.before;
      after = Pre.preprocessors.after;
    });

    it('Should not modify the params', function (done) {
      var promise = Pre.exec(
        Pre.getProcessorsForRoute(before, TEST_PARAMS.path),
        copy(TEST_PARAMS)
      );

      promise.then(function (params) {
        expect(params).to.deep.equal(TEST_PARAMS);
        done();
      }, function (/* err */) {
        done({});
      });

      $timeout.flush();
    });

    it('Should not modify the params as routes do not match', function (done) {
      Pre.use(after, '/api', dummyFn)
      var promise = Pre.exec(
        Pre.getProcessorsForRoute(after, TEST_PARAMS.path),
        copy(TEST_PARAMS)
      );

      promise.then(function (params) {
        expect(params).to.deep.equal(TEST_PARAMS);
        done();
      }, function (/* err */) {
        done({});
      });

      $timeout.flush();
    });

    it('Should modify the params as routes match', function (done) {
      Pre.use(before, '/users', dummyFn)
      var promise = Pre.exec(
        Pre.getProcessorsForRoute(before, TEST_PARAMS.path),
        copy(TEST_PARAMS)
      );

      promise.then(function (params) {
        expect(params).to.not.deep.equal(TEST_PARAMS);
        done();
      }, function (/* err */) {
        done({});
      });

      $timeout.flush();
    });

    it('Should modify the params twice as routes match', function (done) {
      Pre.use(after, '/users', dummyFn)
      Pre.use(after, dummyFn2)
      var promise = Pre.exec(
        Pre.getProcessorsForRoute(after, TEST_PARAMS.path),
        copy(TEST_PARAMS)
      );

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
