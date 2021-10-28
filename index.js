'use strict'

const fp = require('fastify-plugin')
const Ajv = require('ajv')
const ValidatorDictionary = require('./lib/dictionary')

// TODO: add default validator
// TODO: allow AJV passed by the instance#register function
// TODO: ts types
function plugin (fastifyInstance, opts, done) {
  let { defaultValidator } = opts
  // validation and more
  const dictionary = new ValidatorDictionary()
  fastifyInstance.addHook('onRoute', params => {
    if (params.config?.schemaBuilders != null) {
      const { path, method, config } = params
      const builders = config.schemaBuilders
      const keys = Object.keys(builders)

      for (const key of keys) {
        dictionary.addValidator(path, method, key, builders[key])
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
        defaultValidator = defaultValidator != null ? defaultValidator : new Ajv(ajvServerOptions)

        if (schemaIds.length > 0) {
          const validators = dictionary.getValidators()

          for (const schemaKey of schemaIds) {
            for (const validator of validators) {
              // Check if schema added or not
              if (validator.getSchema(schemaKey) == null) {
                validator.addSchema(externalSchemas[schemaKey], schemaKey)
              }

              if (defaultValidator.getSchema(schemaKey) == null) {
                defaultValidator.addSchema(externalSchemas[schemaKey], schemaKey)
              }
            }
          }
        }

        return function validatorCompiler ({ schema, method, url, httpPart }) {
          const dictionaryValidator = dictionary.getValidator(url, method, httpPart)
          const validator = dictionaryValidator == null ? dictionaryValidator : defaultValidator

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
