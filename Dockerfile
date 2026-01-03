FROM node:20-alpine

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npx prisma generate

# Set production environment
ENV NODE_ENV=production

RUN npm run build

# Copy entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["docker-entrypoint.sh"]
