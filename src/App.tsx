import { useEffect, useRef } from 'react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import store, { useAppDispatch } from './store';
import { trackSolidSession } from './store/SolidAuthMiddleware';
import Routes from './views/Routes';

const Main = () => {

  const ref = useRef(false);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!ref.current) {
      dispatch(trackSolidSession());
      ref.current = true;
    }
  }, [dispatch]);

  return <BrowserRouter><Routes /></BrowserRouter>;
}

function App() {

  return (
    <Provider store={store}><Main /></Provider>
  );
}

export default App;
