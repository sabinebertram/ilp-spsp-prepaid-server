# ILP SPSP Prepaid Server
> SPSP server that supports accounts to pay into and to pull from, given the permissions. 

- [Usage](#usage)
- [Environment Variables](#environment-variables)
- [API](#api)
  - [Create an Account](#create-an-account)
  - [Query an Account](#query-an-account)
  - [Webhooks](#webhooks)

## Usage

```sh
SPSP_LOCALTUNNEL=true SPSP_LOCALTUNNEL_SUBDOMAIN=mysubdomain npm start

# creates an account for 10 XRP; the sender can use chunked payments
http POST mysubdomain.localtunnel.me maximum=10000000 name="Survey1" Authorization:"Bearer test" 

# {
#     "receiver": "$mysubdomain.localtunnel.me/f1ce1882-8f72-4cc1-9374-e0cef46e46ff"
# }

http GET mysubdomain.localtunnel.me/f1ce1882-8f72-4cc1-9374-e0cef46e46ff Accept:"application/spsp4+json"

# {
#   "destination_account":       "test.strata-ilsp-3.xrpTestChildren.KvwQ8qEiDsW6MkHhbE1mhXW459EJnqlaad7A5R1Qys0.local.dkhtKBcw02gE26OH25n5uHlvNvjRLC2c4iM-BcYcA3c.81zoVRpXjpJ10mXkvmCR7xvc~f1ce1882-8f72-4cc1-9374-e0cef46e46ff",
#   "shared_secret": "01+J64b+gwLD0ivhpzam/RnOb/XgzGb+IwGR2FcDUuk="
#   "balance": {
#     "available": "0",
#     "current": "0",
#     "maximum": "10000000"
#   },
#   "receiver_info": {
#     "name": "Survey1"
#   }
# }

ilp-spsp send -r '$mysubdomain.localtunnel.me/f1ce1882-8f72-4cc1-9374-e0cef46e46ff' -a 1000

# sent!


http GET mysubdomain.localtunnel.me/f1ce1882-8f72-4cc1-9374-e0cef46e46ff Accept:"application/spsp4+json"

# {
#   "destination_account":       "test.strata-ilsp-3.xrpTestChildren.KvwQ8qEiDsW6MkHhbE1mhXW459EJnqlaad7A5R1Qys0.local.dkhtKBcw02gE26OH25n5uHlvNvjRLC2c4iM-BcYcA3c.81zoVRpXjpJ10mXkvmCR7xvc~f1ce1882-8f72-4cc1-9374-e0cef46e46ff",
#   "shared_secret": "01+J64b+gwLD0ivhpzam/RnOb/XgzGb+IwGR2FcDUuk="
#   "balance": {
#     "available": "1000",
#     "current": "1000",
#     "maximum": "10000000"
#   },
#   "receiver_info": {
#     "name": "Survey1"
#   }
# }

http POST mysubdomain.localtunnel.me/f1ce1882-8f72-4cc1-9374-e0cef46e46ff amount=100 pointer='$spsp.strata-ilsp-3.com:8084' Authorization:"Bearer test" 

http GET mysubdomain.localtunnel.me/f1ce1882-8f72-4cc1-9374-e0cef46e46ff Accept:"application/spsp4+json"

# {
#   "destination_account":       "test.strata-ilsp-3.xrpTestChildren.KvwQ8qEiDsW6MkHhbE1mhXW459EJnqlaad7A5R1Qys0.local.dkhtKBcw02gE26OH25n5uHlvNvjRLC2c4iM-BcYcA3c.81zoVRpXjpJ10mXkvmCR7xvc~f1ce1882-8f72-4cc1-9374-e0cef46e46ff",
#   "shared_secret": "01+J64b+gwLD0ivhpzam/RnOb/XgzGb+IwGR2FcDUuk="
#   "balance": {
#     "available": "900",
#     "current": "1000",
#     "maximum": "10000000"
#   },
#   "receiver_info": {
#     "name": "Survey1"
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
| `SPSP_AUTH_TOKEN` | `test` | Bearer token for creating accounts, sending payments, and receiving webhooks. |
| `SPSP_HOST` | localhost or localtunnel | Host to include in payment pointers |

## API

### Create an Account

```http
POST /
```

Create an account.

#### Request

- `maximum` - Maximum amount that can be paid into this account, in base ledger units.
- `name` - Name or reference for account. 
- `webhook` - (Optional) Webhook to `POST` to after the account has been funded. See [Webhooks](#webhooks)

#### Response

- `receiver` - Payment pointer created for this account.

### Query an Account

```http
GET /:account_id
```

SPSP server endpoint for the account with `:account_id`. The payment pointer
returned by [Create an Account](#create-an-account) resolves to this endpoint.

### Pay to a third party

```http
POST /:account_id
```

Pay out of the account corresponding to `account_id`.

#### Request

- `amount` - Amount to be sent to third party, in base ledger units.
- `pointer` - Third party's payment pointer. 

#### Response

- 200 OK

### Webhooks

When an account is funded and a webhook is specified, the webhook will be called. The request is a `POST` containing `Authorization: Bearer <SPSP_AUTH_TOKEN>` and the following values

    {
      "balance": 1000000,
      "maximum": 1000000,
      "available": 456000,
      "pointer": "$mysubdomain.localtunnel.me/f1ce1882-8f72-4cc1-9374-e0cef46e46ff",
    }

