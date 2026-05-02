'use client';

import { useState } from 'react';
import ParametricViewer from '@/components/ParametricViewer';

interface AstResult {
  nome_projeto: string;
  descricao_tecnica: string;
  componente_raiz: Record<string, unknown>;
  criterios_otimizacao: string[];
}

export default function Home() {
  const [prompt, setPrompt] = useState('Quero um pavilhão industrial de 20x50m com pé direito de 6m e telhado em arco de estrutura metálica.');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AstResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'ast' | '3d' | 'bom'>('ast');

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao gerar o modelo');
      }
      
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#141416] text-[#E8EDF2] font-sans selection:bg-[#3A3A40] selection:text-white">
      <div className="max-w-7xl mx-auto px-8 py-10 flex flex-col h-screen">
        
        {/* HEADER */}
        <header className="flex justify-between items-center mb-10 pb-6 border-b border-[#2C2C32]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#383842] to-[#1E1E22] flex items-center justify-center shadow-lg border border-[#40404A]">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#D8E2ED]" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.496 2.132a1 1 0 00-.992 0l-7 4A1 1 0 003 8v7a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1V8a1 1 0 00-.504-.868l-7-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-[#F8FAFC]">GeoStruct <span className="text-[#8BA3B8] font-medium">AI</span></h1>
              <p className="text-xs text-[#94A3B8] uppercase tracking-[0.2em] font-semibold mt-1">Motor Paramétrico</p>
            </div>
          </div>
          <div className="flex gap-4 text-sm font-medium">
            <span className="px-4 py-2 rounded-lg bg-[#1E1E22] text-[#B0C4DE] border border-[#2C2C32] shadow-inner">
              Fase 1: NLP AST Parser
            </span>
            <span className="px-4 py-2 rounded-lg bg-[#1E293B] text-[#E2E8F0] border border-[#334155] shadow-inner flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-[#38BDF8] animate-pulse shadow-[0_0_8px_#38BDF8]"></span>
              Sistema Online
            </span>
          </div>
        </header>

        {/* MAIN LAYOUT */}
        <div className="flex flex-col lg:flex-row gap-8 flex-1 min-h-0">
          
          {/* LEFT: PROMPT INPUT */}
          <div className="flex flex-col gap-4 lg:w-1/3">
            <div className="bg-[#1A1A1D] border border-[#2A2A30] rounded-2xl p-7 flex flex-col flex-1 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#383842] to-[#1E1E22]"></div>
              
              <h2 className="text-xl font-bold mb-3 text-[#F8FAFC]">Descreva a Estrutura</h2>
              <p className="text-sm text-[#94A3B8] mb-6 leading-relaxed">
                Insira os parâmetros arquitetônicos ou necessidades de engenharia. A Inteligência Artificial traduzirá a linguagem natural em um esquema de dados hierárquico (JSON AST).
              </p>
              
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="flex-1 w-full bg-[#141416] border border-[#2C2C32] focus:border-[#4A5568] focus:ring-1 focus:ring-[#4A5568] rounded-xl p-5 text-[#E2E8F0] placeholder:text-[#475569] outline-none resize-none transition-all shadow-inner leading-relaxed"
                placeholder="Ex: Pavilhão de 20x50m com ponte rolante..."
              />
              
              <div className="flex gap-2 mt-6">
                <button
                  onClick={handleGenerate}
                  disabled={loading || !prompt.trim()}
                  className="flex-[2] bg-[#2D3748] hover:bg-[#4A5568] disabled:opacity-40 disabled:hover:bg-[#2D3748] text-[#F8FAFC] font-semibold py-4 rounded-xl transition-all shadow-lg border border-[#4A5568] flex items-center justify-center gap-3"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-[#E2E8F0]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      IA Processando...
                    </>
                  ) : (
                    'Gerar Projeto'
                  )}
                </button>
                <button
                  onClick={() => {
                    setPrompt('');
                    setResult(null);
                    setError(null);
                  }}
                  disabled={loading}
                  className="flex-1 bg-[#141416] hover:bg-[#1E1E22] text-[#94A3B8] font-medium py-4 rounded-xl transition-all border border-[#2C2C32] flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Limpar
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT: RESULTS */}
          <div className="flex flex-col lg:w-2/3 h-full overflow-hidden">
            <div className="bg-[#1A1A1D] border border-[#2A2A30] rounded-2xl flex flex-col flex-1 overflow-hidden shadow-2xl">
              
              <div className="flex border-b border-[#2A2A30] bg-[#141416]">
                <button 
                  onClick={() => setActiveTab('ast')}
                  className={`px-8 py-5 text-sm font-bold border-b-2 transition-colors ${activeTab === 'ast' ? 'border-[#8BA3B8] text-[#F8FAFC] bg-[#1A1A1D]' : 'border-transparent text-[#64748B] hover:text-[#94A3B8]'}`}>
                  <span className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${activeTab === 'ast' ? 'text-[#8BA3B8]' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                    Estrutura JSON
                  </span>
                </button>
                <button 
                  onClick={() => setActiveTab('3d')}
                  className={`px-8 py-5 text-sm font-bold border-b-2 transition-colors ${activeTab === '3d' ? 'border-[#38BDF8] text-[#F8FAFC] bg-[#1A1A1D]' : 'border-transparent text-[#64748B] hover:text-[#94A3B8]'}`}>
                  <span className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${activeTab === '3d' ? 'text-[#38BDF8]' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
                    </svg>
                    Visão 3D
                  </span>
                </button>
                <button 
                  onClick={() => setActiveTab('bom')}
                  className={`px-8 py-5 text-sm font-bold border-b-2 transition-colors ${activeTab === 'bom' ? 'border-[#10B981] text-[#F8FAFC] bg-[#1A1A1D]' : 'border-transparent text-[#64748B] hover:text-[#94A3B8]'}`}>
                  <span className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${activeTab === 'bom' ? 'text-[#10B981]' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Orçamento (BOM)
                  </span>
                </button>
              </div>

              <div className="flex-1 p-8 overflow-auto bg-[#111113] relative">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none"></div>

                {error && (
                  <div className="p-5 rounded-xl bg-[#3E1C1F] border border-[#6B2B30] text-[#FCA5A5] text-sm relative z-10 shadow-lg mb-4">
                    <strong className="block mb-1">Ocorreu um erro:</strong>
                    {error}
                  </div>
                )}
                
                {loading && !result && !error && (
                  <div className="h-full flex flex-col items-center justify-center text-[#64748B] gap-6 relative z-10">
                    <div className="w-16 h-16 rounded-2xl bg-[#1A1A1D] border border-[#2A2A30] animate-pulse shadow-[0_0_15px_rgba(255,255,255,0.05)]"></div>
                    <p className="text-sm font-medium tracking-wide">Traduzindo semântica para matemática geométrica...</p>
                  </div>
                )}
                
                {!loading && !result && !error && (
                  <div className="h-full flex flex-col items-center justify-center text-[#475569] gap-3 relative z-10">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 opacity-30 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <p className="font-medium text-lg">Aguardando Parâmetros</p>
                    <p className="text-sm">O esquema do projeto aparecerá aqui após o processamento.</p>
                  </div>
                )}

                {result && (
                  <div className="animate-in fade-in duration-700 relative z-10 flex flex-col h-full">
                    <div className="mb-6 flex items-start gap-5 p-5 rounded-2xl bg-[#1A1A1D] border border-[#2C2C32] shadow-md shrink-0">
                      <div className="w-10 h-10 rounded-xl bg-[#2D3748] border border-[#4A5568] flex items-center justify-center flex-shrink-0 shadow-inner">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#E2E8F0]" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <h3 className="text-lg text-[#F8FAFC] font-bold">{result.nome_projeto}</h3>
                          {result.criterios_otimizacao?.length > 0 && (
                            <span className="px-2 py-1 text-[10px] uppercase tracking-wider rounded bg-[#1C2331] text-[#93C5FD] border border-[#1E3A8A]">
                              Otimizado
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-[#94A3B8] leading-relaxed mt-1 line-clamp-2">{result.descricao_tecnica}</p>
                      </div>
                    </div>
                    
                    {activeTab === 'ast' && (
                      <div className="relative group flex-1">
                        <div className="absolute right-4 top-4 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity z-20">
                          <span className="text-xs font-mono text-[#CBD5E1] bg-[#27272A] border border-[#3F3F46] shadow px-3 py-1.5 rounded-md">
                            application/json
                          </span>
                        </div>
                        <div className="bg-[#141416] p-6 rounded-2xl border border-[#2C2C32] shadow-inner overflow-auto h-full max-h-[500px]">
                          <pre className="text-sm font-mono text-[#B0C4DE] leading-relaxed">
                            <code dangerouslySetInnerHTML={{ 
                              __html: JSON.stringify(result.componente_raiz, null, 2)
                                .replace(/"(.*?)":/g, '<span class="text-[#8BA3B8] font-medium">"$1"</span>:')
                                .replace(/: "(.*?)"/g, ': <span class="text-[#A7F3D0]">"$1"</span>')
                                .replace(/: ([0-9.]+)/g, ': <span class="text-[#FDE68A]">$1</span>')
                            }} />
                          </pre>
                        </div>
                      </div>
                    )}

                    {activeTab === '3d' && (
                      <div className="flex-1 animate-in slide-in-from-bottom-4 duration-500">
                        <ParametricViewer ast={result.componente_raiz} />
                      </div>
                    )}

                    {activeTab === 'bom' && (
                      <div className="flex-1 bg-[#141416] border border-[#2C2C32] rounded-2xl overflow-hidden shadow-inner flex flex-col animate-in slide-in-from-bottom-4 duration-500">
                        <div className="p-4 border-b border-[#2C2C32] bg-[#1A1A1D] flex justify-between items-center">
                          <h4 className="font-semibold text-[#E2E8F0]">Bill of Materials (Estimativa)</h4>
                          <span className="text-sm font-mono text-[#10B981]">R$ 1.240.500,00</span>
                        </div>
                        <div className="p-0 overflow-auto">
                          <table className="w-full text-sm text-left text-[#94A3B8]">
                            <thead className="text-xs text-[#64748B] uppercase bg-[#1A1A1D]">
                              <tr>
                                <th className="px-6 py-4">Componente</th>
                                <th className="px-6 py-4">Material</th>
                                <th className="px-6 py-4">Qtd Base</th>
                                <th className="px-6 py-4">Preço (Estimado)</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr className="border-b border-[#2A2A30] bg-[#141416]">
                                <td className="px-6 py-4 font-medium text-[#E2E8F0]">{String(result.componente_raiz?.tipo || '-')}</td>
                                <td className="px-6 py-4">{String(result.componente_raiz?.material || '-')}</td>
                                <td className="px-6 py-4">1 Estrutura Base</td>
                                <td className="px-6 py-4">R$ 500.000,00</td>
                              </tr>
                              {((result.componente_raiz as Record<string, unknown>)?.sub_componentes as Record<string, unknown>[] || []).map((sub: Record<string, unknown>, idx: number) => (
                                <tr key={idx} className="border-b border-[#2A2A30] bg-[#141416] hover:bg-[#1A1A1D] transition-colors">
                                  <td className="px-6 py-4 font-medium text-[#E2E8F0] pl-10">↳ {String(sub.tipo || 'Subcomponente')}</td>
                                  <td className="px-6 py-4">{String(sub.material || '-')}</td>
                                  <td className="px-6 py-4">{((sub.parametros as unknown[]) || []).length * 2} Unidades</td>
                                  <td className="px-6 py-4">R$ {(idx + 1) * 45000},00</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
