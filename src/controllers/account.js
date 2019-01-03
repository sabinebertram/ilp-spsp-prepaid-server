const AccountModel = require('../models/account')
const Auth = require('../lib/auth')
const debug = require('debug')('ilp-spsp-account:account')

class AccountController {
  constructor (deps) {
    this.accounts = deps(AccountModel)
    this.auth = deps(Auth)
  }

  async init (router) {
    router.post('/', this.auth.getMiddleware(), async ctx => {
      debug('creating account')
      const { amount, reason, webhook } = ctx.request.body
      const { receiver } = await this.accounts.create({ amount, reason, webhook })
      ctx.body = { receiver }
    })
  }
}

module.exports = AccountController
