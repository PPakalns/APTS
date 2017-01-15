'use strict'

const Schema = use('Schema')

class SubmissionsTableSchema extends Schema {

  up () {
    this.create('submissions', (table) => {
      table.increments()
      table.timestamps()
      table.integer('user_id').unsigned().references('id').inTable('users')
      table.integer('assignment_id').unsigned().references('id').inTable('assignments')

      table.integer('status')
      table.string('filename', 525)
      table.string('filemime', 525)
      table.integer('filesize')
      table.text('file')

      table.dateTime('update')

      table.integer('score')
      table.integer('maxscore')
    })
  }

  down () {
    this.drop('submissions')
  }

}

module.exports = SubmissionsTableSchema
