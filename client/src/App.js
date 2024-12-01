import { ThemeProvider } from 'styled-components';
import theme from './styles/theme'
import GlobalStyle from './styles/GlobalStyles'
import { Outlet } from 'react-router';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <div className="main">
        <Outlet />
      </div>
    </ThemeProvider>
  );
}

export default App;