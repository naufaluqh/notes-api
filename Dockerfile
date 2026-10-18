FROM node:22-alpine

WORKDIR /app

# Copy the dependency manifests first so this layer is cached until they change.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY src ./src
COPY db ./db

# Run as the unprivileged user that ships with the Node image, not as root.
USER node

EXPOSE 3000

CMD ["node", "src/server.js"]
