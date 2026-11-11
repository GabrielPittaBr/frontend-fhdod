import { lazy } from 'react'
import { createBrowserRouter, Navigate } from 'react-router'
import { ErroInesperado, NaoEncontrada, Raiz } from './Raiz'

// Uma área por arquivo baixado: quem abre a pesquisa pelo QR Code não baixa nada do painel.
const PesquisaPage = lazy(() => import('@/features/pesquisa/pages/PesquisaPage'))
const TotemPage = lazy(() => import('@/features/pesquisa/pages/TotemPage'))
const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage'))
const SenhaPage = lazy(() => import('@/features/auth/pages/SenhaPage'))
const PainelLayout = lazy(() => import('@/components/layout/PainelLayout'))
const ExigeSessao = lazy(() => import('./guards').then((m) => ({ default: m.ExigeSessao })))

export const router = createBrowserRouter([
  {
    element: <Raiz />,
    errorElement: <ErroInesperado />,
    children: [
      { path: '/', element: <Navigate to="/login" replace /> },
      { path: '/s/:setor', element: <PesquisaPage /> },
      { path: '/totem/:setor', element: <TotemPage /> },
      { path: '/login', element: <LoginPage /> },
      {
        path: '/painel',
        element: <ExigeSessao />,
        children: [
          { path: 'senha', element: <SenhaPage /> },
          {
            element: <PainelLayout />,
            children: [
              { path: '*', element: <NaoEncontrada /> },
            ],
          },
        ],
      },
      { path: '*', element: <NaoEncontrada /> },
    ],
  },
])
