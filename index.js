'use strict'

const fp = require('fastify-plugin')
const Ajv = require('ajv')
const ValidatorDictionary = require('./lib/dictionary')

// TODO: add default validator
// TODO: allow AJV passed by the instance#register function
// TODO: ts types
function plugin (fastifyInstance, opts, done) {
  // validation and more
  const validatorInstance = new ValidatorDictionary()

  // TODO: Make it work with the #bucket:
  /**
   * 1. Because is needed to resolve $ref statements
   * 2. For do a fallback if not config.schemaBuilders is set
   * 3. For each new instance, the parent schemas are passed and needs to be resolved
   */

  fastifyInstance.addHook('onRoute', params => {
    if (params.config && params.config.schemaBuilders) {
      const { path, method, config } = params
      const builders = config.schemaBuilders
      const keys = Object.keys(builders)

      for (const key of keys) {
        validatorInstance.addValidator(path, method, key, builders[key])
      }
    }
  })

  fastifyInstance.setSchemaController({
    compilersFactory: {
      // TODO: Maybe the same for serializer?
      buildValidator: function (externalSchemas, ajvServerOptions) {
        return function validatorCompiler ({ schema, method, url, httpPart }) {
          // console.log(schema, method, url, httpPart) // #Debug
          const validator = validatorInstance.getValidator(url, method, httpPart) ?? new Ajv(ajvServerOptions)

          // We load schemas if any
          if (externalSchemas) {
            for (const key of Object.keys(externalSchemas)) {
              validator.addSchema(externalSchemas[key], key)
            }
          }

          return validator.compile(schema)
        }
      }
    }
  })

  done()
}

module.exports = fp(plugin, {
  fastify: '>=3.21.0'
})
