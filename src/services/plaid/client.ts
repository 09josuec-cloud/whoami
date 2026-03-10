import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';

const plaidEnv = (process.env.PLAID_ENV ?? 'sandbox') as keyof typeof PlaidEnvironments;

const config = new Configuration({
  basePath: PlaidEnvironments[plaidEnv],
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET':
        process.env.PLAID_ENV === 'production'
          ? process.env.PLAID_PRODUCTION_SECRET
          : process.env.PLAID_SANDBOX_SECRET,
    },
  },
});

export const plaidClient = new PlaidApi(config);
