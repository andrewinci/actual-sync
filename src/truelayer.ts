import path = require("path");

export type TruelayerConfig = {
    clientId: string,
    clientSecret: string,
    redirectUri: string,
    cacheDir: string
    accounts: TruelayerBankAccount[]
}

export type TruelayerBankAccount = {
    id: string,
    name: string,
    network: string,
    refreshToken: string,
}

type TokenResponse = {
    access_token: string,
    refresh_token: string,
}

type CardsResponse = {
    results: [{
        display_name: string,
        account_id: string,
        card_network: string,
    }],
    status: "Succeeded"
}

type TransactionsResponse = {
    results:
    {
        "timestamp": string, // "2025-09-14T00:00:00Z"
        "description": string,
        "transaction_type": string,
        "transaction_category": string,
        "transaction_classification": [],
        "amount": number, // 8.98
        "currency": string, // "GBP",
        "transaction_id": string,
        "provider_transaction_id": string,
        "normalised_provider_transaction_id": string,
        "meta": {
            "provider_reference": string,
            "provider_merchant_name": string,
            "address": string,
            "transaction_type": string,
            "provider_id": string
        }
    },
    status: "Succeeded"
}

export const Truelayer = (config: TruelayerConfig) => {
    const BASE_URL_AUTH = "https://auth.truelayer.com"
    const BASE_URL_API = "https://api.truelayer.com"
    // auth
    const getAuthCode = async (): Promise<string> => {
        const u = new URL(BASE_URL_AUTH)
        u.searchParams.append("response_type", "code");
        u.searchParams.append("client_id", config.clientId);
        u.searchParams.append("scope", "info accounts balance cards transactions direct_debits standing_orders offline_access");
        u.searchParams.append("redirect_uri", config.redirectUri);
        u.searchParams.append("providers", "uk-ob-all uk-oauth-all");
        console.log(`Navigate to:\n${u.toString()}`);
        const readline = require('readline').createInterface({
            input: process.stdin,
            output: process.stdout
        });
        return new Promise((resolve) => {
            readline.question('Paste the code here\n> ', (code: string) => {
                resolve(code);
                readline.close();
            });
        })
    }
    const swapCodeForTokens = async (code: string) => {
        const resp = await fetch(new URL("/connect/token", BASE_URL_AUTH), {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                "grant_type": "authorization_code",
                "client_id": config.clientId,
                "client_secret": config.clientSecret,
                "redirect_uri": config.redirectUri,
                "code": code,
            })
        })
        const data = await resp.json() as TokenResponse;
        return {
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
        }
    }
    const refreshToken = async (refreshToken: string) => {
        const resp = await fetch(new URL("/connect/token", BASE_URL_AUTH), {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                "grant_type": "refresh_token",
                "client_id": config.clientId,
                "client_secret": config.clientSecret,
                "refresh_token": refreshToken,
            })
        })
        const data = await resp.json() as TokenResponse;
        return {
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
        }
    }
    // account
    const getCardInfo = async (accessToken: string) => {
        const resp = await fetch(new URL(`data/v1/cards/`, BASE_URL_API), {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            }
        })
        const body = await resp.json() as CardsResponse;
        if (body.results.length != 1) throw new Error("Only one result expected");
        return body.results.map(c => ({ id: c.account_id, name: c.display_name, network: c.card_network }))[0]!;
    }
    const addAccount = async (): Promise<TruelayerBankAccount> => {
        const code = await getAuthCode();
        const creds = await swapCodeForTokens(code);
        const card = await getCardInfo(creds.accessToken);
        return ({
            id: card.id,
            name: card.name,
            network: card.network,
            refreshToken: creds.refreshToken,
        })
    }
    const getTransactions = async (account: TruelayerBankAccount) => {
        const creds = await refreshToken(account.refreshToken);
        const resp = await fetch(new URL(`/data/v1/cards/${account.id}/transactions`, BASE_URL_API), {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${creds.accessToken}`
            }
        })
        const body = await resp.json() as TransactionsResponse;
        return body.results;
    };
    return { addAccount, getTransactions }
};