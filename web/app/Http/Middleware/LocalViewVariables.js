'use strict'

class LocalViewVariables {

    * handle (req, res, next) {
        // Wraps sendView function to provide additional local sendView parameters
        res.__oldSendView = res.sendView
        req.localView = {}

        res.sendView = function * (){
            let obj = arguments[ 1 ] || {}
            Object.assign(obj, req.localView)
            yield res.__oldSendView(...arguments)
        }
        yield next
    }

}

module.exports = LocalViewVariables
