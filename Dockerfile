FROM node:22-alpine

WORKDIR /app

# Copy the dependency manifests first so this layer is cached until they change.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# The API only needs the node runtime, so remove the package managers.
# Files from the base image stay in lower layers, so this does not shrink the image,
# but they are no longer present in the running container.
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/corepack \
    /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack \
    /usr/local/bin/yarn /usr/local/bin/yarnpkg /opt/yarn-*

COPY src ./src
COPY db ./db

# Run as the unprivileged user that ships with the Node image, not as root.
USER node

EXPOSE 3000

CMD ["node", "src/server.js"]
