const Ajv = require('ajv')
const { kSchemas } = require('./symbols')

function flatSchemas (schemas) {
  const keys = Object.keys(schemas)

  if (keys.length === 0) return []

  let result = []
  for (const key of keys) {
    if (schemas[key] instanceof Ajv) {
      result.push(schemas[key])
    } else {
      const nestedSchemas = flatSchemas(schemas[key])
      result = result.concat(nestedSchemas)
    }
  }

  return result
}

module.exports = class ValidatorDictionary {
  constructor () {
    this[kSchemas] = {}
  }

  addValidator (path, method, httpPart, validator) {
    if (this[kSchemas][path] == null) {
      this[kSchemas][path] = {
        [method]: {
          [httpPart]: validator
        }
      }
    } else if (this[kSchemas][path][method] == null) {
      this[kSchemas][path][method] = {
        [httpPart]: validator
      }
    } else {
      this[kSchemas][path][method][httpPart] = validator
    }
  }

  getValidator (path, method, httpPart) {
    return this[kSchemas][path]?.[method]?.[httpPart]
  }

  getValidators () {
    return flatSchemas(this[kSchemas])
  }
}
