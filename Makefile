.PHONY: clean build run check-updates

clean:
	rm dist/* -rf
	rm node_modules/* -rf

build: clean
	npm install monaco-editor electron electron-localshortcut jquery markdown-it github-markdown-css

run:
	./node_modules/.bin/electron main.js

check-updates:
	npm update
	npm outdated

