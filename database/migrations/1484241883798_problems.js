'use strict'

const Schema = use('Schema')

class ProblemsTableSchema extends Schema {

  up () {
    this.create('problems', (table) => {
      table.increments()
      table.timestamps()
      table.string('name', 525)
      table.text('description')
      table.integer('author').unsigned().references('id').inTable('users')

      table.string('test_filename', 525)
      table.string('test_filepath', 525)
      table.integer('test_filesize')
    })
  }

  down () {
    this.drop('problems')
  }

}

module.exports = ProblemsTableSchema
