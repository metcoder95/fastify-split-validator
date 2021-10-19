module.exports = class ValidatorDictionary {
  constructor () {
    this.instances = {}
  }

  addValidator (path, method, httpPart, validator) {
    if (this.instances[path] == null) {
      this.instances[path] = {
        [method]: {
          [httpPart]: validator
        }
      }
    }
  }

  getValidator (path, method, httpPart) {
    return this.instances[path]?.[method]?.[httpPart]
  }
}
