karma			= ./node_modules/karma/bin/karma
jshint			= ./node_modules/.bin/jshint
linelint 		= ./node_modules/.bin/linelint
lintspaces 	= ./node_modules/.bin/lintspaces
browserify 	= ./node_modules/.bin/browserify

srcFiles = $(shell find ./src -type f -name '*.js' | xargs)

.PHONY : test

default: format

# Test file for formatting and errors, then run tests
test:debugbuild
	karma start

# Test file formatting and for errors
format:
	$(linelint) $(srcFiles)
	@echo "linelint pass!\n"
	$(lintspaces) -nt -i js-comments -d spaces -s 2 $(srcFiles)
	@echo "lintspaces pass!\n"
	$(jshint) $(srcFiles)
	@echo "JSHint pass!\n"

debugbuild:
	$(browserify) -e ./src/ngFH.js -o ./test/bundle.js

build:format
	$(browserify) -e ./src/ngFH.js -o ./dist/ngFH.js