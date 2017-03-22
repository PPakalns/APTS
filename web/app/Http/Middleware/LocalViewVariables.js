'use strict'

class LocalViewVariables {

    * handle (req, res, next) {
        // Wraps sendView function to provide additional local sendView parameters

        // TODO: Remove when there is new update for adonis-framwork

        res.__oldSendView = res.sendView
        req.localView = {server_time_offset: (new Date()).getTimezoneOffset()}

        res.sendView = function * (){
            let obj = arguments[ 1 ] || {}
            Object.assign(obj, req.localView, {server_time: (new Date()).toISOString()})
            yield res.__oldSendView(arguments[ 0 ], obj)
        }
        yield next
    }

}

module.exports = LocalViewVariables
