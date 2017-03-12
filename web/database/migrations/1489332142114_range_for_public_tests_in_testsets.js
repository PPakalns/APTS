'use strict'

const Schema = use('Schema')

class TestsetsTableSchema extends Schema {

    up () {
        this.table('testresults', (table) => {
            table.boolean("visible").notNullable().defaultTo(false)
        })
        this.table('testsets', (table) => {
            table.string("public_range").notNullable().defaultTo('0-0')
        })
    }

    down () {
        this.table('testresults', (table) => {
            table.dropColumn('visible')
        })
        this.table('testsets', (table) => {
            table.dropColumn('public_range')
        })
    }
}

module.exports = TestsetsTableSchema
