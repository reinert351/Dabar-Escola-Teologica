import React, { useMemo } from 'react';
import { Users, BookOpen, DollarSign, AlertCircle, TrendingUp, Calendar, Cake, Clock, AlertTriangle, CreditCard, Award, FileText, Check } from 'lucide-react';
import { Student, Subject, PaymentRecord, GradeRecord, LessonPlanRecord, ClassGroup } from '../types';

interface DashboardViewProps {
  students: Student[];
  subjects: Subject[];
  classes?: ClassGroup[];
  payments: PaymentRecord[];
  grades: GradeRecord[];
  lessonPlans: LessonPlanRecord[];
  onNavigate: (tab: string) => void;
}

export default function DashboardView({ students, subjects, classes = [], payments, grades, lessonPlans, onNavigate }: DashboardViewProps) {
  // Compute real statistics
  const activeStudents = useMemo(() => students.filter(s => s.status === 'Ativo'), [students]);
  const totalStudents = students.length;
  
  const paymentStats = useMemo(() => {
    let rawTotal = 0;
    let pendingCount = 0;
    payments.forEach(p => {
      if (p.status === 'Pago') {
        rawTotal += p.value;
      } else if (p.status === 'Pendente' || p.status === 'Atrasado') {
        pendingCount++;
      }
    });
    return { received: rawTotal, pending: pendingCount };
  }, [payments]);

  // Compute gender distribution for chart
  const genderStats = useMemo(() => {
    let mCount = 0;
    let fCount = 0;
    activeStudents.forEach(s => {
      if (s.gender === 'M') mCount++;
      else fCount++;
    });
    return { Male: mCount, Female: fCount, total: activeStudents.length || 1 };
  }, [activeStudents]);

  // Compute monthly payment revenue
  const monthlyRevenue = useMemo(() => {
    const months = ['Maio 2026', 'Junho 2026'];
    const revenueByMonth = months.map(m => {
      const sum = payments
        .filter(p => p.month === m && p.status === 'Pago')
        .reduce((acc, curr) => acc + curr.value, 0);
      return { month: m, value: sum };
    });
    return revenueByMonth;
  }, [payments]);

  // Calculate upcoming birthdays for the next 3 days on the Dashboard as well
  const upcomingBirthdays = useMemo(() => {
    const list: { student: Student; daysRemaining: number; formattedDate: string }[] = [];
    const today = new Date();
    const todayNormalized = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    students.forEach(student => {
      if (!student.birthDate || student.status !== 'Ativo') return;
      try {
        const [, bm, bd] = student.birthDate.split('-').map(Number);
        if (!bm || !bd) return;

        let bdayTemp = new Date(today.getFullYear(), bm - 1, bd);
        let diffTime = bdayTemp.getTime() - todayNormalized.getTime();
        let diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
          bdayTemp = new Date(today.getFullYear() + 1, bm - 1, bd);
          diffTime = bdayTemp.getTime() - todayNormalized.getTime();
          diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
        }

        if (diffDays >= 0 && diffDays <= 3) {
          const formattedBday = `${String(bd).padStart(2, '0')}/${String(bm).padStart(2, '0')}`;
          list.push({
            student,
            daysRemaining: diffDays,
            formattedDate: formattedBday
          });
        }
      } catch (e) {
        // ignore
      }
    });

    return list.sort((a, b) => a.daysRemaining - b.daysRemaining);
  }, [students]);

  // Calculate pending payments due in the next 7 days
  const upcomingPaymentsAlerts = useMemo(() => {
    const list: { payment: PaymentRecord; studentName: string; daysRemaining: number; formattedDueDate: string }[] = [];
    const today = new Date();
    const todayNormalized = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    payments.forEach(p => {
      if (p.status !== 'Pendente') return; // Must be Pending, because 'Atrasado' is already overdue
      try {
        const [py, pm, pd] = p.dueDate.split('-').map(Number);
        if (!py || !pm || !pd) return;

        const dueTemp = new Date(py, pm - 1, pd);
        const diffTime = dueTemp.getTime() - todayNormalized.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

        // due in the next 7 days (0 to 7)
        if (diffDays >= 0 && diffDays <= 7) {
          const student = students.find(s => s.id === p.studentId);
          list.push({
            payment: p,
            studentName: student ? student.name : 'Aluno Cadastrado',
            daysRemaining: diffDays,
            formattedDueDate: `${String(pd).padStart(2, '0')}/${String(pm).padStart(2, '0')}/${py}`
          });
        }
      } catch (e) {
        // ignore date parse errors
      }
    });

    return list.sort((a, b) => a.daysRemaining - b.daysRemaining);
  }, [payments, students]);

  // Compute missing lesson plans
  const missingPlansAlerts = useMemo(() => {
    const alerts: { subjectId: string; subjectName: string; missingClasses: number[] }[] = [];
    subjects.forEach(sub => {
      const plansForSub = lessonPlans.filter(p => p.subjectId === sub.id && p.content.trim().length > 10);
      const missing = [];
      for(let i = 1; i <= 4; i++) {
        if(!plansForSub.some(p => p.classNumber === i)) {
          missing.push(i);
        }
      }
      // If none are present, let's just say "all" or keep it brief
      if(missing.length > 0) {
        alerts.push({ subjectId: sub.id, subjectName: sub.name, missingClasses: missing });
      }
    });
    return alerts;
  }, [subjects, lessonPlans]);

  // Compute ready for certificate
  const graduatesAlerts = useMemo(() => {
    return activeStudents.filter(student => {
      const studentGrades = grades.filter(g => g.studentId === student.id);
      if(studentGrades.length === 0) return false;
      const approvedCount = studentGrades.filter(g => g.status === 'Aprovado').length;
      return approvedCount >= 5; // Suppose 5 is the graduation threshold for this alert
    });
  }, [activeStudents, grades]);

  // Compute detailed list of overdue payments (status 'Atrasado' or 'Pendente' but past due date)
  const overduePaymentsDetailed = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return payments
      .filter(p => p.status === 'Atrasado' || (p.status === 'Pendente' && p.dueDate < todayStr))
      .map(p => {
        const student = students.find(s => s.id === p.studentId);
        return {
          id: p.id,
          studentName: student ? student.name : 'Aluno Cadastrado',
          studentEmail: student ? student.email : 'Sem e-mail',
          month: p.month,
          value: p.value,
          dueDate: p.dueDate ? p.dueDate.split('-').reverse().join('/') : 'Sem data'
        };
      })
      .sort((a, b) => (a.studentName.localeCompare(b.studentName)));
  }, [payments, students]);

  // Compute active students with missing or incomplete subject grades
  const studentsMissingGrades = useMemo(() => {
    const list: { studentId: string; studentName: string; className: string; subjectName: string; missingTerms: string[] }[] = [];
    const activeStds = students.filter(s => s.status === 'Ativo');

    activeStds.forEach(student => {
      const cls = classes.find(c => c.name === student.className);
      if (!cls) return;

      cls.subjectIds.forEach(subId => {
        const sub = subjects.find(s => s.id === subId);
        if (!sub) return;

        const gradeRec = grades.find(g => g.studentId === student.id && g.subjectId === subId);
        const missing: string[] = [];
        
        if (!gradeRec) {
          missing.push('1º Bim', '2º Bim', '3º Bim', '4º Bim');
        } else {
          if (gradeRec.term1Grade === null) missing.push('1º Bim');
          if (gradeRec.term2Grade === null) missing.push('2º Bim');
          if (gradeRec.term3Grade === null) missing.push('3º Bim');
          if (gradeRec.term4Grade === null) missing.push('4º Bim');
        }

        if (missing.length > 0) {
          list.push({
            studentId: student.id,
            studentName: student.name,
            className: student.className,
            subjectName: sub.name,
            missingTerms: missing
          });
        }
      });
    });

    return list.sort((a, b) => a.studentName.localeCompare(b.studentName));
  }, [students, classes, subjects, grades]);

  // SVG Chart Dimensions
  const barChartWidth = 360;
  const barChartHeight = 160;

  return (
    <div className="space-y-8 animate-fade-in" id="dashboard-container">
      {/* Page Title & Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-indigo-950 p-8 sm:p-10 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 border border-indigo-900 z-0">
        {/* Abstract background blobs for hero */}
        <div className="absolute top-0 right-0 -m-20 w-72 h-72 bg-gradient-to-br from-indigo-600/30 to-purple-600/30 rounded-full blur-3xl -z-10 mix-blend-screen"></div>
        <div className="absolute bottom-0 left-20 -mb-20 w-64 h-64 bg-gradient-to-tr from-amber-500/20 to-orange-500/20 rounded-full blur-3xl -z-10 mix-blend-screen"></div>

        <div className="z-10 text-center md:text-left">
          <h1 className="text-3xl font-display font-bold tracking-tight text-white/95 drop-shadow-sm">Painel de Controle</h1>
          <p className="text-sm font-medium text-indigo-200 mt-2 max-w-lg leading-relaxed">Painel gerencial central. Visão consolidada do desempenho acadêmico, financeiro e cadastral institucional.</p>
        </div>
        <div className="z-10 shrink-0">
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/10 px-5 py-3 rounded-2xl shadow-xl text-xs font-mono text-indigo-50">
            <Calendar className="w-4 h-4 text-amber-300" />
            <span className="font-bold tracking-wide">07 JUNHO 2026 (UTC)</span>
          </div>
        </div>
      </div>

      {/* Grid of indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Active Students */}
        <div 
          onClick={() => onNavigate('alunos')}
          className="bg-white p-6 rounded-2xl border border-slate-150 shadow-xs cursor-pointer hover:border-indigo-400 hover:shadow-md transition-all duration-200 group"
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Alunos Ativos</span>
              <h3 className="text-2xl font-bold font-sans text-slate-800 mt-1">{activeStudents.length}</h3>
              <span className="text-xs text-slate-400 mt-0.5 block">{totalStudents} no total</span>
            </div>
            <div className="p-3 bg-indigo-50 rounded-xl group-hover:bg-indigo-100 transition-colors">
              <Users className="w-5 h-5 text-indigo-600" />
            </div>
          </div>
        </div>

        {/* Subjects */}
        <div 
          onClick={() => onNavigate('disciplinas')}
          className="bg-white p-6 rounded-2xl border border-slate-150 shadow-xs cursor-pointer hover:border-indigo-400 hover:shadow-md transition-all duration-200 group"
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Disciplinas</span>
              <h3 className="text-2xl font-bold font-sans text-slate-800 mt-1">{subjects.length}</h3>
              <span className="text-xs text-slate-400 mt-0.5 block">Ativas este semestre</span>
            </div>
            <div className="p-3 bg-indigo-50 rounded-xl group-hover:bg-indigo-100 transition-colors">
              <BookOpen className="w-5 h-5 text-indigo-600" />
            </div>
          </div>
        </div>

        {/* Total Revenue */}
        <div 
          onClick={() => onNavigate('financeiro')}
          className="bg-white p-6 rounded-2xl border border-slate-150 shadow-xs cursor-pointer hover:border-indigo-400 hover:shadow-md transition-all duration-200 group"
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Receita Total</span>
              <h3 className="text-2xl font-bold font-sans text-slate-800 mt-1">R$ {paymentStats.received.toFixed(2)}</h3>
              <span className="text-xs text-emerald-500 font-semibold mt-0.5 block flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3" /> Recebido pago
              </span>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl group-hover:bg-emerald-100 transition-colors">
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
        </div>

        {/* Pending Payments */}
        <div 
          onClick={() => onNavigate('financeiro')}
          className={`bg-white p-6 rounded-2xl border shadow-xs cursor-pointer hover:shadow-md transition-all duration-200 group ${upcomingPaymentsAlerts.length > 0 ? "border-amber-300 bg-amber-50/10" : "border-slate-150"}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pgtos Pendentes</span>
              <div className="flex items-baseline gap-2">
                <h3 className="text-2xl font-bold font-sans text-indigo-600 mt-1">{paymentStats.pending}</h3>
                {upcomingPaymentsAlerts.length > 0 && (
                  <span className="text-[10px] font-extrabold px-1.5 py-0.5 bg-amber-500 text-white rounded-md animate-pulse">
                    {upcomingPaymentsAlerts.length} URGENTE
                  </span>
                )}
              </div>
              <span className="text-xs text-slate-400 mt-0.5 block">
                {upcomingPaymentsAlerts.length > 0 
                  ? `${upcomingPaymentsAlerts.length} vencendo nos próx. 7 dias`
                  : 'A receber ou em atraso'
                }
              </span>
            </div>
            <div className={`p-3 rounded-xl transition-colors ${upcomingPaymentsAlerts.length > 0 ? "bg-amber-100 group-hover:bg-amber-200 text-amber-600" : "bg-rose-50 group-hover:bg-rose-100 text-rose-500"}`}>
              {upcomingPaymentsAlerts.length > 0 ? (
                <AlertTriangle className="w-5 h-5 animate-pulse" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* PAINEL DE AVISOS E PENDÊNCIAS CRÍTICAS */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/40 space-y-6 animate-fade-in" id="critical-warnings-board">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h4 className="text-lg font-display font-bold text-slate-800 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 animate-pulse" />
              Painel de Avisos & Pendências de Alunos
            </h4>
            <p className="text-xs text-slate-500 mt-1">Acompanhe e regularize as mensalidades em atraso e pendências de lançamentos de notas acadêmicas da instituição.</p>
          </div>
          <div className="flex gap-2">
            {overduePaymentsDetailed.length > 0 && (
              <span className="text-[10px] sm:text-xs font-bold px-2.5 py-1 bg-red-50 text-red-600 rounded-full border border-red-100">
                {overduePaymentsDetailed.length} {overduePaymentsDetailed.length === 1 ? 'Financeiro Pendente' : 'Financeiros Pendentes'}
              </span>
            )}
            {studentsMissingGrades.length > 0 && (
              <span className="text-[10px] sm:text-xs font-bold px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-full border border-indigo-100">
                {studentsMissingGrades.length} {studentsMissingGrades.length === 1 ? 'Nota Pendente' : 'Notas Pendentes'}
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* COLUNA ESQUERDA: Mensalidades em Atraso */}
          <div className="space-y-4">
            <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-500 font-bold" />
              Mensalidades em Atraso ({overduePaymentsDetailed.length})
            </h5>
            
            {overduePaymentsDetailed.length === 0 ? (
              <div className="border border-emerald-100 bg-emerald-50/20 rounded-2xl p-6 text-center text-emerald-600 font-medium text-sm flex flex-col items-center gap-2">
                <Check className="w-5 h-5 text-emerald-500" />
                Nenhuma mensalidade em atraso no momento!
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {overduePaymentsDetailed.slice(0, 5).map((item) => (
                  <div key={item.id} className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-red-200 transition-colors">
                    <div className="space-y-1">
                      <div className="text-xs font-bold text-slate-700">{item.studentName}</div>
                      <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span>Ref: <strong className="text-slate-600 font-medium">{item.month}</strong></span>
                        <span className="text-slate-300">|</span>
                        <span>Venceu em: <strong className="text-slate-600 font-medium">{item.dueDate}</strong></span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">{item.studentEmail}</div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                      <div className="text-right">
                        <div className="text-xs font-extrabold text-red-600">R$ {item.value.toFixed(2)}</div>
                        <span className="inline-block text-[9px] font-bold px-1.5 py-0.5 bg-red-100 text-red-700 rounded-md mt-0.5">Vencido</span>
                      </div>
                      <button 
                        onClick={() => onNavigate('financeiro')}
                        className="px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-800 text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                      >
                        Verificar
                      </button>
                    </div>
                  </div>
                ))}
                {overduePaymentsDetailed.length > 5 && (
                  <div className="text-center text-[11px] font-semibold text-slate-400 py-1">
                    + {overduePaymentsDetailed.length - 5} outras pendências financeiras registradas
                  </div>
                )}
              </div>
            )}
          </div>

          {/* COLUNA DIREITA: Lançamento de Notas Pendentes */}
          <div className="space-y-4">
            <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-500" />
              Notas Pendentes para Lançamento ({studentsMissingGrades.length})
            </h5>
            
            {studentsMissingGrades.length === 0 ? (
              <div className="border border-indigo-150 bg-indigo-50/5 rounded-2xl p-6 text-center text-indigo-600 font-medium text-sm flex flex-col items-center gap-2">
                <Check className="w-5 h-5 text-indigo-500" />
                Todos os lançamentos de notas em dia!
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {studentsMissingGrades.slice(0, 5).map((item, idx) => (
                  <div key={idx} className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-indigo-200 transition-colors">
                    <div className="space-y-1">
                      <div className="text-xs font-bold text-slate-700">{item.studentName}</div>
                      <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span>Turma: <strong className="text-slate-600 font-medium">{item.className}</strong></span>
                        <span className="text-slate-300">|</span>
                        <span>Matéria: <strong className="text-indigo-600 font-medium">{item.subjectName}</strong></span>
                      </div>
                      <div className="text-[10px] text-purple-600 font-medium mt-1">
                        Pendente: {item.missingTerms.join(', ')}
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                      <span className="text-[10px] font-bold text-amber-600 px-2 py-0.5 bg-amber-50 rounded-md border border-amber-100">Aguardando Nota</span>
                      <button 
                        onClick={() => onNavigate('notas')}
                        className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold rounded-lg transition-colors cursor-pointer shadow-xs"
                      >
                        Lançar
                      </button>
                    </div>
                  </div>
                ))}
                {studentsMissingGrades.length > 5 && (
                  <div className="text-center text-[11px] font-semibold text-slate-400 py-1">
                    + {studentsMissingGrades.length - 5} outras pendências acadêmicas registradas
                  </div>
                )}
              </div>
            )}
          </div>

        </div>

        {/* OUTROS ALERTAS (Aniversariantes e Planos de Aula) */}
        {(missingPlansAlerts.length > 0 || upcomingBirthdays.length > 0 || graduatesAlerts.length > 0) && (
          <div className="border-t border-slate-100 pt-5 mt-4">
            <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Lembretes e Avisos Adicionais</h5>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Planos de Aula */}
              {missingPlansAlerts.length > 0 && (
                <div className="bg-rose-50/50 border border-rose-100 rounded-xl p-3 flex flex-col gap-1.5 hover:border-rose-200 transition-colors">
                  <div className="flex items-center gap-1.5 text-rose-700 font-bold text-xs">
                    <FileText className="w-3.5 h-3.5" />
                    <span>Planos de Aula Pendentes</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-normal line-clamp-2">
                    Incompleto em: {missingPlansAlerts.map(m => `"${m.subjectName}"`).join(', ')}.
                  </p>
                  <button 
                    onClick={() => onNavigate('disciplinas')}
                    className="self-start text-[9px] font-extrabold uppercase tracking-wide text-rose-600 hover:text-rose-700 mt-1 cursor-pointer"
                  >
                    Preencher Planos
                  </button>
                </div>
              )}

              {/* Aniversariantes */}
              {upcomingBirthdays.length > 0 && (
                <div className="bg-pink-50/50 border border-pink-100 rounded-xl p-3 flex flex-col gap-1.5 hover:border-pink-200 transition-colors">
                  <div className="flex items-center gap-1.5 text-pink-700 font-bold text-xs">
                    <Cake className="w-3.5 h-3.5" />
                    <span>Aniversários do Período</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-normal line-clamp-2">
                    {upcomingBirthdays.map(b => `${b.student.name.split(' ')[0]} (${b.formattedDate})`).join(', ')}.
                  </p>
                  <button 
                    onClick={() => onNavigate('alunos')}
                    className="self-start text-[9px] font-extrabold uppercase tracking-wide text-pink-600 hover:text-pink-700 mt-1 cursor-pointer"
                  >
                    Ver Lista de Alunos
                  </button>
                </div>
              )}

              {/* Certificados prontos */}
              {graduatesAlerts.length > 0 && (
                <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3 flex flex-col gap-1.5 hover:border-emerald-200 transition-colors">
                  <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-xs">
                    <Award className="w-3.5 h-3.5" />
                    <span>Certificados Liberados</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    {graduatesAlerts.length} alunos completaram disciplinas suficientes para certificação.
                  </p>
                  <button 
                    onClick={() => onNavigate('alunos')}
                    className="self-start text-[9px] font-extrabold uppercase tracking-wide text-emerald-600 hover:text-emerald-700 mt-1 cursor-pointer"
                  >
                    Emitir Certificado
                  </button>
                </div>
              )}

            </div>
          </div>
        )}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Monthly Revenue Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm" id="chart-receita">
          <h4 className="text-sm font-semibold text-slate-700 mb-4 uppercase tracking-wider">Faturamento Mensal</h4>
          <div className="flex justify-center items-end h-52 py-2">
            {monthlyRevenue.map((item, idx) => {
              const maxVal = Math.max(...monthlyRevenue.map(m => m.value), 400);
              const heightPct = Math.max(15, (item.value / maxVal) * 100);
              return (
                <div key={idx} className="flex flex-col items-center justify-end h-full px-6 w-1/3">
                  <div className="text-xs font-semibold text-slate-700 mb-1">
                    R$ {item.value.toFixed(0)}
                  </div>
                  <div 
                    style={{ height: `${heightPct}%` }}
                    className="w-full bg-indigo-600 rounded-t-xl shadow-sm hover:bg-indigo-700 transition-colors cursor-pointer"
                  />
                  <div className="text-xs font-medium text-slate-500 mt-2 text-center whitespace-nowrap">
                    {item.month}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="border-t border-slate-100 mt-4 pt-3 flex justify-between text-xs text-slate-400 font-mono">
            <span>Período: Acadêmico 2026/1</span>
            <span>Atualizado em tempo real</span>
          </div>
        </div>

        {/* Student Demographics and Status Donut */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm" id="chart-demografia">
          <h4 className="text-sm font-semibold text-slate-700 mb-4 uppercase tracking-wider">Perfil Demográfico (Gênero)</h4>
          <div className="flex flex-col sm:flex-row items-center justify-around h-52 gap-4">
            
            {/* Donut Chart SVG */}
            <div className="relative w-36 h-36">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                {/* Background circle */}
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f1f5f9" strokeWidth="4" />
                {/* Male slice */}
                <circle 
                  cx="18" cy="18" r="15.915" 
                  fill="none" 
                  stroke="#4f46e5" 
                  strokeWidth="4" 
                  strokeDasharray={`${(genderStats.Male / genderStats.total) * 100} ${100 - (genderStats.Male / genderStats.total) * 100}`}
                  strokeDashoffset="0"
                />
                {/* Female slice */}
                <circle 
                  cx="18" cy="18" r="15.915" 
                  fill="none" 
                  stroke="#a5b4fc" 
                  strokeWidth="4" 
                  strokeDasharray={`${(genderStats.Female / genderStats.total) * 100} ${100 - (genderStats.Female / genderStats.total) * 100}`}
                  strokeDashoffset={`${100 - (genderStats.Male / genderStats.total) * 100}`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-bold text-slate-700">{activeStudents.length}</span>
                <span className="text-[10px] text-indigo-500 uppercase tracking-widest font-bold">Ativos</span>
              </div>
            </div>

            {/* Legend */}
            <div className="space-y-3 w-full sm:w-auto">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-indigo-600 rounded-full" />
                <div>
                  <div className="text-xs font-semibold text-slate-600">Masculino</div>
                  <div className="text-xs text-slate-400 font-mono">
                    {genderStats.Male} alunos ({(genderStats.Male / genderStats.total * 100).toFixed(0)}%)
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-indigo-350 rounded-full" />
                <div>
                  <div className="text-xs font-semibold text-slate-600">Feminino</div>
                  <div className="text-xs text-slate-400 font-mono">
                    {genderStats.Female} alunas ({(genderStats.Female / genderStats.total * 100).toFixed(0)}%)
                  </div>
                </div>
              </div>
            </div>
            
          </div>
          <div className="border-t border-slate-100 mt-4 pt-3 text-xs text-slate-400 flex justify-between">
            <span>Matrículas Ativas: {activeStudents.length}</span>
            <span>Matrículas Trancadas/Inativas: {students.length - activeStudents.length}</span>
          </div>
        </div>

      </div>

      {/* Upcoming Activities or Academic schedule quick info */}
      <div className="bg-indigo-600 p-6 rounded-3xl text-white shadow-xl shadow-indigo-150" id="recado-sistema">
        <h5 className="text-md font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
          🔔 Aviso do Sistema Acadêmico
        </h5>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-2">
          <p className="text-sm text-indigo-100 leading-relaxed max-w-3xl">
            As avaliações do 3º Bimestre devem ser encerradas e lançadas até o dia 
            <strong className="text-white"> 15/06/2026</strong>. 
            O controle de frequência dos alunos do portal de teologia agora monitora 
            justificativas de faltas automaticamente por meio do envio de atestados no Portal do Aluno.
          </p>
          <button 
            type="button" 
            onClick={() => onNavigate('notas')}
            className="px-4 py-2 bg-white text-indigo-600 hover:bg-indigo-50 font-bold rounded-xl text-xs whitespace-nowrap self-start md:self-auto shadow-sm"
          >
            Lançar Notas
          </button>
        </div>
      </div>
    </div>
  );
}
