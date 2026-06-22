import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from '../layout/MainLayout/MainLayout';
import { Inicio } from '../features/Libreria/pages/Inicio';
import { Libreria } from '../features/Libreria/pages/Libreria';
import { Ajustes } from '../features/Settings/pages/Ajustes';
import { Descargar } from '../features/Downloader/pages/Descargar';
import { Inmersivo } from '../features/Player/pages/Inmersivo';

export function EnrutadorPrincipal() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Inicio />} />
          <Route path="libreria" element={<Libreria />} />
          <Route path="descargar" element={<Descargar />} />
          <Route path="inmersivo" element={<Inmersivo />} />
          <Route path="ajustes" element={<Ajustes />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
