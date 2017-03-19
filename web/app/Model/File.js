'use strict'

const Lucid = use('Lucid')
const Helpers = use('Helpers')

let uuid = require('node-uuid')
let bluebird = require('bluebird')

let readFile = bluebird.promisify(require("fs").readFile);
let unlinkFile = bluebird.promisify(require("fs").unlink);

class File extends Lucid {

    static boot () {
        super.boot()
        this.addHook('beforeDelete', 'File.deleteFile')
    }

    static * download (req, res, file) {
        if (!file)
        {
            throw Error("File does not exist")
        }
        res.header('Content-type', file.mime)
        res.header('content-disposition', "attachment; filename=\""+file.name+"\"")
        if (file.path)
        {
            res.download(file.path)
        }
        else
        {
            res.send(file.file)
        }
    }

    static * uploadFile (req, id, options, save_content=false, errors=null) {
        // getting file instance
        let req_file = req.file(id, options)

        if (!req_file
            || Array.isArray(req_file)
            || req_file.file == null
            || req_file.file.size == 0){
            // User did not choose file
            if (errors)
                errors.push({msg: "Nav norādīts fails"})
            return null
        }

        const newTestFileName = uuid.v4();
        const storagePath = Helpers.storagePath()

        yield req_file.move(storagePath, newTestFileName)

        if (!req_file.moved()) {
            if (errors)
            {
                errors.push.apply(errors, req_file.errors())
            }
            return false
        }

        let file = new File()
        file.name = req_file.clientName()
        file.size = req_file.clientSize()
        file.mime = req_file.mimeType()
        if (save_content)
        {
            file.file = yield readFile(req_file.uploadPath())
            yield unlinkFile(req_file.uploadPath())
        }
        else
        {
            file.path = req_file.uploadPath()
        }

        yield file.save()

        return file
    }

    testset_zips () {
        return this.hasMany('App/Model/Testset', 'id', 'zip_id')
    }

    testset_checker() {
        return this.hasMany('App/Model/Testset', 'id', 'checker_id')
    }

    submissions () {
        return this.hasMany('App/Model/Submission', 'id', 'file_id')
    }
}

module.exports = File
