import React, { useRef, useState } from 'react';
import { Database, Download, Upload, AlertTriangle, ShieldCheck, CheckCircle, Activity, Clock, User, AlertCircle } from 'lucide-react';
import { loadData, saveData } from '../mockData'; 
import { AuditLog } from '../types';
import initialState from '../initialState.json';

interface SettingsViewProps {
  onRestoreData: (data: any) => void;
  auditLogs: AuditLog[];
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onRestoreData, auditLogs }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [restoreStatus, setRestoreStatus] = useState<string>('');
  const [saveWorkspaceStatus, setSaveWorkspaceStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [saveWorkspaceMsg, setSaveWorkspaceMsg] = useState<string>('');

  const [clientGeminiKey, setClientGeminiKey] = useState(() => localStorage.getItem('LOGOS_C_GEMINI_KEY') || '');
  const [isKeySaved, setIsKeySaved] = useState(false);

  const hasFactoryData = initialState && Object.keys(initialState).length > 0;

  const handleRestoreFromFactory = () => {
    const confirmMsg = "Aviso: Isso substituirá todos os registros atuais do seu navegador pelos dados embutidos no seu arquivo 'src/initialState.json' implantado.\n\nQualquer alteração local temporária será substituída. Deseja redefinir todo o banco local para carregar os novos dados?";
    if (window.confirm(confirmMsg)) {
      const keys = [
        'LOGOS_STUDENTS',
        'LOGOS_SUBJECTS',
        'LOGOS_CLASSES',
        'LOGOS_GRADES',
        'LOGOS_ATTENDANCE',
        'LOGOS_PAYMENTS',
        'LOGOS_TRANSACTIONS',
        'LOGOS_ACTIVITIES',
        'LOGOS_LESSON_PLANS',
        'LOGOS_LOGGED_IN_DOCENTE',
        'LOGOS_LOGIN_LOGS'
      ];
      keys.forEach(k => {
        try {
          localStorage.removeItem(k);
        } catch (e) {
          // ignore
        }
      });
      alert("Banco de dados local limpo! A página será reiniciada agora para ler e reimportar o seu arquivo 'initialState.json' de fábrica.");
      window.location.reload();
    }
  };

  const handleSaveClientGeminiKey = () => {
    if (clientGeminiKey.trim()) {
      localStorage.setItem('LOGOS_C_GEMINI_KEY', clientGeminiKey.trim());
      setIsKeySaved(true);
      setTimeout(() => setIsKeySaved(false), 3000);
    } else {
      localStorage.removeItem('LOGOS_C_GEMINI_KEY');
      setIsKeySaved(true);
      setTimeout(() => setIsKeySaved(false), 3000);
    }
  };

  const generateBackupData = () => {
    // Collect all data from localStorage that we care about
    const data: Record<string, any> = {};
    const keys = [
      'LOGOS_STUDENTS',
      'LOGOS_SUBJECTS',
      'LOGOS_CLASSES',
      'LOGOS_GRADES',
      'LOGOS_ATTENDANCE',
      'LOGOS_PAYMENTS',
      'LOGOS_TRANSACTIONS',
      'LOGOS_ACTIVITIES',
      'LOGOS_LESSON_PLANS',
      'LOGOS_LOGGED_IN_DOCENTE',
      'LOGOS_LOGIN_LOGS'
    ];
    
    keys.forEach(key => {
      const item = localStorage.getItem(key);
      if (item) {
        try {
          data[key] = JSON.parse(item);
        } catch (e) {
          // ignore
        }
      }
    });
    
    return data;
  };

  const handleExportBackup = () => {
    const data = generateBackupData();
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `logos_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSaveToWorkspace = async () => {
    const isGitHubPages = window.location.hostname.includes('github.io') || window.location.hostname.includes('github.preview');
    if (isGitHubPages) {
      setSaveWorkspaceStatus('error');
      setSaveWorkspaceMsg(
        "A sincronização direta com o código-fonte só pode ser executada no ambiente de desenvolvimento ativo do AI Studio. Como este site está rodando de forma estática no GitHub Pages, o botão não pode salvar os arquivos do servidor diretamente. Para sincronizar permanentemente, baixe o arquivo de backup abaixo, abra seu projeto de código, salve o conteúdo no arquivo 'src/initialState.json' e suba para o GitHub."
      );
      return;
    }

    setSaveWorkspaceStatus('saving');
    setSaveWorkspaceMsg('');
    try {
      const data = generateBackupData();
      const baseUrl = import.meta.env.BASE_URL || "/";
      const fetchUrl = `${baseUrl}/api/save-workspace-data`.replace(/\/+/g, '/');
      const response = await fetch(fetchUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      let resData: any = {};
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        resData = await response.json();
      } else {
        const text = await response.text();
        const titleMatch = text.match(/<title>(.*?)<\/title>/i);
        
        if (response.status === 405 || text.includes("<!DOCTYPE html>")) {
          throw new Error("O servidor retornou Erro 405 ou resposta não suportada. O ambiente de hospedagem atual é estático e não aceita requisições de gravação. Por favor, execute este comando a partir do ambiente de visualização do Google AI Studio.");
        }
        throw new Error(titleMatch && titleMatch[1] ? `Erro do Servidor: ${titleMatch[1]}` : `O servidor não retornou JSON válido (Status: ${response.status})`);
      }
      
      if (response.ok && resData.success) {
        setSaveWorkspaceStatus('success');
        setSaveWorkspaceMsg(resData.message || "Gravado com sucesso!");
        // Auto-dismiss message after 10s
        setTimeout(() => {
          setSaveWorkspaceStatus('idle');
          setSaveWorkspaceMsg('');
        }, 10000);
      } else {
        setSaveWorkspaceStatus('error');
        setSaveWorkspaceMsg(resData.error || "Erro ao tentar gravar os dados no servidor.");
      }
    } catch (err: any) {
      console.error("Erro ao sincronizar com o projeto:", err);
      setSaveWorkspaceStatus('error');
      setSaveWorkspaceMsg(err.message || "Não foi possível conectar ao servidor de desenvolvimento para gravar as alterações.");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const jsonContent = event.target?.result as string;
        const parsedData = JSON.parse(jsonContent);
        
        // Let the parent App.tsx handle state replacement
        onRestoreData(parsedData);
        setRestoreStatus('sucesso');
        setTimeout(() => setRestoreStatus(''), 5000);
      } catch (err) {
        console.error("Failed to parse backup:", err);
        setRestoreStatus('erro');
        setTimeout(() => setRestoreStatus(''), 5000);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6 max-w-4xl animate-fade-in pb-12">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-2xl font-black text-slate-800 font-sans tracking-tight">Backup do Sistema</h2>
          <p className="text-xs text-slate-500 max-w-2xl mt-1">
            Aqui você pode fazer o download (exportar) de todos os dados salvos localmente, ou restaurar os dados de um arquivo anterior para garantir que você não perca informações.
          </p>
        </div>
      </div>

      {restoreStatus === 'sucesso' && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-center gap-3 animate-fade-in shadow-sm">
          <CheckCircle className="w-5 h-5 text-emerald-500" />
          <div>
            <h4 className="text-emerald-900 font-bold text-sm">Backup Restaurado com Sucesso!</h4>
            <p className="text-xs text-emerald-700/80">Todos os registros e turmas foram atualizados conforme o arquivo de backup.</p>
          </div>
        </div>
      )}
      
      {restoreStatus === 'erro' && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl flex items-center gap-3 animate-fade-in shadow-sm">
          <AlertTriangle className="w-5 h-5 text-rose-500" />
          <div>
            <h4 className="text-rose-900 font-bold text-sm">Erro ao restaurar backup</h4>
            <p className="text-xs text-rose-700/80">O arquivo enviado selecionado inválido ou corrompido.</p>
          </div>
        </div>
      )}

      {/* Sincronização definitiva de dados para GitHub / Código-Fonte */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-md border border-slate-805 flex flex-col md:flex-row gap-8 items-start relative overflow-hidden">
        <div className="absolute inset-x-0 -top-40 h-80 bg-gradient-to-b from-indigo-500/10 to-transparent blur-3xl pointer-events-none"></div>
        
        {/* Info Content Left */}
        <div className="flex-1 space-y-4 relative z-10 w-full font-sans">
          <div className="w-12 h-12 bg-indigo-500/15 border border-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center">
            <Database className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="bg-amber-400/20 text-amber-300 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded inline-block mb-2 border border-amber-400/10">
              Sincronização do Banco de Dados
            </span>
            <h3 className="text-lg font-bold text-slate-100 tracking-tight">Salvar Alunos e Turmas para o Código-Fonte</h3>
            <p className="text-xs text-slate-350 leading-relaxed mt-2.5">
              Por padrão, os alunos e as notas que você cadastra ou modifica aqui no painel ficam salvos <strong>somente no navegador local</strong> (<code className="bg-slate-800/80 text-amber-200 px-1 py-0.5 rounded font-mono text-[10px]">localStorage</code>).
            </p>
            <p className="text-xs text-slate-350 leading-relaxed mt-2">
              Se você exportar o app para o <strong>GitHub</strong> ou acessá-lo de outro dispositivo, esses novos cadastros não estarão lá por padrão. Para gravar os dados atuais de forma definitiva no banco inicial da aplicação (<code className="bg-slate-800/80 text-indigo-200 px-1 py-0.5 rounded font-mono text-[10px]">src/initialState.json</code>), clique no botão abaixo.
            </p>
          </div>

          {(window.location.hostname.includes('github.io') || window.location.hostname.includes('github.preview')) ? (
            <div className="space-y-4">
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-200 rounded-2xl text-xs space-y-2 animate-fade-in">
                <p className="font-bold flex items-center gap-1.5 uppercase text-[10px] tracking-wider text-amber-405">
                  <AlertTriangle className="w-4 h-4 text-amber-400" /> Versão Estática (GitHub Pages) Ativa
                </p>
                <p className="leading-relaxed text-slate-300">
                  Como você está acessando a aplicação hospedada no <strong>GitHub Pages</strong>, o servidor de desenvolvimento não está rodando por trás. Por isso, a gravação automática direta de arquivos no código-fonte dará erro 405 (Not Allowed).
                </p>
                <div className="p-3 bg-slate-950/60 rounded-xl space-y-1.5 border border-slate-800/80 text-slate-400 text-[11px] leading-relaxed">
                  <p className="text-slate-205 font-semibold">Como salvar suas alterações definitivamente:</p>
                  <ol className="list-decimal pl-4 space-y-1">
                    <li>Altere os dados comuns que precisar neste painel.</li>
                    <li>Clique no botão <strong>"Fazer Download das Informações (Backup)"</strong> na seção abaixo para baixar seu arquivo <code className="text-indigo-300">.json</code> atualizado.</li>
                    <li>No seu repositório de arquivos do código, substitua o conteúdo do arquivo <code className="text-indigo-300">src/initialState.json</code> com as informações deste backup.</li>
                    <li>Faça o push/commit para o GitHub. A nova versão do site já terá todos os novos alunos e turmas embutidos de fábrica!</li>
                  </ol>
                </div>
              </div>

              {/* Botão para atualizar e carregar o initialState no localStorage se houver dados */}
              <div className="p-4 bg-indigo-950/45 border border-indigo-500/20 rounded-2xl text-xs space-y-2.5 animate-fade-in">
                <p className="font-extrabold flex items-center gap-1.5 uppercase text-[10px] tracking-wider text-indigo-400">
                  <ShieldCheck className="w-4 h-4 text-indigo-400 font-sans" /> Sincronizar Navegador com initialState.json
                </p>
                <p className="leading-relaxed text-slate-350">
                  Se você já substituiu o arquivo <code className="bg-slate-950 px-1 py-0.5 rounded text-indigo-300 font-mono text-[10.5px]">src/initialState.json</code> no seu repositório do GitHub com seu backup de alunos e fez o push, mas a tela do navegador <strong>continua aparecendo vazia/zerada</strong>, é porque o navegador manteve o cache antigo guardado localmente.
                </p>
                <p className="leading-relaxed text-slate-350 font-medium">
                  Clique no botão abaixo para esvaziar o cache de dados do seu navegador e forçar o site a carregar os novos dados embutidos de fábrica que você subiu no GitHub Pages:
                </p>

                <div className="pt-1 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleRestoreFromFactory}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs rounded-xl transition duration-200 cursor-pointer flex items-center gap-1.5 shadow-md shadow-indigo-600/10"
                  >
                    <Clock className="w-3.5 h-3.5 text-indigo-200" />
                    <span>Limpar Cache e Carregar Dados do GitHub</span>
                  </button>
                  
                  <span className="text-[10px] text-slate-400">
                    {hasFactoryData 
                      ? "✓ Arquivo de fábrica detectado com dados carregados." 
                      : "ⓘ O arquivo initialState embutido atualmente está vazio (padrão)."}
                  </span>
                </div>
              </div>
            </div>
          ) : null}

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button 
              type="button"
              disabled={saveWorkspaceStatus === 'saving' || window.location.hostname.includes('github.io') || window.location.hostname.includes('github.preview')}
              onClick={handleSaveToWorkspace}
              className={`px-5 py-3 font-bold text-xs rounded-xl transition duration-300 ${
                (window.location.hostname.includes('github.io') || window.location.hostname.includes('github.preview'))
                  ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60'
                  : saveWorkspaceStatus === 'saving'
                    ? 'bg-indigo-700/50 text-indigo-300 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white cursor-pointer shadow-lg shadow-indigo-605/30'
              } flex items-center gap-2`}
            >
              <Database className="w-4 h-4 text-indigo-200" />
              {(window.location.hostname.includes('github.io') || window.location.hostname.includes('github.preview')) 
                ? 'Gravação indisponível no GitHub Pages' 
                : saveWorkspaceStatus === 'saving' 
                  ? 'Gravando dados no código-fonte...' 
                  : 'Gravar Alterações Definitivamente no Código'}
            </button>
          </div>
          
          {saveWorkspaceStatus === 'success' && (
            <div className="bg-emerald-950/80 border border-emerald-500/30 text-emerald-100 p-4 rounded-xl text-xs space-y-1.5 animate-fade-in">
              <span className="font-black text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                <CheckCircle className="w-4 h-4 shrink-0" /> Gravado com sucesso total!
              </span>
              <p className="leading-relaxed text-slate-300">
                {saveWorkspaceMsg}
              </p>
              <p className="text-[10px] text-emerald-300 leading-normal pt-1.5 bg-emerald-950/20 px-2.5 py-1.5 rounded-lg border border-emerald-500/10 mt-1">
                <strong>Próximo Passo no Github:</strong> Já está no código-fonte! Agora você pode exportar seu repositório para o GitHub na barra ou menu de configurações do AI Studio normal. Todo novo acesso receberá o seu banco de dados atualizado por padrão!
              </p>
            </div>
          )}

          {saveWorkspaceStatus === 'error' && (
            <div className="bg-rose-950/80 border border-rose-500/30 text-rose-100 p-4 rounded-xl text-xs space-y-1 animate-fade-in">
              <span className="font-extrabold text-rose-400 flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                <AlertTriangle className="w-4 h-4 shrink-0" /> Falha ao Sincronizar
              </span>
              <p className="leading-relaxed text-slate-300">
                {saveWorkspaceMsg}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Backup Section */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 flex flex-col md:flex-row gap-8 items-start relative overflow-hidden">
        
        {/* Export Card */}
        <div className="flex-1 space-y-4">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center relative">
            <Download className="w-6 h-6" />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white flex items-center justify-center">
              <ShieldCheck className="w-2.5 h-2.5 text-emerald-950" />
            </div>
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800 tracking-tight">Exportar Dados (Download)</h3>
            <p className="text-xs text-slate-500 leading-relaxed mt-1">
              Baixe um arquivo ".json" contendo todo o banco de dados atual do sistema: cadastros de alunos, matrículas, financeiro e gerações de IA. 
              <strong> Você deve fazer esse download periodicamente para segurança!</strong>
            </p>
          </div>
          <button 
            onClick={handleExportBackup}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-indigo-600/20 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Fazer Download das Informações (Backup)
          </button>
        </div>
        
        {/* Divider */}
        <div className="hidden md:block w-px bg-slate-100 self-stretch my-2"></div>
        {/* Divider Mobile */}
        <div className="block md:hidden w-full h-px bg-slate-100 my-2"></div>

        {/* Import Card */}
        <div className="flex-1 space-y-4">
          <div className="w-12 h-12 bg-slate-50 text-slate-600 rounded-2xl flex items-center justify-center">
            <Upload className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800 tracking-tight">Restaurar de Backup</h3>
            <p className="text-xs text-slate-500 leading-relaxed mt-1">
              Importar banco de dados. Caso tenha instalado em um novo dispositivo ou mudado de navegador, suba o arquivo ".json" gravado localmente para recuperar todas as informações.
            </p>
          </div>

          <div 
            className={`mt-2 border-2 border-dashed rounded-2xl p-4 transition text-center cursor-pointer relative overflow-hidden ${isHovering ? 'border-indigo-400 bg-indigo-50/50' : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/50'}`}
            onDragOver={(e) => { e.preventDefault(); setIsHovering(true); }}
            onDragLeave={() => setIsHovering(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsHovering(false);
              if (e.dataTransfer.files?.length && fileInputRef.current) {
                fileInputRef.current.files = e.dataTransfer.files;
                const event = new Event('change', { bubbles: true });
                fileInputRef.current.dispatchEvent(event);
                handleFileUpload({ target: fileInputRef.current } as any);
              }
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept=".json,application/json" 
              onChange={handleFileUpload}
            />
            <div className="flex flex-col items-center justify-center text-slate-400 py-2">
               <Upload className="w-5 h-5 mx-auto mb-2 text-slate-400" />
               <span className="text-xs font-bold font-sans">Selecionar arquivo JSON</span>
            </div>
          </div>

        </div>

      </div>

      {/* Gemini Integration Section */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 space-y-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
            <Activity className="w-6 h-6 text-indigo-600" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-800 tracking-tight">Inteligência Artificial (Planejador de Ementas)</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              O Planejador Teológico Virtual gera ementas e planos de aula estruturados automaticamente. 
              Como você está no <strong>caso de deploy offline/estático (GitHub Pages)</strong>, o servidor de backend Node.js não roda nativamente. Para que os docentes usem a IA de forma ilimitada, configure uma chave de API do Gemini individual para o navegador.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          <div className="md:col-span-2 space-y-3">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Chave de API do Gemini (Browser LocalStorage)
            </label>
            <div className="flex gap-2">
              <input
                type="password"
                placeholder="Insira sua GEMINI_API_KEY do Google AI Studio..."
                value={clientGeminiKey}
                onChange={(e) => setClientGeminiKey(e.target.value)}
                className="flex-1 text-xs px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none placeholder-slate-400 font-mono"
              />
              <button
                type="button"
                onClick={handleSaveClientGeminiKey}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition duration-200 cursor-pointer"
              >
                Salvar Chave
              </button>
            </div>
            
            {isKeySaved && (
              <p className="text-[10px] text-emerald-605 font-bold flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> Chave de API atualizada com sucesso!
              </p>
            )}

            <p className="text-[10px] text-slate-400 leading-relaxed">
              * A chave será armazenada de forma segura <strong>apenas no navegador local</strong> do usuário pela chave <code className="bg-slate-100 text-slate-600 px-1 py-0.5 rounded font-mono text-[9px]">LOGOS_C_GEMINI_KEY</code>. Obtenha uma chave gratuita e ilimitada do Gemini no portal para desenvolvedores do Google{' '}
              <a href="https://aistudio.google.com" target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline font-bold inline-flex items-center gap-0.5">
                Google AI Studio
              </a>.
            </p>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex flex-col justify-between space-y-3">
            <div>
              <h4 className="text-xs font-bold text-slate-750 uppercase tracking-wider">Status da Conexão de IA</h4>
              <p className="text-[10px] text-slate-500 mt-1">Status operacional da inteligência artificial hermenêutica no dispositivo:</p>
            </div>

            <div className="space-y-2">
              {window.location.hostname.includes('github.io') ? (
                <div className="flex items-center gap-2 p-2 rounded-xl bg-orange-50 border border-orange-100 text-orange-700">
                  <div className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse"></div>
                  <div className="text-[10px] space-y-0.5">
                    <p className="font-bold">Hospedagem Estática (GitHub Pages)</p>
                    <p className="text-[9px] text-orange-600">Requer Chave de API própria inserida.</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-2 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                  <div className="text-[10px] space-y-0.5">
                    <p className="font-bold">Servidor Local Conectado</p>
                    <p className="text-[9px] text-emerald-600">Pode usar a chave do servidor ou sua chave local.</p>
                  </div>
                </div>
              )}

              <div className="text-[10px] text-slate-500 font-medium">
                Modo Ativo: <strong className="text-indigo-650">{localStorage.getItem('LOGOS_C_GEMINI_KEY') ? 'Chave de API Direta' : 'Servidor Integrado'}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Audit Logs Section */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden mt-8">
        <div className="border-b border-slate-100 px-6 py-5 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-sans font-bold text-slate-800 tracking-tight">Histórico de Alterações</h3>
              <p className="text-[10px] text-slate-500 font-medium">Log de auditoria das últimas 100 modificações realizadas no sistema</p>
            </div>
          </div>
          <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-1 rounded-md">{auditLogs.length} Registros</span>
        </div>

        <div className="divide-y divide-slate-100/60 max-h-[400px] overflow-y-auto w-full p-2">
          {auditLogs.length === 0 ? (
            <div className="p-8 text-center text-slate-500 font-medium text-xs">Nenhuma alteração registrada ainda.</div>
          ) : (
            auditLogs.map((log) => {
              const dt = new Date(log.timestamp);
              const isRecent = Date.now() - dt.getTime() < 3600000; // 1 hour
              
              return (
                <div key={log.id} className="p-4 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center gap-4 rounded-xl">
                  <div className="flex flex-col md:flex-row md:items-center gap-4 md:w-1/4 shrink-0">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-[11px] font-mono text-slate-600">{dt.toLocaleString('pt-BR')}</span>
                    </div>
                  </div>
                  
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800">{log.action}</span>
                      {isRecent && <span className="text-[9px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-sm font-bold uppercase tracking-wider">Recente</span>}
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">{log.details}</p>
                  </div>

                  <div className="flex items-center gap-1.5 md:w-1/4 shrink-0 justify-start md:justify-end">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-[11px] text-slate-600 font-medium truncate max-w-[120px]" title={log.docenteEmail}>
                      {log.docenteEmail}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
};
