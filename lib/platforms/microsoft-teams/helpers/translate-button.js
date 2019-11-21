module.exports = button => {  
  switch(button.type) {
    case 'postback':
      return {
          type: 'postBack',
          value: button.value,
          text: button.value, // il valore che viene mandato
          title: button.label // label del botton
      };
      break;
    case 'url':
      return {
          type: 'openUrl',
          title: button.label,
          value: button.url
      };
      break;
  }
};