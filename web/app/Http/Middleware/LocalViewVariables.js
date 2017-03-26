'use strict'

class LocalViewVariables {

    * handle (req, res, next) {

        res.viewInstance.global('server_time_offset', (new Date()).getTimezoneOffset())

        yield next
    }

}

module.exports = LocalViewVariables
