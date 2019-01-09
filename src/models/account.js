const uuid = require('uuid')
const levelup = require('levelup')
const leveldown = require('leveldown')
const memdown = require('memdown')
const BigNumber = require('bignumber.js')
const plugin = require('ilp-plugin')
const SPSP = require('ilp-protocol-spsp')

const Config = require('../lib/config')

class AccountModel {
  constructor (deps) {
    this.config = deps(Config)
    this.db = levelup(this.config.dbPath
      ? leveldown(this.config.dbPath)
      : memdown())
  }

  async pay ({ id, amount }) {
    const account = await this.get(id)

    const balance = new BigNumber(account.balance)
    const newBalance = BigNumber.min(balance.plus(amount), account.maximum)

    let full = false
    if (newBalance.isEqualTo(account.maximum)) {
      full = true
    }

    account.balance = newBalance.toString()
    account.pull_maximum = newBalance.toString()
    await this.db.put(id, JSON.stringify(account))

    return full
  }

  async send ({ id, amount, pointer }) {
    const account = await this.get(id)

    const balance = new BigNumber(account.pull_balance)
    const newBalance = balance.plus(amount)

    if (newBalance.isGreaterThan(account.pull_maximum)) {
      return 400
    }

    await SPSP.pay(plugin(), {
      receiver: pointer,
      sourceAmount: amount
    })

    account.pull_balance = newBalance.toString()
    await this.db.put(id, JSON.stringify(account))

    console.log('Sent ' + amount + ' to ' + pointer)

    return 200
  }

  async get (id) {
    return JSON.parse(await this.db.get(id))
  }

  async create ({ maximum, name, webhook }) {
    const id = uuid()

    await this.db.put(id, JSON.stringify({
      balance: 0,
      maximum,
      pull_balance: 0,
      pull_maximum: 0,
      name,
      webhook
    }))

    return {
      id,
      receiver: '$' + this.config.host + '/' + id
    }
  }
}

module.exports = AccountModel
