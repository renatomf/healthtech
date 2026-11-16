import './index.css';
import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router';
import { LoginPage } from './features/auth/login-page.tsx';
import { HomeRedirect, RequireRole } from './features/auth/require-role.tsx';
import { ME_KEY } from './features/auth/use-auth.ts';
import { AgendaPage } from './features/clinic/agenda-page.tsx';
import { AppointmentPage } from './features/clinic/appointment-page.tsx';
import { ClinicLayout } from './features/clinic/clinic-layout.tsx';
import { NewAppointmentPage } from './features/clinic/new-appointment-page.tsx';
import { PatientHome } from './features/patient/patient-home.tsx';
import { ApiError } from './lib/api.ts';

// 401 em qualquer chamada: a sessão acabou; RequireRole manda para o login.
const onError = (err: unknown) => {
  if (err instanceof ApiError && err.status === 401) queryClient.setQueryData(ME_KEY, null);
};

const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError }),
  mutationCache: new MutationCache({ onError }),
  defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
});

const router = createBrowserRouter([
  { path: '/', element: <HomeRedirect /> },
  { path: '/login', element: <LoginPage /> },
  {
    path: '/clinica',
    element: (
      <RequireRole profile="CLINIC">
        <ClinicLayout />
      </RequireRole>
    ),
    children: [
      { index: true, element: <AgendaPage /> },
      { path: 'agendamentos/novo', element: <NewAppointmentPage /> },
      { path: 'agendamentos/:id', element: <AppointmentPage /> },
    ],
  },
  {
    path: '/paciente',
    element: (
      <RequireRole profile="PATIENT">
        <PatientHome />
      </RequireRole>
    ),
  },
  { path: '*', element: <HomeRedirect /> },
]);

const root = document.getElementById('root');
if (!root) throw new Error('Elemento #root não encontrado');

createRoot(root).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
);
