'use strict'

const { rule } = require('indicative')

const FILE_REGEX = /^[a-zA-Z]+\.[a-zA-Z]+$/;

class TestsetRestrictionUpdate {
  get validateAll () {
    return true
  }

  get sanitizationRules () {
    return {
      timelimit: 'to_float',
      memory: 'to_int',
      public_range: 'to_prange',
      use_files: 'to_boolean',
    }
  }
  get rules () {
    return {
      timelimit: 'required|number|above:0|under:60', // works for float
      memory: 'required|integer|above:0|under:1024',
      public_range: 'max:250|prange',
      use_files: 'boolean',
      input_file: [ rule('required_if', 'use_files'), rule('max', 20),
                    rule('regex', FILE_REGEX) ],
      output_file: [ rule('required_if', 'use_files'), rule('max', 20),
                     rule('regex', FILE_REGEX), rule('different', 'input_file') ],
    }
  }
}

module.exports = TestsetRestrictionUpdate
