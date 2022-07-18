FROM nodered/node-red:latest

RUN npm install node-red-contrib-chatbot@latest --unsafe-perm --no-update-notifier --no-fund --only=production

ENV NODE_RED_ENABLE_TOURS=false
