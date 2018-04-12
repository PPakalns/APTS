'use strict'

const Antl = use('Antl')
const { rule } = require('indicative')

const FILE_REGEX = /^[a-zA-Z_]+\.[a-zA-Z]+$/;

class TestsetRestrictionUpdate {
  get messages() {
    return {
      'required': Antl.formatMessage('main.val_required'),
      'number': Antl.formatMessage('main.val_number'),
      'above': Antl.formatMessage('main.val_above'),
      'under': Antl.formatMessage('main.val_under'),
      'integer': Antl.formatMessage('main.val_integer'),
      'max': Antl.formatMessage('main.val_max'),
      'required_if': Antl.formatMessage('main.val_required_if'),
      'regex': Antl.formatMessage('main.val_regex'),
      'different': Antl.formatMessage('main.io_file_names_different'),
    }
  }

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
