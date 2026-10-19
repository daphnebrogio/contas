import { useEffect, useState, type FormEvent } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { anoMesAtual, atualizarGasto, criarGasto, excluirGasto } from '../lib/gastos';
import { criarTag } from '../lib/tags';
import { proximaCorLivre } from '../lib/cores';
import { dataLocalISO, mesDe } from '../lib/datas';
import { useTags } from '../hooks/useTags';
import MoneyInput from '../components/MoneyInput';
import Avatar from '../components/Avatar';
import Segmented from '../components/Segmented';
import { UID_DAPHNE, UID_JOAO, USUARIOS, type Gasto, type StatusGasto } from '../types/models';

const hoje = () => dataLocalISO();

export default function CadastroGasto() {
  const { id } = useParams();
  const editando = Boolean(id);
  const navigate = useNavigate();
  const destino = (useLocation().state as { voltarPara?: string } | null)?.voltarPara ?? '/';
  const tags = useTags();

  const [carregado, setCarregado] = useState(!editando);
  const [gastoOriginal, setGastoOriginal] = useState<Gasto | null>(null);

  const [valor, setValor] = useState(0);
  const [descricao, setDescricao] = useState('');
  const [tagsEscolhidas, setTagsEscolhidas] = useState<string[]>([]);
  const [novaTag, setNovaTag] = useState('');
  const [status, setStatus] = useState<StatusGasto>('pendente');
  const [pagador, setPagador] = useState<string | null>(null);
  const [mesReferencia, setMesReferencia] = useState(anoMesAtual());
  const [mesManual, setMesManual] = useState(false);
  const [dataPagamento, setDataPagamento] = useState(hoje());

  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const snap = await getDoc(doc(db, 'gastos', id));
      if (!snap.exists()) {
        setErro('Gasto não encontrado.');
        setCarregado(true);
        return;
      }
      const g = { id: snap.id, ...(snap.data() as Omit<Gasto, 'id'>) };
      setGastoOriginal(g);
      setValor(g.valor);
      setDescricao(g.descricao);
      setTagsEscolhidas(g.tags);
      setStatus(g.status);
      setPagador(g.pagador);
      setMesReferencia(mesDe(g));
      setMesManual(true);
      setDataPagamento(g.data_pagamento ?? hoje());
      setCarregado(true);
    })();
  }, [id]);

  const bloqueado = gastoOriginal?.bloqueado_para_edicao ?? false;

  function alternarTag(tagId: string) {
    setTagsEscolhidas((atual) => (atual.includes(tagId) ? atual.filter((t) => t !== tagId) : [...atual, tagId]));
  }

  async function adicionarTag() {
    const nome = novaTag.trim();
    if (!nome) return;
    const existente = tags.find((t) => t.nome.toLowerCase() === nome.toLowerCase());
    if (existente) {
      if (!tagsEscolhidas.includes(existente.id)) setTagsEscolhidas((a) => [...a, existente.id]);
    } else {
      await criarTag(nome, proximaCorLivre(tags));
      // a tag nova chega via subscribeTags no próximo tick; o usuário marca ela na lista.
    }
    setNovaTag('');
  }

  async function salvar(e: FormEvent) {
    e.preventDefault();
    setErro(null);

    if (!descricao.trim()) return setErro('Descrição é obrigatória.');
    if (status === 'pago' && !pagador) return setErro('Defina quem pagou antes de marcar como Pago.');
    if (!mesReferencia) return setErro('Informe o mês de referência.');

    setSalvando(true);
    try {
      const campos = {
        valor,
        descricao,
        tags: tagsEscolhidas,
        pagador,
        status,
        mes_referencia: mesReferencia,
        data_pagamento: status === 'pago' ? dataPagamento || hoje() : null,
      };

      if (editando && id) {
        await atualizarGasto(id, campos);
      } else {
        await criarGasto({ ...campos, data_lancamento: hoje() });
      }
      navigate(destino);
    } catch (err) {
      setErro('Não deu pra salvar — tenta de novo.');
      console.error(err);
    } finally {
      setSalvando(false);
    }
  }

  // Num gasto novo, o mês de referência acompanha a data do pagamento até a pessoa escolher outro.
  function mudarDataPagamento(valor: string) {
    setDataPagamento(valor);
    if (!editando && !mesManual && valor) setMesReferencia(valor.slice(0, 7));
  }

  async function excluir() {
    if (!id) return;
    if (!confirmandoExclusao) {
      setConfirmandoExclusao(true);
      return;
    }
    try {
      await excluirGasto(id);
      navigate(destino);
    } catch (err) {
      setErro('Não deu pra excluir — tenta de novo.');
      console.error(err);
      setConfirmandoExclusao(false);
    }
  }

  if (!carregado) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22, maxWidth: 760 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ fontSize: 24 }}>{editando ? 'Editar gasto' : 'Novo gasto'}</h2>
        <button aria-label="Fechar" className="icon-btn" onClick={() => navigate(destino)}>
          <IconClose />
        </button>
      </div>

      {bloqueado && (
        <div className="card" style={{ background: 'var(--pending)', color: 'var(--accent-ink)', border: 'none', padding: '14px 20px', fontSize: 13, fontWeight: 600 }}>
          Este gasto já faz parte de uma Liquidação confirmada e não pode mais ser editado. Pra corrigir valor ou pagador, lance um gasto de ajuste novo (ou exclua este — fica registrado no log).
        </div>
      )}

      <form onSubmit={salvar} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <fieldset disabled={bloqueado} style={{ display: 'flex', flexDirection: 'column', gap: 20, border: 'none', padding: 0, margin: 0, minWidth: 0 }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ width: 200 }}>
            <label className="field-label" htmlFor="valor">Valor</label>
            <MoneyInput id="valor" centavos={valor} onChange={setValor} style={{ fontSize: 15 }} />
          </div>
          <div style={{ flexGrow: 1, minWidth: 200 }}>
            <label className="field-label" htmlFor="desc">Descrição</label>
            <input
              id="desc"
              type="text"
              className="input"
              placeholder="Ex: Mercado da semana"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
            />
          </div>
        </div>

        <div>
          <span className="field-label">Tags</span>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            {tags.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => alternarTag(t.id)}
                className="filtro-chip"
                aria-pressed={tagsEscolhidas.includes(t.id)}
                style={{
                  background: tagsEscolhidas.includes(t.id) ? t.cor : 'var(--surface)',
                  color: tagsEscolhidas.includes(t.id) ? 'var(--accent-ink)' : 'var(--ink)',
                  borderColor: tagsEscolhidas.includes(t.id) ? t.cor : 'var(--border)',
                  fontWeight: tagsEscolhidas.includes(t.id) ? 700 : 500,
                }}
              >
                <span className="tag-dot" style={{ background: tagsEscolhidas.includes(t.id) ? 'var(--accent-ink)' : t.cor }} />
                {t.nome}
              </button>
            ))}
            <input
              type="text"
              placeholder="+ tag"
              value={novaTag}
              onChange={(e) => setNovaTag(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), adicionarTag())}
              onBlur={adicionarTag}
              style={{ width: 90, height: 28, fontSize: 12, border: '1px dashed var(--border)', borderRadius: 999, padding: '0 10px', background: 'var(--bg)', color: 'var(--ink2)' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <div>
            <span className="field-label">Status</span>
            <Segmented
              options={[
                { value: 'pendente', label: 'Pendente' },
                { value: 'pago', label: 'Pago' },
              ]}
              value={status}
              onChange={(v) => setStatus(v as StatusGasto)}
            />
          </div>
        </div>

        <div>
          <span className="field-label">Pagador — quem pagou</span>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {[UID_DAPHNE, UID_JOAO].map((uid) => (
              <button
                key={uid}
                type="button"
                className="chip"
                onClick={() => setPagador(uid)}
                style={{ borderColor: pagador === uid ? (uid === UID_DAPHNE ? 'var(--daphne)' : 'var(--joao)') : 'var(--border)', background: pagador === uid ? (uid === UID_DAPHNE ? 'var(--daphne-soft)' : 'var(--joao-soft)') : 'var(--surface)' }}
              >
                <Avatar uid={uid} /> {USUARIOS[uid].nome}
              </button>
            ))}
            <button
              type="button"
              className="chip"
              onClick={() => setPagador(null)}
              style={{ borderStyle: 'dashed', color: 'var(--ink2)', borderColor: pagador === null ? 'var(--ink2)' : 'var(--border)', background: pagador === null ? 'var(--tag-bg)' : 'var(--surface)' }}
            >
              <Avatar uid={null} /> Ainda não sei
            </button>
          </div>
          {status === 'pago' && !pagador && (
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--pending)', display: 'block', marginTop: 6 }}>
              Defina quem pagou antes de marcar este gasto como Pago.
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ width: 240 }}>
            <label className="field-label" htmlFor="mesRef">Mês de referência</label>
            <input
              id="mesRef"
              type="month"
              className="input"
              value={mesReferencia}
              onChange={(e) => {
                setMesReferencia(e.target.value);
                setMesManual(true);
              }}
            />
            <span style={{ fontSize: 12, color: 'var(--ink2)', display: 'block', marginTop: 6 }}>
              A que mês esta conta pertence — é o que vale nos relatórios.
            </span>
          </div>
          {status === 'pago' && (
            <div style={{ width: 240 }}>
              <label className="field-label" htmlFor="dataPag">Data do pagamento</label>
              <input id="dataPag" type="date" className="input" value={dataPagamento} onChange={(e) => mudarDataPagamento(e.target.value)} />
            </div>
          )}
        </div>
        </fieldset>

        {erro && <span style={{ color: 'var(--neg)', fontSize: 13, fontWeight: 600 }}>{erro}</span>}

        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          {!bloqueado && (
            <button type="submit" disabled={salvando} className="btn-primary">
              {salvando ? 'Salvando…' : 'Salvar gasto'}
            </button>
          )}
          <button type="button" onClick={() => navigate(destino)} className="btn-secondary">
            Cancelar
          </button>
        </div>

        {editando && (
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {confirmandoExclusao ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>Excluir de vez este gasto?</span>
                <button type="button" onClick={excluir} className="btn-text-danger">
                  Sim, excluir
                </button>
                <button type="button" onClick={() => setConfirmandoExclusao(false)} className="btn-secondary" style={{ height: 32, padding: '0 14px', fontSize: 13 }}>
                  Cancelar
                </button>
              </div>
            ) : (
              <button type="button" onClick={excluir} className="btn-text-danger" style={{ alignSelf: 'flex-start' }}>
                Excluir gasto
              </button>
            )}
            <span style={{ fontSize: 12, color: 'var(--ink2)' }}>
              {bloqueado
                ? 'Esse gasto já faz parte de uma Liquidação confirmada — excluir não recalcula o saldo daquela liquidação. Fica registrado em Histórico → Log de alterações, com o que era e quem excluiu.'
                : 'Fica registrado em Histórico → Log de alterações, com o que era e quem excluiu.'}
            </span>
          </div>
        )}
      </form>
    </div>
  );
}

function IconClose() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
