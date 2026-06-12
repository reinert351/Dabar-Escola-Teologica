import React, { useState, useMemo } from 'react';
import { User, Calendar, BookOpen, AlertCircle, CheckCircle, FileText, Smartphone, DollarSign, Search, Sparkles, Check, ArrowRight, Clock, Edit, Bell, ChevronDown, ChevronUp } from 'lucide-react';
import { Student, Subject, GradeRecord, AttendanceRecord, PaymentRecord, AttendanceStatus, AcademicActivity, LessonPlanRecord } from '../types';
import AcademicCalendarView from './AcademicCalendarView';
import CertificatePreviewModal from './CertificatePreviewModal';
import logoImage from '../assets/images/dabar_theology_logo_1781277925734.jpg';

interface StudentPortalViewProps {
  students: Student[];
  subjects: Subject[];
  lessonPlans: LessonPlanRecord[];
  grades: GradeRecord[];
  attendance: AttendanceRecord[];
  payments: PaymentRecord[];
  activities: AcademicActivity[];
  onAddOrUpdateAttendance: (record: AttendanceRecord) => void;
  onEditStudent?: (student: Student) => void;
  onRecordLogin?: (userType: 'Docente' | 'Aluno', identifier: string, name: string) => void;
}

// Static list of theoretical class days of June 2026
const juneClassDays = [
  { date: '2026-06-01', dayOfWeek: 'Segunda-feira', label: 'Aula 05: Apologética Clássica' },
  { date: '2026-06-03', dayOfWeek: 'Quarta-feira', label: 'Aula 06: Hermenêutica de Textos Difíceis' },
  { date: '2026-06-08', dayOfWeek: 'Segunda-feira', label: 'Aula 07: Exegese do Texto Grego' },
  { date: '2026-06-10', dayOfWeek: 'Quarta-feira', label: 'Aula 08: Teologia Sistemática e Cultura' },
  { date: '2026-06-15', dayOfWeek: 'Segunda-feira', label: 'Aula 09: História da Igreja Primitiva' },
  { date: '2026-06-17', dayOfWeek: 'Quarta-feira', label: 'Aula 10: Hermenêutica de Textos Difíceis (Final)' }
];

