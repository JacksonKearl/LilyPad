test:
	psql -f ./models/postgres/init.sql &> /dev/null
	@./node_modules/.bin/mocha

.PHONY: test
