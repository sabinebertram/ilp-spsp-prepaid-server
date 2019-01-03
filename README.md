# ILP SPSP Account Server
> SPSP server that supports accounts

- [Usage](#usage)
- [Environment Variables](#environment-variables)
- [API](#api)
  - [Create an Account](#create-an-account)
  - [Query an Account](#query-an-account)
  - [Webhooks](#webhooks)

## Usage

```sh
SPSP_LOCALTUNNEL=true SPSP_LOCALTUNNEL_SUBDOMAIN=mysubdomain npm start

# creates an account for 10 XRP; the sender will use a chunked payment
http POST mysubdomain.localtunnel.me amount=10000000 reason="you bought something" \
  Authorization:"Bearer test"
# {
#  "server": "$mysubdomain.localtunnel.me/ef6e2a39-ba3c-a5cc-0849-9730ed56d525"
# }

ilp-spsp query -r "$mysubdomain.localtunnel.me/ef6e2a39-ba3c-a5cc-0849-9730ed56d525"
# {
#   "destinationAccount": "g.scylla.client.sharafian-lm.local.abhnViXADp0lCl7urVp18n5OLmOke57RN0ABbW2jliA.f036d74f-da5e-4b38-aca1-bd3cdd12461c.9B47_eWU76I.7tNCY0ytiCulOG4eIQSUiTxk",
#   "sharedSecret": "CFiJIvw1rwcqYnxtWuKZ+Fq2UoR1KwMh4S4sHKVaj1U=",
#   "balance": {
#     "current": "0",
#     "maximum": "10000000"
#   },
#   "serverInfo": {
#     "reason": "you bought something"
#   }
# } 

ilp-spsp account -r "$mysubdomain.localtunnel.me/ef6e2a39-ba3c-a5cc-0849-9730ed56d525"
# paying account at "$accounts.localtunnel.me/84e17e20-0391-4c00-8af7-b0d91c2aaa07"...
# WARNING: PSK2 Chunked Payments are experimental. Money can be lost if an error occurs mid-payment or if the exchange rate changes dramatically! This should not be used for payments that are significantly larger than the path's Maximum Payment Size.
# paid!

ilp-spsp query -r "$mysubdomain.localtunnel.me/ef6e2a39-ba3c-a5cc-0849-9730ed56d525"
# {
#   "destinationAccount": "g.scylla.client.sharafian-lm.local.abhnViXADp0lCl7urVp18n5OLmOke57RN0ABbW2jliA.f036d74f-da5e-4b38-aca1-bd3cdd12461c.9B47_eWU76I.7tNCY0ytiCulOG4eIQSUiTxk",
#   "sharedSecret": "CFiJIvw1rwcqYnxtWuKZ+Fq2UoR1KwMh4S4sHKVaj1U=",
#   "balance": {
#     "current": "10000000",
#     "maximum": "10000000"
#   },
#   "serverInfo": {
#     "reason": "you bought something"
#   }
# } 
```

## Environment Variables

| Name | Default | Description |
|:---|:---|:---|
| `SPSP_PORT` | `6000` | port to listen on locally. |
| `SPSP_LOCALTUNNEL` | | If this variable is defined, `SPSP_PORT` will be proxied by localtunnel under `SPSP_LOCALTUNNEL_SUBDOMAIN`. |
| `SPSP_LOCALTUNNEL_SUBDOMAIN` | | Subdomain to forward `SPSP_PORT` to. Must be defined if you set `SPSP_LOCALTUNNEL` |
| `SPSP_DB_PATH` | | Path for leveldb database. Uses in-memory database if unspecified. |
| `SPSP_AUTH_TOKEN` | `test` | Bearer token for creating accounts and receiving webhooks. |
| `SPSP_HOST` | localhost or localtunnel | Host to include in payment pointers |

## API

### Create an Account

```http
POST /
```

Create an account.

#### Request

- `amount` - Account amount in base ledger units.
- `reason` - Reason for account. Returned in payment pointer response.
- `webhook` - (Optional) Webhook to `POST` to after the account is fully paid. See [Webhooks](#webhooks)

#### Response

- `server` - Payment pointer of the SPSP server created for this account.

### Query an Account

```http
GET /:account_id
```

SPSP server endpoint for the account with `:account_id`. The payment pointer
returned by [Create an Account](#create-an-account) resolves to this endpoint.

### Webhooks

When you [Create an Account](#create-an-account) and specify a webhook, it will
call the specified webhook when the account is paid. The request is a `POST` with

```http
Authorization: Bearer <SPSP_AUTH_TOKEN>

{
  "balance": 1000000,
  "amount": 1000000,
  "pointer": "$localhost:6000/1b6cf71a-f465-43f2-bd69-92f66defbaf7",
}
```
