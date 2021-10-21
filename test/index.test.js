'use strict'

const tap = require('tap')
const AJV = require('ajv')
const Fastify = require('fastify')
const plugin = require('..')

const test = tap.test

// tap.plan(2)

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
        schemaBuilders: {
          querystring: customAjv
        }
      }
    },
    (req, reply) => { }
  )

  try {
    const res = await server.inject(
      {
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
        schemaBuilders: {
          body: customAjv
        }
      }
    },
    (req, reply) => { }
  )

  try {
    const res = await server.inject(
      {
        method: 'POST',
        url: '/',
        payload: {
          msg: 'hello world'
        }
      })

    const body = res.json()

    t.equal(body.message, 'body must be array')
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
        schemaBuilders: {
          params: customAjv
        }
      }
    },
    (req, reply) => { }
  )

  try {
    const res = await server.inject(
      {
        method: 'GET',
        url: '/1'
      })

    const body = res.json()

    t.equal(body.message, 'params must be integer')
    t.equal(
      res.statusCode,
      400,
      'Should coerce the single element array into string'
    )
  } catch (err) {
    t.error(err)
  }
})
