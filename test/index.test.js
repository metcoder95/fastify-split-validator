'use strict'

const tap = require('tap')
const AJV = require('ajv')
const Fastify = require('fastify')
const proxyquire = require('proxyquire')
const plugin = require('..')

const test = tap.test

tap.plan(15)

test('Should allow custom AJV instance for querystring', async t => {
  t.plan(1)
  const customAjv = new AJV({ coerceTypes: false })
  const server = Fastify()

  server.register(plugin, {})

  server.get(
    '/',
    {
      schema: {
        querystring: {
          msg: {
            type: 'array',
            items: {
              type: 'string'
            }
          }
        }
      },
      config: {
        schemaValidators: {
          // TODO: normalize to query
          querystring: customAjv
        }
      }
    },
    (req, reply) => {}
  )

  try {
    const res = await server.inject({
      method: 'GET',
      url: '/',
      query: {
        msg: ['hello world']
      }
    })

    t.equal(
      res.statusCode,
      400,
      'Should coerce the single element array into string'
    )
  } catch (err) {
    t.error(err)
  }
})

test('Should allow custom AJV instance for body', async t => {
  t.plan(2)
  const customAjv = new AJV({ coerceTypes: false })
  const server = Fastify()

  server.register(plugin, {})

  server.post(
    '/',
    {
      schema: {
        body: {
          type: 'object',
          properties: {
            msg: {
              type: 'array',
              items: {
                type: 'string'
              }
            }
          }
        }
      },
      config: {
        schemaValidators: {
          body: customAjv
        }
      }
    },
    (req, reply) => {}
  )

  try {
    const res = await server.inject({
      method: 'POST',
      url: '/',
      payload: {
        msg: 'hello world'
      }
    })

    const body = res.json()

    t.equal(body.message, 'body/msg must be array')
    t.equal(
      res.statusCode,
      400,
      'Should coerce the single element array into string'
    )
  } catch (err) {
    t.error(err)
  }
})

test('Should allow custom AJV instance for params', async t => {
  t.plan(2)
  const customAjv = new AJV({ coerceTypes: false })
  const server = Fastify()

  server.register(plugin, {})

  server.get(
    '/:msg',
    {
      schema: {
        params: {
          msg: {
            type: 'integer'
          }
        }
      },
      config: {
        schemaValidators: {
          params: customAjv
        }
      }
    },
    (req, reply) => {}
  )

  try {
    const res = await server.inject({
      method: 'GET',
      url: '/1'
    })

    const body = res.json()

    t.equal(body.message, 'params/msg must be integer')
    t.equal(
      res.statusCode,
      400,
      'Should coerce the single element array into string'
    )
  } catch (err) {
    t.error(err)
  }
})

test('Should allow custom AJV instance for headers', async t => {
  t.plan(2)
  const customAjv = new AJV({ coerceTypes: false })
  const server = Fastify()

  server.register(plugin, {})

  server.get(
    '/',
    {
      schema: {
        headers: {
          'x-type': {
            type: 'integer'
          }
        }
      },
      config: {
        schemaValidators: {
          headers: customAjv
        }
      }
    },
    (req, reply) => {}
  )

  try {
    const res = await server.inject({
      method: 'GET',
      path: '/',
      headers: {
        'x-type': '1'
      }
    })

    const body = res.json()

    // TODO: set into documentation that it's possible the
    // error formatter doesn't work as expected.
    // Custom one should be provided
    t.equal(body.message, 'headers/x-type must be integer')
    t.equal(
      res.statusCode,
      400,
      'Should coerce the single element array into string'
    )
  } catch (err) {
    t.error(err)
  }
})

test('Should work with referenced schemas (querystring)', async t => {
  t.plan(2)
  const customAjv = new AJV({ coerceTypes: false })
  const server = Fastify()

  server.addSchema({
    $id: 'some',
    type: 'array',
    items: {
      type: 'string'
    }
  })

  server.register(plugin, {})

  // The issue is at the `Fastify#setSchemaControler` level,
  // as when adding a new SchemaController the parent is passed
  // instead of the same old Schema Controller, causing
  // to lose the reference to the prior registered Schemas.
  // Reported at: https://github.com/fastify/fastify/issues/3121
  server.get(
    '/',
    {
      schema: {
        query: {
          msg: {
            $ref: 'some#'
          }
        }
      },
      config: {
        schemaValidators: {
          querystring: customAjv
        }
      }
    },
    (req, reply) => {
      reply.send({ noop: 'noop' })
    }
  )

  try {
    const res = await server.inject({
      method: 'GET',
      url: '/',
      query: {
        msg: ['hello world']
      }
    })

    const body = res.json()

    t.equal(body.message, 'querystring/msg must be array')
    t.equal(
      res.statusCode,
      400,
      'Should parse the single element array into string'
    )
  } catch (err) {
    t.error(err)
  }
})

