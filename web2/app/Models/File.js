'use strict'

const Model = use('Model')
const Helpers = use('Helpers')

let uuid = require('node-uuid')
let path = require('path')

let readFile = Helpers.promisify(require("fs").readFile);
let unlinkFile = Helpers.promisify(require("fs").unlink);

class File extends Model {

  static boot () {
    super.boot()
    this.addHook('beforeDelete', 'File.deleteFile')
  }

  static async download ({response}, file) {
    if (file.path)
    {
      response.attachment(file.path, file.name)
    }
    else
    {
      response.header('Content-type', file.mime)
      response.header('content-disposition', `attachment; filename="${escape(file.name)}"`)
      response.send(file.file)
    }
  }

  static async upload ({request, response, session, antl},
                        name, types = [], save_db=false, size='64kb') {

    console.log(request.all())
    const dataFile = request.file(name, {size, types})
    if (!dataFile) {
      session.withErrors({[name]: antl.formatMessage('main.file_not_provided')})
      response.redirect('back')
      return false
    }

    let newFileName = uuid.v4()
    await dataFile.move(Helpers.tmpPath('uploads'), {
      name: newFileName
    })
    let filePath = path.join(Helpers.tmpPath('uploads'), newFileName)

    if (!dataFile.moved()) {
      console.log(dataFile.error())
      session.withErrors({[name]: dataFile.error().message})
      response.redirect('back')
      return false
    }

    let file = new File()
    file.name = dataFile.clientName
    file.size = dataFile.size
    file.mime = `${dataFile.type}/${dataFile.subtype}`
    if (save_db) {
      file.file = await readFile(filePath)
      await unlinkFile(filePath)
    }
    else
    {
      file.path = filePath
    }

    await file.save()
    return file
  }

  testset_zips () {
      return this.hasMany('App/Models/Testset', 'id', 'zip_id')
  }

  testset_checker() {
      return this.hasMany('App/Models/Testset', 'id', 'checker_id')
  }

  submissions () {
      return this.hasMany('App/Models/Submission', 'id', 'file_id')
  }
}

module.exports = File
