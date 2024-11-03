
@echo off
docker-compose down

@echo removing Auto Operations
rmdir %0\..\api\autooperations /s /q
rmdir %0\..\shared-data /s /q
rmdir %0\..\db /s /q
del %0\..\frontend\src\APIHandler.js

@echo Adding Auto Operations
mkdir %0\..\shared-data
mkdir %0\..\db
mkdir %0\..\api\autooperations
mkdir %0\..\api\autooperations\DELETE
mkdir %0\..\api\autooperations\GET
mkdir %0\..\api\autooperations\POST
mkdir %0\..\api\autooperations\PUT

node %0\..\compile-models.js

npm run --prefix frontend installation && ^
npm run --prefix frontend build && ^
docker-compose up -d --build

