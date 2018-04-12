'use strict'

const RANGE_PATTERN = /^(\d{1,3})(-(\d{1,3}))?$/

/*
 * Must pass correct range string, or else throws exception
 */
function getRangeSet(str)
{
  str = str.replace(/\s/g, '')
  if (str == "")
    return {}
  let arr = str.split(',')
  let numset = {}

  for (let range of arr)
  {
    let match = range.trim().match(RANGE_PATTERN);
    if (match){
      let start = parseInt(match[ 1 ])
      let end = start

      if (match[ 3 ])
        end = parseInt(match[3])

      if (start < 0)
        throw Error('A,A-B: A>=0')

      if (start > end)
        throw Error('A,A-B: A<=B');

      if (end - start > 1000)
        throw Error('A,A-B: B-A<=1000')

      for (let i = start; i <= end; i++)
      {
        numset[ i ] = true
      }
    }
    else
    {
      throw Error('Incorrect format');
    }
  }

  return numset;
}

/*
 * Simplifies string or throws exception
 */
function parseRangeStr(str){
  str = str.replace(/\s/g, '')
  if (str == "")
    return ""
  let numarray = Object.keys(getRangeSet(str))

  if (numarray.length == 0) {
    return ""
  }
  numarray = numarray.map((x) => (parseInt(x)))

  numarray.sort((a, b) => (a - b))

  let corr = ""
  let from = numarray[0]
  let to = from

  let addRange = (from, to) => {
    if (corr != "") {
      corr += ','
    }
    if (from == to) {
      corr += `${from}`
    } else {
      corr += `${from}-${to}`
    }
  }

  for (let i = 1; i < numarray.length; i++) {
    let vi = numarray[i]

    if (vi == to + 1) {
      to = vi
      continue
    }

    addRange(from, to)
    from = vi
    to = vi
  }

  addRange(from, to)

  return corr
}

module.exports = {
  getRangeSet,
  parseRangeStr
}

