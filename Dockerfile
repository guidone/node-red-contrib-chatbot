FROM nodered/node-red:latest

RUN npm install node-red-contrib-chatbot@latest --unsafe-perm --no-update-notifier --no-fund --only=production --omit=dev \
  && rm -r /tmp/* \
  && rm -r /data/.npm/*

ENV NODE_RED_ENABLE_TOURS=false
