# tala-express

A lightweight nodejs package for adding authorization system on your express app.



## Installation

Install this package with npm or yarn

```bash
  npm install tala-express
  yarn add tala-express
```
    

## Function Reference

#### setTala

Initializes the tala.

```javascript
  setTala(dbConn, configuration);
```

| Parameter       | Type     | Description                |
| :--------       | :------- | :------------------------- |
| `dbConn`        | `object` | **Required**. mysql2 connection or pool, or mongoose |
| `configuration` | `object` | **Required**. Options are described in the configuration section |

#### genToken

Generates token for an user. Use this to generate token after login is succeed.
This token needs to be sent as Authorization header or cookie to verify a request.

```javascript
  genToken(req, userId);
```

| Parameter | Type              | Description                       |
| :-------- | :-------          | :-------------------------------- |
| `req`     | `object`          | **Required**. Current request object of express    |
| `userId`  | `int` or `string` | **Required**. For whom the token will be generated |


#### ensureUser

This function returns a middleware that makes sure a request is authorized.
And if it's authorized then adds `userId`, `accessToken` and `user` attributes
to the request object. `user` attribute will be populated from `userModel`
table (mysql) or model(mongoose) provided in the configuration object.

```javascript
  ensureUser(callback, ignores);
```

| Parameter | Type              | Description                       |
| :-------- | :-------          | :-------------------------------- |
| `callback`| `object`          | **Required**. The function to be called when a request is not authorized |
| `ignores` | `string`, `array`, `regex` | Routes, for which this check can be omitted |

- callback: this function will recieve two arguments, `req`and `res`
- ignores: `string`, `regex` or `array` of both to ignore this check for

```javascript
  app.use(ensureUser((req, res)=>{
    res.status(401).send('Unauthoried request.');
  }, ['/login', '/register']));
```

#### revokeToken (async)

Removes a token from the database.
- Returns nothing of success, and throws error on failure.

```javascript
  revokeToken(userId, token)
```

| Parameter | Type              | Description                        |
| :-------- | :-------          | :--------------------------------  |
| `userId`  | `string` or `int` | **Required**. User id of the token |
| `token`   |    `string`       | **Required**. The token to be removed |

#### getOfUser (async)

Returns an array of tokens that the given user posseses.
- Throws error on failure

```javascript
  getOfUser(userId, page);
```

| Parameter | Type              | Description                        |
| :-------- | :-------          | :--------------------------------  |
| `userId`  | `string` or `int` | **Required**. User id of the user  |
| `page`    |    `int`          | Page number for pagination         |

#### getOfToken (async)

Returns an array of users that a token posseses. This is helpful for logging into
multiple accounts from a single device.
- Throws error on failure

```javascript
  getOfToken(token, page);
```

| Parameter | Type     | Description                        |
| :-------- | :------- | :--------------------------------  |
| `token`   | `string` | **Required**. The token  |
| `page`    |   `int`  | Page number for pagination         |

## Usage

```javascript
  import { createPool } from 'mysql2/promise';
  import { setTala, genToken, ensureUser, attachUser } from 'tala-express';
  import express from 'express';

  const dbConn = createPool({
    host: "localhost",
    user: "root",
    password: "",
    database: "test",
  });
  setTala(dbConn, {
      promise: true
  });

  const app = express();
  
  const authChecker = ensureUser(
    (req, res)=>{
      /**
      * This will get called if user is not authorized
      */
      res.status(401).send('Unauthorized request!');
    },
    '/login' /* Paths to be skipped from this check. array, string or regex */
  );

  const authCheckerApi = ensureUser(
    (req, res)=>{
      res.status(401).send({
        success: false,
        error: 'Unauthorized request!'
      });
    },
    ['/api/login', '/api/register', /^\/api\/guest\//]
  );

  app.use(/^(?!\/api\/)/, authChecker);
  app.use(/^(\/api\/)/, authCheckerApi);

  app.post('/login', (req, res)=>{
      if(req.userId){
          //User is already logged in;
          res.send(req.user);
          return;
      }
      //DO your password check
      const token = genToken(req, user_id);
      //Either you can set this as cookie or send with request header
  });

  app.listen(3000, ()=>{
      console.log('Server started at port 3000');
  });

```

#### Configuration Options

```javascript
  setTala(dbConnection, { //mysql2 connection or pool
    promise: false, //true if connection is promise (mysql2 only)

    cookie: {
        name: 'user_key',
        signed: false //true if cookies are signed
    },

    header: 'Authorization', //The header name by which token will be sent

    /**
    * Provide table name for mysql2 or model for mongoose to
    * add a user property containing user info in req object
    */
    userModel: false,

    /**
    * coloumn names or fields you want to get from users table
    * In case of mysql2 provide array of fields
    * or a direct string as: "full_name as name, COUNT(id) AS any_count"
    * And in case of mongoose provide space separated names as: "name age another_field"
    */
    populate: false,
    
    /**
    * coloumn names or fields you want to get from users table
    * In case of mysql2 provide array of fields
    * or a direct string as: "full_name as name, COUNT(id) AS any_count"
    * And in case of mongoose provide space separated names as: "name age another_field"
    */

    foreignKey: 'id', //id column name in the userModel table
  });
```
