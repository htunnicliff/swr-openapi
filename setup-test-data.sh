#!/usr/bin/env bash

./node_modules/.bin/openapi-typescript \
  https://petstore3.swagger.io/api/v3/openapi.json \
  --output ./generated/petstore.ts
