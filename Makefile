.PHONY: clean

build: clean
	npm run build

clean:
	npm run clean

package: build
	npm run package