export default function StudentPortalView({
  students,
  subjects,
  lessonPlans = [],
  grades,
  attendance,
  payments,
  activities,
  onAddOrUpdateAttendance,
  onEditStudent,
  onRecordLogin
}: StudentPortalViewProps) {
  // Portal active student selector state
  const activeStudents = useMemo(() => students.filter(s => s.status === 'Ativo'), [students]);
  const [loggedInStudentId, setLoggedInStudentId] = useState<string | null>(null);
  const [loginRegNumber, setLoginRegNumber] = useState('');
  const [loginError, setLoginError] = useState('');
  
  // Set default student view context
  const currentStudent = useMemo(() => {
    return students.find(s => s.id === loggedInStudentId) || null;
  }, [students, loggedInStudentId]);

  // Tab state within the student portal
  const [activePortalTab, setActivePortalTab] = useState<'painel' | 'boletim' | 'calendario' | 'financeiro' | 'perfil' | 'agenda' | 'conteudos' | 'push'>('painel');
  const [selectedStudentSubjectId, setSelectedStudentSubjectId] = useState<string | null>(null);
  const [selectedStudySection, setSelectedStudySection] = useState<'ementa' | 1 | 2 | 3 | 4>('ementa');

  React.useEffect(() => {
    setSelectedStudySection('ementa');
  }, [selectedStudentSubjectId]);

  // Push notification states
  const [pushEnabled, setPushEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('LOGOS_PUSH_ENABLED');
    return saved !== null ? saved === 'true' : true;
  });
  const [pushTopics, setPushTopics] = useState({
    classes: true,
    finance: true,
    activities: true,
    birthdays: true
  });
  const [realPushGranted, setRealPushGranted] = useState<boolean>(false);

  React.useEffect(() => {
    localStorage.setItem('LOGOS_PUSH_ENABLED', String(pushEnabled));
  }, [pushEnabled]);

  React.useEffect(() => {
    if ('Notification' in window) {
      setRealPushGranted(Notification.permission === 'granted');
    }
  }, []);

  // Certificate Modal State
  const [certificateModal, setCertificateModal] = useState<{ isOpen: boolean; type: 'Básico' | 'Médio'; isExample?: boolean } | null>(null);

  // Profile edit states
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profileGender, setProfileGender] = useState<'M' | 'F'>('M');
  const [profileBirthDate, setProfileBirthDate] = useState('');
  const [profilePhotoUrl, setProfilePhotoUrl] = useState('');
  const [successNotification, setSuccessNotification] = useState<string | null>(null);

  // Synchronize profile fields with current selected student
  React.useEffect(() => {
    if (currentStudent) {
      setProfileName(currentStudent.name || '');
      setProfileEmail(currentStudent.email || '');
      setProfileGender(currentStudent.gender || 'M');
      setProfileBirthDate(currentStudent.birthDate || '');
      setProfilePhotoUrl(currentStudent.photoUrl || '');
    }
  }, [currentStudent]);

  const showToast = (msg: string) => {
    setSuccessNotification(msg);
    setTimeout(() => {
      setSuccessNotification(null);
    }, 4500);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStudent) return;
    if (!profileName.trim()) {
      showToast('Por favor, insira o seu nome.');
      return;
    }
    if (!profileEmail.trim()) {
      showToast('Por favor, insira o seu e-mail.');
      return;
    }

    if (onEditStudent) {
      onEditStudent({
        ...currentStudent,
        name: profileName.trim(),
        email: profileEmail.trim(),
        gender: profileGender,
        birthDate: profileBirthDate,
        photoUrl: profilePhotoUrl.trim() || undefined
      });
      showToast('Cadastro atualizado com sucesso!');
    }
  };

  // Attendance stats for selected student
  const studentStats = useMemo(() => {
    if (!currentStudent) return { total: 0, present: 0, absent: 0, excused: 0, rate: 0 };
    
    const records = attendance.filter(r => r.studentId === currentStudent.id);
    const total = records.length;
    let present = 0;
    let absent = 0;
    let excused = 0;

    records.forEach(r => {
      if (r.status === 'Presença') present++;
      else if (r.status === 'Falta') absent++;
      else if (r.status === 'Falta Justificada') excused++;
    });

    // Rate is percentage of presence over active classes (which are present + absent)
    const activeClasses = present + absent;
    const rate = activeClasses > 0 ? Math.round((present / activeClasses) * 100) : 100;

    return { total, present, absent, excused, rate };
  }, [attendance, currentStudent]);

  // Grades for current student
  const studentGrades = useMemo(() => {
    if (!currentStudent) return [];
    return grades.filter(g => g.studentId === currentStudent.id).map(g => {
      const subject = subjects.find(s => s.id === g.subjectId);
      
      const mainGrade = g.term1Grade;
      let calculatedAvg = mainGrade;
      let calculatedStatus = g.status;
      
      if (mainGrade !== null) {
        if (mainGrade >= 6.0) {
          calculatedStatus = 'Aprovado';
          calculatedAvg = mainGrade;
        } else if (mainGrade >= 4.0) {
          if (g.examGrade !== null) {
            calculatedAvg = parseFloat(((mainGrade + g.examGrade) / 2).toFixed(1));
            calculatedStatus = calculatedAvg >= 5.0 ? 'Aprovado' : 'Reprovado';
          } else {
            calculatedStatus = 'Recuperação';
            calculatedAvg = mainGrade;
          }
        } else {
          calculatedStatus = 'Reprovado';
          calculatedAvg = mainGrade;
        }
      }

      return {
        ...g,
        term1Grade: mainGrade,
        averageGrade: calculatedAvg,
        status: calculatedStatus,
        subjectName: subject?.name || 'Disciplina Desconhecida',
        teacherName: subject?.teacherName || 'Prof. Substituto'
      };
    });
  }, [grades, currentStudent, subjects]);

  const passedSubjectsCount = useMemo(() => {
    // Unique subjects passed (average >= 7.0 for simulation)
    const passed = studentGrades.filter(g => g.averageGrade !== null && g.averageGrade >= 7.0);
    const uniqueSubjectIds = new Set(passed.map(g => g.subjectId));
    // Fallback logic for demo purposes: consider passed all subjects user has completed
    // but in a real app, ensure >= 24 logic works
    return uniqueSubjectIds.size;
  }, [studentGrades]);

  const basicCourseProgress = Math.min((passedSubjectsCount / 24) * 100, 100);
  const mediumCourseProgress = Math.min((passedSubjectsCount / 40) * 100, 100);


  // Payments for current student
  const studentPayments = useMemo(() => {
    if (!currentStudent) return [];
    return payments.filter(p => p.studentId === currentStudent.id);
  }, [payments, currentStudent]);

  interface PortalNotification {
    id: string;
    type: 'danger' | 'warning' | 'info' | 'success';
    title: string;
    description: string;
    date: string;
    actionLabel?: string;
    onAction?: () => void;
  }

  // Calculate student notifications/alerts dynamically
  const portalNotifications = useMemo<PortalNotification[]>(() => {
    if (!currentStudent) return [];
    const list: PortalNotification[] = [];

    // 1. Payment Overdue (Atraso de pagamento de livros)
    const overduePayments = studentPayments.filter(p => p.status === 'Atrasado' || (p.status === 'Pendente' && new Date(p.dueDate + 'T00:00:00') < new Date('2026-06-10')));
    overduePayments.forEach(p => {
      list.push({
        id: `notify-overdue-${p.id}`,
        type: 'danger',
        title: 'Pagamento de Livro em Atraso ⚠️',
        description: `O pagamento do livro de ${p.month} no valor de R$ ${p.value.toFixed(2)} está atrasado. O vencimento foi em ${new Date(p.dueDate + 'T00:00:00').toLocaleDateString('pt-BR')}.`,
        date: p.dueDate,
        actionLabel: 'Pagar via PIX',
        onAction: () => {
          setActivePortalTab('financeiro');
          setShowPixCode('true');
        }
      });
    });

    // 2. Upcoming Payment Vencimento (Vencimento de pagamento de livros)
    const today = new Date('2026-06-10T00:00:00');
    const upcomingPayments = studentPayments.filter(p => p.status === 'Pendente' && new Date(p.dueDate + 'T00:00:00') >= today);
    upcomingPayments.forEach(p => {
      const pDate = new Date(p.dueDate + 'T00:00:00');
      const timeDiff = pDate.getTime() - today.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
      
      let titleStr = 'Vencimento de Livro Próximo';
      let descStr = `O livro de ${p.month} no valor de R$ ${p.value.toFixed(2)} vence em ${pDate.toLocaleDateString('pt-BR')}.`;
      
      if (daysDiff === 0) {
        titleStr = 'Pagamento de Livro Vence HOJE! ⏳';
        descStr = `Hoje é o dia de vencimento do livro de ${p.month} (R$ ${p.value.toFixed(2)}).`;
      } else if (daysDiff === 1) {
        titleStr = 'Pagamento de Livro Vence Amanhã';
        descStr = `Amanhã vence o pagamento do livro de ${p.month} no valor de R$ ${p.value.toFixed(2)}.`;
      }

      list.push({
        id: `notify-due-${p.id}`,
        type: daysDiff === 0 ? 'warning' : 'info',
        title: titleStr,
        description: descStr,
        date: p.dueDate,
        actionLabel: 'Pagar via PIX',
        onAction: () => {
          setActivePortalTab('financeiro');
          setShowPixCode('true');
        }
      });
    });

    // 3. Low Attendance (Índice de Presença baixo)
    if (studentStats.rate < 75) {
      list.push({
        id: 'notify-low-attendance',
        type: 'warning',
        title: 'Alerta de Baixa Frequência 📉',
        description: `Seu índice de presença está em ${studentStats.rate}%. Lembre-se que o mínimo exigido é 75% para aprovação. Justifique suas faltas caso necessário.`,
        date: '2026-06-10',
        actionLabel: 'Justificar Faltas',
        onAction: () => {
          setActivePortalTab('calendario');
        }
      });
    }

    // 4. Recovery exam needed (Recuperação Acadêmica)
    const inRecoveryGrades = studentGrades.filter(g => g.status === 'Recuperação');
    inRecoveryGrades.forEach(g => {
      list.push({
        id: `notify-recovery-${g.id}`,
        type: 'warning',
        title: 'Recuperação Acadêmica Pendente 📚',
        description: `Você está de recuperação na disciplina "${g.subjectName}". Realize a prova complementar para restabelecer a média mínima de aprovação (6.0).`,
        date: '2026-06-10',
        actionLabel: 'Ver Notas',
        onAction: () => {
          setActivePortalTab('boletim');
        }
      });
    });

    // 5. Successful/Completed payments (Sucesso)
    const paidPayments = studentPayments.filter(p => p.status === 'Pago');
    if (paidPayments.length > 0) {
      list.push({
        id: `notify-paid-summary`,
        type: 'success',
        title: 'Financeiro em Dia! ✅',
        description: `Parabéns! Você já quitou ${paidPayments.length} livro(s) no semestre. Seu acesso e recebimento de materiais estão 100% regularizados.`,
        date: '2026-06-10'
      });
    }

    // 6. Classmate Birthdays (Aniversariantes do mês de Junho - baseado no dia 2026-06-10)
    if (pushTopics.birthdays) {
      const currentMonthStr = '06'; // June
      const classmates = students.filter(s => s.id !== currentStudent.id && s.className === currentStudent.className && s.status === 'Ativo');
      classmates.forEach(s => {
        if (s.birthDate) {
          const dateParts = s.birthDate.split('-');
          if (dateParts.length === 3) {
            const birthMonth = dateParts[1];
            const birthDay = parseInt(dateParts[2], 10);
            if (birthMonth === currentMonthStr) {
              const isToday = birthDay === 10; // Under system date 2026-06-10
              list.push({
                id: `notify-birthday-${s.id}`,
                type: isToday ? 'success' : 'info',
                title: isToday ? `🎉 Aniversário HOJE: ${s.name}! 🎂` : `🎁 Aniversariante de Junho: ${s.name}`,
                description: isToday 
                  ? `Hoje (${birthDay}/06), seu(sua) colega de turma ${s.name} está celebrando seu aniversário! Que tal enviar um parabéns abençoado pelo WhatsApp?` 
                  : `O colega ${s.name} faz aniversário no dia ${birthDay} de Junho. Mantenha essa comunhão ativa!`,
                date: `2026-06-${birthDay < 10 ? '0' + birthDay : birthDay}`,
                actionLabel: isToday ? 'Enviar Parabéns 💬' : undefined,
                onAction: isToday ? () => {
                  const text = encodeURIComponent(`Graça e paz, ${s.name}! Passando para te desejar um feliz aniversário! Que o Senhor te conceda muitas bênçãos, saúde e contínuo crescimento na graça e no conhecimento! 🎂🎁🎈`);
                  window.open(`https://wa.me/?text=${text}`, '_blank');
                } : undefined
              });
            }
          }
        }
      });
    }

    // 7. Day of Class Reminder (Lembrete no dia da aula)
    if (pushTopics.classes) {
      const todayStr = '2026-06-10';
      const classToday = juneClassDays.find(c => c.date === todayStr);
      if (classToday) {
        list.push({
          id: `notify-class-today`,
          type: 'info',
          title: '📖 Aula Agendada HOJE!',
          description: `Lembrete de Aula: Hoje você tem um encontro marcado de sua disciplina! "${classToday.label}" se inicia às 19:30h. Prepare seu coração e anotações!`,
          date: todayStr,
          actionLabel: 'Ver Chamada de Aula 📝',
          onAction: () => {
            setActivePortalTab('calendario');
          }
        });
      }
    }

    return list;
  }, [studentPayments, studentGrades, studentStats, currentStudent, payments, students, pushTopics]);

  // CALENDAR & ATTENDANCE RECORD WRITER STATE
  // juneClassDays is defined at module-level to prevent initialization ordering issues

  const [selectedClassDate, setSelectedClassDate] = useState<string | null>(null);
  const [calendarSearchName, setCalendarSearchName] = useState('');
  const [isClassActionOpen, setIsClassActionOpen] = useState(false);
  const [attendanceJustification, setAttendanceJustification] = useState('');

  // Find a specific student in the list who wants to register attendance
  const matchedStudentForAttendance = useMemo(() => {
    if (!calendarSearchName.trim()) return currentStudent; // Default to self
    return students.find(s => 
      s.name.toLowerCase().includes(calendarSearchName.toLowerCase()) && s.status === 'Ativo'
    );
  }, [students, calendarSearchName, currentStudent]);

  // Fetch the record of attendance for the chosen date & matched student
  const classStatusForMatchedUser = useMemo(() => {
    if (!selectedClassDate || !matchedStudentForAttendance) return null;
    return attendance.find(r => 
      r.date === selectedClassDate && r.studentId === matchedStudentForAttendance.id
    );
  }, [attendance, selectedClassDate, matchedStudentForAttendance]);

  const handleClassClick = (date: string) => {
    setSelectedClassDate(date);
    setCalendarSearchName(currentStudent?.name || '');
    const existing = attendance.find(r => r.date === date && r.studentId === (currentStudent?.id || ''));
    setAttendanceJustification(existing?.justification || '');
    setIsClassActionOpen(true);
  };

  const handleRegisterSelfCall = (status: AttendanceStatus) => {
    if (!selectedClassDate || !matchedStudentForAttendance) return;

    onAddOrUpdateAttendance({
      id: classStatusForMatchedUser?.id || `att-self-${Date.now()}-${matchedStudentForAttendance.id}`,
      studentId: matchedStudentForAttendance.id,
      subjectId: 'sub-1', // Default subject link for class day
      date: selectedClassDate,
      status: status,
      justification: status === 'Falta Justificada' ? attendanceJustification : undefined
    });

    showToast(`Frequência registrada com sucesso para ${matchedStudentForAttendance.name}!`);
  };

  // Simple QR simulator for PIX simulation
  const [showPixCode, setShowPixCode] = useState<string | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const student = activeStudents.find(s => s.registrationNumber.trim() === loginRegNumber.trim());
    if (student) {
      setLoggedInStudentId(student.id);
      setLoginError('');
      if (onRecordLogin) {
        onRecordLogin('Aluno', student.registrationNumber, student.name);
      }
    } else {
      setLoginError('Matrícula não encontrada. Verifique o número digitado.');
    }
  };

  if (!currentStudent) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50 min-h-[70vh] relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-64 bg-indigo-950/5"></div>
        <div className="w-full max-w-[400px] bg-white rounded-3xl shadow-2xl shadow-indigo-900/5 p-8 border border-white relative z-10 animate-fade-in my-8 backdrop-blur-xl">
          <div className="text-center space-y-4 mb-8">
            <div className="w-16 h-16 rounded-2xl mx-auto shadow-inner border border-indigo-100 overflow-hidden">
              <img src={logoImage} alt="Dabar Logo" className="w-full h-full object-cover" />
            </div>
            <h3 className="text-lg font-display font-extrabold text-slate-800 tracking-tight">Saguão do Discente</h3>
            <p className="text-xs text-slate-500 leading-relaxed max-w-[260px] mx-auto font-medium">Acesso restrito à secretaria. Digite sua matrícula para acessar seu painel individual.</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <label className="block text-[11px] font-black tracking-widest text-slate-400 uppercase">Matrícula Escolar</label>
              <input 
                type="text" 
                value={loginRegNumber}
                onChange={(e) => {
                  setLoginRegNumber(e.target.value);
                  if (loginError) setLoginError('');
                }}
                autoFocus
                placeholder="Ex. 2026001"
                className="w-full min-h-[48px] px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition-all"
                required
              />
            </div>
            {loginError && (
              <p className="text-rose-600 text-[11px] font-bold mt-2 flex items-center gap-1.5 animate-fade-in bg-rose-50 p-2 rounded-lg border border-rose-100">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
                {loginError}
              </p>
            )}
            <button 
              type="submit"
              className="w-full min-h-[48px] bg-gradient-to-r from-indigo-600 to-indigo-800 hover:from-indigo-700 hover:to-indigo-900 text-white font-bold py-3 px-4 rounded-xl transition-all duration-300 shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer text-sm transform hover:-translate-y-0.5"
            >
              <span>Acessar Painel</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6" id="student-portal-container">
      {/* Header of Student Portal */}
      <div className="bg-indigo-950 p-5 rounded-2xl text-white flex flex-col md:flex-row items-center justify-between gap-4 border border-indigo-900 shadow-md shadow-indigo-100">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500 rounded-xl">
            <Smartphone className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest block">Portal do Aluno</span>
            <h4 className="text-sm font-sans font-semibold text-slate-200">Visão Individual do Aluno</h4>
          </div>
        </div>

        <button
          onClick={() => {
            setLoggedInStudentId(null);
            setLoginRegNumber('');
            setActivePortalTab('painel');
          }}
          className="bg-indigo-900 hover:bg-indigo-800 border border-indigo-800 text-xs font-semibold text-indigo-100 py-2.5 px-4 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:outline-none transition"
        >
          Sair da Conta
        </button>
      </div>

      {/* Main Student Hub Frame */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* PROFILE SIDEBAR */}
        <div className="lg:col-span-1 bg-white border border-slate-100 rounded-2xl p-5 space-y-5 shadow-xs h-fit">
          <div className="flex flex-col items-center text-center">
            {currentStudent.photoUrl ? (
              <img src={currentStudent.photoUrl} alt={currentStudent.name} referrerPolicy="no-referrer" className="w-16 h-16 rounded-full object-cover border-2 border-indigo-400 mb-3" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-extrabold flex items-center justify-center text-2xl mb-3">
                {currentStudent.name.charAt(0)}
              </div>
            )}
            <h3 className="text-sm font-bold text-slate-800 leading-tight">{currentStudent.name}</h3>
            <span className="text-[10px] text-slate-400 font-mono mt-0.5">{currentStudent.registrationNumber}</span>
            <div className="mt-2 text-[10px] px-2 py-0.5 bg-emerald-50 border border-emerald-100 text-emerald-600 font-bold rounded-full">
              {currentStudent.className}
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4 space-y-1">
            {([
              { id: 'painel', label: 'Meu Painel', icon: User },
              { id: 'boletim', label: 'Boletim Acadêmico', icon: FileText },
              { id: 'conteudos', label: 'Material de Estudo', icon: BookOpen },
              { id: 'calendario', label: 'Frequência e Chamada', icon: CheckCircle },
              { id: 'agenda', label: 'Calendário Letivo', icon: Calendar },
              { id: 'financeiro', label: 'Meus Livros', icon: DollarSign },
              { id: 'push', label: 'Push no Celular 📱', icon: Smartphone },
              { id: 'perfil', label: 'Editar Perfil', icon: Edit }
            ] as const).map(tab => {
              const Icon = tab.icon;
              
              // Calculate badges dynamically
              let badgeText: string | null = null;
              let badgeBg = "bg-rose-500 text-white";
              
              if (tab.id === 'painel') {
                const criticalCount = portalNotifications.filter(n => n.type === 'danger' || n.type === 'warning').length;
                if (criticalCount > 0) {
                  badgeText = String(criticalCount);
                }
              } else if (tab.id === 'financeiro') {
                const unpaidCount = studentPayments.filter(p => p.status !== 'Pago').length;
                if (unpaidCount > 0) {
                  badgeText = String(unpaidCount);
                  badgeBg = "bg-amber-500 text-white";
                }
              }

              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActivePortalTab(tab.id);
                    setIsClassActionOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2.5 text-xs font-semibold rounded-xl flex items-center justify-between transition-all duration-150 ${
                    activePortalTab === tab.id
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{tab.label}</span>
                  </div>
                  {badgeText && (
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${badgeBg} animate-pulse`}>
                      {badgeText}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="border-t border-slate-100 pt-4 text-[11px] text-slate-400 space-y-2">
            <div>
              <span className="font-medium block text-slate-400">E-mail:</span>
              <span className="font-semibold text-slate-700">{currentStudent.email}</span>
            </div>
            <div>
              <span className="font-medium block text-slate-400">Matrícula em:</span>
              <span className="font-semibold text-slate-700">{new Date(currentStudent.enrollmentDate + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
            </div>
          </div>
        </div>

        {/* PORTAL MAIN MULTI TAB MODULE */}
        <div className="lg:col-span-3 space-y-6">

          {/* TAB 1: MEU PAINEL */}
          {activePortalTab === 'painel' && (
            <div className="space-y-6" id="panel-tab">
              {/* Welcome box */}
              <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 p-6 rounded-2xl border border-slate-800 text-white relative overflow-hidden">
                <div className="relative z-10 max-w-sm space-y-2">
                  <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest block">Bem-vindo, Aluno(a)</span>
                  <h2 className="text-xl font-sans font-bold text-slate-100 leading-tight">Graça e Paz, {currentStudent.name.split(' ')[0]}!</h2>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Aqui você pode gerenciar seus pagamentos de livros, justificar ausências em aulas selecionadas e conferir suas notas por disciplina.
                  </p>
                </div>
                <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-1/4 translate-y-1/4">
                  <Sparkles className="w-48 h-48 text-indigo-500" />
                </div>
              </div>

              {/* Dynamic Notifications Center */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                      <Bell className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">Central de Notificações</h4>
                      <p className="text-[10px] text-slate-400 font-medium">Avisos e pendências importantes da sua secretaria acadêmica e financeira</p>
                    </div>
                  </div>
                  {portalNotifications.length > 0 && (
                    <span className="bg-rose-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full animate-bounce">
                      {portalNotifications.filter(n => n.type === 'danger' || n.type === 'warning').length} Pendentes
                    </span>
                  )}
                </div>

                {portalNotifications.length > 0 ? (
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                    {portalNotifications.map((n) => {
                      let bgClass = "bg-slate-50 border-slate-100 text-slate-700";
                      let iconColor = "text-slate-500";
                      let iconBg = "bg-slate-100";
                      
                      if (n.type === 'danger') {
                        bgClass = "bg-rose-50/50 border-rose-100 text-rose-950";
                        iconColor = "text-rose-600";
                        iconBg = "bg-rose-100/75";
                      } else if (n.type === 'warning') {
                        bgClass = "bg-amber-50/50 border-amber-100 text-amber-950";
                        iconColor = "text-amber-600";
                        iconBg = "bg-amber-100/75";
                      } else if (n.type === 'success') {
                        bgClass = "bg-emerald-50/40 border-emerald-100 text-emerald-950";
                        iconColor = "text-emerald-600";
                        iconBg = "bg-emerald-100/75";
                      } else if (n.type === 'info') {
                        bgClass = "bg-blue-50/40 border-blue-100 text-blue-950";
                        iconColor = "text-blue-500";
                        iconBg = "bg-blue-100/75";
                      }

                      return (
                        <div key={n.id} className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs transition hover:shadow-xs ${bgClass}`}>
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg ${iconBg} ${iconColor} shrink-0 mt-0.5 sm:mt-0`}>
                              {n.type === 'danger' ? <AlertCircle className="w-4 h-4 animate-pulse" /> : <Clock className="w-4 h-4" />}
                            </div>
                            <div className="space-y-0.5">
                              <h5 className="font-bold">{n.title}</h5>
                              <p className="text-slate-605 text-[11px] leading-relaxed">{n.description}</p>
                            </div>
                          </div>
                          {n.actionLabel && (
                            <button
                              onClick={() => {
                                if (n.onAction) n.onAction();
                              }}
                              className="text-[10px] font-bold text-indigo-600 bg-white border border-slate-200 hover:border-indigo-200 hover:bg-slate-50 px-2.5 py-1.5 rounded-lg shadow-3xs cursor-pointer select-none transition self-end sm:self-auto uppercase tracking-wider whitespace-nowrap shrink-0"
                            >
                              {n.actionLabel}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 text-center py-6">Nenhuma notificação importante no momento. Tudo em dia!</p>
                )}
              </div>

              {/* Attendance and stats widget */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Attendance rate gauge */}
                <div className="md:col-span-1 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center text-center">
                  <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Índice de Presença</h5>
                  <div className="relative w-28 h-28 mb-3">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                      <circle 
                        cx="18" 
                        cy="18" 
                        r="15.915" 
                        fill="none" 
                        stroke={studentStats.rate >= 75 ? '#10b981' : '#f43f5e'} 
                        strokeWidth="3" 
                        strokeDasharray={`${studentStats.rate} ${100 - studentStats.rate}`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-black text-slate-800">{studentStats.rate}%</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 font-mono">
                    {studentStats.present} presenças / {studentStats.absent} faltas
                  </span>
                  {studentStats.rate < 75 && (
                    <div className="mt-2 text-[10px] text-rose-500 font-semibold flex items-center gap-1 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-100">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>Risco de reprovação por falta (Abaixo de 75%)</span>
                    </div>
                  )}
                </div>

                {/* Performance & messages */}
                <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
                  <div>
                    <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Desempenho Acadêmico</h5>
                    <p className="text-xs text-slate-500 leading-relaxed mb-4">
                      Você está matriculado em <strong>{subjects.length} disciplinas</strong> ativas no semestre regular. 
                      Confira suas médias parciais correspondentes do período acadêmico vigente.
                    </p>

                    <div className="space-y-2">
                      {studentGrades.map((g, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs p-2 bg-slate-50 border border-slate-100 rounded-lg">
                          <span className="font-semibold text-slate-700">{g.subjectName}</span>
                          <span className="font-mono text-slate-500">Média Parcial: 
                            <strong className="text-slate-800 ml-1 bg-white font-bold px-2 py-0.5 border border-slate-200 rounded">{g.averageGrade !== null ? g.averageGrade.toFixed(1) : '-'}</strong>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-slate-100 mt-4 pt-3 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span>Situação: Regularizado</span>
                    <button onClick={() => setActivePortalTab('boletim')} className="text-indigo-600 font-bold hover:underline flex items-center gap-0.5">
                      Ver boletim <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BOLETIM ACADÊMICO */}
          {activePortalTab === 'boletim' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6" id="boletim-tab">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-md font-sans font-bold text-slate-800 mb-1">Boletim Escolar Oficial</h3>
                  <p className="text-xs text-slate-500">Notas oficiais por disciplina (cada disciplina tem duração de 1 mês, composta de uma prova presencial e prova de recuperação se necessário).</p>
                </div>
                <button
                  onClick={() => window.print()}
                  className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 font-bold rounded-xl text-xs px-4 py-2 transition flex items-center justify-center gap-1.5 self-start sm:self-center"
                >
                  <FileText className="w-4 h-4" />
                  Imprimir Boletim
                </button>
              </div>

              <div className="overflow-x-auto border border-slate-100 rounded-xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      <th className="px-5 py-3.5 w-2/5">Disciplina / Docente</th>
                      <th className="px-4 py-3.5 text-center">Nota da Disciplina</th>
                      <th className="px-4 py-3.5 text-center bg-indigo-50/20 text-indigo-700">Prova de Recuperação</th>
                      <th className="px-4 py-3.5 text-center bg-slate-50 font-semibold text-slate-700">Média Final</th>
                      <th className="px-5 py-3.5 text-right">Resultado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {studentGrades.length > 0 ? (
                      studentGrades.map((g, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-5 py-3">
                            <span className="font-bold text-slate-800 block text-sm">{g.subjectName}</span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">{g.teacherName}</span>
                          </td>
                          <td className="px-4 py-3 text-center font-bold font-mono text-slate-700">{g.term1Grade !== null ? g.term1Grade.toFixed(1) : '-'}</td>
                          <td className="px-4 py-3 text-center font-bold font-mono text-indigo-600 bg-indigo-50/5">{g.examGrade !== null ? g.examGrade.toFixed(1) : '-'}</td>
                          <td className="px-4 py-3 text-center font-extrabold font-mono text-slate-800 bg-slate-50/40">{g.averageGrade !== null ? g.averageGrade.toFixed(1) : '-'}</td>
                          <td className="px-5 py-3 text-right">
                            <span className={`inline-flex px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                              g.status === 'Aprovado'
                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                : g.status === 'Recuperação'
                                ? 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                                : 'bg-rose-50 text-rose-600 border border-rose-100'
                            }`}>
                              {g.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="text-center py-8 text-slate-400">Nenhum registro de notas neste boletim.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Progress & Certificate */}
              <div className="pt-6 border-t border-slate-100">
                <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-500" /> Progresso do Curso e Certificados
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Course Content */}
                  <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl">
                    <div className="flex justify-between items-center mb-2">
                      <strong className="text-xs font-bold text-slate-700">Curso Básico em Teologia</strong>
                      <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded font-bold font-mono">
                        {passedSubjectsCount} / 24 Diciplinas
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 mb-4">
                      <div className="bg-indigo-500 h-2 rounded-full transition-all" style={{ width: `${basicCourseProgress}%` }}></div>
                    </div>
                    {passedSubjectsCount >= 24 ? (
                      <button onClick={() => {
                        setCertificateModal({ isOpen: true, type: 'Básico', isExample: false });
                      }} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2 rounded-lg transition">
                        Emitir Certificado (Básico)
                      </button>
                    ) : (
                      <div className="space-y-2">
                         <p className="text-[10px] text-slate-400 text-center">Conclua 24 disciplinas aprovadas para emitir.</p>
                         <button onClick={() => {
                           setCertificateModal({ isOpen: true, type: 'Básico', isExample: true });
                         }} className="w-full bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold py-2 rounded-lg transition">
                           Visualizar Exemplo (Básico)
                         </button>
                      </div>
                    )}
                  </div>
                  
                  {/* Medium Course Content */}
                  <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl">
                    <div className="flex justify-between items-center mb-2">
                      <strong className="text-xs font-bold text-slate-700">Curso Médio em Teologia</strong>
                      <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded font-bold font-mono">
                        {passedSubjectsCount} / 40 Diciplinas
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 mb-4">
                      <div className="bg-indigo-500 h-2 rounded-full transition-all" style={{ width: `${mediumCourseProgress}%` }}></div>
                    </div>
                    {passedSubjectsCount >= 40 ? (
                      <button onClick={() => {
                         setCertificateModal({ isOpen: true, type: 'Médio', isExample: false });
                      }} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2 rounded-lg transition">
                        Emitir Certificado (Médio)
                      </button>
                    ) : (
                      <div className="space-y-2">
                         <p className="text-[10px] text-slate-400 text-center">Conclua 40 disciplinas aprovadas para emitir.</p>
                         <button onClick={() => {
                           setCertificateModal({ isOpen: true, type: 'Médio', isExample: true });
                         }} className="w-full bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold py-2 rounded-lg transition">
                           Visualizar Exemplo (Médio)
                         </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: CALENDÁRIO & CHAMADA INTERATIVA */}
          {activePortalTab === 'calendario' && (
            <div className="space-y-6" id="calendario-tab">
              
              {/* Instruction banner */}
              <div className="bg-indigo-500/5 border border-indigo-500/10 p-5 rounded-2xl">
                <h4 className="text-xs font-bold text-indigo-800 tracking-wider uppercase mb-1.5 flex items-center gap-1.5 font-sans">
                  <Sparkles className="w-4.5 h-4.5 text-indigo-500 shrink-0" /> Calendário de Presenças Interativo
                </h4>
                <p className="text-xs text-slate-700 leading-relaxed">
                  Confira os dias letivos cadastrados para este mês de Junho de 2026. 
                  Clique em qualquer dia do cronograma de estudos abaixo para abrir o 
                  <strong> Painel de Chamada / Justificativa</strong> para simular sua presença ou enviar uma falta justificada.
                </p>
              </div>

              {/* Grid split: Days vs Custom Action Block */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Visual Days Column (2/3 width) */}
                <div className="md:col-span-2 space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Aulas Agendadas (Junho 2026)</h4>
                  
                  <div className="space-y-2">
                    {juneClassDays.map((day) => {
                      // Lookup existing record for current selected student
                      const existingRecord = attendance.find(r => r.date === day.date && r.studentId === currentStudent.id);
                      
                      return (
                        <div
                          key={day.date}
                          onClick={() => handleClassClick(day.date)}
                          className={`p-4 rounded-2xl border cursor-pointer transition-all duration-200 hover:border-indigo-500 hover:shadow-xs flex items-center justify-between ${
                            selectedClassDate === day.date
                              ? 'bg-indigo-500/5 border-indigo-500 ring-1 ring-indigo-500/35'
                              : 'bg-white border-slate-100 shadow-3xs'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg group text-center shrink-0 w-12 text-slate-500 font-mono">
                              <span className="text-[10px] block leading-none font-bold uppercase">Jun</span>
                              <span className="text-sm font-black block leading-none mt-1">{day.date.split('-')[2]}</span>
                            </div>

                            <div className="space-y-1">
                              <h5 className="text-xs font-bold text-slate-800">{day.label}</h5>
                              <p className="text-[10px] text-slate-400 font-medium">{day.dayOfWeek} (19h30 - 21h30)</p>
                            </div>
                          </div>

                          {/* Quick indicators */}
                          <div>
                            {existingRecord ? (
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold leading-none ${
                                existingRecord.status === 'Presença'
                                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                  : existingRecord.status === 'Falta'
                                  ? 'bg-rose-50 text-rose-600 border border-rose-100'
                                  : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                              }`}>
                                {existingRecord.status === 'Presença' ? 'Presente' : (existingRecord.status === 'Falta' ? 'Ausente' : 'Falta Justificada')}
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-indigo-500 uppercase bg-indigo-500/5 border border-indigo-200/40 px-2 py-0.5 rounded">
                                Agendada
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Selected Day Action Box (1/3 width) */}
                <div className="md:col-span-1">
                  {isClassActionOpen && selectedClassDate ? (
                    <div className="bg-white border border-slate-100 rounded-2xl p-5 space-y-4 shadow-sm sticky top-4">
                      <div className="pb-3 border-b border-slate-100 flex items-start justify-between">
                        <div>
                          <span className="text-[9px] uppercase font-bold text-indigo-600 tracking-wider font-mono font-bold">Simulador de Frequência</span>
                          <h4 className="text-xs font-bold text-slate-800 mt-1">Presença para {new Date(selectedClassDate + 'T00:00:00').toLocaleDateString('pt-BR')}</h4>
                        </div>
                        <button onClick={() => setIsClassActionOpen(false)} className="text-slate-400 hover:text-slate-600 text-xs">Fechar</button>
                      </div>

                      {/* Search matches box */}
                      <div className="space-y-3">
                        <div>
                          <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Confirmar Nome dO Aluno:</label>
                          <div className="relative">
                            <input
                              type="text"
                              value={calendarSearchName}
                              onChange={(e) => setCalendarSearchName(e.target.value)}
                              placeholder="Pesquise seu nome para assinar..."
                              className="block w-full text-xs px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white font-semibold"
                            />
                          </div>
                        </div>

                        {/* Matched profile display */}
                        {matchedStudentForAttendance ? (
                          <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-2.5 text-xs">
                            <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600 text-[10px]">
                              {matchedStudentForAttendance.name.charAt(0)}
                            </div>
                            <div>
                              <strong className="text-slate-800 block text-[11px] leading-tight">{matchedStudentForAttendance.name}</strong>
                              <span className="text-[9px] text-slate-400 font-mono italic leading-none">{matchedStudentForAttendance.registrationNumber}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="text-[10px] text-rose-500 italic bg-rose-50 p-2 rounded-lg">
                            Nenhum aluno ativo encontrado com este nome.
                          </div>
                        )}
                      </div>

                      {/* Display status already registered */}
                      <div className="p-2.5 bg-indigo-500/5 rounded-xl border border-indigo-300/20 text-xs space-y-1">
                        <span className="text-slate-400 text-[10px] block uppercase font-bold tracking-wider">Status Registrado:</span>
                        {classStatusForMatchedUser ? (
                          <div className="font-semibold text-slate-700 flex items-center gap-1.5 mt-0.5">
                            <div className={`w-2 h-2 rounded-full ${classStatusForMatchedUser.status === 'Presença' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                            <span>{classStatusForMatchedUser.status} {classStatusForMatchedUser.justification ? `(${classStatusForMatchedUser.justification})` : ''}</span>
                          </div>
                        ) : (
                          <span className="text-slate-500 italic text-[11px] block mt-0.5">Sem registro até o momento</span>
                        )}
                      </div>

                      {/* Action confirm buttons */}
                      {matchedStudentForAttendance && (
                        <div className="space-y-2 pt-2 border-t border-slate-100">
                          {/* Confirmation green button */}
                          <button
                            onClick={() => handleRegisterSelfCall('Presença')}
                            className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 transition text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-3xs"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Confirmar Presença</span>
                          </button>

                          {/* Excused form option */}
                          <div className="space-y-1.5 pt-1">
                            <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Motivo Justificativa (Apenas faltas):</label>
                            <input
                              type="text"
                              value={attendanceJustification}
                              onChange={(e) => setAttendanceJustification(e.target.value)}
                              placeholder="Atestado médico ou Trabalho..."
                              className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-xl placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
                            />
                            
                            <button
                              onClick={() => {
                                if (!attendanceJustification.trim()) {
                                  showToast('Por favor, informe a justificativa da falta primeiro.');
                                  return;
                                }
                                handleRegisterSelfCall('Falta Justificada');
                              }}
                              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 transition text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-indigo-100"
                            >
                              <AlertCircle className="w-3.5 h-3.5" />
                              <span>Justificar com Falta</span>
                            </button>
                          </div>
                        </div>
                      )}

                    </div>
                  ) : (
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-8 text-center text-slate-400 text-xs shadow-3xs">
                      Clique em um dia letivo da lista ao lado para abrir o módulo de chamada.
                    </div>
                  )}
                </div>

              </div>

              {/* ATIVIDADES E EVENTOS ACADÊMICOS */}
              <div className="bg-white p-6 border border-slate-100 rounded-2xl shadow-sm space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-indigo-500" />
                  Próximos Eventos e Avaliações
                </h4>
                
                {activities.length === 0 ? (
                  <p className="text-sm text-slate-400 italic">Nenhum evento ou atividade cadastrada no momento.</p>
                ) : (
                  <div className="space-y-3">
                    {activities
                      .filter(a => !a.targetClass || a.targetClass === currentStudent?.className)
                      .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                      .map(act => {
                        const isPast = new Date(act.date) < new Date('2026-06-07T00:00:00');
                        return (
                        <div key={act.id} className={`flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 border rounded-xl transition ${isPast ? 'bg-slate-50 border-slate-100 opacity-60' : 'bg-white border-slate-200 hover:border-indigo-300'}`}>
                          <div className="w-20 shrink-0 text-center border-r border-slate-100 pr-4">
                            <span className="block text-[10px] font-bold text-slate-400 uppercase">{new Date(`${act.date}T12:00:00Z`).toLocaleDateString('pt-BR', { month: 'short' })}</span>
                            <span className="block text-2xl font-light text-slate-700">{new Date(`${act.date}T12:00:00Z`).getDate()}</span>
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                                act.type === 'Prova' ? 'bg-rose-50 text-rose-600 border-rose-100' : 
                                act.type === 'Trabalho' ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                                act.type === 'Evento' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 
                                'bg-slate-100 text-slate-600 border-slate-200'
                              }`}>{act.type}</span>
                              {act.targetClass && <span className="text-[9px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded font-mono">{act.targetClass}</span>}
                            </div>
                            <h4 className={`text-sm font-bold ${isPast ? 'text-slate-500' : 'text-slate-800'}`}>{act.title}</h4>
                            <p className="text-xs text-slate-500 line-clamp-2">{act.description}</p>
                          </div>
                        </div>
                      )})}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB: MATERIAL DE ESTUDO */}
          {activePortalTab === 'conteudos' && (
            <div className="space-y-6" id="conteudos-tab-animate">
              <div className="bg-indigo-50 border border-indigo-100 p-5 rounded-2xl flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5 animate-pulse" />
                <div>
                  <h3 className="text-sm font-bold text-indigo-950 font-sans">Material de Apoio & Plano de Estudos</h3>
                  <p className="text-xs text-indigo-900/80 leading-relaxed mt-1">
                    Consulte as ementas, planos de aula semanais, sugestões bibliográficas e tópicos teológicos reflexivos gerados para cada uma das suas matérias matriculadas.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {subjects.map((sub) => {
                  const isExpanded = selectedStudentSubjectId === sub.id;
                  return (
                    <div 
                      key={sub.id}
                      className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden transition-all duration-300"
                    >
                      {/* Accordion Header */}
                      <div 
                        onClick={() => {
                          setSelectedStudentSubjectId(isExpanded ? null : sub.id);
                        }}
                        className={`p-5 flex items-center justify-between cursor-pointer select-none transition-colors ${
                          isExpanded ? 'bg-indigo-50/40' : 'hover:bg-slate-50/50'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-11 h-11 rounded-xl flex items-center justify-center border transition-all ${
                            isExpanded 
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100' 
                              : 'bg-indigo-50 border-indigo-100/50 text-indigo-600'
                          }`}>
                            <BookOpen className="w-5 h-5" />
                          </div>
                          
                          <div className="space-y-1">
                            <h4 className="text-sm font-bold text-slate-800 leading-tight">{sub.name}</h4>
                            <p className="text-[11px] text-slate-500 font-medium">Docente: {sub.teacherName}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {/* Desktop Indicators */}
                          <div className="hidden sm:flex items-center gap-2">
                            <span className="text-[10px] font-semibold text-slate-500 font-mono bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200/50">
                              {sub.workload}h Carga
                            </span>
                          </div>

                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-indigo-600 bg-indigo-100/60 p-1 rounded-lg" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-slate-400 bg-slate-100 p-1 rounded-lg" />
                          )}
                        </div>
                      </div>

                      {/* Accordion Content Body */}
                      {isExpanded && (
                        <div className="border-t border-slate-100/80 p-5 sm:p-6 bg-white space-y-5 animate-fade-in">
                          {/* Mobile-only tags */}
                          <div className="sm:hidden flex flex-wrap items-center gap-2 pb-3 border-b border-rose-50/10">
                            <span className="text-[10px] font-semibold text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/50">
                              Carga: {sub.workload}h
                            </span>
                          </div>

                          {/* Seletor de Seções */}
                          <div className="flex border-b border-slate-105 pb-2 gap-1.5 overflow-x-auto scrollbar-none">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedStudySection('ementa');
                              }}
                              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition whitespace-nowrap border ${
                                selectedStudySection === 'ementa'
                                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm shadow-indigo-100'
                                  : 'bg-slate-50 text-slate-600 border-slate-200/60 hover:bg-slate-100'
                              }`}
                            >
                              Matriz / Ementa Geral
                            </button>
                            {[1, 2, 3, 4].map(num => {
                              const hasPlan = lessonPlans.some(p => p.subjectId === sub.id && p.classNumber === num && p.content.trim().length > 10);
                              return (
                                <button
                                  key={num}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedStudySection(num as any);
                                  }}
                                  className={`px-3.5 py-2 text-xs font-bold rounded-xl transition flex items-center gap-1.5 whitespace-nowrap border ${
                                    selectedStudySection === num
                                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                                      : 'bg-slate-50 text-slate-600 border-slate-200/60 hover:bg-slate-100'
                                  }`}
                                >
                                  <span>Aula {num}</span>
                                  {hasPlan ? (
                                    <span className={`w-1.5 h-1.5 rounded-full ${selectedStudySection === num ? 'bg-white animate-pulse' : 'bg-emerald-500'}`} />
                                  ) : (
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                                  )}
                                </button>
                              );
                            })}
                          </div>

                          {/* Content Display */}
                          <div className="overflow-y-auto max-h-[500px] pr-1.5 mt-2">
                            {(() => {
                              if (selectedStudySection === 'ementa') {
                                if (sub.aiContent) {
                                  return (
                                    <div className="prose prose-indigo max-w-none text-xs leading-relaxed space-y-2">
                                      {sub.aiContent.split('\n').map((line, idx) => {
                                        if (line.startsWith('# ')) {
                                          return <h1 key={idx} className="text-md font-bold mt-4 mb-2 text-indigo-950 font-sans border-b pb-1 first:mt-0">{line.replace('# ', '')}</h1>;
                                        }
                                        if (line.startsWith('## ')) {
                                          return <h2 key={idx} className="text-sm font-bold mt-3.5 mb-1.5 text-indigo-900 font-sans border-b pb-0.5">{line.replace('## ', '')}</h2>;
                                        }
                                        if (line.startsWith('### ')) {
                                          return <h3 key={idx} className="text-xs font-bold mt-3 mb-1 text-indigo-800 font-sans">{line.replace('### ', '')}</h3>;
                                        }
                                        let formattedText: React.ReactNode = line;
                                        if (line.includes('**')) {
                                          const parts = line.split('**');
                                          formattedText = parts.map((part, pIdx) => pIdx % 2 === 1 ? <strong key={pIdx} className="font-extrabold text-slate-900">{part}</strong> : part);
                                        }
                                        if (line.startsWith('- ') || line.startsWith('* ')) {
                                          return (
                                            <li key={idx} className="ml-4 list-disc text-slate-700 text-xs py-0.5 font-sans">
                                              {formattedText instanceof Array ? formattedText : line.substring(2)}
                                            </li>
                                          );
                                        }
                                        if (!line.trim()) {
                                          return <div key={idx} className="h-1.5" />;
                                        }
                                        return <p key={idx} className="text-xs text-slate-700 leading-relaxed py-1 font-sans">{formattedText}</p>;
                                      })}
                                    </div>
                                  );
                                } else {
                                  return (
                                    <div className="text-center py-12 space-y-4">
                                      <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-500 mx-auto">
                                        <Sparkles className="w-6 h-6 text-indigo-400 animate-pulse" />
                                      </div>
                                      <div className="max-w-xs mx-auto space-y-1">
                                        <h4 className="text-xs font-bold text-slate-800">Plano Acadêmico sendo Preparado</h4>
                                        <p className="text-[10px] text-slate-500 leading-relaxed">
                                          O docente desta disciplina está estruturando o conteúdo programático, ementas de estudo e referências bibliográficas com o auxílio do Planejador Teológico Virtual da I.A. <br />
                                          Assim que publicado, o conteúdo aparecerá integralmente aqui!
                                        </p>
                                      </div>
                                    </div>
                                  );
                                }
                              } else {
                                const activePlan = lessonPlans.find(p => p.subjectId === sub.id && p.classNumber === selectedStudySection && p.content.trim().length > 10);
                                if (activePlan) {
                                  return (
                                    <div className="prose prose-indigo max-w-none text-xs leading-relaxed space-y-2">
                                      <div className="mb-4 bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          <Sparkles className="w-4.5 h-4.5 text-emerald-600 animate-pulse" />
                                          <span className="text-xs font-extrabold text-emerald-955">Estudo de Aula com IA Disponível para Aula {selectedStudySection}</span>
                                        </div>
                                        <span className="text-[9px] font-bold bg-emerald-600 text-white px-2.5 py-0.5 rounded-full uppercase tracking-wider">Sincronizado</span>
                                      </div>
                                      {activePlan.content.split('\n').map((line, idx) => {
                                        if (line.startsWith('# ')) {
                                          return <h1 key={idx} className="text-md font-bold mt-4 mb-2 text-indigo-950 font-sans border-b pb-1 first:mt-0">{line.replace('# ', '')}</h1>;
                                        }
                                        if (line.startsWith('## ')) {
                                          return <h2 key={idx} className="text-sm font-bold mt-3.5 mb-1.5 text-indigo-900 font-sans border-b pb-0.5">{line.replace('## ', '')}</h2>;
                                        }
                                        if (line.startsWith('### ')) {
                                          return <h3 key={idx} className="text-xs font-bold mt-3 mb-1 text-indigo-800 font-sans">{line.replace('### ', '')}</h3>;
                                        }
                                        let formattedText: React.ReactNode = line;
                                        if (line.includes('**')) {
                                          const parts = line.split('**');
                                          formattedText = parts.map((part, pIdx) => pIdx % 2 === 1 ? <strong key={pIdx} className="font-extrabold text-slate-900">{part}</strong> : part);
                                        }
                                        if (line.startsWith('- ') || line.startsWith('* ')) {
                                          return (
                                            <li key={idx} className="ml-4 list-disc text-slate-700 text-xs py-0.5 font-sans">
                                              {formattedText instanceof Array ? formattedText : line.substring(2)}
                                            </li>
                                          );
                                        }
                                        if (!line.trim()) {
                                          return <div key={idx} className="h-1.5" />;
                                        }
                                        return <p key={idx} className="text-xs text-slate-700 leading-relaxed py-1 font-sans">{formattedText}</p>;
                                      })}
                                    </div>
                                  );
                                } else {
                                  return (
                                    <div className="text-center py-12 space-y-4 animate-fade-in">
                                      <div className="w-12 h-12 bg-slate-50 border border-slate-150 rounded-full flex items-center justify-center text-slate-400 mx-auto">
                                        <BookOpen className="w-6 h-6 text-slate-400" />
                                      </div>
                                      <div className="max-w-xs mx-auto space-y-1">
                                        <h4 className="text-xs font-bold text-slate-800 font-sans">Aula {selectedStudySection} em Elaboração</h4>
                                        <p className="text-[10px] text-slate-500 leading-relaxed font-sans">
                                          O plano de estudos e conteúdo conceitual acadêmico desta aula de <strong>{sub.name}</strong> está sendo finalizado com o Pb. Marcelo Reinert e estará ativo em breve!
                                        </p>
                                      </div>
                                    </div>
                                  );
                                }
                              }
                            })()}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: FINANCEIRO */}
          {activePortalTab === 'financeiro' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6" id="portal-financeiro-tab">
              <div>
                <h3 className="text-md font-sans font-bold text-slate-800 mb-1">Meus Livros / Pagamentos</h3>
                <p className="text-xs text-slate-500">Histórico de cobrança escolar, vencimentos e simulação de boleto interativo.</p>
              </div>

              {/* Payments log */}
              <div className="space-y-3">
                {studentPayments.map((p) => (
                  <div key={p.id} className="p-4 rounded-2xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl ${p.status === 'Pago' ? 'bg-emerald-50 text-emerald-600 animate-pulse' : 'bg-indigo-50 text-indigo-600'}`}>
                        <DollarSign className="w-5 h-5 animate-pulse" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">Livro de {p.month}</h4>
                        <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-400 font-mono">
                          <span>Vecto: {new Date(p.dueDate + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
                          <span>•</span>
                          <span className="font-semibold text-slate-705">R$ {p.value.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                        p.status === 'Pago'
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                          : 'bg-rose-50 text-rose-600 border border-rose-100'
                      }`}>
                        {p.status}
                      </span>

                      {p.status !== 'Pago' && (
                        <button
                          onClick={() => {
                            setShowPixCode('true');
                          }}
                          className="bg-indigo-600 text-white font-bold text-xs px-3 py-1.5 rounded-xl hover:bg-indigo-700 shadow-md shadow-indigo-100 transition"
                        >
                          Pagar PIX
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* PIX details dynamic simulation */}
              {showPixCode && (
                <div className="p-5 bg-indigo-500/5 rounded-2xl border border-indigo-300/35 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-800 flex items-center gap-1">
                      <Smartphone className="w-4 h-4 text-indigo-500" /> Dados para Pagamento via PIX
                    </span>
                    <button onClick={() => setShowPixCode(null)} className="text-[10px] text-indigo-600 font-bold hover:underline">Fechar</button>
                  </div>

                  <p className="text-[11px] text-slate-600 leading-relaxed font-semibold">
                    Realize o pagamento para a chave PIX abaixo no valor de <strong>R$ 60,00</strong>.
                  </p>

                  <div className="p-4 bg-slate-900 text-white rounded-xl break-all leading-tight border border-slate-700">
                    <p className="font-mono text-indigo-400 mb-1 text-[10px] uppercase font-bold tracking-wider">Chave PIX (CPF):</p>
                    <p className="font-bold text-base font-mono mb-2 select-all">79910262991</p>
                    <div className="border-t border-slate-700/50 pt-2 mt-2 text-[11px] text-slate-400">
                      <p><strong className="text-slate-300">Favorecido:</strong> Marcelo Reinert</p>
                      <p><strong className="text-slate-300">Instituição:</strong> Banco C6 Bank</p>
                    </div>
                  </div>

                  <a
                    href="https://wa.me/5547999458205?text=Ol%C3%A1%2C%20segue%20o%20comprovante%20de%20pagamento%20do%20meu%20livro."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 bg-emerald-500 text-white font-bold text-xs rounded-xl hover:bg-emerald-600 transition inline-flex items-center w-fit"
                  >
                    Enviar Comprovante via WhatsApp
                  </a>
                </div>
              )}

            </div>
          )}

          {/* TAB: AGENDA E CALENDÁRIO */}
          {activePortalTab === 'agenda' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6" id="portal-agenda-tab">
               <AcademicCalendarView 
                  activities={activities}
                  classes={[]}
                  students={students}
                  readOnly={true}
               />
            </div>
          )}

          {/* TAB 5: PERFIL */}
          {activePortalTab === 'perfil' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6" id="portal-perfil-tab">
              <div>
                <h3 className="text-md font-sans font-bold text-slate-800 mb-1">Editar Dados Cadastrais</h3>
                <p className="text-xs text-slate-500">Mantenha seus dados e sua foto de perfil devidamente atualizados.</p>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Left columns: fields */}
                  <div className="md:col-span-2 space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nome Completo</label>
                      <input
                        type="text"
                        required
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        className="w-full text-xs px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">E-mail de Contato</label>
                      <input
                        type="email"
                        required
                        value={profileEmail}
                        onChange={(e) => setProfileEmail(e.target.value)}
                        className="w-full text-xs px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Gênero</label>
                        <select
                          value={profileGender}
                          onChange={(e) => setProfileGender(e.target.value as 'M' | 'F')}
                          className="w-full text-xs px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                        >
                          <option value="M">Masculino</option>
                          <option value="F">Feminino</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Data de Nascimento</label>
                        <input
                          type="date"
                          required
                          value={profileBirthDate}
                          onChange={(e) => setProfileBirthDate(e.target.value)}
                          className="w-full text-xs px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right column: profile picture / avatars */}
                  <div className="md:col-span-1 space-y-4 border-t md:border-t-0 md:border-l border-slate-100 md:pl-6 pt-6 md:pt-0">
                    <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Foto do Perfil</span>
                    
                    <div className="flex flex-col items-center gap-3">
                      {profilePhotoUrl ? (
                        <img 
                          src={profilePhotoUrl} 
                          alt="Previsualização" 
                          referrerPolicy="no-referrer"
                          className="w-20 h-20 rounded-full object-cover border-2 border-indigo-400 shadow shadow-indigo-100" 
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-slate-100 border border-slate-200 text-slate-500 flex items-center justify-center font-extrabold text-3xl">
                          {profileName ? profileName.charAt(0) : '?'}
                        </div>
                      )}
                      
                      <button
                        type="button"
                        onClick={() => setProfilePhotoUrl('')}
                        className="text-[10px] text-rose-600 hover:underline font-semibold"
                      >
                        Remover Foto
                      </button>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">URL Personalizada</label>
                      <input
                        type="url"
                        placeholder="Cole o endereço da imagem..."
                        value={profilePhotoUrl}
                        onChange={(e) => setProfilePhotoUrl(e.target.value)}
                        className="w-full text-[10px] px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                      />
                    </div>

                    {/* Presets Grid */}
                    <div className="space-y-2">
                      <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Ou escolha um avatar acadêmico:</span>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face',
                          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
                          'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
                          'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
                          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face',
                          'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
                        ].map((url, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => setProfilePhotoUrl(url)}
                            className={`relative rounded-full overflow-hidden border-2 transition ${
                              profilePhotoUrl === url ? 'border-indigo-600 scale-105 shadow-sm' : 'border-transparent hover:border-slate-300'
                            }`}
                          >
                            <img src={url} alt={`Preset ${index + 1}`} referrerPolicy="no-referrer" className="w-10 h-10 object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit button */}
                <div className="pt-4 border-t border-slate-100 flex justify-end">
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs px-5 py-3 transition shadow-md shadow-indigo-100"
                  >
                    Salvar Alterações
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 8: NOTIFICAÇÕES PUSH */}
          {activePortalTab === 'push' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6 animate-fade-in" id="portal-push-tab">
              <div>
                <h3 className="text-md font-sans font-bold text-slate-800 mb-1">Central de Notificações Push Celular 📱</h3>
                <p className="text-xs text-slate-500">
                  Configure avisos automáticos e lembretes instantâneos diretamente na tela bloqueada do seu celular ou no seu navegador.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* SETTINGS CARD (7 cols on large) */}
                <div className="lg:col-span-7 space-y-6">
                  {/* Master Push Toggle Switch */}
                  <div className="p-5 rounded-2xl bg-indigo-50/40 border border-indigo-100 flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-slate-800">Sistema Push Geral</h4>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Ative para receber alertas instantâneos de aulas agendadas, aniversários de colegas e controle financeiro.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setPushEnabled(!pushEnabled);
                        showToast(pushEnabled ? 'Notificações push suspensas.' : 'Notificações push ativadas com sucesso!');
                      }}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        pushEnabled ? 'bg-indigo-600' : 'bg-slate-200'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          pushEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Native Browser Permission Helper */}
                  <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                    <div className="space-y-0.5">
                      <p className="font-bold text-slate-800 flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${realPushGranted ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                        Permissão no Aparelho / Navegador
                      </p>
                      <p className="text-slate-500 text-[11px]">
                        {realPushGranted 
                          ? 'Excelente! Seu navegador já está autorizado a enviar notificações nativas.' 
                          : 'Para receber notificações push mesmo fora das abas, conceda autorização.'}
                      </p>
                    </div>
                    
                    {!realPushGranted ? (
                      <button
                        type="button"
                        onClick={async () => {
                          if (!('Notification' in window)) {
                            showToast('Este navegador não suporta notificações de sistema.');
                            return;
                          }
                          try {
                            const permission = await Notification.requestPermission();
                            if (permission === 'granted') {
                              setRealPushGranted(true);
                              showToast('Notificações de sistema ativadas com sucesso! 🎉');
                              
                              new Notification('Faculdade Logos Apóstolos', {
                                body: 'Notificações ativadas! Você será lembrado das aulas e aniversários.',
                                icon: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face'
                              });
                            } else {
                              showToast('Permissão de notificações recusada.');
                            }
                          } catch (err) {
                            showToast('Inscrição efetuada com sucesso!');
                          }
                        }}
                        className="text-[10px] font-bold text-indigo-700 bg-white border border-slate-200 hover:border-indigo-300 px-3 py-1.5 rounded-lg shrink-0 transition"
                      >
                        Autorizar Push
                      </button>
                    ) : (
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
                        Autorizado (Ok)
                      </span>
                    )}
                  </div>

                  {/* Topics List Configurator */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tópicos de Notificação</h4>
                    <div className="space-y-2.5">
                      {[
                        { key: 'classes' as const, title: '🗓️ Lembrete de Aulas de Hoje', desc: 'Ser lembrado pontualmente nas segundas e quartas (dias de aula de Teologia) sobre o cronograma e horário.' },
                        { key: 'birthdays' as const, title: '🎂 Comunhão & Aniversários', desc: 'Aviso especial na tela do aparelho quando algum irmão ou companheiro de classe fizer aniversário hoje.' },
                        { key: 'finance' as const, title: '📚 Vencimentos de Livros Didáticos', desc: 'Alertas de controle de vencimento dos livros para evitar acumulação ou inadimplência.' },
                        { key: 'activities' as const, title: '📝 Provas & Atividades Acadêmicas', desc: 'Lembretes de provas agendadas, novos módulos liberados ou avaliações publicadas.' }
                      ].map((topic) => (
                        <div key={topic.key} className="p-4 rounded-xl border border-slate-100 flex items-start justify-between gap-4 transition hover:bg-slate-50/40">
                          <div className="space-y-0.5">
                            <p className="text-xs font-bold text-slate-700">{topic.title}</p>
                            <p className="text-slate-500 text-[10.5px] leading-relaxed">{topic.desc}</p>
                          </div>
                          <button
                            type="button"
                            disabled={!pushEnabled}
                            onClick={() => {
                              setPushTopics(prev => ({ ...prev, [topic.key]: !prev[topic.key] }));
                            }}
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${
                              pushTopics[topic.key] && pushEnabled ? 'bg-indigo-600' : 'bg-slate-200'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                pushTopics[topic.key] && pushEnabled ? 'translate-x-4' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* VISUAL CELL PHONE SIMULATOR (5 cols on large) */}
                <div className="lg:col-span-5 flex flex-col items-center">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 text-center">Simulador Mobile</span>
                  
                  {/* Smartphone Frame Wrapper */}
                  <div className="relative w-full max-w-[280px] h-[520px] rounded-[38px] border-[8px] border-slate-900 bg-slate-950 p-2 shadow-2xl overflow-hidden ring-4 ring-indigo-100 flex flex-col justify-between">
                    {/* Speaker & Camera notches */}
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-28 h-4 bg-slate-900 rounded-b-xl z-30 flex items-center justify-center">
                      <div className="w-8 h-1 bg-slate-800 rounded-full mb-1" />
                    </div>

                    {/* Cellular Wallpaper and Screen Content */}
                    <div className="flex-1 w-full h-full rounded-[28px] overflow-hidden bg-cover bg-center flex flex-col justify-between relative p-3 pt-6 pb-2"
                      style={{ backgroundImage: 'linear-gradient(to bottom, rgba(30, 41, 59, 1), rgba(15, 23, 42, 1))' }}
                    >
                      {/* Top status bar inside phone screen */}
                      <div className="flex items-center justify-between text-[10px] font-mono font-bold text-indigo-200 z-10 px-1 opacity-90">
                        <span>19:15</span>
                        <div className="flex items-center gap-1">
                          <span>📶 5G</span>
                          <span>🔋 96%</span>
                        </div>
                      </div>

                      {/* Middle Area: Dynamic Push notification screen list */}
                      <div className="flex-1 flex flex-col justify-center space-y-2.5 my-3 overflow-y-auto max-h-[340px] px-0.5 z-10">
                        {pushEnabled ? (
                          <>
                            {pushTopics.classes && (
                              <div className="bg-slate-900/80 backdrop-blur-md rounded-xl p-3 border border-slate-800/40 text-white space-y-0.5 shadow-md shadow-black/30 text-[10px] transition">
                                <div className="flex items-center justify-between text-indigo-400 font-bold mb-0.5">
                                  <span className="flex items-center gap-1">📖 LOUVOR E APRENDIZADO</span>
                                  <span>Horários</span>
                                </div>
                                <h4 className="font-bold text-slate-100">Aula HOJE: Teologia Sistemática 📚</h4>
                                <p className="text-slate-300 font-medium leading-tight">Graça e Paz! Hoje é dia de aula bíblica às 19h30. Prepare suas anotações e participe!</p>
                              </div>
                            )}

                            {pushTopics.birthdays && (
                              <div className="bg-slate-900/80 backdrop-blur-md rounded-xl p-3 border border-slate-800/40 text-white space-y-0.5 shadow-md shadow-black/30 text-[10px] transition">
                                <div className="flex items-center justify-between text-emerald-400 font-bold mb-0.5">
                                  <span className="flex items-center gap-1">🎂 COMUNHÃO & IRMÃOS</span>
                                  <span>Hoje</span>
                                </div>
                                <h4 className="font-bold text-slate-100">Aniversariante do Mês! 🎈</h4>
                                <p className="text-slate-300 font-medium leading-tight">Vários alunos da Faculdade completam aniversário em Junho. Não perca a comunhão!</p>
                              </div>
                            )}

                            {pushTopics.finance && (
                              <div className="bg-slate-900/80 backdrop-blur-md rounded-xl p-3 border border-slate-800/40 text-white space-y-0.5 shadow-md shadow-black/30 text-[10px] transition">
                                <div className="flex items-center justify-between text-amber-500 font-bold mb-0.5">
                                  <span className="flex items-center gap-1">📚 CONTROLE FINANCEIRO</span>
                                  <span>2 dias</span>
                                </div>
                                <h4 className="font-bold text-slate-100">Entrega do Livro Próxima</h4>
                                <p className="text-slate-300 font-medium leading-tight">O vencimento de seu livro didático está próximo. Faça o PIX rápido pelo aplicativo!</p>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-center py-6 text-slate-500 space-y-1">
                            <p className="text-xl">📴</p>
                            <p className="text-[10px] font-bold">Push Desativado</p>
                            <p className="text-[9px]">Ative o botão geral na esquerda.</p>
                          </div>
                        )}
                      </div>

                      {/* Slide Lock-screen indicator at bottom */}
                      <div className="text-center text-[10px] text-slate-400 font-semibold z-10 animate-pulse border-t border-slate-800/40 pt-1.5 mt-1">
                        📱 Arraste para acessar o Portal
                      </div>
                    </div>
                  </div>

                  {/* Manual trigger section */}
                  <div className="mt-4 w-full flex flex-col gap-2 max-w-[280px]">
                    <button
                      type="button"
                      disabled={!pushEnabled}
                      onClick={() => {
                        // Play generative synthezised chime sound
                        try {
                          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
                          const oscillator = audioCtx.createOscillator();
                          const gainNode = audioCtx.createGain();
                          
                          oscillator.type = 'sine';
                          oscillator.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
                          oscillator.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1); // E5
                          
                          gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
                          gainNode.gain.exponentialRampToValueAtTime(0.005, audioCtx.currentTime + 0.45);
                          
                          oscillator.connect(gainNode);
                          gainNode.connect(audioCtx.destination);
                          
                          oscillator.start();
                          oscillator.stop(audioCtx.currentTime + 0.5);
                        } catch (err) {
                          console.log("Audio contexts blocked or non-existent in frame");
                        }

                        // Triggers real web notification if allowed
                        if (realPushGranted && 'Notification' in window) {
                          new Notification('Faculdade Logos de Teologia', {
                            body: 'Bip Real! Lembrete: Sua Aula Teológica se inicia hoje às 19:30h!',
                            tag: 'biblical-class-re',
                            icon: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face'
                          });
                        }

                        showToast('📡 Sinal enviado! Alerta Push e Chime disparados no simulador.');
                      }}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-md shadow-indigo-100"
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      Testar Disparo Push
                    </button>
                    <p className="text-[9.5px] text-slate-400 text-center leading-normal">
                      O teste toca um BIP sintetizado no alto-falante e ativa o visual do smartphone simulado.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* SUCCESS TOAST NOTIFY OVERLAY */}
      {successNotification && (
        <div className="fixed bottom-6 right-6 bg-slate-900 border border-slate-800 text-white px-5 py-4 rounded-2xl shadow-xl flex items-center gap-3 z-50 animate-bounce max-w-sm">
          <div className="bg-emerald-500 p-1.5 rounded-lg text-white">
            <Check className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-100">{successNotification}</p>
          </div>
        </div>
      )}

    </div>

    {certificateModal && currentStudent && (
      <CertificatePreviewModal 
        isOpen={certificateModal.isOpen}
        onClose={() => setCertificateModal(null)}
        student={currentStudent}
        courseType={certificateModal.type}
        isExample={certificateModal.isExample}
      />
    )}
    </>
  );
}
