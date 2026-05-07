const updateTokens = (node, response) => {
  const totalTokens = (node.context().get('tokens') ?? 0) + response.usage.total_tokens;
  node.context().set('tokens', totalTokens);

  node.status({
    fill: 'green',
    shape: 'dot',
    text: `Tokens: ` + totalTokens
  });
};

module.exports = updateTokens;
