'use strict'

const Schema = use('Schema')

class FilesTableSchema extends Schema {

  up () {
    this.create('files', (table) => {
      table.increments()
      table.timestamps()

      table.string('name', 525)
      table.string('path', 525)
      table.string('mime', 525)
      table.integer('size')
      table.text('file')
    })
  }

  down () {
    this.drop('files')
  }

}

module.exports = FilesTableSchema