test('Should work with referenced schemas (params)', async t => {
  t.plan(2)
  const customAjv = new AJV({ coerceTypes: false })
  const server = Fastify()

  server.addSchema({
    $id: 'some',
    type: 'integer'
  })

  server.register(plugin, {})

  server.get(
    '/:id',
    {
      schema: {
        params: {
          id: {
            $ref: 'some#'
          }
        }
      },
      config: {
        schemaValidators: {
          params: customAjv
        }
      }
    },
    (req, reply) => {
      reply.send({ noop: 'noop' })
    }
  )

  try {
    const res = await server.inject({
      method: 'GET',
      url: '/1'
    })

    const body = res.json()

    t.equal(body.message, 'params/id must be integer')
    t.equal(res.statusCode, 400, 'Should not coearce the string into integer')
  } catch (err) {
    t.error(err)
  }
})

test('Should work with referenced schemas (headers)', async t => {
  t.plan(2)
  const customAjv = new AJV({ coerceTypes: false })
  const server = Fastify()

  server.addSchema({
    $id: 'some',
    type: 'integer'
  })

  server.register(plugin, {})

  server.get(
    '/',
    {
      schema: {
        headers: {
          'x-id': {
            $ref: 'some#'
          }
        }
      },
      config: {
        schemaValidators: {
          headers: customAjv
        }
      }
    },
    (req, reply) => {
      reply.send({ noop: 'noop' })
    }
  )

  try {
    const res = await server.inject({
      method: 'GET',
      url: '/',
      headers: {
        'x-id': '1'
      }
    })

    const body = res.json()

    t.equal(body.message, 'headers/x-id must be integer')
    t.equal(res.statusCode, 400, 'Should not coearce the string into integer')
  } catch (err) {
    t.error(err)
  }
})
test('Should work with referenced schemas (body)', async t => {
  t.plan(2)
  const customAjv = new AJV({ coerceTypes: false })
  const server = Fastify()

  server.addSchema({
    $id: 'some',
    type: 'string'
  })

  server.register(plugin, {})

  server.post(
    '/',
    {
      schema: {
        body: {
          type: 'object',
          properties: {
            msg: {
              $ref: 'some#'
            }
          }
        }
      },
      config: {
        schemaValidators: {
          body: customAjv
        }
      }
    },
    (req, reply) => {
      reply.send({ noop: 'noop' })
    }
  )

  try {
    const res = await server.inject({
      method: 'POST',
      url: '/',
      payload: {
        msg: 1
      }
    })

    const body = res.json()

    t.equal(body.message, 'body/msg must be string')
    t.equal(res.statusCode, 400, 'Should not coearce the string into integer')
  } catch (err) {
    t.error(err)
  }
})

test('Should work with parent and same instance schemas', async t => {
  t.plan(2)
  const customAjv = new AJV({ coerceTypes: false })
  const server = Fastify()

  server.addSchema({
    $id: 'some',
    type: 'string'
  })

  server.register((instance, opts, done) => {
    instance.addSchema({
      $id: 'another',
      type: 'string'
    })

    // #TODO: Another bug, schemas defined within the same
    // encaptulated plugin are not being registered
    instance.register(plugin, {})

    instance.post(
      '/',
      {
        schema: {
          body: {
            type: 'object',
            properties: {
              msg: {
                $ref: 'some#'
              },
              another: {
                $ref: 'another#'
              }
            }
          }
        },
        config: {
          schemaValidators: {
            body: customAjv
          }
        }
      },
      (req, reply) => {
        reply.send({ noop: 'noop' })
      }
    )

    done()
  })

  try {
    const res = await server.inject({
      method: 'POST',
      url: '/',
      payload: {
        msg: 1
      }
    })

    const body = res.json()

    t.equal(body.message, 'body/msg must be string')
    t.equal(res.statusCode, 400, 'Should not coearce the string into integer')
  } catch (err) {
    t.error(err)
  }
})

