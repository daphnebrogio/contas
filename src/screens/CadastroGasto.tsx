import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { atualizarGasto, criarGasto, excluirGasto } from '../lib/gastos';
import { criarTag } from '../lib/tags';
import { proximaCorLivre } from '../lib/cores';
import { useTags } from '../hooks/useTags';
import MoneyInput from '../components/MoneyInput';
import Avatar from '../components/Avatar';
import { UID_DAPHNE, UID_JOAO, USUARIOS, type Gasto, type StatusGasto } from '../types/models';

const hoje = () => new Date().toISOString().slice(0, 10);

export default function CadastroGasto() {
  const { id } = useParams();
  const editando = Boolean(id);
  const navigate = useNavigate();
  const tags = useTags();

  const [carregado, setCarregado] = useState(!editando);
  const [gastoOriginal, setGastoOriginal] = useState<Gasto | null>(null);

  const [valor, setValor] = useState(0);
  const [descricao, setDescricao] = useState('');
  const [tagsEscolhidas, setTagsEscolhidas] = useState<string[]>([]);
  const [novaTag, setNovaTag] = useState('');
  const [status, setStatus] = useState<StatusGasto>('pendente');
  const [pagador, setPagador] = useState<string | null>(null);
  const [dataLancamento, setDataLancamento] = useState(hoje());
  const [comprovanteUrl, setComprovanteUrl] = useState('');

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
      setDataLancamento(g.data_lancamento);
      setComprovanteUrl(g.comprovante_url ?? '');
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

    setSalvando(true);
    try {
      const dadosGasto = {
        valor,
        descricao,
        tags: tagsEscolhidas,
        pagador,
        data_lancamento: dataLancamento,
        status,
        data_pagamento: status === 'pago' ? hoje() : null,
        comprovante_url: comprovanteUrl.trim() || null,
      };

      if (editando && id) {
        await atualizarGasto(id, dadosGasto);
      } else {
        await criarGasto(dadosGasto);
      }
      navigate('/');
    } catch (err) {
      setErro('Não deu pra salvar — tenta de novo.');
      console.error(err);
    } finally {
      setSalvando(false);
    }
  }

  async function excluir() {
    if (!id) return;
    if (!confirmandoExclusao) {
      setConfirmandoExclusao(true);
      return;
    }
    try {
      await excluirGasto(id);
      navigate('/');
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
        <button aria-label="Fechar" className="icon-btn" onClick={() => navigate('/')}>
          <IconClose />
        </button>
      </div>

      {bloqueado && (
        <div className="card" style={{ background: 'var(--pending)', color: 'var(--accent-ink)', border: 'none', padding: '14px 20px', fontSize: 13, fontWeight: 600 }}>
          Este gasto já faz parte de uma Liquidação confirmada — só o comprovante pode ser alterado. Pra corrigir valor ou pagador, lance um gasto de ajuste novo.
        </div>
      )}

      <form onSubmit={salvar} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
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
              disabled={bloqueado}
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

        <div>
          <label className="field-label" htmlFor="comprovante">Link do comprovante (opcional)</label>
          <input
            id="comprovante"
            type="url"
            className="input"
            placeholder="Cole o link do Google Fotos, Drive, etc."
            value={comprovanteUrl}
            onChange={(e) => setComprovanteUrl(e.target.value)}
          />
        </div>

        <div style={{ width: 220 }}>
          <label className="field-label" htmlFor="dataLanc">Data de lançamento</label>
          <input id="dataLanc" type="date" className="input" value={dataLancamento} onChange={(e) => setDataLancamento(e.target.value)} disabled={bloqueado} />
        </div>

        {erro && <span style={{ color: 'var(--neg)', fontSize: 13, fontWeight: 600 }}>{erro}</span>}

        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          <button type="submit" disabled={salvando} className="btn-primary">
            {salvando ? 'Salvando…' : 'Salvar gasto'}
          </button>
          <button type="button" onClick={() => navigate('/')} className="btn-secondary">
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

function Segmented({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', width: 'fit-content' }}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          style={{
            padding: '9px 18px',
            fontSize: 13,
            fontWeight: 600,
            border: 'none',
            cursor: 'pointer',
            background: value === o.value ? 'var(--accent)' : 'var(--surface)',
            color: value === o.value ? 'var(--accent-ink)' : 'var(--ink)',
          }}
        >
          {o.label}
        </button>
      ))}
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
