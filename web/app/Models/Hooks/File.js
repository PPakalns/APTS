'use strict'

const FileHook = exports = module.exports = {}

const Helpers = use('Helpers')
let unlinkFile = Helpers.promisify(require("fs").unlink);

FileHook.deleteFile = async (fileInstance) => {
  if (fileInstance.path != null)
  {
    console.log(`Deleting ${fileInstance.path}`)
    await unlinkFile(fileInstance.path)
  }
}