test('Should work with parent schemas', async t => {
  t.plan(2)
  const customAjv = new AJV({ coerceTypes: false })
  const server = Fastify()

  server.addSchema({
    $id: 'some',
    type: 'string'
  })

  server.register((instance, opts, done) => {
    instance.register(plugin, {})

    instance.post(
      '/',
      {
        schema: {
          body: {
            type: 'object',
            properties: {
              msg: {
                $ref: 'some#'
              }
            }
          }
        },
        config: {
          schemaValidators: {
            body: customAjv
          }
        }
      },
      (req, reply) => {
        reply.send({ noop: 'noop' })
      }
    )

    done()
  })

  try {
    const res = await server.inject({
      method: 'POST',
      url: '/',
      payload: {
        msg: 1
      }
    })

    const body = res.json()

    t.equal(body.message, 'body/msg must be string')
    t.equal(res.statusCode, 400, 'Should not coearce the string into integer')
  } catch (err) {
    t.error(err)
  }
})

test('Should work with parent nested schemas', async t => {
  t.plan(4)
  const customAjv = new AJV({ coerceTypes: false })
  const server = Fastify()

  server.addSchema({
    $id: 'some',
    type: 'array',
    items: {
      type: 'string'
    }
  })

  server.register((instance, opts, done) => {
    instance.addSchema({
      $id: 'another',
      type: 'integer'
    })

    instance.register((subInstance, opts, innerDone) => {
      subInstance.register(plugin, {})

      subInstance.post(
        '/',
        {
          schema: {
            querystring: {
              msg: {
                $ref: 'some#'
              }
            },
            headers: {
              'x-another': {
                $ref: 'another#'
              }
            }
          },
          config: {
            schemaValidators: {
              querystring: customAjv,
              headers: customAjv
            }
          }
        },
        (req, reply) => {
          reply.send({ noop: 'noop' })
        }
      )

      innerDone()
    })

    done()
  })

  try {
    const [res1, res2] = await Promise.all([
      server.inject({
        method: 'POST',
        url: '/',
        query: {
          msg: ['string']
        }
      }),
      server.inject({
        method: 'POST',
        url: '/',
        headers: {
          'x-another': '1'
        }
      })
    ])

    t.equal(res1.json().message, 'querystring/msg must be array')
    t.equal(res1.statusCode, 400, 'Should not coearce the string into array')
    t.equal(res2.json().message, 'headers/x-another must be integer')
    t.equal(res2.statusCode, 400, 'Should not coearce the string into integer')
  } catch (err) {
    t.error(err)
  }
})

test('Should handle parsing to querystring (query)', async t => {
  t.plan(4)
  const customAjv = new AJV({ coerceTypes: false })
  const server = Fastify()

  server.addSchema({
    $id: 'some',
    type: 'array',
    items: {
      type: 'string'
    }
  })

  server.register((instance, opts, done) => {
    instance.addSchema({
      $id: 'another',
      type: 'integer'
    })

    instance.register((subInstance, opts, innerDone) => {
      subInstance.register(plugin, {})

      subInstance.post(
        '/',
        {
          schema: {
            query: {
              msg: {
                $ref: 'some#'
              }
            },
            headers: {
              'x-another': {
                $ref: 'another#'
              }
            }
          },
          config: {
            schemaValidators: {
              query: customAjv,
              headers: customAjv
            }
          }
        },
        (req, reply) => {
          reply.send({ noop: 'noop' })
        }
      )

      innerDone()
    })

    done()
  })

  try {
    const [res1, res2] = await Promise.all([
      server.inject({
        method: 'POST',
        url: '/',
        query: {
          msg: ['string']
        }
      }),
      server.inject({
        method: 'POST',
        url: '/',
        headers: {
          'x-another': '1'
        }
      })
    ])

    t.equal(res1.json().message, 'querystring/msg must be array')
    t.equal(res1.statusCode, 400, 'Should not coearce the string into array')
    t.equal(res2.json().message, 'headers/x-another must be integer')
    t.equal(res2.statusCode, 400, 'Should not coearce the string into integer')
  } catch (err) {
    t.error(err)
  }
})

