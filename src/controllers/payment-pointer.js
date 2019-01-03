const AccountModel = require('../models/account')
const Receiver = require('../lib/receiver')

class PaymentPointerController {
  constructor (deps) {
    this.accounts = deps(AccountModel)
    this.receiver = deps(Receiver)
  }

  async init (router) {
    await this.receiver.listen()

    router.get('/:account_id', async ctx => {
      if (ctx.get('Accept').indexOf('application/spsp+json') === -1) {
        return ctx.throw(404)
      }

      const account = await this.accounts.get(ctx.params.account_id)
      if (!account) {
        return ctx.throw(404, 'Account not found')
      }

      const { destinationAccount, sharedSecret } =
        this.receiver.generateAddressAndSecret()

      const segments = destinationAccount.split('.')
      const resultAccount = segments.slice(0, -2).join('.') +
        '.' + ctx.params.account_id +
        '.' + segments.slice(-2).join('.')

      ctx.set('Content-Type', 'application/spsp+json')
      ctx.body = {
        destination_account: resultAccount,
        shared_secret: sharedSecret,
        balance: {
          current: String(account.balance),
          maximum: String(account.amount)
        },
        receiver_info: {
          reason: account.reason
        }
      }
    })
  }
}

module.exports = PaymentPointerController
