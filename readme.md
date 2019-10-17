# totaljs-jwt-session
Example build application with Total.js using JWT and Session.

## Usage
- Download or clone this repository
- Go to extracted directory then `$ npm install`
- Run `$ node debug.js`
- Go to `127.0.0.1:8000`
- Done

## User Authentication
- Register user at `127.0.0.1:8000/register`
- Then you are able to login at `127.0.0.1:8000/login`

### How JWT and Session Works
- JWT and Session is authenticated from middleware.
- Generated JWT token will be expired after `30 days`.
- JWT session will expire automatically if user have no any activity (idle) within `30 minutes`.
- Page session will expire automatically if user have no any activity (idle) within `10 minutes`.
- JWT and Page session will automatically extend the expires time if user have any activity.
- When User logout, JWT session and Page session will be expired but will not make expire the Generated JWT token (reusable for `30 days`).
- This example is for `monolitic architecture`, If you are in `microservices architecture`, you have to use `redis` and modify the `session_api` middleware by yourself.

**Note:**
- This example is using Argon Dashboard Pro template which is you can buy at [here](https://demos.creative-tim.com/argon-dashboard-pro/).
- If you going to production, You need to regenerate the `jwt_private.key` and `jwt_public.key` at [here](http://travistidwell.com/jsencrypt/demo/).