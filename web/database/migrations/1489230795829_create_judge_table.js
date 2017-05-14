'use strict'

const Schema = use('Schema')

class JudgesTableSchema extends Schema {

    up () {
        this.create('judges', (table) => {
            table.increments()
            table.timestamps()

            table.string('name', 254).notNullable().unique()
            table.string('pass', 60).notNullable()

            table.boolean('disabled').notNullable() // Tells if judge is disabled

            table.string('description')

            table.string('status', 254)
            table.integer('submission_id').unsigned().references('id').inTable('submissions')

            table.string('ip', 45)
            table.integer('tested').unsigned()
        })
        this.table('submissions', (table) => {
            table.integer('judge_id').unsigned().references('id').inTable('judges')
        })
    }

    down () {
        this.table('submissions', (table) => {
            table.dropColumn('judge_id')
        })
        this.drop('judges')
    }
}

module.exports = JudgesTableSchema
