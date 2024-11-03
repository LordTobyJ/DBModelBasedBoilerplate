
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

#### Model Format
Models are a json formatted list of SQL keywords, with a table name ALWAYS corresponding to the file name.

 The first item is recommended to be the Primary Key, which should be a UUID ( but is not strictly required to be a UUID ).

A standard Primary Key for a users table would be:
```
{
  "user_id": ["UUID", "PRIMARY KEY", "DEFAULT gen_random_uuid()"],
}
```

`gen_random_uuid()` comes from the pgcrypto extension which is included in the package by default.

Currently the general format expectation of the keywords is:
```
{
  <column_name>: [<sql_type>, [...<sql_keywords>]]
}
```

More specifically, the generators use the sql keywords to make deductions about your needs. Most notably using Foreign Key Constraints, which require special formats, as so:

```
{
  <column_name>: ["<sql_type>", "FOREIGN KEY", "<modelName>", "(<key_restraint>)"]
}
```

Take note of the curly brackets in the key_restraint field, as these are both necessary and expected.

As such, an example foreign key would be:

```
{
  user_group: ["UUID", "FOREIGN KEY", "UserGroups", "(user_group_id)"]
}
```


## ENV File
```
POSTGRES_USER=(Your User)
POSTGRES_PASSWORD=(Your Password)
POSTGRES_DB=(Your DB Name)
```
