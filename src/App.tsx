import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Users, 
  Award, 
  DollarSign, 
  Menu, 
  Grid, 
  Calendar, 
  LogOut, 
  Sliders, 
  ShieldAlert, 
  Smartphone, 
  Sparkles, 
  Lock, 
  CheckCircle,
  GraduationCap,
  Layers,
  Cake,
  Mail,
  Settings,
  Database,
  Download,
  Upload,
  Clock
} from 'lucide-react';

// Imports types
import { Student, Subject, ClassGroup, GradeRecord, AttendanceRecord, PaymentRecord, CashTransaction, AcademicActivity, LessonPlanRecord, AuditLog, LoginRecord } from './types';

// Imports initializers and helpers
import { 
  INITIAL_STUDENTS, 
  INITIAL_SUBJECTS, 
  INITIAL_CLASSES, 
  INITIAL_GRADES, 
  INITIAL_PAYMENTS, 
  INITIAL_TRANSACTIONS,
  INITIAL_ACTIVITIES,
  INITIAL_LOGIN_LOGS,
  generateInitialAttendance, 
  loadData, 
  saveData 
} from './mockData';

// Imports view modules
import DashboardView from './components/DashboardView';
import StudentListView from './components/StudentListView';
import AttendanceView from './components/AttendanceView';
import GradesView from './components/GradesView';
import FinancialView from './components/FinancialView';
import SubjectsView from './components/SubjectsView';
import ClassesView from './components/ClassesView';
import StudentPortalView from './components/StudentPortalView';
import AcademicCalendarView from './components/AcademicCalendarView';
import { SettingsView } from './components/SettingsView';
import AccessLogsView from './components/AccessLogsView';
import logoImage from './assets/images/dabar_theology_logo_1781277925734.jpg';