test('Should use default plugin validator as fallback', async t => {
  t.plan(3)
  let compileCalled = false
  const defaultAjv = new AJV({ coerceTypes: false })
  const defaultCompile = defaultAjv.compile.bind(defaultAjv)

  defaultAjv.compile = schema => {
    compileCalled = true
    return defaultCompile(schema)
  }

  const proxiedPlugin = proxyquire('..', {
    ajv: class {
      constructor () {
        return defaultAjv
      }
    }
  })

  const server = Fastify()

  server.addSchema({
    $id: 'some',
    type: 'array',
    items: {
      type: 'string'
    }
  })

  server.register((instance, opts, done) => {
    instance.addSchema({
      $id: 'another',
      type: 'integer'
    })

    instance.register(proxiedPlugin, {})

    instance.post(
      '/',
      {
        schema: {
          query: {
            msg: {
              $ref: 'some#'
            }
          },
          headers: {
            'x-another': {
              $ref: 'another#'
            }
          }
        }
      },
      (req, reply) => {
        reply.send({ noop: 'noop' })
      }
    )

    done()
  })

  try {
    const res = await server.inject({
      method: 'POST',
      url: '/',
      query: {
        msg: ['string']
      }
    })

    t.equal(res.json().message, 'querystring/msg must be array')
    t.equal(res.statusCode, 400, 'Should not coearce the string into array')
    t.ok(compileCalled, 'Should have called the default Ajv instance')
  } catch (err) {
    t.error(err)
  }
})

test('Should always cache schema to default plugin validator', async t => {
  t.plan(4)
  let compileCalled = false
  let customCompileCalled = false
  const defaultAjv = new AJV({ coerceTypes: false })
  const headerAjv = new AJV({ coerceTypes: false })
  const defaultCompile = defaultAjv.compile.bind(defaultAjv)
  const headerDefaultCompile = headerAjv.compile.bind(headerAjv)

  defaultAjv.compile = schema => {
    compileCalled = true
    return defaultCompile(schema)
  }

  headerAjv.compile = schema => {
    console.log('called')
    customCompileCalled = true
    return headerDefaultCompile(schema)
  }

  const proxiedPlugin = proxyquire('..', {
    ajv: class {
      constructor () {
        return defaultAjv
      }
    }
  })

  const server = Fastify()

  server.addSchema({
    $id: 'some',
    type: 'array',
    items: {
      type: 'string'
    }
  })

  server.register(async (instance, opts, done) => {
    instance.addSchema({
      $id: 'another',
      type: 'integer'
    })

    await instance.register(proxiedPlugin, {})

    instance.post(
      '/',
      {
        schema: {
          query: {
            msg: {
              $ref: 'some#'
            }
          },
          headers: {
            'x-another': {
              $ref: 'another#'
            }
          }
        },
        config: {
          schemaValidators: {
            headers: headerAjv
          }
        }
      },
      (req, reply) => {
        reply.send({ noop: 'noop' })
      }
    )
  })

  try {
    const res = await server.inject({
      method: 'POST',
      url: '/',
      query: {
        msg: ['string']
      },
      headers: {
        'x-another': 1
      }
    })

    t.equal(res.json().message, 'querystring/msg must be array')
    t.equal(res.statusCode, 400, 'Should not coearce the string into array')
    t.ok(compileCalled, 'Should have called the default Ajv instance')
    t.ok(customCompileCalled, 'Should have called the custom Ajv instance')
  } catch (err) {
    t.error(err)
  }
})

test('Should use default provided validator as fallback', async t => {
  t.plan(3)
  let compileCalled = false
  const defaultAjv = new AJV({ coerceTypes: false })
  const defaultCompile = defaultAjv.compile.bind(defaultAjv)

  defaultAjv.compile = schema => {
    compileCalled = true
    return defaultCompile(schema)
  }

  const server = Fastify()

  server.addSchema({
    $id: 'some',
    type: 'array',
    items: {
      type: 'string'
    }
  })

  server.register((instance, opts, done) => {
    instance.addSchema({
      $id: 'another',
      type: 'integer'
    })

    instance.register(plugin, {
      defaultValidator: defaultAjv
    })

    instance.post(
      '/',
      {
        schema: {
          query: {
            msg: {
              $ref: 'some#'
            }
          },
          headers: {
            'x-another': {
              $ref: 'another#'
            }
          }
        }
      },
      (req, reply) => {
        reply.send({ noop: 'noop' })
      }
    )

    done()
  })

  try {
    const res = await server.inject({
      method: 'POST',
      url: '/',
      query: {
        msg: ['string']
      }
    })

    t.equal(res.json().message, 'querystring/msg must be array')
    t.equal(res.statusCode, 400, 'Should not coearce the string into array')
    t.ok(compileCalled, 'Should have called the default Ajv instance')
  } catch (err) {
    t.error(err)
  }
})
