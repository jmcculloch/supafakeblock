.PHONY: clean

clean:
	npm run clean

build: clean
	npm run build

package: build
	npm run package
