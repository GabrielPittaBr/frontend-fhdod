import { lazy, type ReactNode } from 'react'
import { createBrowserRouter, Navigate } from 'react-router'
import type { Permissao } from '@/lib/api/tipos'
import { ErroInesperado, NaoEncontrada, Raiz } from './Raiz'

// Uma área por arquivo baixado: quem abre a pesquisa pelo QR Code não baixa nada do painel.
const PesquisaPage = lazy(() => import('@/features/pesquisa/pages/PesquisaPage'))
const TotemPage = lazy(() => import('@/features/pesquisa/pages/TotemPage'))
const TvPage = lazy(() => import('@/features/tv-wall/pages/TvPage'))
const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage'))
const SenhaPage = lazy(() => import('@/features/auth/pages/SenhaPage'))
const PainelLayout = lazy(() => import('@/components/layout/PainelLayout'))
const DashboardPage = lazy(() => import('@/features/dashboard/pages/DashboardPage'))
const RespostasPage = lazy(() => import('@/features/respostas/pages/RespostasPage'))
const ContatosPage = lazy(() => import('@/features/contatos/pages/ContatosPage'))
const SetoresPage = lazy(() => import('@/features/setores/pages/SetoresPage'))
const PerguntasPage = lazy(() => import('@/features/perguntas/pages/PerguntasPage'))
const CadastrosPage = lazy(() => import('@/features/cadastros/pages/CadastrosPage'))
const TelasTvPage = lazy(() => import('@/features/tv-wall/pages/TelasTvPage'))
const ExigeSessao = lazy(() => import('./guards').then((m) => ({ default: m.ExigeSessao })))
const ExigePermissao = lazy(() => import('./guards').then((m) => ({ default: m.ExigePermissao })))

/** O acesso depende da lista de permissões do /auth/me (basta uma delas), não do nome do perfil. */
const com = (permissoes: Permissao[], pagina: ReactNode) => <ExigePermissao permissoes={permissoes}>{pagina}</ExigePermissao>

export const router = createBrowserRouter([
  {
    element: <Raiz />,
    errorElement: <ErroInesperado />,
    children: [
      { path: '/', element: <Navigate to="/login" replace /> },
      { path: '/s/:setor', element: <PesquisaPage /> },
      { path: '/totem/:setor', element: <TotemPage /> },
      { path: '/tv', element: <TvPage /> },
      { path: '/login', element: <LoginPage /> },
      {
        path: '/painel',
        element: <ExigeSessao />,
        children: [
          { path: 'senha', element: <SenhaPage /> },
          {
            element: <PainelLayout />,
            children: [
              { index: true, element: com(['dashboard:ver'], <DashboardPage />) },
              { path: 'respostas', element: com(['respostas:ver'], <RespostasPage />) },
              { path: 'contatos', element: com(['contatos:ver'], <ContatosPage />) },
              // o gestor entra aqui só para chegar às perguntas e ao QR Code dos seus setores
              { path: 'setores', element: com(['setores:gerenciar', 'perguntas:gerenciar'], <SetoresPage />) },
              { path: 'setores/:id/perguntas', element: com(['perguntas:gerenciar'], <PerguntasPage />) },
              { path: 'cadastros', element: com(['categorias:gerenciar', 'turnos:gerenciar'], <CadastrosPage />) },
              { path: 'tv', element: com(['tvwall:gerenciar'], <TelasTvPage />) },
              { path: '*', element: <NaoEncontrada /> },
            ],
          },
        ],
      },
      { path: '*', element: <NaoEncontrada /> },
    ],
  },
])
