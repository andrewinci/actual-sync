# Actual sync

Simple cli app to sync banks to actual.

Supported providers:

- [Truelayer](https://truelayer.com/)

## Dev

### Docker

```bash
## Build image
docker build -t actual-sync .
# Test docker image locally
docker run -e CONFIG_FILE_PATH=/config/.config.yml -v ${PWD}/:/config/ actual-sync actual list-accounts
```

# Disclaimer
This project is not associated with Actual budget or any of the data providers.