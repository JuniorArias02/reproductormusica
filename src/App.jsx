import { EnrutadorPrincipal } from './router/EnrutadorPrincipal';
import { ProveedorReproductor } from './features/Player/context/ContextoReproductor';

function App() {
  return (
    <ProveedorReproductor>
      <EnrutadorPrincipal />
    </ProveedorReproductor>
  );
}

export default App;
