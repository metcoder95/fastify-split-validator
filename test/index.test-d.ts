import fastify from 'fastify'
import Ajv from 'ajv'
import plugin from '..'

const serverHttp = fastify()
const customAjv = new Ajv()

serverHttp.register(plugin)

serverHttp.addSchema({
  $id: 'hello',
  type: 'string'
})

serverHttp.register(plugin, {
  defaultValidator: customAjv
})

serverHttp.get('/', {
  schema: {
    querystring: {
      hello: {
        $ref: 'hello#'
      }
    }
  },
  config: {
    schemaValidators: {
      querystring: customAjv
    }
  }
} , async (request, reply) => {})


// -> Second level
serverHttp.register(
  function (fastifyInstance, opts, done) {
    fastifyInstance.register(plugin)

    fastifyInstance.get('/string',{ 
      schema:{
        params: {
          hello: {
            $ref: 'hello#',
          }
        },
        response:{
          200:{
            type:'string'
          }
        },
      },
      config: {
        schemaValidators: {
          params: customAjv
        }
      }
     }, (req, reply) => {
      reply.send({
        hello: 'world'
      })
    })

    // Sending a JSON
    serverHttp.post('/json', (req, reply) => {
      reply.send({ foo: 'bar' })
    })

   
    done()
  },
  { prefix: '/api' }
)

const serverHttp2 = fastify({ http2: true })
serverHttp2.addSchema({
  $id: 'hello',
  type: 'string'
})


serverHttp2.register(plugin, {
  defaultValidator: new Ajv()
})

serverHttp2.get('/', {
  schema: {
    querystring: {
      hello: {
        $ref: 'hello#'
      }
    }
  },
  config: {
    schemaValidators: {
      querystring: customAjv
    }
  }
} , async (request, reply) => {})

// -> First plugin
serverHttp2.register(
  function (fastifyInstance, opts, done) {
    fastifyInstance.get('/string',{ 
      schema:{
        params: {
          hello: {
            $ref: 'hello#',
          }
        },
        response:{
          200:{
            type:'string'
          }
        },
      },
      config: {
        schemaValidators: {
          params: customAjv
        }
      }
     }, (req, reply) => {
      reply.send({
        hello: 'world'
      })
    })

    // Sending a JSON
    fastifyInstance.post('/json', (req, reply) => {
      reply.send({ foo: 'bar' })
    })

    done()
  },
  { prefix: '/api' }
)
