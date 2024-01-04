# 279map

## Package Configuration
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
```

| package | | detail |
|--|--|--|
| 279map-backend-main | main server |[ReadeMe](279map-backend-main/README.md) |
| 279map-core | frontend's core modules |[ReadeMe](279map-core/README.md) |
| 279map-backend-common | common modules for backend |[ReadeMe](279map-backend-common/README.md) |
| 279map-db | cache db | [ReadeMe](279map-db/README.md) |

## Develop
### set up Database
```shell
cd 279map-db
docker-compose up -d --build
```
#### build 279map-backend-main
1. create .env.dev. from sample.
    ```shell
    cd 279map-backend-main
    cp .env.dev.sample .env.dev
    ```
2. edit xxxxxx in .env.dev to your environment.
3. package install
    ```shell
    npm i
    cd 279map-backend-common
    npm i
    ```
#### build and start 279map-core
1. package install
    ```shell
    cd 279map-core
    npm i
    ```
### start development sesrver
1. start servers.
```shell
npm start
```
2. open https://localhost on your browser.

## Deploy
TODO: write

## Copyright
Copyright (c) 2022 satocheeen.com

Released under the MPL-2.0 license

https://www.mozilla.org/en-US/MPL/2.0/
