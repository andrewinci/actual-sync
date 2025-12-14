# Actual Sync

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A minimal command-line tool that automatically syncs bank transactions from various financial providers directly into [Actual Budget](https://actualbudget.org/).

## ✨ Features

- 🔄 **Automatic Transaction Sync** - Import transactions from supported banks
- 🏦 **Multi-Bank Support** - Connect multiple accounts from different providers
- 📊 **Flexible Account Mapping** - Configure how accounts sync to Actual Budget
- 🔔 **Notifications** - Optional ntfy integration for sync status notifications
- 🐋 **Docker Ready** - Easy deployment and containerization

## 🏦 Supported Providers

- **[TrueLayer](https://truelayer.com/)** - Connect to 300+ banks across UK and Europe
- **[Trading 212](https://www.trading212.com/)** - Track investment account balances (API key required)

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
# Use pre-built image from GitHub Container Registry
docker pull ghcr.io/andrewinci/actual-sync:latest

# Or build locally
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
     syncId: "your-sync-id" # Found in Actual Settings > Advanced
     url: "https://your-actual-server.com" # or "localhost" for local
     cacheDir: ".cache/"

   truelayer:
     redirectUri: "https://console.truelayer.com/redirect-page"
     clientId: "your-truelayer-client-id"
     clientSecret: "your-truelayer-client-secret"

   # Optional: For Trading 212 support
   trading212:
     apiKey: "your-trading212-api-key"
     accounts:
       - id: "trading212-invest"
         name: "Trading212 Invest"
   ```

3. **Add Truelayer accounts following the wizard** (for bank accounts)
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
6. **List the Trading212 accounts** (if configured)
   ```bash
   ./actual-sync trading212 list-accounts
   ```
7. **Add sync configurations**
   ```yaml
   sync:
     map:
       # TrueLayer account example
       - name: Amex
         truelayerAccountId: truelayer-sample-id-amex
         actualAccountId: actual-budget-sample-account-id-amex
         mapConfig:
           invertAmount: true
       # Trading212 account example
       - name: Trading212 Invest
         trading212AccountId: trading212-invest
         actualAccountId: actual-budget-sample-account-id-trading212
         mapConfig: {}
   ```
8. **Run sync**
   ```bash
   ./actual-sync sync
   ```

## 📋 Command Reference

| Command                                   | Description                              |
| ----------------------------------------- | ---------------------------------------- |
| `config create`                           | Create a default configuration file      |
| `actual list-accounts`                    | List all Actual Budget accounts          |
| `truelayer add-account`                   | Add TrueLayer bank accounts via OAuth    |
| `truelayer list-accounts`                 | List configured TrueLayer accounts       |
| `truelayer list-transactions <accountId>` | View transactions for a specific account |
| `truelayer get-balance <accountId>`       | Check balance for a TrueLayer account    |
| `trading212 list-accounts`                | List configured Trading 212 accounts     |
| `trading212 get-balance <accountId>`      | Check balance for a Trading 212 account  |
| `sync`                                    | Synchronize all configured accounts      |

## 📄 Configuration File Reference

```yaml
actual:
  password: "your-actual-password"
  syncId: "your-sync-id" # Found in Actual Settings > Advanced
  url: "https://your-actual-server.com" # or "localhost" for local
  cacheDir: ".cache/"
# Optional: Get notifications via ntfy (https://ntfy.sh)
ntfy:
  url: "https://ntfy.sh" # or your self-hosted ntfy server
  topic: "your-topic-name" # choose a topic name
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
# Optional: For Trading 212 support
# Get your API key from Trading 212 Settings > API (Beta)
trading212:
  apiKey: "your-trading212-api-key"
  accounts:
    - id: "trading212-invest"
      name: "Trading212 Invest"
sync:
  # manually create the map below to match provider accounts to actual
  map:
    # TrueLayer account examples
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
    # Trading212 account example
    - name: Trading212 Invest
      trading212AccountId: trading212-invest
      actualAccountId: actual-budget-sample-account-id-trading212
      mapConfig: {}
```

## 🔔 Notifications

Actual-sync supports optional notifications via [ntfy](https://ntfy.sh) to keep you informed about sync status.

### Configuration

Add the `ntfy` section to your `.config.yml`:

```yaml
ntfy:
  url: "https://ntfy.sh" # or your self-hosted ntfy server URL
  topic: "your-unique-topic-name" # choose a topic name
```

## 📈 Trading 212 Integration

Trading 212 support works differently from TrueLayer. Instead of importing individual transactions, it creates reconciliation transactions to track your investment account values in Actual Budget.

### How It Works

- **Balance Tracking**: Fetches the current total value from your Trading 212 account
- **Automatic Reconciliation**: Creates a single transaction to adjust your Actual Budget balance to match Trading 212
- **Daily Updates**: Each sync creates a reconciliation entry for the current date if the balance differs

### Setup

1. **Get your API Key**: Log into Trading 212 → Settings → API (Beta) → Generate API Key
2. **Add to config**: Update your `.config.yml` with the Trading 212 section (see Configuration File Reference)
3. **Configure sync mapping**: Add your Trading 212 account to the sync map with `trading212AccountId`

### Example Use Case

Perfect for tracking investment portfolios in your budget without cluttering your transactions with every buy/sell order. You'll see the net change in your portfolio value as a single reconciliation entry.

## 🚀 Deployment

### ☸️ Kubernetes with Helm

The easiest way to deploy actual-sync to Kubernetes is using the included Helm chart. The deployment creates a CronJob that automatically syncs your bank transactions every 4 hours.

#### Prerequisites

- Kubernetes cluster
- Helm 3.x installed
- A `.config.yml` file with your credentials

#### Installation

1. **Deploy using your local configuration file:**

   ```bash
   # Create namespace and install with your config
   helm upgrade --install actual-sync ./helm \
     --set config.create=true \
     --set-file config.data=.config.yml \
     -n actual-sync --create-namespace
   ```

2. **Or use an existing ConfigMap:**
   ```bash
   # If you already have a ConfigMap named 'my-config'
   helm upgrade --install actual-sync ./helm \
     --set existingConfigMap=my-config \
     -n actual-sync --create-namespace
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

Docker images are automatically built and published to GitHub Container Registry on every release.

### Pre-built Images

```bash
# Pull the latest image
docker pull ghcr.io/andrewinci/actual-sync:latest

# Pull a specific version
docker pull ghcr.io/andrewinci/actual-sync:v1.0.0
```

### Build Locally

```bash
docker build -t actual-sync .
```

### Run

```bash
# Use pre-built image from GitHub Container Registry
docker run -e CONFIG_FILE_PATH=/config/.config.yml \
  -v ${PWD}/:/config/ \
  ghcr.io/andrewinci/actual-sync:latest [command]

# Examples:
# List accounts
docker run -e CONFIG_FILE_PATH=/config/.config.yml \
  -v ${PWD}/:/config/ \
  ghcr.io/andrewinci/actual-sync:latest actual list-accounts

# Run sync
docker run -e CONFIG_FILE_PATH=/config/.config.yml \
  -v ${PWD}/:/config/ \
  ghcr.io/andrewinci/actual-sync:latest sync
```

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Disclaimer

This project is not officially associated with Actual Budget, TrueLayer, or any other financial institutions. Use at your own risk and always verify your financial data. The developers are not responsible for any financial discrepancies or data loss.
