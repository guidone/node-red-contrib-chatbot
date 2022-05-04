FROM nodered/node-red:2.2.2

RUN npm install node-red-contrib-chatbot@1.0.0-beta.3 --unsafe-perm --no-update-notifier --no-fund --only=production

ENV NODE_RED_ENABLE_TOURS=false
