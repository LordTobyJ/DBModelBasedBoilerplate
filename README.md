
## Setup

1. Add Database Models to db-models
2. Add Any Custom Operations needed to the `API/operations` folder
3. Update `.env` with your parameters
4. run `deploy`

## Stack Infrastructure
API: Express API
Frontend: Vite React
Proxy: NGINX
DB: Postgres

## Creating Models

Models are populated from the db-models directory

A model should be a json file representing a table and its confines.

Currently no system for DB functions exists

The system is built to generate the following on each deploy, for each model present:
* A DB Table
* An Upsert (Create and Update) Operation
* A Delete Operation
* An Upsert Frontend Function
* A Delete Frontend Function

## ENV File
```
POSTGRES_USER=(Your User)
POSTGRES_PASSWORD=(Your Password)
POSTGRES_DB=(Your DB Name)
```
