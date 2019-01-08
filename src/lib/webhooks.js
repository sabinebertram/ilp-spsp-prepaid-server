const fetch = require('node-fetch')

const Config = require('../lib/config')
const AccountModel = require('../models/account')

class Webhooks {
  constructor (deps) {
    this.config = deps(Config)
    this.accounts = deps(AccountModel)
  }

  async call (id) {
    const account = await this.accounts.get(id)

    if (!account.webhook) {
      return
    }

    return fetch(account.webhook, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + this.config.token
      },
      body: JSON.stringify({
        balance: account.balance,
        maximum: account.maximum,
        pulled: account.pull_balance,
        pointer: '$' + this.config.host + '/' + id
      })
    })
  }
}

module.exports = Webhooks
