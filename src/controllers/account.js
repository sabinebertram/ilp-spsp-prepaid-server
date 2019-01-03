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
      const { maximum, name, webhook } = ctx.request.body
      const { server } = await this.accounts.create({ maximum, name, webhook })
      ctx.body = { server }
    })
  }
}

module.exports = AccountController
