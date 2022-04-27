export default type => {
  switch(type) {
    case 'message': return 'cyan';
    case 'document':
    case 'photo':
    case 'video':
    case 'sticker':
      return 'orange';
    case 'buttons':
    case 'inline-buttons':
      return 'violet';
    default: return 'grey';
  }
};