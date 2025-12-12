# Actual Sync

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A minimal command-line tool that automatically syncs bank transactions from various financial providers directly into [Actual Budget](https://actualbudget.org/). Keep the budget up-to-date without manual data entry!

## ✨ Features

- 🔄 **Automatic Transaction Sync** - Import transactions from supported banks
- 🏦 **Multi-Bank Support** - Connect multiple accounts from different providers
- 📊 **Flexible Account Mapping** - Configure how accounts sync to Actual Budget
- 🐋 **Docker Ready** - Easy deployment and containerization

## 🏦 Supported Providers

- **[TrueLayer](https://truelayer.com/)** - Connect to 300+ banks across UK and Europe
- **Trading 212** - *Coming soon*

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ or Docker
- An [Actual Budget](https://actualbudget.org/) server instance
- Account with a supported financial provider (e.g., TrueLayer)

### Installation

#### Using pnpm (Recommended)

```bash
git clone https://github.com/andrewinci/actual-sync.git
cd actual-sync
pnpm install
pnpm run build
```

#### Using Docker

```bash
git clone https://github.com/andrewinci/actual-sync.git
cd actual-sync
docker build -t actual-sync .
```

## 📖 Usage

1. **Create a configuration file**:
   ```bash
   ./actual-sync config create
   ```

2. **Edit the generated `.config.yml`** with your credentials:
   ```yaml
   actual:
     password: "your-actual-password"
     syncId: "your-sync-id"  # Found in Actual Settings > Advanced
     url: "https://your-actual-server.com"  # or "localhost" for local
     cacheDir: ".cache/"
   
   truelayer:
     redirectUri: "https://console.truelayer.com/redirect-page"
     clientId: "your-truelayer-client-id"
     clientSecret: "your-truelayer-client-secret"
   ```
3. **Add Truelayer accounts following the wizard**
    ```bash
    ./actual-sync truelayer add-account
    ```
4. **List the Actual budget accounts**
    ```bash
    ./actual-sync actual list-accounts
    ```
5. **List the Truelayer accounts**
    ```bash
    ./actual-sync truelayer list-accounts
    ```
6. **Add sync configurations**
    ```yaml
    sync:
      map:
        - name: Amex
          truelayerAccountId: truelayer-sample-id-amex
          actualAccountId: actual-budget-sample-account-id-amex
          mapConfig:
            invertAmount: true
    ```
7. **Run sync**
    ```bash
    ./actual-sync sync
    ```

## 📋 Command Reference

| Command | Description |
|---------|-------------|
| `config create` | Create a default configuration file |
| `actual list-accounts` | List all Actual Budget accounts |
| `truelayer add-account` | Add TrueLayer bank accounts via OAuth |
| `truelayer list-accounts` | List configured TrueLayer accounts |
| `truelayer list-transactions <accountId>` | View transactions for a specific account |
| `truelayer get-balance <accountId>` | Check balance for a specific account |
| `sync` | Synchronize all configured accounts |

## 📄 Configuration File Reference
```yaml
actual:
  password: "your-actual-password"
  syncId: "your-sync-id"  # Found in Actual Settings > Advanced
  url: "https://your-actual-server.com"  # or "localhost" for local
  cacheDir: ".cache/"
truelayer:
  redirectUri: "https://console.truelayer.com/redirect-page" #no need to change this uri
  # you need a truelayer live app to get the below clientId and secret
  clientId: "your-truelayer-client-id"
  clientSecret: "your-truelayer-client-secret"
  # use the `truelayer add-account` command to generate the below
  accounts:
    - id: truelayer-sample-id-amex
      name: Amex # set the name you prefer
      type: CARD
      refreshToken: ....
    - id: truelayer-sample-id-monzo
      name: Monzo
      type: ACCOUNT
      refreshToken: ....
    - id: truelayer-sample-id-starling
      name: Starling
      type: ACCOUNT
      refreshToken: ....
sync:
  # manually create the map below to match truelayer accounts to actual
  map:
    - name: Amex # set the name you prefer
      truelayerAccountId: truelayer-sample-id-amex
      actualAccountId: actual-budget-sample-account-id-amex
      mapConfig:
        invertAmount: true # use this for credit cards for example
    - name: Monzo
      truelayerAccountId: truelayer-sample-id-monzo
      actualAccountId: actual-budget-sample-account-id-monzo
      mapConfig: {}
    - name: Starling
      truelayerAccountId: truelayer-sample-id-starling
      actualAccountId: actual-budget-sample-account-id-starling
      mapConfig: {}
```

## 🔧 Development

### Setup

```bash
git clone https://github.com/andrewinci/actual-sync.git
cd actual-sync
pnpm install
```

### Available Scripts

- `pnpm run dev` - Run in development mode with ts-node
- `pnpm run build` - Build the application
- `pnpm run pretty` - Format code with Prettier

## 🐳 Docker

### Build

```bash
docker build -t actual-sync .
```

### Run

```bash
docker run -e CONFIG_FILE_PATH=/config/.config.yml \
  -v ${PWD}/:/config/ \
  actual-sync [command]
```


## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Disclaimer

This project is not officially associated with Actual Budget, TrueLayer, or any other financial institutions. Use at your own risk and always verify your financial data. The developers are not responsible for any financial discrepancies or data loss.