'use strict'

const Schema = use('Schema')

class SubmissionsTableSchema extends Schema {

  up () {
    this.create('submissions', (table) => {
      table.increments()
      table.timestamps()
      table.integer('user_id').unsigned().references('id').inTable('users')
      table.integer('assignment_id').unsigned().references('id').inTable('assignments')
      table.integer('problem_id').unsigned().references('id').inTable('problems')
      table.integer('testset_id').unsigned().references('id').inTable('testsets')

      // Submission
      table.string('type', 10) // cpp cpp11 c c11 pas

      table.integer('filesize')
      table.string('filename', 525)
      table.string('filemime', 525)
      table.integer('filesize')
      table.text('file')

      // Testing results
      table.integer('testing_status') // 0 - waiting, 1-testing, 2-done
      table.integer('judge_id').unsigned().references('id').inTable('users') // judge

      table.string('status', 100) // OK, CE, IE
      table.string('status_message', 525) // CE message

      table.integer('score')
      table.integer('maxscore')
    })
  }

  down () {
    this.drop('submissions')
  }

}

module.exports = SubmissionsTableSchema