import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { atualizarGasto, criarGasto, excluirGasto } from '../lib/gastos';
import { criarSerie, encerrarSerie, marcarInstanciaGerada, reabrirSerie } from '../lib/series';
import { criarTag } from '../lib/tags';
import { useTags } from '../hooks/useTags';
import MoneyInput from '../components/MoneyInput';
import Avatar from '../components/Avatar';
import { UID_DAPHNE, UID_JOAO, USUARIOS, type Gasto, type StatusGasto, type TipoGasto } from '../types/models';

const hoje = () => new Date().toISOString().slice(0, 10);

export default function CadastroGasto() {
  const { id } = useParams();
  const editando = Boolean(id);
  const navigate = useNavigate();
  const tags = useTags();

  const [carregado, setCarregado] = useState(!editando);
  const [gastoOriginal, setGastoOriginal] = useState<Gasto | null>(null);
  const [serieId, setSerieId] = useState<string | null>(null);
  const [serieFim, setSerieFim] = useState<string | null>(null);

  const [valor, setValor] = useState(0);
  const [descricao, setDescricao] = useState('');
  const [tagsEscolhidas, setTagsEscolhidas] = useState<string[]>([]);
  const [novaTag, setNovaTag] = useState('');
  const [tipo, setTipo] = useState<TipoGasto>('pontual');
  const [status, setStatus] = useState<StatusGasto>('pendente');
  const [pagador, setPagador] = useState<string | null>(null);
  const [dataLancamento, setDataLancamento] = useState(hoje());
  const [comprovanteUrl, setComprovanteUrl] = useState('');

  const [diaVencimento, setDiaVencimento] = useState(new Date().getDate());
  const [dataFimSerie, setDataFimSerie] = useState<string | null>(null);
  const [valorSugerido, setValorSugerido] = useState(0);

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
      setTipo(g.tipo);
      setStatus(g.status);
      setPagador(g.pagador);
      setDataLancamento(g.data_lancamento);
      setComprovanteUrl(g.comprovante_url ?? '');
      setValorSugerido(g.valor);

      if (g.serie_id) {
        setSerieId(g.serie_id);
        const serieSnap = await getDoc(doc(db, 'series_recorrentes', g.serie_id));
        if (serieSnap.exists()) {
          const s = serieSnap.data();
          setDiaVencimento(s.dia_vencimento);
          setDataFimSerie(s.data_fim);
          setSerieFim(s.data_fim);
          setValorSugerido(s.valor_sugerido);
        }
      }
      setCarregado(true);
    })();
  }, [id]);

  const bloqueado = gastoOriginal?.bloqueado_para_edicao ?? false;
  const recorrenciaEncerrada = tipo === 'recorrente' && serieId !== null && dataFimSerie !== null;

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
      await criarTag(nome);
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
      let serieIdParaGasto = serieId;

      if (tipo === 'recorrente' && !serieId) {
        const novaSerie = await criarSerie({
          descricao,
          tags: tagsEscolhidas,
          valor_sugerido: valorSugerido || valor,
          dia_vencimento: diaVencimento,
          data_inicio: dataLancamento,
          data_fim: null,
          ultima_instancia_gerada: null,
        });
        serieIdParaGasto = novaSerie.id;
      }

      const dadosGasto = {
        valor,
        descricao,
        tags: tagsEscolhidas,
        tipo,
        serie_id: tipo === 'recorrente' ? serieIdParaGasto : null,
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
        if (tipo === 'recorrente' && serieIdParaGasto) {
          await marcarInstanciaGerada(serieIdParaGasto, dataLancamento.slice(0, 7));
        }
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
    if (!id || bloqueado) return;
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

  async function encerrarRecorrencia() {
    if (!serieId) return;
    await encerrarSerie(serieId);
    setDataFimSerie(hoje());
    setSerieFim(hoje());
  }

  async function desfazerEncerramento() {
    if (!serieId) return;
    await reabrirSerie(serieId);
    setDataFimSerie(null);
    setSerieFim(null);
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
                className="tag-pill"
                style={{
                  border: 'none',
                  cursor: 'pointer',
                  background: tagsEscolhidas.includes(t.id) ? 'var(--accent)' : 'var(--tag-bg)',
                  color: tagsEscolhidas.includes(t.id) ? 'var(--accent-ink)' : 'var(--tag-text)',
                }}
              >
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
            <span className="field-label">Tipo</span>
            <Segmented
              disabled={editando}
              options={[
                { value: 'pontual', label: 'Pontual' },
                { value: 'recorrente', label: 'Recorrente' },
              ]}
              value={tipo}
              onChange={(v) => setTipo(v as TipoGasto)}
            />
          </div>
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
          {tipo === 'recorrente' && (
            <span style={{ fontSize: 12, color: 'var(--ink2)', display: 'block', marginBottom: 8 }}>
              Recorrente varia todo mês — só fica definido quando alguém marca como pago.
            </span>
          )}
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

        {tipo === 'recorrente' && !recorrenciaEncerrada && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 18, background: 'var(--bg)', borderRadius: 12, border: '1px dashed var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink2)' }}>CAMPOS DA RECORRÊNCIA</span>
              {serieId && (
                <button type="button" onClick={encerrarRecorrencia} className="btn-text-danger">
                  Encerrar recorrência
                </button>
              )}
            </div>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ width: 180 }}>
                <label className="field-label" htmlFor="venc">Dia de vencimento</label>
                <input id="venc" type="number" min={1} max={31} className="input" value={diaVencimento} onChange={(e) => setDiaVencimento(Number(e.target.value))} />
              </div>
              <div style={{ width: 200 }}>
                <label className="field-label" htmlFor="valorSug">Valor sugerido</label>
                <MoneyInput id="valorSug" centavos={valorSugerido} onChange={setValorSugerido} />
              </div>
            </div>
          </div>
        )}

        {recorrenciaEncerrada && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: 18, background: 'var(--neg-soft)', borderRadius: 12, border: '1px solid rgba(201,114,104,0.35)' }}>
            <span style={{ fontSize: 13, color: '#f0c4bc', lineHeight: 1.5 }}>
              Recorrência encerrada a partir de {serieFim && new Date(serieFim + 'T00:00:00').toLocaleDateString('pt-BR')} — não gera mais instâncias novas. Os meses já lançados continuam no histórico.
            </span>
            <button type="button" onClick={desfazerEncerramento} className="btn-text-danger" style={{ color: '#f0c4bc', whiteSpace: 'nowrap' }}>
              Desfazer
            </button>
          </div>
        )}

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
              <button type="button" onClick={excluir} disabled={bloqueado} className="btn-text-danger" style={{ alignSelf: 'flex-start', opacity: bloqueado ? 0.5 : 1, cursor: bloqueado ? 'not-allowed' : 'pointer' }}>
                Excluir gasto
              </button>
            )}
            <span style={{ fontSize: 12, color: 'var(--ink2)' }}>
              Só é possível excluir gastos que ainda não fazem parte de uma Liquidação confirmada.
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
  disabled,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', width: 'fit-content', opacity: disabled ? 0.5 : 1 }}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          disabled={disabled}
          onClick={() => onChange(o.value)}
          style={{
            padding: '9px 18px',
            fontSize: 13,
            fontWeight: 600,
            border: 'none',
            cursor: disabled ? 'not-allowed' : 'pointer',
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
