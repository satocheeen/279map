# 279map-core
This is used in 279map.
279map-core connects to 279map server and provides basic features of 279map.
if you want to make originai UI map, you can use 279map-core.

## Package Configuration
```mermaid
flowchart LR
	279map-common
	subgraph frontend
		279map-core
		279map[279map*] -. use .-> 279map-core
	end
	subgraph backend
		direction TB
		279map-main-server <--> odba
    end
	frontend -. use .-> 279map-common
	backend -. use .-> 279map-common
	backend -. use .-> 279map-backend-common
    279map-core <-- https,wss --> 279map-main-server
    style 279map-core fill:#faa, stroke:#f55
```
\* or original map you made

## Development
### build common package
1. build 279map-common
    ```shell
    cd 279map-common
    npm i
    npm run rollup
    ```
2. build 279map-backend-common
    ```shell
    cd 279map-backend-common
    npm i
    npm run rollup
    ```
### set up DB

3. package install in 279map-core
    ```shell
    cd 279map-core
    npm i
    ```

## Copyright
Copyright (c) 2022 satocheeen.com

Released under the MPL-2.0 license

https://www.mozilla.org/en-US/MPL/2.0/
