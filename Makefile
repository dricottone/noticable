.PHONY: clean build run check-updates

clean:
	rm dist/ noticable-win32-x64/ -rf
	rm node_modules/* -rf

build: clean
	npm install monaco-editor jquery markdown-it github-markdown-css
	npm install --save-dev electron electron-builder

build-windows: ./node_modules/.bin/electron-builder
	./node_modules/.bin/electron-builder --win nsis

run: ./node_modules/.bin/electron
	./node_modules/.bin/electron main.js

check-updates:
	npm update
	npm outdated

