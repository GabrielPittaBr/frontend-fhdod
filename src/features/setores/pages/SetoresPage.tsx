import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { ListChecks, Pencil, Plus, Printer, QrCode } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useForm, useWatch } from 'react-hook-form'
import { Link } from 'react-router'
import { z } from 'zod'
import logo from '@/assets/logo.png'
import { CampoCopiavel, DialogoFormulario } from '@/components/crud'
import { CampoTexto, ErroDoFormulario } from '@/components/formulario'
import { Bloco, Consulta, Pagina } from '@/components/layout/Pagina'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { Setor } from '@/lib/api/tipos'
import { aplicarErroDaApi, useSalvar } from '@/lib/salvar'
import { usePode } from '@/stores/sessao'
import { alterarStatusSetor, criarSetor, editarSetor, listarSetores } from '../api'

const esquema = z.object({
  nome: z.string().trim().min(2, 'Informe o nome do setor'),
  slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Use só letras minúsculas, números e hífen, sem espaços'),
  descricao: z.string().trim().max(120, 'Use no máximo 120 caracteres'),
})
type Dados = z.infer<typeof esquema>

/** "Raio-X e Imagem" vira "raio-x-e-imagem". */
const paraEndereco = (nome: string) =>
  nome
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

function Formulario({ setor, aoFechar }: { setor: Setor | null; aoFechar: () => void }) {
  const form = useForm<Dados>({
    resolver: zodResolver(esquema),
    defaultValues: { nome: setor?.nome ?? '', slug: setor?.slug ?? '', descricao: setor?.descricao ?? '' },
  })
  const erros = form.formState.errors
  const salvar = useSalvar((dados: Dados) => (setor ? editarSetor(setor.id, dados) : criarSetor(dados)), {
    recarregar: ['setores'],
    sucesso: setor ? 'Setor atualizado' : 'Setor criado',
    aoConcluir: aoFechar,
    // endereço repetido volta como conflito (409) e aparece acima do botão
    aoFalhar: (erro) => aplicarErroDaApi(form, erro),
  })
  const nome = form.register('nome')
  const endereco = useWatch({ control: form.control, name: 'slug' })

  return (
    <DialogoFormulario
      aberto
      aoFechar={aoFechar}
      titulo={setor ? `Editar ${setor.nome}` : 'Novo setor'}
      descricao={setor ? 'Mudar o endereço invalida os QR Codes já impressos deste setor.' : 'Cada setor tem a sua pesquisa, com link e QR Code próprios.'}
      rotuloSalvar={setor ? 'Salvar setor' : 'Criar setor'}
      salvando={salvar.isPending}
      aoEnviar={form.handleSubmit((dados) => salvar.mutate(dados))}
    >
      <CampoTexto
        rotulo="Nome do setor"
        erro={erros.nome?.message}
        {...nome}
        onChange={(evento) => {
          void nome.onChange(evento)
          // ao criar, o endereço acompanha o nome até a pessoa mexer nele
          if (!setor && !form.formState.dirtyFields.slug) form.setValue('slug', paraEndereco(evento.target.value))
        }}
      />
      <CampoTexto
        rotulo="Endereço da pesquisa"
        dica={`O link fica ${window.location.host}/s/${endereco || 'nome-do-setor'}`}
        spellCheck={false}
        autoCapitalize="none"
        erro={erros.slug?.message}
        {...form.register('slug')}
      />
      <CampoTexto rotulo="Descrição (opcional)" erro={erros.descricao?.message} {...form.register('descricao')} />
      <ErroDoFormulario mensagem={erros.root?.message} />
    </DialogoFormulario>
  )
}

