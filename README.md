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

## Structure
Most API calls are provided as an Angular service that you can inject into 
your code. Add *ngFH* as a dependency of your application and then require 
*FH.Act* or *FH.Cloud* as a dependency of any Angular service, controller etc.

## FH.Cloud

#### .request(opts[, callback])
Wrapper for $fh.cloud. Takes the standard options object and an optional 
callback function that follows the Node.js convention of taking an error 
as the first parameter and a result as the second. If a callback isn't provided 
a promise is returned. 

#### .GET/PUT/POST/HEAD/DELETE(path[, params[, callback]])
Perform a request of the specified type to the specified *path*. Two optional 
paramaters of *params* and *callback* are accepted. If no callback is provided 
a promise is returned.

```javascript
Cloud.POST('/phones', {
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