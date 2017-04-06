'use strict'

const Schema = use('Schema')

class AssignmentsTableSchema extends Schema {

    up () {
        this.create('assignments', (table) => {
            table.increments()
            table.timestamps()

            table.boolean('visible').notNullable().defaultTo(true)

            table.integer('score_visibility').notNullable().defaultTo(0)
            // 0 - public score - public tests with details
            // 4 - full score - public tests with details
            // 8 - full score - full tests without details and public tests with details
            // 12 - full score - full tests with details

            table.integer('problem_id').unsigned().references('id').inTable('problems')
            table.integer('group_id').unsigned().references('id').inTable('groups')
        })
    }

    down () {
        this.drop('assignments')
    }

}

module.exports = AssignmentsTableSchema