/** Links e QR Code do setor, com a folha pronta para imprimir e colar na parede. */
function LinksDoSetor({ setor, aoFechar }: { setor: Setor; aoFechar: () => void }) {
  const pesquisa = `${window.location.origin}/s/${setor.slug}`
  return (
    <Dialog open onOpenChange={(abrir) => !abrir && aoFechar()}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Links e QR Code: {setor.nome}</DialogTitle>
          <DialogDescription>O QR Code leva direto à pesquisa deste setor, sem cadastro nem senha.</DialogDescription>
        </DialogHeader>
        <CampoCopiavel rotulo="Link da pesquisa" valor={pesquisa} />
        <CampoCopiavel rotulo="Link do totem" valor={`${window.location.origin}/totem/${setor.slug}`} />
        <div className="flex flex-col items-center gap-3 rounded-lg border p-4">
          <QRCodeSVG value={pesquisa} size={176} marginSize={2} title={`QR Code da pesquisa do setor ${setor.nome}`} />
          <Button onClick={() => window.print()}>
            <Printer aria-hidden />
            Imprimir folha com o QR Code
          </Button>
        </div>
      </DialogContent>

      {createPortal(
        <div className="folha-qr">
          <img src={logo} alt="FHDOD" width={450} height={150} style={{ height: '22mm', width: 'auto' }} />
          <h1>Como foi o seu atendimento?</h1>
          <p>
            Aponte a câmera do celular para o código e avalie o setor <strong>{setor.nome}</strong>.
          </p>
          <QRCodeSVG value={pesquisa} size={340} marginSize={2} />
          <p>É anônimo e leva menos de 2 minutos.</p>
          <small>{pesquisa.replace(/^https?:\/\//, '')}</small>
        </div>,
        document.body,
      )}
    </Dialog>
  )
}

/** /painel/setores: setores, links e QR Codes. O gestor vê só os seus, sem poder editar. */
export default function SetoresPage() {
  const consulta = useQuery({ queryKey: ['setores'], queryFn: listarSetores })
  const podeGerenciar = usePode('setores:gerenciar')
  const podePerguntas = usePode('perguntas:gerenciar')
  const [editando, setEditando] = useState<Setor | 'novo' | null>(null)
  const [links, setLinks] = useState<Setor | null>(null)
  const status = useSalvar(({ id, ativo }: { id: number; ativo: boolean }) => alterarStatusSetor(id, ativo), {
    recarregar: ['setores'],
    sucesso: 'Situação do setor atualizada',
  })

  return (
    <Pagina
      titulo="Setores"
      descricao="Cada setor tem a sua pesquisa. Setor inativo não aceita novas respostas, mas o histórico continua nos indicadores."
      acoes={
        podeGerenciar && (
          <Button onClick={() => setEditando('novo')}>
            <Plus aria-hidden />
            Novo setor
          </Button>
        )
      }
    >
      <Bloco>
        <Consulta consulta={consulta} altura="h-72" vazio={(setores) => setores.length === 0} textoVazio="Você ainda não tem setores vinculados. Fale com quem administra o sistema.">
          {(setores) => (
            <ul className="grid gap-3">
              {setores.map((setor) => (
                <li key={setor.id} className="grid gap-3 rounded-lg border p-4 lg:grid-cols-[1fr_auto] lg:items-center">
                  <div className="min-w-0">
                    <h2 className="flex flex-wrap items-center gap-2 font-semibold">
                      {setor.nome}
                      <span className={`rounded-md border px-1.5 text-xs leading-6 font-medium ${setor.ativo ? 'border-input/50' : 'border-aviso-borda bg-aviso-fundo text-aviso'}`}>
                        {setor.ativo ? 'Ativo' : 'Inativo: pesquisa pausada'}
                      </span>
                    </h2>
                    {setor.descricao && <p className="text-sm text-muted-foreground">{setor.descricao}</p>}
                    <p className="mt-1 text-sm break-all text-muted-foreground">/s/{setor.slug}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {podePerguntas && (
                      <Button asChild variant="outline">
                        <Link to={`/painel/setores/${setor.id}/perguntas`}>
                          <ListChecks aria-hidden />
                          Perguntas
                        </Link>
                      </Button>
                    )}
                    <Button variant="outline" onClick={() => setLinks(setor)}>
                      <QrCode aria-hidden />
                      Links e QR Code
                    </Button>
                    {podeGerenciar && (
                      <>
                        <Button variant="outline" onClick={() => setEditando(setor)}>
                          <Pencil aria-hidden />
                          Editar
                        </Button>
                        <Button variant="outline" disabled={status.isPending} onClick={() => status.mutate({ id: setor.id, ativo: !setor.ativo })}>
                          {setor.ativo ? 'Desativar' : 'Ativar'}
                        </Button>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Consulta>
      </Bloco>

      {editando && <Formulario setor={editando === 'novo' ? null : editando} aoFechar={() => setEditando(null)} />}
      {links && <LinksDoSetor setor={links} aoFechar={() => setLinks(null)} />}
    </Pagina>
  )
}
