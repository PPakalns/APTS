'use strict'

/*
 * Must pass correct range string, or else behaviour undefined
 */
function getRangeSet(str)
{
    str = String(str).trim()
    if (str=="")
        return {}
    const patt = /^(\d{1,3})(-(\d{1,3}))?$/
    let arr = str.split(',')
    let numset = {}

    for (let range of arr)
    {
        let match = range.trim().match(patt);
        if (match){
            let start = parseInt(match[ 1 ])
            let end = start

            if (match[ 3 ])
            {
                end = parseInt(match[3])
            }

            if (start > end)
            {
                throw Error('Range string incorrect');
            }

            for (let i=start; i<=end; i++)
            {
                numset[ i ] = true
            }
        }
        else
        {
            throw Error('Range string incorrect');
        }
    }

    return numset;
}

function parseRangeStr(str, errors){
    str = String(str).trim()
    if (str=="")
        return ''
    if (str.length>=250)
    {
        errors.push({msg: "Samaziniet publisko testa grupu aprakstošā teksta garumu."})
        return false
    }
    const patt = /^(\d{1,3})(-(\d{1,3}))?$/
    let arr = str.split(',')
    let numset = {}

    let min=1000
    let max=0

    for (let range of arr)
    {
        let match = range.trim().match(patt);
        if (match){
            let start = parseInt(match[ 1 ])
            let end = start

            if (match[ 3 ])
            {
                end = parseInt(match[3])
            }

            if (start > end)
            {
                errors.push({msg: "Publiskajās grupās jāizpildās īpašībai: A-B => A<=B"})
                return false
            }

            if (start < min)
                min = start
            if (max < end)
                max = end

            for (let i=start; i<=end; i++)
            {
                numset[ i ] = true
            }
        }
        else
        {
            errors.push({msg: "\"" + String(range) + "\" nepareiza vērtība"})
            return false
        }
    }

    let corr = ""
    let started = false
    let from = 0
    max = max+1 // No additional if

    for (let i=min; i<=max; i++)
    {
        if (numset.hasOwnProperty(i))
        {
            if (started == false)
            {
                started = true
                from = i
            }
        }
        else
        {
            if (started == true)
            {
                started = false

                if (corr != "")
                    corr += ","

                if (from == i-1)
                    corr += from.toString()
                else
                    corr += (from.toString() + "-" + (i-1).toString())
            }
        }
    }

    return corr
}

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

const TESTING_STAGE = {
    "WAIT" : 0,
    "PUBLIC_TESTING" : 4,
    "PUBLIC_DONE" : 8,
    "NON_PUBLIC_TESTING" : 12,
    "TESTING_DONE" : 16,

    "__NEXT" : 4,
    "__IS_TESTING_STAGE": function(stage){
        return ([4, 12].indexOf(stage) != -1)
    }
}

module.exports = {
    bulkInsert : bulkInsert,
    parseRangeStr : parseRangeStr,
    getRangeSet: getRangeSet,
    TESTING_STAGE: TESTING_STAGE
}

