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

            table.integer('ip', 45)
            table.integer('tested').unsigned()
        })
    }

    down () {
        this.drop('judges')
    }
}

module.exports = JudgesTableSchema
