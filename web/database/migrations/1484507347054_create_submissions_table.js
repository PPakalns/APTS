'use strict'

const Schema = use('Schema')

class SubmissionsTableSchema extends Schema {

    up () {
        this.create('submissions', (table) => {
            table.increments()
            table.timestamps()

            table.integer('user_id').unsigned().references('id').inTable('users')
            table.integer('assignment_id').unsigned().references('id').inTable('assignments')

            // table.integer('testset_id').unsigned().references('id').inTable('testsets') -- defined after testsets
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

            table.integer('public_score')
            table.integer('public_maxscore')
            table.decimal('public_maxtime', 5, 2)
            table.integer('public_maxmemory')

            // Saves submission testing stage
            // 0 - not testing, 4 - public testing, 8 - public tests done, 12 - non public testing, 16 - all tests done
            table.integer('testing_stage').notNullable().defaultTo(0)

            table.string('status_private') // Save status message for non public tests
        })
    }

    down () {
        this.drop('submissions')
    }

}

module.exports = SubmissionsTableSchema
