'use strict'

class LocalViewVariables {

    * handle (req, res, next) {

        res.viewInstance.global('server_time_offset', (new Date()).getTimezoneOffset())
        res.viewInstance.global('server_time', (new Date()).toISOString())

        yield next
    }

}

module.exports = LocalViewVariables
