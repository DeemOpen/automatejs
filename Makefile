
test: test-cov

test-unit:
	node_modules/mocha/bin/mocha;

test-cov:
	node_modules/.bin/istanbul cover node_modules/.bin/_mocha;

.PHONY: test
