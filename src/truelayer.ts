import path = require("path");
import { TruelayerConfig } from "./config";
import * as fs from "fs/promises";

export const Truelayer = (config: TruelayerConfig) => {
    const getAuthCode = async (): Promise<string> => {
        const url = `https://auth.truelayer.com/?response_type=code&client_id=${config.clientId}&scope=info%20accounts%20balance%20cards%20transactions%20direct_debits%20standing_orders%20offline_access&redirect_uri=${config.redirectUri}&providers=uk-ob-all%20uk-oauth-all`
        console.log("Navigate to:");
        console.log(url);
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
        const resp = await fetch("https://auth.truelayer.com/connect/token", {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                "grant_type": "authorization_code",
                "client_id": config.clientId,
                "client_secret": config.clientSecret,
                "redirect_uri": config.redirectUri,
                "code": code,
            })
        })
        const data = await resp.json() as {
            access_token: string,
            refresh_token: string,
        };
        return {
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
        }
    }
    const refreshToken = async (refreshToken: string) => {
        const resp = await fetch("https://auth.truelayer.com/connect/token", {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                "grant_type": "refresh_token",
                "client_id": config.clientId,
                "client_secret": config.clientSecret,
                "refresh_token": refreshToken,
            })
        })
        const data = await resp.json() as {
            access_token: string,
            refresh_token: string,
        };
        return {
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
        }
    }
    const auth = async () => {
        const TOKEN_FILE_PATH = path.join(config.cacheDir, ".refresh_token");
        await fs.mkdir(config.cacheDir, { recursive: true });
        const creds = fs.readFile(TOKEN_FILE_PATH).then(d => JSON.parse(d.toString())).catch(() => ({}))
        if ("refreshToken" in creds) {
            return await refreshToken(creds.refreshToken as string)
        } else {
            const code = await getAuthCode()
            console.log(code)
            const tokens = await swapCodeForTokens(code);
            fs.writeFile(TOKEN_FILE_PATH, JSON.stringify({ refreshToken: tokens.refreshToken }));
            return tokens;
        }
    }
    const getHeaders = async () => {
        const tokens = await auth();
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${tokens.accessToken}`
        }
    }
    const listAccounts = () => {
        return []
    };

    return { auth, listAccounts }
};