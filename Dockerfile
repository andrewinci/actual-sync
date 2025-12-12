FROM node:20-alpine
WORKDIR /app
RUN npm install -g pnpm@10.25.0

COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build
RUN addgroup -g 1001 -S nodejs && \
    adduser -S actual-sync -u 1001
RUN chown -R actual-sync:nodejs /app
USER actual-sync
RUN chmod +x actual-sync
ENTRYPOINT ["./actual-sync"]
CMD ["--help"]