import { lazy } from 'react'
import { createBrowserRouter, Navigate } from 'react-router'
import { ErroInesperado, NaoEncontrada, Raiz } from './Raiz'

// Uma área por arquivo baixado: quem abre a pesquisa pelo QR Code não baixa nada do painel.
const PesquisaPage = lazy(() => import('@/features/pesquisa/pages/PesquisaPage'))
const TotemPage = lazy(() => import('@/features/pesquisa/pages/TotemPage'))

export const router = createBrowserRouter([
  {
    element: <Raiz />,
    errorElement: <ErroInesperado />,
    children: [
      { path: '/', element: <Navigate to="/login" replace /> },
      { path: '/s/:setor', element: <PesquisaPage /> },
      { path: '/totem/:setor', element: <TotemPage /> },
      { path: '*', element: <NaoEncontrada /> },
    ],
  },
])
