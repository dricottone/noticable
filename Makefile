.PHONY: clean build run check-updates

clean:
	rm dist/ noticable-win32-x64/ -rf
	rm node_modules/* -rf

build: clean
	npm install monaco-editor electron-localshortcut jquery markdown-it github-markdown-css
	npm install --save-dev electron

build-windows: build
	#NOTE: works, but is remarkably slower!
	#electron-builder --win portable
	electron-builder --win nsis

_build-windows-deprecated: build
	electron-packager ./ noticable --platform=win32 --arch=x64

run:
	./node_modules/.bin/electron main.js

check-updates:
	npm update
	npm outdated

