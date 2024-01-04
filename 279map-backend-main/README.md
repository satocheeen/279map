# 279map-backend-main
This is the main server of 279map.

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
