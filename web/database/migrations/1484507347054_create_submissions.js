'use strict'

const Schema = use('Schema')

class SubmissionsTableSchema extends Schema {

  up () {
    this.create('submissions', (table) => {
      table.increments()
      table.timestamps()
      table.integer('user_id').unsigned().references('id').inTable('users')
      table.integer('assignment_id').unsigned().references('id').inTable('assignments')
      table.integer('testset_id').unsigned().references('id').inTable('testsets')
      table.integer('testset_update').unsigned()

      // Submission
      table.string('type', 10) // cpp cpp11 c c11 pas

      table.integer('file_id').unsigned().references('id').inTable('files')

      // Testing results
      table.integer('testing_status') // 0 - waiting, 1-testing, 2-done
      table.integer('judge_id').unsigned().references('id').inTable('users') // judge

      table.string('status', 100) // OK, CE, IE
      table.string('public', 525) // Public testing message
      table.string('private', 525) // Private testing message

      table.integer('score')
      table.integer('maxscore')
    })
  }

  down () {
    this.drop('submissions')
  }

}

module.exports = SubmissionsTableSchema
