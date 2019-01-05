const uuid = require('uuid')
const levelup = require('levelup')
const leveldown = require('leveldown')
const memdown = require('memdown')
const BigNumber = require('bignumber.js')
const plugin = require('ilp-plugin')()
const SPSP = require('ilp-protocol-spsp')

const Config = require('../lib/config')

class AccountModel {
  constructor (deps) {
    this.config = deps(Config)
    this.db = levelup(this.config.dbPath
      ? leveldown(this.config.dbPath)
      : memdown())

    this.pushBalanceCache = new Map()
    this.pullBalanceCache = new Map()
    this.writeQueue = Promise.resolve()
  }

  async pay ({ id, amount }) {
    const account = await this.get(id)

    if (!this.pushBalanceCache.get(id)) {
      this.pushBalanceCache.set(id, account.balance)
    }

    const balance = new BigNumber(this.pushBalanceCache.get(id))
    const newBalance = BigNumber.min(balance.plus(amount), account.maximum)

    if (balance.isEqualTo(account.maximum)) {
      throw new Error('Maximum input has been reached.')
    }

    let full = false
    if (newBalance.isEqualTo(account.maximum)) {
      full = true
    }

    // TODO: debounce instead of writeQueue
    this.pushBalanceCache.set(id, newBalance.toString())
    this.writeQueue = this.writeQueue.then(async () => {
      const loaded = await this.get(id)
      loaded.balance = newBalance.toString()
      loaded.pull_maximum = newBalance.toString()
      return this.db.put(id, JSON.stringify(loaded))
    })

    return full
  }

  async send ({ id, amount, pointer }) {
    const account = await this.get(id)

    if (!this.pullBalanceCache.get(id)) {
      this.pullBalanceCache.set(id, account.pull_balance)
    }

    const balance = new BigNumber(this.pullBalanceCache.get(id))
    const newBalance = balance.plus(amount)

    if (newBalance.isGreaterThan(account.pull_maximum)) {
      throw new Error('Amount cannot be sent. Not enough funds left.')
    }

    await plugin.connect()
    await SPSP.pay(plugin, {
      receiver: pointer,
      sourceAmount: amount
    })

    this.pullBalanceCache.set(id, newBalance.toString())
    this.writeQueue = this.writeQueue.then(async () => {
      const loaded = await this.get(id)
      loaded.pull_balance = newBalance.toString()
      return this.db.put(id, JSON.stringify(loaded))
    })

    console.log('Sent ' + amount + ' to ' + pointer)

    return { status: 'Success' }
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
