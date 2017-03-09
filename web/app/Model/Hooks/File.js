'use strict'

const File = exports = module.exports = {}

let bluebird = require('bluebird')
let unlinkFile = bluebird.promisify(require("fs").unlink);
/*
 * Deletes file from storage
 */
File.deleteFile = function * (next) {
  console.log("Deleting file", this.name)
  if (this.path != null)
  {
    unlinkFile(this.path)
  }
  yield next
}