export default function App() {
  // --- STATE PERSISTENCE ---
  const [students, setStudents] = useState<Student[]>(() => 
    loadData<Student[]>('LOGOS_STUDENTS', INITIAL_STUDENTS)
  );
  
  const [lessonPlans, setLessonPlans] = useState<LessonPlanRecord[]>(() => 
    loadData<LessonPlanRecord[]>('LOGOS_LESSON_PLANS', [])
  );
  
  const [subjects, setSubjects] = useState<Subject[]>(() => {
    const loaded = loadData<Subject[]>('LOGOS_SUBJECTS', INITIAL_SUBJECTS);
    const baseSubjects = (!loaded || loaded.length < 10) ? INITIAL_SUBJECTS : loaded;
    
    // Force all subjects to have 'Pb. Marcelo Reinert' as teacher
    const forcedSubjects = baseSubjects.map(sub => ({
      ...sub,
      teacherName: 'Pb. Marcelo Reinert'
    }));
    
    saveData('LOGOS_SUBJECTS', forcedSubjects);
    return forcedSubjects;
  });
  
  const [classes, setClasses] = useState<ClassGroup[]>(() => {
    const loaded = loadData<ClassGroup[]>('LOGOS_CLASSES', INITIAL_CLASSES);
    if (!loaded || loaded.length === 0 || (loaded[0] && loaded[0].subjectIds.length < 10)) {
      saveData('LOGOS_CLASSES', INITIAL_CLASSES);
      return INITIAL_CLASSES;
    }
    return loaded;
  });
  
  const [grades, setGrades] = useState<GradeRecord[]>(() => {
    const loaded = loadData<GradeRecord[]>('LOGOS_GRADES', INITIAL_GRADES);
    if (!loaded || loaded.length < 50) {
      saveData('LOGOS_GRADES', INITIAL_GRADES);
      return INITIAL_GRADES;
    }
    return loaded;
  });
  
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => 
    loadData<AttendanceRecord[]>('LOGOS_ATTENDANCE', generateInitialAttendance())
  );
  
  const [payments, setPayments] = useState<PaymentRecord[]>(() => 
    loadData<PaymentRecord[]>('LOGOS_PAYMENTS', INITIAL_PAYMENTS)
  );

  const [transactions, setTransactions] = useState<CashTransaction[]>(() => 
    loadData<CashTransaction[]>('LOGOS_TRANSACTIONS', INITIAL_TRANSACTIONS)
  );

  const [activities, setActivities] = useState<AcademicActivity[]>(() => 
    loadData<AcademicActivity[]>('LOGOS_ACTIVITIES', INITIAL_ACTIVITIES)
  );

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => 
    loadData<AuditLog[]>('LOGOS_AUDIT', [])
  );

  const [loginLogs, setLoginLogs] = useState<LoginRecord[]>(() => 
    loadData<LoginRecord[]>('LOGOS_LOGIN_LOGS', INITIAL_LOGIN_LOGS)
  );

  const recordLogin = (userType: 'Docente' | 'Aluno', identifier: string, name: string) => {
    const newRecord: LoginRecord = {
      id: `login-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString(),
      userType,
      identifier,
      name
    };
    setLoginLogs(prev => [newRecord, ...prev]);
  };

  const handleClearLoginLogs = () => {
    setLoginLogs([]);
  };

  const writeAuditLog = (action: string, details: string) => {
    if (!loggedInDocenteEmail) return;
    const newLog: AuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString(),
      docenteEmail: loggedInDocenteEmail,
      action,
      details
    };
    setAuditLogs(prev => [newLog, ...prev].slice(0, 100)); // Keep last 100 logs
  };

  // Switch between Admin context and Student portal context
  const [currentRole, setCurrentRole] = useState<'admin' | 'student'>('admin');

  // Docente authentication based on registered student/docente list
  const [loggedInDocenteEmail, setLoggedInDocenteEmail] = useState<string | null>(() => 
    loadData<string | null>('LOGOS_LOGGED_IN_DOCENTE', null)
  );
  const [docenteLoginEmailInput, setDocenteLoginEmailInput] = useState('');
  const [docenteLoginError, setDocenteLoginError] = useState('');

  const handleDocenteLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const emailLower = docenteLoginEmailInput.trim().toLowerCase();
    if (!emailLower) {
      setDocenteLoginError('Por favor, informe seu e-mail.');
      return;
    }
    
    // Check in database/list of Alunos Ativos/Inativos
    const existsInDatabase = students.some(s => s.email.toLowerCase().trim() === emailLower);
    
    // Also support default admin emails for backward compatibility or direct access
    const isDefaultHardcoded = emailLower === 'reinert351@gmail.com' || emailLower === 'marceloreinert@gmail.com';
    
    if (existsInDatabase || isDefaultHardcoded) {
      setLoggedInDocenteEmail(emailLower);
      setDocenteLoginError('');
      
      const matchedStudent = students.find(s => s.email.toLowerCase().trim() === emailLower);
      let docenteName = 'Instituição / Admin';
      if (matchedStudent) {
        docenteName = `${matchedStudent.name} (Docente)`;
      } else if (emailLower === 'reinert351@gmail.com') {
        docenteName = 'Pb. Marcelo Reinert';
      } else if (emailLower === 'marceloreinert@gmail.com') {
        docenteName = 'Pb. Marcelo Reinert (Presb.)';
      }
      recordLogin('Docente', emailLower, docenteName);
    } else {
      setDocenteLoginError('E-mail não encontrado no cadastro administrativo. Use um e-mail de aluno/admin registrado.');
    }
  };
  
  // Sidebar tab for admin view
  const [activeAdminTab, setActiveAdminTab] = useState<string>('painel');

  // Dismissed birthday alerts list
  const [dismissedBdayAlerts, setDismissedBdayAlerts] = useState<string[]>([]);

  // Calculate students with birthdays 3 days before (or up to 3 days from now)
  const birthdayAlerts = React.useMemo(() => {
    const alerts: { student: Student; daysRemaining: number; formattedDate: string }[] = [];
    const today = new Date();
    const todayNormalized = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    students.forEach(student => {
      if (!student.birthDate || student.status !== 'Ativo') return;
      try {
        const [by, bm, bd] = student.birthDate.split('-').map(Number);
        if (!bm || !bd) return;

        // Construct birthday this year
        let bdayTemp = new Date(today.getFullYear(), bm - 1, bd);
        let diffTime = bdayTemp.getTime() - todayNormalized.getTime();
        let diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
          // Try next year's birthday
          bdayTemp = new Date(today.getFullYear() + 1, bm - 1, bd);
          diffTime = bdayTemp.getTime() - todayNormalized.getTime();
          diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
        }

        // We show alerts for today (0), tomorrow (1), in 2 days (2), and exactly 3 days away (3).
        if (diffDays >= 0 && diffDays <= 3) {
          const formattedBday = `${String(bd).padStart(2, '0')}/${String(bm).padStart(2, '0')}`;
          alerts.push({
            student,
            daysRemaining: diffDays,
            formattedDate: formattedBday
          });
        }
      } catch (e) {
        // ignore parsing error
      }
    });
    // Sort so closest birthdays come first
    return alerts.sort((a, b) => a.daysRemaining - b.daysRemaining);
  }, [students]);

  const visibleBirthdayAlerts = React.useMemo(() => {
    return birthdayAlerts.filter(a => !dismissedBdayAlerts.includes(a.student.id));
  }, [birthdayAlerts, dismissedBdayAlerts]);

  // Sync state to localStorage whenever modified
  useEffect(() => {
    saveData('LOGOS_STUDENTS', students);
  }, [students]);

  useEffect(() => {
    saveData('LOGOS_SUBJECTS', subjects);
  }, [subjects]);

  useEffect(() => {
    saveData('LOGOS_CLASSES', classes);
  }, [classes]);

  useEffect(() => {
    saveData('LOGOS_GRADES', grades);
  }, [grades]);

  useEffect(() => {
    saveData('LOGOS_ATTENDANCE', attendance);
  }, [attendance]);

  useEffect(() => {
    saveData('LOGOS_PAYMENTS', payments);
  }, [payments]);

  useEffect(() => {
    saveData('LOGOS_TRANSACTIONS', transactions);
  }, [transactions]);

  useEffect(() => {
    saveData('LOGOS_ACTIVITIES', activities);
  }, [activities]);

  useEffect(() => {
    saveData('LOGOS_LESSON_PLANS', lessonPlans);
  }, [lessonPlans]);

  useEffect(() => {
    saveData('LOGOS_AUDIT', auditLogs);
  }, [auditLogs]);

  useEffect(() => {
    saveData('LOGOS_LOGGED_IN_DOCENTE', loggedInDocenteEmail);
  }, [loggedInDocenteEmail]);

  useEffect(() => {
    saveData('LOGOS_LOGIN_LOGS', loginLogs);
  }, [loginLogs]);

  // Auto-reset once to a complete clean slate (zero pre-loaded students)
  useEffect(() => {
    const isFirstTimeCleanRun = localStorage.getItem('LOGOS_CLEAN_SLATE_RESET_V2') !== 'true';
    if (isFirstTimeCleanRun) {
      localStorage.setItem('LOGOS_STUDENTS', JSON.stringify([]));
      localStorage.setItem('LOGOS_GRADES', JSON.stringify([]));
      localStorage.setItem('LOGOS_ATTENDANCE', JSON.stringify([]));
      localStorage.setItem('LOGOS_PAYMENTS', JSON.stringify([]));
      localStorage.setItem('LOGOS_TRANSACTIONS', JSON.stringify([]));
      localStorage.setItem('LOGOS_LOGIN_LOGS', JSON.stringify([]));
      localStorage.setItem('LOGOS_CLEAN_SLATE_RESET_V2', 'true');
      
      setStudents([]);
      setGrades([]);
      setAttendance([]);
      setPayments([]);
      setTransactions([]);
      setLoginLogs([]);
    }
  }, []);

  // Migration effect to update old 'Mensalidade' data to 'Venda de Livros' or 'Ofertas nas aulas' and update 120.00 to 60.00
  useEffect(() => {
    let changedPayments = false;
    setPayments(prev => {
      const newPayments = prev.map(p => {
        if (p.value === 120) {
          changedPayments = true;
          return { ...p, value: 60 };
        }
        return p;
      });
      return changedPayments ? newPayments : prev;
    });

    let changedTx = false;
    setTransactions(prev => {
      const newTx = prev.map(tx => {
        let newTxData = { ...tx };
        if (tx.category === 'Mensalidade' || tx.description.includes('Mensalidade')) {
          newTxData.category = 'Venda de Livros';
          newTxData.description = newTxData.description.replace(/Mensalidade/g, 'Livro');
          changedTx = true;
        }
        if (tx.value === 120) {
          newTxData.value = 60;
          changedTx = true;
        }
        return newTxData;
      });
      return changedTx ? newTx : prev;
    });
  }, []);



  // --- CRUD BUSINESS HANDLERS ---

  // 1. ADD STUENT (With default blank grade and attendance slots)
  const handleAddStudent = (newStudentData: Omit<Student, 'id' | 'registrationNumber' | 'enrollmentDate'>) => {
    const nextSeq = students.length + 1;
    const registrationNumber = `MAT-2026-${String(nextSeq).padStart(3, '0')}`;
    const enrollmentDate = '2026-06-07'; // current simulated system date
    const id = `std-new-${Date.now()}`;

    const newStudent: Student = {
      ...newStudentData,
      id,
      registrationNumber,
      enrollmentDate
    };

    setStudents(prev => [newStudent, ...prev]);

    // Preseed blank average-grade sheets for subjects
    const newGrades: GradeRecord[] = subjects.map(sub => ({
      id: `grd-gen-${Date.now()}-${sub.id}-${id}`,
      studentId: id,
      subjectId: sub.id,
      term1Grade: null,
      term2Grade: null,
      term3Grade: null,
      term4Grade: null,
      examGrade: null,
      averageGrade: null,
      status: 'Reprovado'
    }));
    
    setGrades(prev => [...newGrades, ...prev]);
    writeAuditLog('Inclusão de Aluno', `Adicionado novo discente: ${newStudentData.name}`);
  };

  // 2. EDIT STUDENT PROFILE DETAILS
  const handleEditStudent = (updatedStudent: Student) => {
    setStudents(prev => prev.map(s => s.id === updatedStudent.id ? updatedStudent : s));
    writeAuditLog('Atualização de Cadastro', `Ficha do aluno modificada: ${updatedStudent.name}`);
  };

  // 3. SECURELY DELETE STUDENT (Cascading removal from all secondary ledgers)
  const handleDeleteStudent = (studentId: string) => {
    const sName = students.find(s=>s.id === studentId)?.name || studentId;
    setStudents(prev => prev.filter(s => s.id !== studentId));
    setGrades(prev => prev.filter(g => g.studentId !== studentId));
    setAttendance(prev => prev.filter(a => a.studentId !== studentId));
    setPayments(prev => prev.filter(p => p.studentId !== studentId));
    writeAuditLog('Exclusão de Aluno', `Discente permanentemente removido: ${sName}`);
  };

  // 4. SAVE COMPLETED ATTENDANCE SHEET FOR A SUBJECT/DATE
  const handleSaveAttendance = (updatedRecords: AttendanceRecord[]) => {
    setAttendance(prev => {
      const copy = [...prev];
      updatedRecords.forEach(record => {
        const foundIdx = copy.findIndex(
          r => r.date === record.date && r.studentId === record.studentId && r.subjectId === record.subjectId
        );
        if (foundIdx > -1) {
          copy[foundIdx] = record;
        } else {
          copy.push(record);
        }
      });
      return copy;
    });
    writeAuditLog('Registro de Frequência', `Lançamento de diário de classe atualizado.`);
  };

  // 5. STUDENT SELF SIGN-OFF (Attending via portal calendar clicks)
  const handleAddOrUpdateAttendance = (record: AttendanceRecord) => {
    setAttendance(prev => {
      const index = prev.findIndex(r => r.date === record.date && r.studentId === record.studentId);
      if (index > -1) {
        const copy = [...prev];
        copy[index] = record;
        return copy;
      }
      return [record, ...prev];
    });
    // no audit log since students trigger this in theory, but maybe? 
  };

  // 6. SAVE GRADE SHEET RECORDS
  const handleSaveGrades = (updatedGrades: GradeRecord[]) => {
    setGrades(prev => {
      const copy = [...prev];
      updatedGrades.forEach(record => {
        const foundIdx = copy.findIndex(
          g => g.studentId === record.studentId && g.subjectId === record.subjectId
        );
        if (foundIdx > -1) {
          copy[foundIdx] = record;
        } else {
          copy.push(record);
        }
      });
      return copy;
    });
    writeAuditLog('Notas Cursadas', `Lançamento de boletim notas ou recuperação.`);
  };

  // 7. RECORD COMPLETED TUITION FEES
  const handleTogglePaymentStatus = (paymentId: string) => {
    setPayments(prev => prev.map(p => {
      if (p.id === paymentId) {
        return {
          ...p,
          status: 'Pago',
          paymentDate: '2026-06-07' // transaction today
        };
      }
      return p;
    }));
    writeAuditLog('Baixa Financeira', `Pagamento processado e baixado no sistema: ${paymentId}`);
  };

  const handleUpdatePayment = (updatedPayment: PaymentRecord) => {
    setPayments(prev => prev.map(p => p.id === updatedPayment.id ? updatedPayment : p));
    writeAuditLog('Atualização Financeira', `Dados do pagamento/mensalidade alterados: ${updatedPayment.id}`);
  };

  const handleDeletePayment = (paymentId: string) => {
    setPayments(prev => prev.filter(p => p.id !== paymentId));
    writeAuditLog('Exclusão de Faturamento', `Cobrança apagada do sistema: ${paymentId}`);
  };

  const handleAddPayments = (newPayments: Omit<PaymentRecord, 'id'>[]) => {
    const withIds = newPayments.map(p => ({
      ...p,
      id: `pay-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
    }));
    setPayments(prev => [...withIds, ...prev]);
    const studentNamesDesc = newPayments.length <= 3 
      ? newPayments.map(p => {
          const s = students.find(std => std.id === p.studentId);
          return `${s?.name || 'Aluno'} (${p.month})`;
        }).join(', ')
      : `${newPayments.length} registros`;
    writeAuditLog('Lançamento de Livros', `Geração de lançamentos para: ${studentNamesDesc}`);
  };

  // 8. SUBJECT CRUD METHODS
  const handleAddSubject = (newSub: Omit<Subject, 'id'>) => {
    const id = `sub-${Date.now()}`;
    const subject: Subject = { ...newSub, id };
    setSubjects(prev => [...prev, subject]);

    // Preseed blank average-grade sheets for all students for this subject
    setGrades(prev => {
      const newGrades: GradeRecord[] = students.map(s => ({
        id: `grd-gen-${Date.now()}-${id}-${s.id}`,
        studentId: s.id,
        subjectId: id,
        term1Grade: null,
        term2Grade: null,
        term3Grade: null,
        term4Grade: null,
        examGrade: null,
        averageGrade: null,
        status: 'Reprovado'
      }));
      return [...newGrades, ...prev];
    });
    writeAuditLog('Nova Disciplina', `Disciplina incluída na grade acadêmica: ${subject.name}`);
  };

  const handleEditSubject = (updated: Subject) => {
    setSubjects(prev => prev.map(s => s.id === updated.id ? updated : s));
    writeAuditLog('Edição de Disciplina', `Dados da disciplina alterados: ${updated.name}`);
  };

  const handleDeleteSubject = (id: string) => {
    const sName = subjects.find(s=>s.id === id)?.name || id;
    setSubjects(prev => prev.filter(s => s.id !== id));
    setGrades(prev => prev.filter(g => g.subjectId !== id));
    setAttendance(prev => prev.filter(a => a.subjectId !== id));
    writeAuditLog('Exclusão de Disciplina', `Disciplina excluída permanentemente: ${sName}`);
  };

  // 9. CASH LEDGER CRUD METHODS
  const handleAddTransaction = (newTx: Omit<CashTransaction, 'id'>) => {
    const transaction: CashTransaction = {
      ...newTx,
      id: `tx-${Date.now()}`
    };
    setTransactions(prev => [transaction, ...prev]);
    writeAuditLog('Lançamento Livro-Caixa', `Novo registro: [${newTx.type}] ${newTx.description}`);
  };

  const handleEditTransaction = (updated: CashTransaction) => {
    setTransactions(prev => prev.map(t => t.id === updated.id ? updated : t));
    writeAuditLog('Edição Livro-Caixa', `Alteração do registro contábil: ${updated.description}`);
  };
  
  const handleRestoreData = (parsedData: any) => {
    if (parsedData.LOGOS_STUDENTS) setStudents(parsedData.LOGOS_STUDENTS);
    if (parsedData.LOGOS_SUBJECTS) setSubjects(parsedData.LOGOS_SUBJECTS);
    if (parsedData.LOGOS_CLASSES) setClasses(parsedData.LOGOS_CLASSES);
    if (parsedData.LOGOS_GRADES) setGrades(parsedData.LOGOS_GRADES);
    if (parsedData.LOGOS_ATTENDANCE) setAttendance(parsedData.LOGOS_ATTENDANCE);
    if (parsedData.LOGOS_PAYMENTS) setPayments(parsedData.LOGOS_PAYMENTS);
    if (parsedData.LOGOS_TRANSACTIONS) setTransactions(parsedData.LOGOS_TRANSACTIONS);
    if (parsedData.LOGOS_ACTIVITIES) setActivities(parsedData.LOGOS_ACTIVITIES);
    if (parsedData.LOGOS_LESSON_PLANS) setLessonPlans(parsedData.LOGOS_LESSON_PLANS);
    if (parsedData.LOGOS_LOGGED_IN_DOCENTE) setLoggedInDocenteEmail(parsedData.LOGOS_LOGGED_IN_DOCENTE);
    writeAuditLog('Backup Restaurado', 'O sistema restaurou os dados a partir de um arquivo JSON local.');
  };

  const handleDeleteTransaction = (id: string) => {
    const txInfo = transactions.find(t=>t.id===id)?.description || id;
    setTransactions(prev => prev.filter(t => t.id !== id));
    writeAuditLog('Exclusão Livro-Caixa', `Registro contábil excluído: ${txInfo}`);
  };

  return (
    <div className="min-h-screen bg-indigo-50/30 flex flex-col font-sans antialiased text-slate-800" id="logos-academy-app">
      
      {/* GLOBAL HIGH-CONTRAST TOP BRANDING BAR */}
      <header className="bg-indigo-950 border-b border-indigo-900/50 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 sticky top-0 z-40 shadow-[0_4px_20px_-10px_rgba(30,27,75,0.5)]">
        
        {/* Brand identity */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl shadow-inner border border-indigo-400/20 overflow-hidden shrink-0">
            <img src={logoImage} alt="Dabar Logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="text-md sm:text-lg font-display tracking-tight text-white/90 font-bold leading-tight">
              Dabar <span className="text-gold-400 font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-yellow-400">Escola Teológica</span>
            </h1>
            <p className="text-[10px] sm:text-[11px] font-medium text-indigo-300/80 tracking-wide">TEOLOGIA & HERANÇA CULTURAL</p>
          </div>
        </div>

        {/* Global profile/clearance switcher (Toggle Role) */}
        <div className="flex items-center gap-1.5 p-1 bg-indigo-900/50 border border-indigo-800/60 rounded-xl">
          <button
            onClick={() => setCurrentRole('admin')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all duration-150 flex items-center gap-1.5 ${
              currentRole === 'admin'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-indigo-200 hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Acesso Docente</span>
          </button>
          
          <button
            onClick={() => setCurrentRole('student')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all duration-150 flex items-center gap-1.5 ${
              currentRole === 'student'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-indigo-200 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Portal do Aluno</span>
          </button>
        </div>

      </header>

      {/* GLOBAL BIRTHDAY NOTIFICATION BANNER */}
      {visibleBirthdayAlerts.length > 0 && (
        <div className="bg-pink-50 border-b border-pink-102 px-6 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs animate-fade-in z-30" id="birthday-alerts-banner">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="p-2 bg-pink-100 text-pink-600 rounded-xl animate-pulse">
              <Cake className="w-5 h-5" />
            </div>
            <div className="text-xs text-slate-700 leading-relaxed">
              <span className="font-extrabold text-pink-800 uppercase tracking-widest text-[10px] block mb-0.5">⚠️ Alerta de Aniversário Próximo</span>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                {visibleBirthdayAlerts.map((alert) => {
                  let alertText = "";
                  if (alert.daysRemaining === 0) {
                    alertText = `Hoje é aniversário de ${alert.student.name}! 🥳 Parabéns!`;
                  } else if (alert.daysRemaining === 1) {
                    alertText = `Amanhã é aniversário de ${alert.student.name}!`;
                  } else if (alert.daysRemaining === 2) {
                    alertText = `O aniversário de ${alert.student.name} é em 2 dias (${alert.formattedDate}).`;
                  } else if (alert.daysRemaining === 3) {
                    alertText = `ALERTA (3 dias antes): O aniversário de ${alert.student.name} é em 3 dias (${alert.formattedDate})!`;
                  }
                  
                  return (
                    <div key={'alert-' + alert.student.id} className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-pink-100 shadow-3xs">
                      <span className="font-bold text-slate-800 text-[11px]">{alertText}</span>
                      <button 
                        onClick={() => setDismissedBdayAlerts(prev => [...prev, alert.student.id])}
                        className="text-slate-400 hover:text-rose-500 font-bold transition ml-1 text-xs"
                        title="Dispensar"
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <button 
            onClick={() => setDismissedBdayAlerts(prev => [...prev, ...visibleBirthdayAlerts.map(a => a.student.id)])}
            className="text-[10px] font-bold text-pink-700 hover:text-pink-900 transition underline shrink-0 cursor-pointer self-end sm:self-auto"
          >
            Dispensar todos
          </button>
        </div>
      )}

      {/* CORE WORKSPACE FRAME CONTAINER */}
      <div className="flex-1 flex flex-col lg:flex-row">
        
        {/* SUBTREE 1: ADMINISTRATOR SIDEBAR AND NAV GRID */}
        {currentRole === 'admin' ? (
          !loggedInDocenteEmail ? (
            /* DOCENTE LOGIN PAGE */
            <div className="flex-1 flex items-center justify-center p-6 bg-slate-50 relative min-h-[70vh] overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-64 bg-indigo-950/5"></div>
              
              <div className="w-full max-w-[400px] bg-white rounded-3xl shadow-2xl shadow-indigo-900/5 p-8 border border-white relative z-10 animate-fade-in my-8 backdrop-blur-xl">
                <div className="text-center space-y-4 mb-8">
                  <div className="w-16 h-16 rounded-2xl mx-auto shadow-inner border border-indigo-100 overflow-hidden">
                    <img src={logoImage} alt="Dabar Logo" className="w-full h-full object-cover" />
                  </div>
                  <h3 className="text-lg font-display font-extrabold text-slate-800 tracking-tight">Portal Docente</h3>
                  <p className="text-xs text-slate-500 leading-relaxed max-w-[260px] mx-auto font-medium">
                    Acesso exclusivo à gestão acadêmica, lançamento de notas e acompanhamento financeiro.
                  </p>
                </div>

                <form onSubmit={handleDocenteLogin} className="space-y-5">
                  <div className="space-y-2">
                    <label className="block text-[11px] font-black tracking-widest text-slate-400 uppercase">E-mail Cadastrado</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Mail className="h-4.5 w-4.5 text-slate-400" />
                      </div>
                      <input
                        type="email"
                        value={docenteLoginEmailInput}
                        onChange={(e) => {
                          setDocenteLoginEmailInput(e.target.value);
                          if (docenteLoginError) setDocenteLoginError('');
                        }}
                        placeholder="nome@dabar.edu.br"
                        className="w-full min-h-[48px] pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition-all"
                      />
                    </div>
                    {docenteLoginError && (
                      <p className="text-rose-600 text-[11px] font-bold mt-2 flex items-center gap-1.5 animate-fade-in bg-rose-50 p-2 rounded-lg border border-rose-100">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
                        {docenteLoginError}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="w-full min-h-[48px] bg-gradient-to-r from-indigo-600 to-indigo-800 hover:from-indigo-700 hover:to-indigo-900 text-white font-bold py-3 px-4 rounded-xl transition-all duration-300 shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer text-sm transform hover:-translate-y-0.5"
                  >
                    <span>Autenticar</span>
                  </button>
                </form>

                <div className="mt-8 pt-6 border-t border-slate-100 text-[11px] space-y-3">
                  <button 
                    type="button"
                    onClick={() => setCurrentRole('student')}
                    className="text-indigo-600 font-extrabold hover:underline block text-center w-full"
                  >
                    Ir para o Portal do Aluno
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Sidebar Left panel */}
              <aside className="w-full lg:w-[280px] bg-[#0c0a20] text-indigo-50 flex flex-col justify-between border-r border-[#1a1738] shadow-2xl z-10 shrink-0">
              
              <div className="p-6 space-y-7">
                <div>
                  <span className="text-[10px] font-black text-indigo-500/80 uppercase tracking-widest block mb-1.5">MÓDULO INTERNO</span>
                  <p className="text-[13px] font-medium text-indigo-200/90 leading-tight">Gestão e Lançamento Acadêmico</p>
                </div>

                {/* Sidebar Navigation */}
                <nav className="space-y-2" id="admin-sidebar-nav">
                  {([
                    { id: 'painel', label: 'Painel de Controle', icon: Grid },
                    { id: 'alunos', label: 'Alunos Ativos', icon: Users, badge: students.filter(s=>s.status==='Ativo').length },
                    { id: 'turmas', label: 'Turmas de Aula', icon: Layers },
                    { id: 'disciplinas', label: 'Disciplinas', icon: BookOpen },
                    { id: 'frequencia', label: 'Controle de Frequência', icon: Calendar },
                    { id: 'notas', label: 'Boletim de Notas', icon: Award },
                    { id: 'financeiro', label: 'Fluxo Financeiro', icon: DollarSign },
                    { id: 'calendario_academico', label: 'Calendário Letivo', icon: Calendar },
                    { id: 'logs_acesso', label: 'Logs de Acesso', icon: Clock },
                    { id: 'configuracoes', label: 'Backup do Sistema', icon: Database }
                  ]).map((item, index) => {
                    const Icon = item.icon;
                    const isActive = activeAdminTab === item.id;
                    return (
                      <button
                        key={`${item.id}-${index}`}
                        onClick={() => setActiveAdminTab(item.id)}
                        className={`w-full text-left px-4 py-3 text-xs font-semibold rounded-2xl flex items-center justify-between transition-all duration-300 group ${
                          isActive
                            ? 'bg-gradient-to-r from-indigo-900/60 to-transparent text-white border-l-4 border-indigo-500 shadow-sm'
                            : 'text-indigo-300/70 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={`w-4.5 h-4.5 transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-amber-400' : 'text-indigo-400/60'}`} />
                          <span className={`${isActive ? 'font-bold tracking-wide' : 'font-medium font-sans'}`}>{item.label}</span>
                        </div>
                        {item.badge !== undefined && (
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold transition-all duration-300 ${
                            isActive ? 'bg-amber-400 text-amber-950 shadow-sm' : 'bg-indigo-900/50 text-indigo-400/80 group-hover:bg-indigo-800/80 group-hover:text-amber-200'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Sidebar bottom signature profile */}
              <div className="p-6 border-t border-[#1a1738] bg-[#0c0a20]/80 flex flex-col gap-3 shrink-0 backdrop-blur-md">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-800 text-white font-extrabold text-sm flex items-center justify-center border border-indigo-400/30 shadow-lg shrink-0">
                    {loggedInDocenteEmail ? loggedInDocenteEmail.substring(0, 2).toUpperCase() : 'AD'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-bold text-white/90 truncate tracking-tight" title={loggedInDocenteEmail || 'Prof. Administrador'}>
                      {loggedInDocenteEmail || 'Prof. Administrador'}
                    </div>
                    <div className="text-[10px] text-emerald-400 font-medium mt-1 flex items-center gap-1.5 opacity-80">
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                      <span>Sessão Ativa</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setLoggedInDocenteEmail(null);
                    setDocenteLoginEmailInput('');
                  }}
                  className="w-full py-2.5 px-3 bg-red-500/5 hover:bg-red-500/15 text-red-400/80 hover:text-red-300 text-[11px] font-bold rounded-xl border border-red-500/10 hover:border-red-500/30 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  <LogOut className="w-4 h-4 opacity-80" />
                  <span>Encerrar Sessão</span>
                </button>
              </div>

            </aside>

            {/* Admin visual component container */}
            <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
              {activeAdminTab === 'painel' && (
                <DashboardView 
                  students={students} 
                  subjects={subjects} 
                  payments={payments}
                  grades={grades}
                  lessonPlans={lessonPlans}
                  onNavigate={(tab) => setActiveAdminTab(tab)} 
                />
              )}
              
              {activeAdminTab === 'alunos' && (
                <StudentListView 
                  students={students} 
                  classes={classes}
                  onAddStudent={handleAddStudent} 
                  onEditStudent={handleEditStudent} 
                  onDeleteStudent={handleDeleteStudent} 
                />
              )}
              
              {activeAdminTab === 'turmas' && (
                <ClassesView 
                  classes={classes} 
                  students={students} 
                  subjects={subjects} 
                  onAddClassGroup={(newCls) => {
                    const id = `cls-${Date.now()}`;
                    setClasses(prev => [...prev, { ...newCls, id }]);
                    writeAuditLog('Nova Turma', `Criada turma acadêmica: ${newCls.name}`);
                  }}
                  onEditClassGroup={(updatedCls) => {
                    const prevClass = classes.find(c => c.id === updatedCls.id);
                    if (prevClass && prevClass.name !== updatedCls.name) {
                      setStudents(prev => prev.map(s => s.className === prevClass.name ? { ...s, className: updatedCls.name } : s));
                    }
                    setClasses(prev => prev.map(c => c.id === updatedCls.id ? updatedCls : c));
                    writeAuditLog('Edição de Turma', `Dados e vínculos da turma alterados: ${updatedCls.name}`);
                  }}
                  onDeleteClassGroup={(id) => {
                    const cName = classes.find(c=>c.id === id)?.name || id;
                    setClasses(prev => prev.filter(c => c.id !== id));
                    writeAuditLog('Exclusão de Turma', `Turma removida do sistema: ${cName}`);
                  }}
                />
              )}
              
              {activeAdminTab === 'disciplinas' && (
                <SubjectsView 
                  subjects={subjects} 
                  students={students} 
                  grades={grades} 
                  lessonPlans={lessonPlans}
                  onAddSubject={handleAddSubject}
                  onEditSubject={handleEditSubject}
                  onDeleteSubject={handleDeleteSubject}
                  onSaveLessonPlan={(plan) => {
                    setLessonPlans(prev => {
                      const idx = prev.findIndex(p => p.subjectId === plan.subjectId && p.classNumber === plan.classNumber);
                      if (idx > -1) {
                        const newArray = [...prev];
                        newArray[idx] = plan;
                        return newArray;
                      }
                      return [...prev, plan];
                    });
                    const subjectName = subjects.find(s=>s.id === plan.subjectId)?.name || plan.subjectId;
                    writeAuditLog('Plano de Aula Atualizado', `Plano modificado (AI ou manual) na disciplina: ${subjectName} (Aula ${plan.classNumber})`);
                  }}
                />
              )}
              
              {activeAdminTab === 'frequencia' && (
                <AttendanceView 
                  students={students} 
                  subjects={subjects} 
                  attendance={attendance} 
                  onSaveAttendance={handleSaveAttendance} 
                />
              )}
              
              {activeAdminTab === 'notas' && (
                <GradesView 
                  students={students} 
                  subjects={subjects} 
                  grades={grades} 
                  onSaveGrades={handleSaveGrades} 
                />
              )}
              
              {activeAdminTab === 'financeiro' && (
                <FinancialView 
                  students={students} 
                  payments={payments} 
                  onTogglePaymentStatus={handleTogglePaymentStatus} 
                  onUpdatePayment={handleUpdatePayment}
                  onDeletePayment={handleDeletePayment}
                  onAddPayments={handleAddPayments}
                  transactions={transactions}
                  onAddTransaction={handleAddTransaction}
                  onEditTransaction={handleEditTransaction}
                  onDeleteTransaction={handleDeleteTransaction}
                />
              )}

              {activeAdminTab === 'calendario_academico' && (
                <AcademicCalendarView 
                  activities={activities}
                  classes={classes}
                  students={students}
                  onAddActivity={(newAct) => {
                    const id = `act-${Date.now()}`;
                    setActivities(prev => [...prev, { ...newAct, id }]);
                  }}
                  onEditActivity={(updatedAct) => {
                    setActivities(prev => prev.map(a => a.id === updatedAct.id ? updatedAct : a));
                  }}
                  onDeleteActivity={(id) => {
                    setActivities(prev => prev.filter(a => a.id !== id));
                  }}
                />
              )}
              
              {activeAdminTab === 'logs_acesso' && (
                <AccessLogsView 
                  loginLogs={loginLogs} 
                  students={students} 
                  onRecordLogin={recordLogin}
                  onClearLogs={handleClearLoginLogs}
                />
              )}
              
              {activeAdminTab === 'configuracoes' && (
                <SettingsView onRestoreData={handleRestoreData} auditLogs={auditLogs} />
              )}
            </main>
          </>
        )) : (
          
          /* SUBTREE 2: STUDENT PORTAL VIEW (CONTEXT SWITCHED) */
          <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
            <StudentPortalView 
              students={students} 
              subjects={subjects} 
              lessonPlans={lessonPlans}
              grades={grades} 
              attendance={attendance} 
              payments={payments} 
              activities={activities}
              onAddOrUpdateAttendance={handleAddOrUpdateAttendance} 
              onEditStudent={handleEditStudent}
              onRecordLogin={recordLogin}
            />
          </main>
        )}

      </div>
    </div>
  );
}
