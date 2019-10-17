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

**Note:**
- This example is using Argon Dashboard Pro template which is you can buy at [here](https://demos.creative-tim.com/argon-dashboard-pro/).
- If you going to production, You need to regenerate the `jwt_private.key` and `jwt_public.key` at [here](http://travistidwell.com/jsencrypt/demo/).