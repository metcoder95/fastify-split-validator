# fastify-split-validator

[![CI](https://github.com/MetCoder95/fastify-split-validator/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/MetCoder95/fastify-split-validator/actions/workflows/ci.yml) [![CodeQL](https://github.com/MetCoder95/fastify-split-validator/actions/workflows/codeql-analysis.yml/badge.svg?branch=main)](https://github.com/MetCoder95/fastify-split-validator/actions/workflows/codeql-analysis.yml)

---

`fastify-split-validator` is a plugin which allows you to setup, granularly, different validates per HTTP part of the request. This works at a route level, doing a fallback into a default validator using the default server config from the instance where the plugin is being installed.

You can provide your own default validator to act as fallback in case this is not defined within the definition of the route (_by default uses Ajv@8 as default fallback_).

## Setup

Install by running `npm install fastify-split-validator`.

### Options

**Instance**

- `defaultValidator`: default validator to be used as fallback in case nothing is provided at a route level definition

Example:

```js
const fastify = require('fastify');
const splitValidator = require('fastify-split-validator');
const Ajv = require('ajv');

const app = fastify();
const validator = new Ajv({});

app.register(splitValidator, { defaultValidator: validator });
```

**On Route**

- `schemaValidators`: an object with the HTTP parts as keys and the validators to be used for that part as values
  - `schemaValidators.body`: validator to be used for the body of the request
  - `schemaValidators.params`: validator to be used for the params of the request
  - `schemaValidators.headers`: validator to be used for the headers of the request
  - `schemaValidators.querystring`: validator to be used for the querystring of the request
  - `schemaValidators.query`: alias for `schemaValidators.querystring`

### TypeScript

```ts
import fastify from 'fastify';
import splitValidator from 'fastify-split-validator';
import Ajv from 'ajv';

const app = fastify();
const validator = new Ajv({});
const bodyValidator = new Ajv({});
const headersValidator = new Ajv({});

app.register(splitValidator, { defaultValidator: validator });

app.post('/', {
  config: {
    schemaValidators: {
      body: bodyValidator,
      headers: headersValidator,
    },
  },
}, (req, reply) => {
  // ...
});
```

### JavaScript
```js
const fastify = require('fastify');
const splitValidator = require('fastify-split-validator');
const Ajv = require('ajv');

const app = fastify();
const validator = new Ajv({});
const bodyValidator = new Ajv({});
const headersValidator = new Ajv({});

app.register(splitValidator, { defaultValidator: validator });

app.post('/', {
  config: {
    schemaValidators: {
      body: bodyValidator,
      headers: headersValidator,
    },
  },
}, (req, reply) => {
  // ...
});
```

See [test](test/index.test.js) for more examples.