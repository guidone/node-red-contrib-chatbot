const GPTContext = ({ context, sessionId }) => {
  return {
    hasSession: async () => {
      return false;
    },
    getSession: async (sessionId) => {
      return await context.get(String(sessionId));
      // TODO touch ts
    },
    createSession: async ({ sessionId, previousId, ...rest }) => {

      await context.set(String(sessionId), {
        ts: new Date().toISOString(),
        sessionId,
        previousId,
        ...rest
      });
    },
    updateSession: async(sessionId, obj) => {
      const current = await context.get(String(sessionId)) ?? {};
      await context.set(String(sessionId), {
        ...current,
        ts: new Date().toISOString(),
        ...obj
      });
    }
  };
};

module.exports = GPTContext;
