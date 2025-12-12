import path = require("path");

export type TruelayerConfig = {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  cacheDir: string;
  accounts: TruelayerBankAccount[];
};

export type TruelayerBankAccount = {
  id: string;
  name: string;
  refreshToken: string;
  type: "CARD" | "ACCOUNT";
};

type TruelayerResponse<T> = {
  results: T[]
  status: "Succeeded";
}

type TokenResponse = {
  access_token: string;
  refresh_token: string;
};

type CardAccountResponse = TruelayerResponse<{
  display_name: string;
  account_id: string;
  card_network: string;
}>;


export type TruelayerTransaction = {
  timestamp: string; // "2025-09-14T00:00:00Z"
  description: string;
  transaction_type: string;
  transaction_category: string;
  amount: number; // 8.98
  currency: string; // "GBP",
  transaction_id: string;
  provider_transaction_id?: string;
  normalised_provider_transaction_id?: string;
  meta: {
    provider_merchant_name: string;
    address: string;
    transaction_type: string;
    provider_reference?: string;
    provider_id?: string;
  };
};
type TransactionsResponse = {
  results: TruelayerTransaction[];
  status: "Succeeded";
};

export const Truelayer = (config: TruelayerConfig) => {
  const BASE_URL_AUTH = "https://auth.truelayer.com";
  const BASE_URL_API = "https://api.truelayer.com";
  // auth
  const getAuthCode = async (): Promise<string> => {
    const u = new URL(BASE_URL_AUTH);
    u.searchParams.append("response_type", "code");
    u.searchParams.append("client_id", config.clientId);
    u.searchParams.append(
      "scope",
      "info accounts balance cards transactions direct_debits standing_orders offline_access",
    );
    u.searchParams.append("redirect_uri", config.redirectUri);
    u.searchParams.append("providers", "uk-ob-all uk-oauth-all");
    console.log(`Navigate to:\n${u.toString()}`);
    const readline = require("readline").createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    return new Promise((resolve) => {
      readline.question("Paste the code here\n> ", (code: string) => {
        resolve(code);
        readline.close();
      });
    });
  };
  const swapCodeForTokens = async (code: string) => {
    const resp = await fetch(new URL("/connect/token", BASE_URL_AUTH), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "authorization_code",
        client_id: config.clientId,
        client_secret: config.clientSecret,
        redirect_uri: config.redirectUri,
        code: code,
      }),
    });
    const data = (await resp.json()) as TokenResponse;
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
    };
  };
  const refreshToken = async (refreshToken: string) => {
    const resp = await fetch(new URL("/connect/token", BASE_URL_AUTH), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "refresh_token",
        client_id: config.clientId,
        client_secret: config.clientSecret,
        refresh_token: refreshToken,
      }),
    });
    const data = (await resp.json()) as TokenResponse;
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
    };
  };
  // account
  const listAccounts = () => config.accounts;

  const getInfo = async (
    accessToken: string,
    isCard: boolean,
  ): Promise<Omit<TruelayerBankAccount, "refreshToken">[]> => {
    const resp = await fetch(
      new URL(isCard ? `data/v1/cards/` : `data/v1/accounts/`, BASE_URL_API),
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );
    const body = (await resp.json()) as CardAccountResponse;
    return body.results.map((c) => ({
      id: c.account_id,
      name: c.display_name,
      network: c.card_network,
      type: isCard ? "CARD" : "ACCOUNT",
    }));
  };

  const addAccounts = async (): Promise<TruelayerBankAccount[]> => {
    const code = await getAuthCode();
    const creds = await swapCodeForTokens(code);
    // truelayer has different endpoints for cards and accounts
    // that we want to hide here. e.g. Monzo is an account, Amex is a card
    let accounts = await getInfo(creds.accessToken, true);
    if (accounts.length === 0)
      accounts = await getInfo(creds.accessToken, false);
    if (accounts.length === 0)
      throw new Error("Unable to retrieve the account info");
    return accounts.map((a) => ({
      id: a.id,
      name: a.name,
      type: a.type,
      refreshToken: creds.refreshToken,
    }));
  };

  const getTransactions = async (account: TruelayerBankAccount) => {
    const creds = await refreshToken(account.refreshToken);
    const resp = await fetch(
      new URL(
        account.type === "CARD"
          ? `/data/v1/cards/${account.id}/transactions`
          : `/data/v1/accounts/${account.id}/transactions`,
        BASE_URL_API,
      ),
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${creds.accessToken}`,
        },
      },
    );
    const body = (await resp.json()) as TransactionsResponse;
    return body.results;
  };

  const getBalance = async (account: TruelayerBankAccount) => {
    const creds = await refreshToken(account.refreshToken);
    const resp = await fetch(
      new URL(
        account.type === "CARD"
          ? `/data/v1/cards/${account.id}/balance`
          : `/data/v1/accounts/${account.id}/balance`,
        BASE_URL_API,
      ),
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${creds.accessToken}`,
        },
      },
    );
    const data = await resp.json() as TruelayerResponse<{current: number}>;
    if (data.results.length !== 1) throw Error("Only one budget per account expected");
    return data.results[0];
  };
  return { addAccounts, getTransactions, getBalance, listAccounts };
};
