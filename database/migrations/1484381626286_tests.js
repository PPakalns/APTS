'use strict'

const Schema = use('Schema')

class TestsTableSchema extends Schema {

  up () {
    this.create('tests', (table) => {
      table.increments()
      table.timestamps()
      table.integer('number')
      table.integer('problem_id').unsigned().references('id').inTable('problems')

      table.string('input_filename', 255)
      table.string('output_filename', 255)
    })
  }

  down () {
    this.drop('tests')
  }

}

module.exports = TestsTableSchema
