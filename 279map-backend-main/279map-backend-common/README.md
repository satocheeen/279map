# 279map-backend-common
This is the common modules for backend.

```mermaid
flowchart RL
	subgraph frontend
		subgraph 279map-core
			279map-common-core["279map-common"]
		end
		279map-frontend -. use .-> 279map-core
	end

	subgraph backend
		db[("279map-db")]

		subgraph 279map-backend-main
			api-interface["api-interface (private)"]
		end

		subgraph 279map-backend-common
			279map-common-backend["279map-common"]
		end

		279map-backend-main <--> odba
		279map-backend-main <--> db
		odba <--> db
		fs["fs (option)"] <--> 279map-backend-main
		fs <--> odba
		279map-backend-main -. use .-> 279map-backend-common
		odba -. use .-> 279map-backend-common
		fs -. use .-> 279map-backend-common
	end
	279map-core -.-> api-interface
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
