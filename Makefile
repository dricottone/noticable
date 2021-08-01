.PHONY: clean build run check-updates

clean:
	rm dist/ noticable-win32-x64/ -rf
	rm node_modules/* -rf

build: clean
	npm install monaco-editor electron-localshortcut jquery markdown-it github-markdown-css
	npm install --save-dev electron electron-builder

build-windows: build
	#NOTE: works but electron-builder is preferred
	#./node_modules/.bin/electron-packager ./ noticable --platform=win32 --arch=x64

	#NOTE: works, but is remarkably slower!
	#./node_modules/.bin/electron-builder --win portable

	./node_modules/.bin/electron-builder --win nsis

run:
	./node_modules/.bin/electron main.js

check-updates:
	npm update
	npm outdated

