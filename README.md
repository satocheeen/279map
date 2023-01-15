# 279map-backend-main
This is the main server of 279map.

## Package Configuration
```mermaid
flowchart LR
	279map-common
	subgraph frontend
		279map-core
		279map -. use .-> 279map-core
	end
	subgraph backend
		db[("cache db")]
		279map-backend-common
		279map-backend-main <--> odba
		279map-backend-main <--> db
		odba <--> db
		fs["fs (option)"] <--> 279map-backend-main
		fs <--> odba
		279map-backend-main -. use .-> 279map-backend-common
		odba -. use .-> 279map-backend-common
		fs -. use .-> 279map-backend-common
	end
	frontend -. use .-> 279map-common
	backend -. use .-> 279map-common
	279map-core <-- https,wss --> 279map-backend-main

    style 279map-backend-common fill:#faa, stroke:#f55
    style db fill:#faa, stroke:#f55
```

## Deploy
### 279map-backend-common
1. update version in `package.json`.
2. execute `npm i` to update the version in `packege-lock.json`.
3. build
	```shell
	npm run rollup
	```
4. publish
	```shell
	npm publish ./
	```
### DB
1. make docker image
	```shell
	cd db
	docker image build -t 279map-db .
	```
