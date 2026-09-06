TOOLS = [
    {
        "name": "get_balance",
        "description": "Get the balance, account type, and currency for a specific bank account, given its account number.",
        "parameters": {
            "type": "object",
            "properties": {
                "account_number": {
                    "type": "string",
                    "description": "The bank account number, e.g. '1234567890'"
                }
            },
            "required": ["account_number"]
        }
    },
    {
        "name": "get_transactions",
        "description": "Get a list of recent transactions for a specific bank account, given its account number. Returns transaction type, category, amount, description, merchant, and date.",
        "parameters": {
            "type": "object",
            "properties": {
                "account_number": {
                    "type": "string",
                    "description": "The bank account number, e.g. '1234567890'"
                },
                "limit": {
                    "type": "integer",
                    "description": "How many recent transactions to return. Defaults to 5 if not specified."
                }
            },
            "required": ["account_number"]
        }
    },
    {
        "name": "freeze_card",
        "description": "Freeze a debit or credit card so it cannot be used for any transactions, given the last 4 digits of the card number.",
        "parameters": {
            "type": "object",
            "properties": {
                "card_number_last4": {
                    "type": "string",
                    "description": "The last 4 digits of the card to freeze, e.g. '4521'"
                }
            },
            "required": ["card_number_last4"]
        }
    },
    {
        "name": "unfreeze_card",
        "description": "Unfreeze (reactivate) a previously frozen debit or credit card, given the last 4 digits of the card number.",
        "parameters": {
            "type": "object",
            "properties": {
                "card_number_last4": {
                    "type": "string",
                    "description": "The last 4 digits of the card to unfreeze, e.g. '4521'"
                }
            },
            "required": ["card_number_last4"]
        }
    }
]