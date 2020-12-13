clean:
	rm dist/* -rf
	rm node_modules/* -rf

build: clean
	npm install monaco-editor electron electron-localshortcut jquery markdown-it
	./node_modules/.bin/electron main.js

run:
	./node_modules/.bin/electron main.js

