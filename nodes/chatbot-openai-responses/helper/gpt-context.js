const KEY_PREFIX = 'chatbot_openai_';
const scopedKey = sessionId => `${KEY_PREFIX}${sessionId}`;

const GPTContext = ({ context, sessionId }) => {
  return {
    hasSession: async () => {
      return false;
    },
    getSession: async (sessionId) => {
      return await context.get(scopedKey(sessionId));
      // TODO touch ts
    },
    createSession: async ({ sessionId, previousId, ...rest }) => {

      await context.set(scopedKey(sessionId), {
        ts: new Date().toISOString(),
        sessionId,
        previousId,
        ...rest
      });
    },
    updateSession: async(sessionId, obj) => {
      const current = await context.get(scopedKey(sessionId)) ?? {};
      await context.set(scopedKey(sessionId), {
        ...current,
        ts: new Date().toISOString(),
        ...obj
      });
    }
  };
};

module.exports = GPTContext;
