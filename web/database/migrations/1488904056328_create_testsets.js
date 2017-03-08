'use strict'

const Schema = use('Schema')

class TestsetsTableSchema extends Schema {

  up () {
    this.create('testsets', (table) => {
      table.increments()
      table.timestamps()

      table.integer('problem_id').unsigned().references('id').inTable('problems')

      table.decimal('timelimit', 4, 2)
      table.integer('memory')

      // Test zip archive
      table.integer('test_count')

      table.string('test_filename', 525)
      table.string('test_filepath', 525)
      table.string('test_filemime', 525)
      table.integer('test_filesize')

      // Checker cpp file
      table.string('checker_filename', 525)
      table.string('checker_filemime', 525)
      table.integer('checker_filesize')
      table.text('checker_file')
    })
  }

  down () {
    this.drop('testsets')
  }
}

module.exports = TestsetsTableSchema
