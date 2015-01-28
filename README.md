ngFeedHenry
===================================

This project is dedicated to creating an Angular friendly way to use the
FeedHenry SDK.

## Why?
JavaScript applications handle events using callbacks, these callbacks can be
triggered at any time in the application life cycle. AngularJS applications
have their own life cycle that manages the values of variables in different
Angular "scopes". If callbacks aren't executed correctly within the Angular
life cycle the values they update or create can be "lost" or take a long time 
to be reflected in your AngularJS component's $scope. This module overcomes
this problem when using the FeedHenry API and provides a nice promise based
wrapper.

## Usage
Add this module as a dependency of your Angular app as with other libraries.

```
angular.module('MyApp', [
  // The usual angular stuff
  'ng',
  // Our fh-js-sdk wrapper
  'ngFeedHenry'
]);
```
Most API calls are provided as an Angular service that you can inject into
your code. Add *ngFeedHenry* as a dependency of your application and then 
require *Act* or *Cloud* as a dependency of any Angular service, controller etc.


## API

### FH.Act (Deprecated)
Errors returned by this API are different to the standard ones in the
fh-js-sdk - they're smarter. Here's a sample error returned to a promise.

```javascript
{
  type: <ERRORS.TYPE>, // Helpful meaningful error type
  err: err, // The usual act err param
  msg: details // The usual act msg param
}
```

#### .request(opts)
Accepts the usual Act call parameters. Returns a promise.


#### .ERRORS
The errors that can be returned in an error object as described above.

* NO_ACTNAME_PROVIDED
* UNKNOWN_ERROR
* UNKNOWN_ACT
* CLOUD_ERROR
* TIMEOUT
* PARSE_ERROR
* NO_NETWORK

Sample errors usage:

```javascript
Act.request({
  act: 'login',
  req: {
    u: 'username',
    p: 'password'
  }
})
.then(function (res) {
  // Do something...
}, function (err) {
  if (err.type === Act.ERRORS.TIMEOUT) {
    // Handle it as you see fit etc...
  }
})

```

### FH.Cloud

#### .request(opts)
Wrapper for $fh.cloud. Takes the standard options object. Returns a promise.

#### .get/put/post/head/del(path, data)
Wrapper for $fh.cloud that performs a request of the specified method by 
providing a path and data. The default content-type (application/json) and 
timeout are used (30 seconds). A promise is returned.

```javascript
Cloud.post('/phones', {
  model: 'S3',
  make: 'Samsung',
})
.then(function (res) {
  // Do something...
}, function (err) {
  // Oh no...
})
```

#### .before([route, validators, ]fn)
Instruct Cloud to run the specified _fn_ on the params of a request that 
matches a route pattern prior to sending it to the cloud. A similar concept to 
express middleware, except for outgoing requests. Very useful if you need to 
perform some form of wrapping or inject certain params into requests but want 
to do so in a DRY friendly manner. Functions are exectued in the order they are 
added and only exected if they match the _route_. If _route_ is omitted the 
function _fn_ will be executed for _Cloud.request/get/put/head/delete/post_.

You can add as many of these as you please. If any of the functions fail the 
request will **not** be sent and the error callback of the promise is triggered.

Params: 

* **route** - Optional. A pattern to use to match the incoming path parameter.
* **validators** - Optional. An object containing RegExp or functions to 
inspect URL params.
* **fn** - The function that will be run to modify the data attribute before 
it's passed to $fh.cloud and sent over HTTPS to the cloud.

Internally this uses 
[route-matcher](https://github.com/cowboy/javascript-route-matcher) to match 
routes. The _route_ and _validators_ params are simply passed to an instance 
of _route-matcher_ so read the docs of that module for more info on route 
matching and to understand the _route_ and _validators_ params.


```javascript
// Every function to users/:id e.g users/123abc will include your local id
Cloud.before('/users/:id', function (params) {
  var defer = $q.defer();

  // Let's assume get ID is defined above
  getId(function (id) {
    params.data = params.data || {}; // If no data is present create a payload

    params.data.myId = id; // Add in our ID

    // IMPORTANT: You must pass the params object back to the resolve!
    defer.resolve(params);
  }, defer.reject);

  return defer.promise;
});
```

#### .after([route, validators, ]fn)
Almost the same as _before_, but instead of running the supplied _fn_ over the 
input params to $fh.cloud it will run _fn_ on the response received by 
$fh.cloud if the request was successful. 

Example usage of _after_:

```javascript
// Upon receiving a response from any request run the through a parser
Cloud.after('/data', function (response) {
  var defer = $q.defer();

  parseResponseData(response.data, function (parsedData) {
    response.parsedData = parsedData;

    defer.resolve(response);
  }, defer.reject);

  return defer.promise;
});
```