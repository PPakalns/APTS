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
            table.integer('judge_id').unsigned().references('id').inTable('judges') // judge

            table.integer('status')  // See status_map in app/Model/Submission.js

            table.string('public', 1023) // Public testing message
            table.string('private', 1023) // Private testing message

            table.integer('score')
            table.integer('maxscore')

            table.decimal('maxtime', 5, 2)
            table.integer('maxmemory')
        })
    }

    down () {
        this.drop('submissions')
    }

}

module.exports = SubmissionsTableSchema
