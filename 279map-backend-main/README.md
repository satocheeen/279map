# 279map-backend-main
This is the main server of 279map.

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

		subgraph 279map-common
			279map-common-backend["279map-common"]
		end

		279map-backend-main <--> odba
		279map-backend-main <--> db
		odba <--> db
		fs["fs (option)"] <--> 279map-backend-main
		fs <--> odba
		279map-backend-main -. use .-> 279map-common
		odba -. use .-> 279map-common
		fs -. use .-> 279map-common
	end
	279map-core -.-> api-interface
	original-db[("Original DB")] <--> odba
	
	style 279map-backend-main fill:#faa, stroke:#f55
```

## Develop
1. create .env.dev. from sample.
	```shell
	cp .env.dev.sample .env.dev
	```
2. edit .env.dev
3. package install
	```shell
	npm i
	```
4. start developer server.
	```shell
	npm run dev
	```
when you develop with running 279map-docker container, you stop 279map container.

## Deploy
### 279map-backend-main
1. make docker image
	```shell
	docker image build -t 279map-backend-main .
	```
