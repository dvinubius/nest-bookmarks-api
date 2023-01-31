## Installation

```bash
$ yarn install
```

## Running the app

```bash
# DB (postgres dev & test DB containers in the background)
$ yarn run db:dev:restart

# development
$ yarn run start

# development w/ watch mode
$ yarn run start:dev

# production mode
$ yarn run start:prod
```

## Test

```bash
# unit tests
$ yarn run test

# integration tests
$ yarn run test:int

# e2e tests
$ yarn run test:e2e

# test coverage
$ yarn run test:cov
```

## Takeaways

### Unit tests

They are suitable for:

- CRUD ops behave as expected within the unit:
  - password hashed on auth
- **validatable** bearer token is returned from signup/signin

Design:

- unit is a service / controller
- unit-injected services are mocked

### Integration tests

They are suitable for:

- CRUD ops behave as expected at the service-abstraction level
- controller - service interop
  - feature controller w/ feature service
- service - service interop
  - feature service w/ db connector
  - feature service w/ feature service (across modules)

Design:

- no mocking
- set up env with test db so DB connector service is not mocked

### e2e tests

Some devs write them only to check that requests and responses have the expected shape, with no tests for precise values.

However, some logical checks can only be made with e2e tests:

- a received bearer token can indeed be used for subsequent auth
- an attempt to edit the own user indeed targets that user, not another one
- an attempt to edit/delete a bookmark indeed targets that bookmark, not another one
- refresh token functionality: can use RT, cannot use AT instead, cannot use RT after logout even if not expired
