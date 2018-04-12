'use strict'

const Hash = use('Hash')
const Token = require('rand-token').generate;

const UserHook = module.exports = {}

/**
 * Hash password
 */
UserHook.hashPassword = async (userInstance) => {
  if (userInstance.password) {
    userInstance.password = await Hash.make(userInstance.password)
  }
}

/**
 * Assign user a unique token
 */
UserHook.createToken = async (userInstance) => {
  const tokenLength = 24
  userInstance.token = String(Token(tokenLength))
}
