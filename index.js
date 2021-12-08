'use strict'

const fp = require('fastify-plugin')
const Ajv = require('ajv')
const ValidatorDictionary = require('./lib/dictionary')
function plugin (fastifyInstance, opts = {}, done) {
  let { defaultValidator } = opts

  // validation and more
  const dictionary = new ValidatorDictionary()
  fastifyInstance.addHook('onRoute', params => {
    if (params.config?.schemaValidators != null) {
      const { path, method, config } = params
      const compilers = config.schemaValidators
      const keys = Object.keys(compilers)

      for (const key of keys) {
        dictionary.addValidator(
          path,
          method,
          // If query passed, we should change it to querystring
          key === 'query' ? 'querystring' : key,
          compilers[key]
        )
      }
    }
  })

  fastifyInstance.setSchemaController({
    compilersFactory: {
      // TODO: Maybe the same for serializer?
      buildValidator: function (externalSchemas, ajvServerOptions) {
        // We load schemas if any
        const schemaIds =
          externalSchemas != null ? Object.keys(externalSchemas) : []
        defaultValidator = defaultValidator ?? new Ajv(ajvServerOptions)

        if (schemaIds.length > 0) {
          const validators = dictionary.getValidators()

          for (const schemaKey of schemaIds) {
            const schema = externalSchemas[schemaKey]
            for (const validator of validators) {
              // Check if schema added or not for custom validators
              if (validator.getSchema(schemaKey) == null) {
                validator.addSchema(schema, schemaKey)
              }
            }

            // Also add it to default validator as fallback
            if (defaultValidator.getSchema(schemaKey) == null) {
              console.log('adding to default validator', schemaKey)
              defaultValidator.addSchema(schema, schemaKey)
            }
          }
        }

        return function validatorCompiler ({ schema, method, url, httpPart }) {
          const httpPartValidator = dictionary.getValidator(
            url,
            method,
            httpPart
          )
          // We compile for cache all schemas for performance
          const fallback = defaultValidator.compile(schema)

          if (httpPartValidator == null) {
            return fallback
          }

          return httpPartValidator.compile(schema)
        }
      }
    }
  })

  done()
}

module.exports = fp(plugin, {
  fastify: '>=3.24.1',
  name: 'fastify-split-validator'
})
