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
      const { receiver } = await this.accounts.create({ maximum, name, webhook })
      ctx.body = { receiver }
    })

    router.post('/:account_id', this.auth.getMiddleware(), async ctx => {
      debug('sending units')
      const id = ctx.params.account_id
      const { amount, pointer } = ctx.request.body
      const status = await this.accounts.send({ id, amount, pointer })
      ctx.status = status
    })
  }
}

module.exports = AccountController
