import { Provider } from 'react-redux';
import { store } from './store/store';
import { BrowserRouter, Routes } from 'react-router';

import { renderRoutes } from './router/router';
import { routes } from './router/routesTree';

function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <Routes>{renderRoutes(routes)}</Routes>
      </BrowserRouter>
    </Provider>
  );
}

export default App;
