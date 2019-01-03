const PSK2 = require('ilp-protocol-psk2')
const debug = require('debug')('ilp-spsp-account:receiver')

const Config = require('../lib/config')
const Webhooks = require('../lib/webhooks')
const AccountModel = require('../models/account')

class Receiver {
  constructor (deps) {
    this.config = deps(Config)
    this.accounts = deps(AccountModel)
    this.webhooks = deps(Webhooks)
    this.plugin = this.config.plugin
    this.receiver = null
  }

  async listen () {
    await this.plugin.connect()

    this.receiver = await PSK2.createReceiver({
      plugin: this.plugin,
      paymentHandler: async params => {
        const amount = params.prepare.amount
        const id = params.prepare.destination.split('.').slice(-3)[0]

        // this will throw if the account has been paid already
        debug('got packet. amount=' + amount, 'account=' + id)
        const paid = await this.accounts.pay({ id, amount })

        if (paid) {
          this.webhooks.call({ id })
            .catch(e => {
              debug('failed to call webhook. error=', e)
            })
        }

        return params.acceptSingleChunk()
      }
    })
  }

  generateAddressAndSecret () {
    return this.receiver.generateAddressAndSecret()
  }
}

module.exports = Receiver
