import { Suspense } from 'react'
import { Link, Outlet } from 'react-router'
import { Carregando, TelaMensagem } from '@/components/TelaMensagem'

const classeDoLink = 'font-semibold text-primary underline underline-offset-4 hover:no-underline'

/** Cada área (pesquisa, totem, painel, TV) é baixada só quando alguém a acessa. */
export function Raiz() {
  return (
    <Suspense fallback={<Carregando />}>
      <Outlet />
    </Suspense>
  )
}

export function NaoEncontrada() {
  return (
    <TelaMensagem
      titulo="Página não encontrada"
      acao={
        <Link to="/login" className={classeDoLink}>
          Ir para o painel da gestão
        </Link>
      }
    >
      <p>Este endereço não existe. Se você veio avaliar o atendimento, aponte a câmera de novo para o QR Code do setor.</p>
    </TelaMensagem>
  )
}

export function ErroInesperado() {
  return (
    <TelaMensagem
      titulo="Esta tela não abriu"
      acao={
        <button type="button" className={classeDoLink} onClick={() => window.location.reload()}>
          Recarregar a página
        </button>
      }
    >
      <p>Confira a internet do aparelho e recarregue a página.</p>
    </TelaMensagem>
  )
}
