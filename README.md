ngFeedHenry
===================================

This project is dedicated to creating an Angular friendly way to use the
FeedHenry SDK.

## Why?
JavaScript applications handle events using callbacks, these callbacks can be
triggered at any time in the application life cycle. AngularJS applications
have their own life cycle that manages the values of variables in different
Angular "scopes". If callbacks aren't executed correctly within the Angular
life cycle the values they update or create can be lost. This module overcomes
this problem when using the FeedHenry API and provides a nice promise based
wrapper; if you're into that sort of thing.

## Usage
Add this module as a dependency of your Angular app as with other libraries.

```
angular.module('MyApp', [
  // The usual angular stuff
  'ng',
  // Our fh-js-sdk wrapper
  'ngFH'
]);
```
Most API calls are provided as an Angular service that you can inject into
your code. Add *ngFH* as a dependency of your application and then require
*FH.Act* or *FH.Cloud* as a dependency of any Angular service, controller etc.


## API

### FH.Act
Errors returned by this API are different to the standard ones in the
fh-js-sdk - they're smarter. Here's a sample error returned to callback.

```javascript
{
  type: <ERRORS.TYPE>, // Helpful meaningful error type
  err: err, // The usual act err param
  msg: details // The usual act msg param
}
```

#### .request(opts[, callback])
Accepts the usual Act call parameters and an optional callback. If no callback
is provided a promise is returned.


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
  u: 'username',
  p: 'password'
}, function (err, res) {
    if (err && err.type === Act.ERRORS.TIMEOUT) {
      // Handle it as you see fit etc...
    } else {
      // Woohoo!
    }
  }
})

```

### FH.Cloud

#### .request(opts[, callback])
Wrapper for $fh.cloud. Takes the standard options object and an optional
callback function that follows the Node.js convention of taking an error
as the first parameter and a result as the second. If a callback isn't provided
a promise is returned.

#### .get/put/post/head/delete(opts[, callback])
Perform a request of the specified type providing a regular options object to
the fh-js-sdk. An optional *callback* is accepted. If no callback is provided
a promise is returned.

```javascript
Cloud.post({
  path: '/phones',
  model: 'S3',
  make: 'Samsung',
}, function (err, res) {
	if (err) {
		// Deal with it...
	} else {
		// Great success!
	}
});
```