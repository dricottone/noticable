install:
	npm install monaco-editor monaco-editor-webpack-plugin webpack webpack-cli style-loader css-loader ttf-loader file-loader

clean:
	rm dist/* -f

build:
	./node_modules/.bin/webpack

