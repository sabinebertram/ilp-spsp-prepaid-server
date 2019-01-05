const { createServer } = require('ilp-protocol-stream')
const crypto = require('crypto')

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
    this.server = await createServer({
      plugin: this.plugin,
      serverSecret: crypto.randomBytes(32)
    })

    this.server.on('connection', async (connection) => {
      console.log('server got connection')

      const id = connection.connectionTag

      const account = await this.accounts.get(id)

      connection.on('stream', (stream) => {
        stream.setReceiveMax(account.maximum - account.balance)
        stream.on('money', amount => {
          this.accounts.pay({ id, amount })
          console.log('Received ' + amount + ' units from ' + connection._sourceAccount)
        })
      })
    })
  }

  generateAddressAndSecret (connectionTag) {
    return this.server.generateAddressAndSecret(connectionTag)
  }
}

module.exports = Server
