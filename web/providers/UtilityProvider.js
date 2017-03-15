'use strict'

const ServiceProvider = require('adonis-fold').ServiceProvider
let Utility = require('./../utility/utility.js')

class UtilityProvider extends ServiceProvider {

    * register () {
        this._bindUtility()
    }

    _bindUtility () {
        this.app.bind('Adonis/Utility', function (app) {
            return Utility
        })
    }

}
module.exports = UtilityProvider
