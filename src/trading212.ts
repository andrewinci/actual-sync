export type Trading212Config = {
  apiKey: string;
  accounts: Trading212Account[];
};

export type Trading212Account = {
  id: string;
  name: string;
};

export type Trading212Balance = {
  total: number;
  currency: string;
};

export const Trading212 = (config: Trading212Config) => {
  const BASE_URL_API = "https://live.trading212.com/api/v0";

  const listAccounts = () => config.accounts;

  const trading212Api = async <T>(path: string): Promise<T> => {
    const resp = await fetch(new URL(path, BASE_URL_API), {
      headers: {
        "Content-Type": "application/json",
        Authorization: config.apiKey,
      },
    });
    if (!resp.ok) {
      throw new Error(
        `Trading212 API error: ${resp.status} ${resp.statusText}`,
      );
    }
    return (await resp.json()) as T;
  };

  const getBalance = async (
    account: Trading212Account,
  ): Promise<Trading212Balance> => {
    type AccountCashResponse = {
      free: number;
      total: number;
      ppl: number;
      result: number;
      invested: number;
      pieCash: number;
      blockedForStocks: number;
    };

    const data =
      await trading212Api<AccountCashResponse>(`/equity/account/cash`);

    // Return the total value (invested + free cash)
    return {
      total: data.total,
      currency: "GBP", // Trading212 default, could be made configurable
    };
  };

  return { getBalance, listAccounts };
};
