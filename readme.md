# Actual sync

## Dev

### Docker
```bash
## Build image
docker build -t actual-sync .
# Test docker image locally
docker run -e CONFIG_FILE_PATH=/config/.config.yml -v ${PWD}/:/config/ actual-sync actual list-accounts
```