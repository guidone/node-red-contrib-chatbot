import { useEffect, useReducer } from 'react';

const useTimedReRender = (delay = 1000) => {
  const [ignored, forceUpdate] = useReducer(x => x + 1, 0);
  useEffect(() => {
    const timer = setInterval(() => forceUpdate(), delay)
    return () => clearInterval(timer);
  });
};

export default useTimedReRender;