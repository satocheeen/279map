# 279map-backend-common
This is the common modules for backend.

```mermaid
flowchart LR
	subgraph frontend
		subgraph 279map-frontend
			279map-core
		end
	end

	subgraph backend
		db[("279map-db")]
		279map-backend-main

		279map-backend-main <--> odba["279map-backend-odba"]
		odba-."use".->279map-backend-common
		279map-backend-main-."use".->279map-backend-common

		db -.read.-> 279map-backend-main
		odba -.insert.-> db
	end
	279map-core <--> 279map-backend-main
	original-db[("Original DB")] <--> odba
	
	style 279map-backend-common fill:#faa, stroke:#f55
```

## Deploy
1. update version.
	```shell
	npm version patch
	```
2. build
	```shell
	npm run rollup
	```
3. publish
	```shell
	npm publish ./
	```
