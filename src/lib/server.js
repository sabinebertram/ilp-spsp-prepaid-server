const PSK2 = require('ilp-protocol-psk2')
const debug = require('debug')('ilp-spsp-account:server')

const Config = require('./config')
const Webhooks = require('./webhooks')
const AccountModel = require('../models/account')

class Server {
  constructor (deps) {
    this.config = deps(Config)
    this.accounts = deps(AccountModel)
    this.webhooks = deps(Webhooks)
    this.plugin = this.config.plugin
    this.server = null
  }

  async listen () {
    await this.plugin.connect()

    this.server = await PSK2.createReceiver({
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
    return this.server.generateAddressAndSecret()
  }
}

module.exports = Server
