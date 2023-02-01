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

## Takeaways on Testing

- Mocking can become very tedious only to replicate elementary logic
- Basic logic could also be tested by using the system as-is, but typically e2e tests execution control is "far away" from the intricacies at the unit levels.
- Hierarchy:
  - Controller Req-Resp
    - -> Service
      - -> DBConnector or other tools (encryption libs, save to fs, make external calls etc.)

An optimal approach to testing would be integration at different levels of the hierarchy (but always go all the way down):

### 📝 _Integrated Unit Tests_

> Run a **test DB** for all tests below

1. prisma service: prisma itself is already tested
   - see if the cleanup works as expected
2. service level

   - test:

     - auth service
     - bookmarks service
     - user service

   - Use the real prisma service
   - **Rely on prisma service** to be tested already
   - perform value checks via scenarios (as in e2e):
     - can it be retrieved after created?
     - can an update be observed?
     - can a delete be observed?
     - can user credentials be used to login after used to sign up?

- check that external calls are made (not in this app)
- possibly mock some calls
  - like argon.hash(), since these provide different values each time
  - external calls
  - if external calls are typically awaited to return before returning from the unit call, the result can be checked for correctness

3. controller level
   - test
     - auth controller
     - bookmarks controller
     - users controller

- use actual auth / bookmark / user services
- **rely on auth / bookmark services** to be tested
- check merely for calls on the service methods (as long as controller performs no additional logic)
- possibly check validation, route guards etc.
- complex e2e scenarios to check for data consistency
  - signup, logout, login (probably tested at service level)
  - login route, then refresh token route, then logout, then cannot refresh token route any more

Checks for correct changes / returned values may be split up btw. service level & controller level.
If service is tested to perform a correct update, and the controller is tested to call the service, we don't need to check for data consistency.

## Established patterns for testing

> - applied to the current app / setup
> - compiled from misc sources

### Unit tests

They are suitable for:

- CRUD ops behave as expected within the unit:
  - password hashed on auth
- **validatable** bearer token is returned from signup/signin

Design:

- unit is a service / controller
- unit-injected services are mocked
- input values and outputs are mocked
- function calls within the unit are spied on

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
