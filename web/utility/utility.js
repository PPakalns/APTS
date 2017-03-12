'use strict'


function * bulkInsert(obj, elements){

    let to_insert = []
    let bulk_size = 30

    for (let e of elements)
    {
        to_insert.push(e)
        if (to_insert.length >= bulk_size)
        {
            yield obj.query().insert(to_insert)
            to_insert = []
        }
    }

    if (to_insert.length > 0)
        yield obj.query().insert(to_insert)
}

module.exports = {
    bulkInsert : bulkInsert
}

