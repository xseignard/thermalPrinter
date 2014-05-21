MOCHA="node_modules/.bin/mocha"
_MOCHA="node_modules/.bin/_mocha"
JSHINT="node_modules/.bin/jshint"
ISTANBUL="node_modules/.bin/istanbul"

TESTS=$(shell find test/ -name "*.test.js")

clean:
	rm -rf reports

test:
	$(MOCHA) -R spec $(TESTS)

jshint:
	$(JSHINT) src test demo

coverage:
	@# check if reports folder exists, if not create it
	@test -d reports || mkdir reports
	$(ISTANBUL) cover --dir ./reports $(_MOCHA) -- -R spec $(TESTS)

codeclimate:
	CODECLIMATE_REPO_TOKEN=81648f70a46f19c1b4d5c9cf7f53fa40969af62284554621c22d7d038d2c637e codeclimate < reports/lcov.info

ci: clean jshint test coverage codeclimate

.PHONY: clean test jshint coverage codeclimate ci
