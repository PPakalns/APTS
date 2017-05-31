'use strict'

const Schema = use('Schema')

class TestsetInputOutputFilenamesTableSchema extends Schema {

  up () {
    this.table('testsets', (table) => {
        table.boolean('use_files').notNullable().defaultTo(false)
        table.string('input_file', 20).notNullable().defaultTo("")
        table.string('output_file', 20).notNullable().defaultTo("")
    })
  }

  down () {
    this.table('testsets', (table) => {
        table.dropColumn('use_files')
        table.dropColumn('input_file')
        table.dropColumn('output_file')
    })
  }

}

module.exports = TestsetInputOutputFilenamesTableSchema
