import React, { useState, useMemo } from 'react';
import { 
  Clock, 
  Users, 
  UserCheck, 
  UserMinus, 
  Search, 
  Zap, 
  CheckCircle, 
  TrendingUp, 
  Calendar, 
  ShieldCheck, 
  Database,
  RefreshCw,
  SearchCode
} from 'lucide-react';
import { Student, LoginRecord } from '../types';

interface AccessLogsViewProps {
  loginLogs: LoginRecord[];
  students: Student[];
  onRecordLogin: (userType: 'Docente' | 'Aluno', identifier: string, name: string) => void;
  onClearLogs?: () => void;
}

export default function AccessLogsView({ 
  loginLogs = [], 
  students = [], 
  onRecordLogin,
  onClearLogs
}: AccessLogsViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState<'All' | 'Docente' | 'Aluno'>('All');
  const [confirmDelete, setConfirmDelete] = useState(false);
  
  // States for simulating test logins
  const [simTargetType, setSimTargetType] = useState<'Aluno' | 'Docente'>('Aluno');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [customDocenteName, setCustomDocenteName] = useState('Pb. Marcelo Reinert');
  const [customDocenteEmail, setCustomDocenteEmail] = useState('marceloreinert@gmail.com');

  // Pre-selected student ID for the simulation dropdown
  React.useEffect(() => {
    if (students.length > 0 && !selectedStudentId) {
      const activeOne = students.find(s => s.status === 'Ativo');
      if (activeOne) {
        setSelectedStudentId(activeOne.id);
      } else {
        setSelectedStudentId(students[0].id);
      }
    }
  }, [students, selectedStudentId]);

  // Handle mock simulation login trigger
  const handleSimulateLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (simTargetType === 'Aluno') {
      const stu = students.find(s => s.id === selectedStudentId);
      if (stu) {
        onRecordLogin('Aluno', stu.registrationNumber, stu.name);
      }
    } else {
      if (customDocenteEmail.trim() && customDocenteName.trim()) {
        onRecordLogin('Docente', customDocenteEmail.trim().toLowerCase(), customDocenteName.trim());
      }
    }
  };

  // Safe date difference calculations in days
  const getDiffInDays = (d1: Date, d2: Date) => {
    const timeDiff = Math.abs(d1.getTime() - d2.getTime());
    return Math.floor(timeDiff / (1000 * 60 * 60 * 24));
  };

  // Helper to format date dynamically to Brazil context (Portuguese)
  const formatDateTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return 'Data inválida';
      
      const day = String(date.getDate()).padStart(2, '0');
      const monthNames = [
        'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 
        'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
      ];
      const month = monthNames[date.getMonth()];
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      
      return `${day} ${month} ${year}, ${hours}:${minutes}:${seconds}`;
    } catch {
      return 'Data inválida';
    }
  };

  // Helper to show time elapsed since login
  const getRelativeTimeStr = (isoString: string) => {
    try {
      const past = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - past.getTime();
      const diffSecs = Math.floor(diffMs / 1000);
      const diffMins = Math.floor(diffSecs / 60);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffSecs < 10) return 'Agora mesmo';
      if (diffSecs < 60) return `há ${diffSecs} segundos`;
      if (diffMins === 1) return 'há 1 minuto';
      if (diffMins < 60) return `há ${diffMins} minutos`;
      if (diffHours === 1) return 'há 1 hora';
      if (diffHours < 24) return `há ${diffHours} horas`;
      if (diffDays === 1) return 'ontem';
      return `há ${diffDays} dias`;
    } catch {
      return '';
    }
  };

  // Compute login stats for a targeted identifier dynamically
  const getUserLoginMetrics = (identifier: string, referenceDateStr: string) => {
    const userRecords = loginLogs.filter(log => log.identifier.toLowerCase() === identifier.toLowerCase());
    
    const referenceDate = new Date(referenceDateStr);
    const refYear = referenceDate.getFullYear();
    const refMonth = referenceDate.getMonth();
    const refDay = referenceDate.getDate();

    let dailyCount = 0;
    let weeklyCount = 0;
    let monthlyCount = 0;
    let yearlyCount = 0;

    userRecords.forEach(rec => {
      const recDate = new Date(rec.timestamp);
      if (isNaN(recDate.getTime())) return;

      const recYear = recDate.getFullYear();
      const recMonth = recDate.getMonth();
      const recDay = recDate.getDate();

      // Yearly: Same Calendar Year
      if (recYear === refYear) {
        yearlyCount++;

        // Monthly: Same Calendar Month and year
        if (recMonth === refMonth) {
          monthlyCount++;

          // Daily: Same Calendar Day, month and year
          if (recDay === refDay) {
            dailyCount++;
          }
        }

        // Weekly: Within 7 days window (same calendar year)
        const diffInDays = getDiffInDays(referenceDate, recDate);
        if (diffInDays <= 7) {
          weeklyCount++;
        }
      }
    });

    return {
      daily: dailyCount,
      weekly: weeklyCount,
      monthly: monthlyCount,
      yearly: yearlyCount
    };
  };

  // Global statistics based on currently loaded login logs
  const globalMetrics = useMemo(() => {
    const now = new Date();
    const refYear = now.getFullYear();
    const refMonth = now.getMonth();
    const refDay = now.getDate();

    let todayCount = 0;
    let weekCount = 0;
    let monthCount = 0;
    let yearCount = 0;

    loginLogs.forEach(rec => {
      const recDate = new Date(rec.timestamp);
      if (isNaN(recDate.getTime())) return;

      const recYear = recDate.getFullYear();
      const recMonth = recDate.getMonth();
      const recDay = recDate.getDate();

      if (recYear === refYear) {
        yearCount++;
        if (recMonth === refMonth) {
          monthCount++;
          if (recDay === refDay) {
            todayCount++;
          }
        }
        
        const diffInDays = getDiffInDays(now, recDate);
        if (diffInDays <= 7) {
          weekCount++;
        }
      }
    });

    // Unique active users count today
    const uniqueUsersToday = new Set(
      loginLogs
        .filter(log => {
          const recDate = new Date(log.timestamp);
          return recDate.getFullYear() === refYear && recDate.getMonth() === refMonth && recDate.getDate() === refDay;
        })
        .map(log => log.identifier.toLowerCase())
    ).size;

    return {
      todayCount,
      weekCount,
      monthCount,
      yearCount,
      uniqueUsersToday,
      totalCount: loginLogs.length
    };
  }, [loginLogs]);

  // Filtered and searched logs
  const sortedAndFilteredLogs = useMemo(() => {
    let result = [...loginLogs];

    // Filter by type
    if (userTypeFilter !== 'All') {
      result = result.filter(log => log.userType === userTypeFilter);
    }

    // Search by name or email/registration number
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(log => 
        log.name.toLowerCase().includes(searchLower) ||
        log.identifier.toLowerCase().includes(searchLower)
      );
    }

    // Sort logs: newest first
    return result.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [loginLogs, searchTerm, userTypeFilter]);

  return (
    <div className="space-y-6" id="access-logs-view-root">
      
      {/* Banner Header */}
      <div className="bg-indigo-950 text-white rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-xl border border-indigo-900/50">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-950 to-indigo-900 opacity-90 z-0"></div>
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-indigo-505/10 rounded-full blur-2xl z-0"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="bg-amber-400 text-amber-950 text-[10px] uppercase font-black px-2.5 py-1 rounded-full tracking-wider shadow-sm">
                Segurança & Audit
              </span>
              <span className="bg-indigo-805 text-indigo-200 text-[10px] font-bold px-2 py-0.5 rounded-md">
                Acesso Interno
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-display font-extrabold tracking-tight">
              Monitoramento & Registro de Acessos
            </h1>
            <p className="text-xs text-indigo-200/90 leading-relaxed max-w-2xl">
              Rastreabilidade completa de autenticações. Monitore as atividades e saiba quem logou no sistema de ensino Dabar Theology, com logs de data/hora e totalizadores de recorrência diária, semanal, mensal e anual.
            </p>
          </div>

          {onClearLogs && loginLogs.length > 0 && (
            <div className="self-start md:self-center">
              {!confirmDelete ? (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="bg-rose-600/30 hover:bg-rose-600 border border-rose-500/30 text-rose-100 hover:text-white font-bold py-2.5 px-4 rounded-xl text-xs transition duration-300 active:scale-95 flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  <UserMinus className="w-4 h-4" />
                  <span>Limpar Histórico</span>
                </button>
              ) : (
                <div className="flex items-center gap-2 bg-rose-950/40 p-1.5 rounded-2xl border border-rose-500/25">
                  <span className="text-[10px] font-bold text-rose-200 px-2 whitespace-nowrap">Tem certeza?</span>
                  <button
                    onClick={() => {
                      onClearLogs();
                      setConfirmDelete(false);
                    }}
                    className="bg-rose-600 hover:bg-rose-500 text-white font-bold py-1.5 px-3 rounded-xl text-[10px] uppercase tracking-wider transition cursor-pointer"
                  >
                    Sim, Limpar
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-1.5 px-3 rounded-xl text-[10px] uppercase tracking-wider transition cursor-pointer"
                  >
                    Não
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Aggregate Metric Widgets Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Acessos Hoje</p>
            <h3 className="text-md font-extrabold text-slate-800 mt-0.5">{globalMetrics.todayCount}</h3>
            <p className="text-[10px] text-slate-500 mt-1">
              <span className="font-semibold text-indigo-600">{globalMetrics.uniqueUsersToday}</span> contas únicas
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Nesta Semana</p>
            <h3 className="text-md font-extrabold text-slate-800 mt-0.5">{globalMetrics.weekCount}</h3>
            <p className="text-[10px] text-slate-500 mt-1">Últimos 7 dias</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500 shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">No Mês Atual</p>
            <h3 className="text-md font-extrabold text-slate-800 mt-0.5">{globalMetrics.monthCount}</h3>
            <p className="text-[10px] text-slate-500 mt-1">Mês Civil Vigente</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Total Geral</p>
            <h3 className="text-md font-extrabold text-slate-800 mt-0.5">{globalMetrics.totalCount}</h3>
            <p className="text-[10px] text-slate-500 mt-1">Todos os tempos</p>
          </div>
        </div>
      </div>

      {/* Main Grid: Left is simulated controls console, Right is logs listing */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Interactive Simulation Console */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <div className="pb-3 border-b border-rose-50/10">
              <h3 className="text-xs font-black tracking-widest text-slate-400 uppercase flex items-center gap-2">
                <Zap className="w-4 h-4 text-indigo-650" />
                <span>Simulador de Autenticação</span>
              </h3>
              <p className="text-[11px] text-slate-500 leading-normal mt-1">
                Dispare eventos de login simulados para carregar a grade e testar imediatamente a detecção de frequência (diária, semanal, mensal) do usuário selecionado.
              </p>
            </div>

            <form onSubmit={handleSimulateLogin} className="space-y-4 text-xs">
              
              {/* Type Select */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-500">
                  Tipo de Usuário para Simular
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSimTargetType('Aluno')}
                    className={`p-2 rounded-xl text-center font-bold border transition ${
                      simTargetType === 'Aluno'
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700 font-extrabold ring-1 ring-indigo-500/20'
                        : 'bg-white border-slate-250 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Estudante (Aluno)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimTargetType('Docente')}
                    className={`p-2 rounded-xl text-center font-bold border transition ${
                      simTargetType === 'Docente'
                        ? 'bg-purple-50 border-purple-500 text-purple-700 font-extrabold ring-1 ring-purple-500/20'
                        : 'bg-white border-slate-250 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Docente (Inst.)
                  </button>
                </div>
              </div>

              {simTargetType === 'Aluno' ? (
                /* Student Selector selector dropdown */
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-500">
                    Selecione o Estudante
                  </label>
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer focus:bg-white focus:ring-1 focus:ring-indigo-500 font-medium"
                  >
                    {students.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.registrationNumber}) - {s.status}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                /* Docente Manual Details input forms */
                <div className="space-y-2">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-500">
                      Nome do Docente
                    </label>
                    <input
                      type="text"
                      required
                      value={customDocenteName}
                      onChange={(e) => setCustomDocenteName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                      placeholder="Nome Sobrenome"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-500">
                      E-mail do Docente
                    </label>
                    <input
                      type="email"
                      required
                      value={customDocenteEmail}
                      onChange={(e) => setCustomDocenteEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-slate-600 font-mono font-bold"
                      placeholder="e-mail@dabar.com"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-slate-850 hover:bg-slate-900 border border-slate-800 text-white font-bold py-2.5 px-4 rounded-xl transition duration-300 active:scale-95 text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <UserCheck className="w-4 h-4 text-emerald-450" />
                <span>Registrar Login de Teste</span>
              </button>
            </form>
          </div>

          {/* Quick Informational card */}
          <div className="bg-indigo-50/50 p-5 rounded-2xl border border-indigo-150 text-[11px] text-indigo-950 leading-relaxed space-y-2">
            <h4 className="font-extrabold text-indigo-900 flex items-center gap-1.5 uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>Como funciona os limites?</span>
            </h4>
            <p>
              O sistema computa a recorrência no momento de gravação de cada sessão de acesso.
            </p>
            <ul className="list-disc pl-4 space-y-1 text-slate-600">
              <li><strong>Diária</strong>: Total de logins realizados na mesma data civil de referência.</li>
              <li><strong>Semanal</strong>: Soma acumulada dos acessos nos últimos 7 dias.</li>
              <li><strong>Mensal</strong>: Total registrado dentro do respectivo mês de calendário.</li>
              <li><strong>Anual</strong>: Frequência bruta calculada dentro do ano civil em exercício (2026).</li>
            </ul>
          </div>
        </div>

        {/* Right Column: Listing Table of current Authentication Logs */}
        <div className="lg:col-span-8 bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
          
          {/* Filtering Header Controller */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between pb-3 border-b border-rose-50/10">
            <div className="space-y-1">
              <h3 className="text-xs font-black tracking-widest text-slate-400 uppercase">
                Histórico de Autenticações
              </h3>
              <p className="text-[11px] text-slate-500">
                Apresentando {sortedAndFilteredLogs.length} de {loginLogs.length} logs registrados.
              </p>
            </div>

            {/* Quick Filter buttons */}
            <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-150 self-start sm:self-auto gap-0.5">
              {(['All', 'Aluno', 'Docente'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setUserTypeFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    userTypeFilter === f
                      ? 'bg-white text-slate-800 shadow-xs ring-1 ring-slate-100 font-extrabold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {f === 'All' ? 'Todos' : f}
                </button>
              ))}
            </div>
          </div>

          {/* Search bar input widget */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Pesquisar por nome de aluno, docente ou credencial..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white placeholder-slate-400 font-medium"
            />
          </div>

          {/* Main Logs Table and List View */}
          {sortedAndFilteredLogs.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed border-slate-150 rounded-2xl space-y-3">
              <Database className="w-10 h-10 text-slate-300 mx-auto" />
              <div className="max-w-xs mx-auto space-y-0.5">
                <h4 className="text-xs font-bold text-slate-700">Nenhum log encontrado</h4>
                <p className="text-[11px] text-slate-500 leading-normal">
                  Nenhum registro de acesso corresponde aos filtros definidos. Dispare logins rápidos pelo console esquerdo para popular!
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3.5 max-h-[600px] overflow-y-auto pr-1">
              {sortedAndFilteredLogs.map((log) => {
                // Fetch user-specific metrics for this accurate timestamp
                const userMetrics = getUserLoginMetrics(log.identifier, log.timestamp);
                
                return (
                  <div 
                    key={log.id} 
                    className="p-4 bg-slate-50 hover:bg-slate-100/70 rounded-2xl border border-slate-200/50 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all"
                  >
                    
                    {/* User profile & Info */}
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl font-bold font-display text-sm flex items-center justify-center shrink-0 border uppercase ${
                        log.userType === 'Docente'
                          ? 'bg-purple-100/80 border-purple-200 text-purple-700'
                          : 'bg-indigo-100/80 border-indigo-200 text-indigo-700'
                      }`}>
                        {log.name.charAt(0)}
                      </div>
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <h4 className="text-xs font-extrabold text-slate-800">{log.name}</h4>
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded leading-none ${
                            log.userType === 'Docente'
                              ? 'bg-purple-150 text-purple-700 border border-purple-200/20'
                              : 'bg-indigo-150 text-indigo-700 border border-indigo-200/20'
                          }`}>
                            {log.userType}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-mono font-semibold">Credencial/Matrícula: {log.identifier}</p>
                        
                        {/* ISO Date and relative time */}
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 pt-0.5 font-medium">
                          <Clock className="w-3 h-3 text-emerald-555" />
                          <span>{formatDateTime(log.timestamp)}</span>
                          <span className="text-slate-350">•</span>
                          <span className="text-indigo-605 font-bold">{getRelativeTimeStr(log.timestamp)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Accurate times logged in frequency meter */}
                    <div className="flex items-center gap-1.5 whitespace-nowrap self-start md:self-center font-sans">
                      <div className="grid grid-cols-4 sm:flex gap-1">
                        
                        {/* Daily counter */}
                        <div className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-center min-w-[54px] shadow-2xs">
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Hoje</p>
                          <p className="text-xs font-black text-indigo-700 mt-1">{userMetrics.daily}</p>
                        </div>

                        {/* Weekly counter */}
                        <div className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-center min-w-[54px] shadow-2xs">
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Semana</p>
                          <p className="text-xs font-black text-teal-700 mt-1">{userMetrics.weekly}</p>
                        </div>

                        {/* Monthly counter */}
                        <div className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-center min-w-[54px] shadow-2xs">
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Mês</p>
                          <p className="text-xs font-black text-amber-605 mt-1">{userMetrics.monthly}</p>
                        </div>

                        {/* Yearly counter */}
                        <div className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-center min-w-[54px] shadow-2xs">
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Ano</p>
                          <p className="text-xs font-black text-purple-700 mt-1">{userMetrics.yearly}</p>
                        </div>

                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>
      </div>

    </div>
  );
}
