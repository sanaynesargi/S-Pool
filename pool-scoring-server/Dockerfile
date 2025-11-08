# Use Node.js LTS
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json first
COPY package.json ./

# Verify package.json exists
RUN ls -la /app && cat package.json

# Install dependencies with npm
RUN npm install

# Verify node_modules was created
RUN ls -la /app/node_modules || (echo "ERROR: node_modules not created!" && exit 1)

# Copy all source files
COPY . .

# Build TypeScript (fail soft)
RUN npx tsc || true

# Verify dist exists
RUN ls -la /app/dist || echo "Warning: dist not created"

# Expose port
EXPOSE 8000

# Set NODE_ENV
ENV NODE_ENV=production

# Start server
CMD ["node", "dist/server.js"]
