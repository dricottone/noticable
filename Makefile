install:
	npm install monaco-editor electron

clean:
	rm dist/* -f

build:
	./node_modules/.bin/electron main.js

