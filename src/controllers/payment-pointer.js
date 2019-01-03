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
      if (ctx.get('Accept').indexOf('application/spsp4+json') === -1) {
        return ctx.throw(404)
      }

      const account = await this.accounts.get(ctx.params.account_id)
      if (!account) {
        return ctx.throw(404, 'Account not found')
      }

      const { destinationAccount, sharedSecret } =
        this.receiver.generateAddressAndSecret(ctx.params.token_id)

      ctx.set('Content-Type', 'application/spsp4+json')
      ctx.body = {
        destination_account: destinationAccount,
        shared_secret: sharedSecret.toString('base64'),
        balance: {
          current: String(account.balance),
          maximum: String(account.maximum)
        },
        pull_balance: {
          current_amount: String(account.pull_balance),
          maximum_amount: String(account.pull_maximum)
        },
        receiver_info: {
          name: account.name
        }
      }
    })
  }
}

module.exports = PaymentPointerController
