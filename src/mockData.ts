import { Student, Subject, ClassGroup, GradeRecord, AttendanceRecord, PaymentRecord, CashTransaction, AcademicActivity } from './types';
import initialState from './initialState.json';

export const INITIAL_ACTIVITIES: AcademicActivity[] = [
  { id: 'act-1', title: 'Avaliação Parcial - Teologia Sistemática', description: 'Prova abrangendo os capítulos 1 a 4 sobre a doutrina da revelação.', date: '2026-06-25', type: 'Prova', targetClass: 'Turma Alpha (Teologia)' },
  { id: 'act-2', title: 'Entrega de Trabalho - Grego', description: 'Tradução do texto de João 1:1-18.', date: '2026-07-05', type: 'Trabalho', targetClass: 'Turma Alpha (Teologia)' },
  { id: 'act-3', title: 'Seminário Vida e Obra de Agostinho', description: 'Evento geral do seminário para toda a instituição.', date: '2026-08-15', type: 'Evento' },
  { id: 'act-4', title: 'Feriado e Recesso Acadêmico', description: 'Aviso sobre o recesso estudantil de final de semana.', date: '2026-09-07', type: 'Aviso' }
];

export const INITIAL_SUBJECTS: Subject[] = [
  { id: 'sub-1', name: 'TEONTOLOGIA', teacherName: 'Pb. Marcelo Reinert', workload: 60 },
  { id: 'sub-2', name: 'EVANGELISMO', teacherName: 'Pb. Marcelo Reinert', workload: 60 },
  { id: 'sub-3', name: 'A T (PENTATEUCO)', teacherName: 'Pb. Marcelo Reinert', workload: 60 },
  { id: 'sub-4', name: 'EDUCAÇÃO CRISTÃ', teacherName: 'Pb. Marcelo Reinert', workload: 60 },
  { id: 'sub-5', name: 'CRISTOLOGIA', teacherName: 'Pb. Marcelo Reinert', workload: 60 },
  { id: 'sub-6', name: 'AT II (JOSUÉ A ESTER)', teacherName: 'Pb. Marcelo Reinert', workload: 60 },
  { id: 'sub-7', name: 'MISSIOLOGIA', teacherName: 'Pb. Marcelo Reinert', workload: 60 },
  { id: 'sub-8', name: 'HERMENÊUTICA', teacherName: 'Pb. Marcelo Reinert', workload: 60 },
  { id: 'sub-9', name: 'ÉTICA CRISTÃ', teacherName: 'Pb. Marcelo Reinert', workload: 60 },
  { id: 'sub-10', name: 'SOTERIOLOGIA', teacherName: 'Pb. Marcelo Reinert', workload: 60 },
  { id: 'sub-11', name: 'NT I (EVANGELHOS E ATOS)', teacherName: 'Pb. Marcelo Reinert', workload: 60 },
  { id: 'sub-12', name: 'HISTÓRIA DA IGREJA I', teacherName: 'Pb. Marcelo Reinert', workload: 60 },
  { id: 'sub-13', name: 'NOVO TESTAMENTO II (EPIS PAUL)', teacherName: 'Pb. Marcelo Reinert', workload: 60 },
  { id: 'sub-14', name: 'HOMILÉTICA', teacherName: 'Pb. Marcelo Reinert', workload: 60 },
  { id: 'sub-15', name: 'ECLESIOLOGIA', teacherName: 'Pb. Marcelo Reinert', workload: 60 },
  { id: 'sub-16', name: 'NT III (EP GERAIS E APO)', teacherName: 'Pb. Marcelo Reinert', workload: 60 },
  { id: 'sub-17', name: 'TEO PAS', teacherName: 'Pb. Marcelo Reinert', workload: 60 },
  { id: 'sub-18', name: 'SOCIOLOGIA DO ANTIGO TESTAMENTO', teacherName: 'Pb. Marcelo Reinert', workload: 60 },
  { id: 'sub-19', name: 'HAMARTIOLOGIA', teacherName: 'Pb. Marcelo Reinert', workload: 60 },
  { id: 'sub-20', name: 'ADMINISTRAÇÃO ECLESIÁSTICA', teacherName: 'Pb. Marcelo Reinert', workload: 60 },
  { id: 'sub-21', name: 'PNEUMAGIOLOGIA', teacherName: 'Pb. Marcelo Reinert', workload: 60 },
  { id: 'sub-22', name: 'PORTUGUÊS', teacherName: 'Pb. Marcelo Reinert', workload: 60 },
  { id: 'sub-23', name: 'BIBLIOLOGIA', teacherName: 'Pb. Marcelo Reinert', workload: 60 },
  { id: 'sub-24', name: 'A T III (JÓ A CANTICO DOS CANTICOS)', teacherName: 'Pb. Marcelo Reinert', workload: 60 },
  { id: 'sub-25', name: 'SOCIOLOGIA NT I', teacherName: 'Pb. Marcelo Reinert', workload: 60 },
  { id: 'sub-26', name: 'MÉTODOS DE ESTUDO DA BÍBLIA', teacherName: 'Pb. Marcelo Reinert', workload: 60 },
  { id: 'sub-27', name: 'FAMÍLIA CRISTÃ', teacherName: 'Pb. Marcelo Reinert', workload: 60 },
  { id: 'sub-28', name: 'HISTÓRIA DO PENTECOSTALISMO', teacherName: 'Pb. Marcelo Reinert', workload: 60 },
  { id: 'sub-29', name: 'ANGEL I', teacherName: 'Pb. Marcelo Reinert', workload: 60 },
  { id: 'sub-30', name: 'AT IV (PROF MAIORES)', teacherName: 'Pb. Marcelo Reinert', workload: 60 },
  { id: 'sub-31', name: 'DIDÁTICA', teacherName: 'Pb. Marcelo Reinert', workload: 60 },
  { id: 'sub-32', name: 'ANTROPOLOGIA', teacherName: 'Pb. Marcelo Reinert', workload: 60 },
  { id: 'sub-33', name: 'DIACONIA', teacherName: 'Pb. Marcelo Reinert', workload: 60 },
  { id: 'sub-34', name: 'AT V (PROF MENORES)', teacherName: 'Pb. Marcelo Reinert', workload: 60 },
  { id: 'sub-35', name: 'ESCATOLOGIA', teacherName: 'Pb. Marcelo Reinert', workload: 60 },
  { id: 'sub-36', name: 'PNEUMAGIOLOGIA II', teacherName: 'Pb. Marcelo Reinert', workload: 60 },
  { id: 'sub-37', name: 'História das Religiões', teacherName: 'Pb. Marcelo Reinert', workload: 60 },
  { id: 'sub-38', name: 'GEOGRAFIA BÍBLICA', teacherName: 'Pb. Marcelo Reinert', workload: 60 },
  { id: 'sub-39', name: 'SOCIOLOGIA NT II*', teacherName: 'Pb. Marcelo Reinert', workload: 60 },
  { id: 'sub-40', name: 'HERESIOLOGIA', teacherName: 'Pb. Marcelo Reinert', workload: 60 }
];

export const INITIAL_TRANSACTIONS: CashTransaction[] = [
  {
    id: 'tx-1',
    description: 'Venda de Livro: Introdução à Hermenêutica Teológica',
    value: 60.00,
    type: 'entrada',
    date: '2026-06-05',
    category: 'Venda de Livros'
  },
  {
    id: 'tx-2',
    description: 'Pagamento de Boleto: Aluguel do Prédio Acadêmico (Mês Vigente)',
    value: 1200.00,
    type: 'saida',
    date: '2026-06-01',
    category: 'Aluguel'
  },
  {
    id: 'tx-3',
    description: 'Venda de Livro Integral (Compensado via Pix - Reinert)',
    value: 60.00,
    type: 'entrada',
    date: '2026-06-02',
    category: 'Venda de Livros'
  },
  {
    id: 'tx-4',
    description: 'Pagamento de Boleto: Conta de Energia Elétrica (Enel)',
    value: 235.40,
    type: 'saida',
    date: '2026-06-04',
    category: 'Contas de Consumo'
  },
  {
    id: 'tx-5',
    description: 'Doação Beneficente para Aquisição de Equipamento de Projeção',
    value: 650.00,
    type: 'entrada',
    date: '2026-06-03',
    category: 'Doações'
  },
  {
    id: 'tx-6',
    description: 'Pagamento de Boleto: Licença de Software de Videoconferência',
    value: 119.90,
    type: 'saida',
    date: '2026-06-03',
    category: 'Manutenção'
  },
  {
    id: 'tx-7',
    description: 'Aquisição de Literatura Acadêmica para Biblioteca Central (Livros Importados)',
    value: 320.00,
    type: 'saida',
    date: '2026-06-06',
    category: 'Material Acadêmico'
  }
];


export const INITIAL_CLASSES: ClassGroup[] = [
  { id: 'cls-1', name: 'Turma Alpha (Teologia)', subjectIds: INITIAL_SUBJECTS.map(s => s.id), schedule: 'Segunda e Quarta, 19h30 - 21h30' }
];

export const INITIAL_STUDENTS: Student[] = [
  {
    id: 'std-reinert',
    name: 'Reinert Administrador',
    email: 'reinert351@gmail.com',
    gender: 'M',
    registrationNumber: 'MAT-2026-001',
    birthDate: '1995-04-12',
    className: 'Turma Alpha (Teologia)',
    status: 'Ativo',
    enrollmentDate: '2026-01-10',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'std-2',
    name: 'Pedro Henrique Santos',
    email: 'pedrosantos@gmail.com',
    gender: 'M',
    registrationNumber: 'MAT-2026-002',
    birthDate: '1998-08-22',
    className: 'Turma Alpha (Teologia)',
    status: 'Ativo',
    enrollmentDate: '2026-01-11',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'std-3',
    name: 'Ana Júlia Oliveira',
    email: 'anaoliveira@gmail.com',
    gender: 'F',
    registrationNumber: 'MAT-2026-003',
    birthDate: '2001-02-15',
    className: 'Turma Alpha (Teologia)',
    status: 'Ativo',
    enrollmentDate: '2026-01-12'
  },
  {
    id: 'std-4',
    name: 'Lucas Ferreira',
    email: 'lucasferreira@gmail.com',
    gender: 'M',
    registrationNumber: 'MAT-2026-004',
    birthDate: '1999-11-05',
    className: 'Turma Alpha (Teologia)',
    status: 'Ativo',
    enrollmentDate: '2026-01-12'
  },
  {
    id: 'std-5',
    name: 'Mariana Costa Araujo',
    email: 'marianacosta@gmail.com',
    gender: 'F',
    registrationNumber: 'MAT-2026-005',
    birthDate: '1997-06-30',
    className: 'Turma Alpha (Teologia)',
    status: 'Ativo',
    enrollmentDate: '2026-01-14'
  },
  {
    id: 'std-6',
    name: 'Carlos Alberto Sousa',
    email: 'carlossousa@hotmail.com',
    gender: 'M',
    registrationNumber: 'MAT-2026-006',
    birthDate: '1994-12-01',
    className: 'Turma Alpha (Teologia)',
    status: 'Ativo',
    enrollmentDate: '2026-01-15'
  },
  {
    id: 'std-7',
    name: 'Júlia Lima Rezende',
    email: 'julia.lima@gmail.com',
    gender: 'F',
    registrationNumber: 'MAT-2026-007',
    birthDate: '2002-09-18',
    className: 'Turma Alpha (Teologia)',
    status: 'Ativo',
    enrollmentDate: '2026-01-15'
  },
  {
    id: 'std-8',
    name: 'Gabriel Castro Neves',
    email: 'gabrielcastro@yahoo.com.br',
    gender: 'M',
    registrationNumber: 'MAT-2026-008',
    birthDate: '2000-03-24',
    className: 'Turma Alpha (Teologia)',
    status: 'Ativo',
    enrollmentDate: '2026-01-18'
  },
  {
    id: 'std-9',
    name: 'Beatriz Rocha Melo',
    email: 'beatrizrocha@gmail.com',
    gender: 'F',
    registrationNumber: 'MAT-2026-009',
    birthDate: '1996-07-07',
    className: 'Turma Alpha (Teologia)',
    status: 'Ativo',
    enrollmentDate: '2026-01-20'
  },
  {
    id: 'std-10',
    name: 'Thiago Gomes Moreira',
    email: 'thiagogomes@outlook.com',
    gender: 'M',
    registrationNumber: 'MAT-2026-010',
    birthDate: '2001-10-10',
    className: 'Turma Alpha (Teologia)',
    status: 'Ativo',
    enrollmentDate: '2026-01-21'
  },
  {
    id: 'std-11',
    name: 'Sofia Martins Pires',
    email: 'sofiamartins@gmail.com',
    gender: 'F',
    registrationNumber: 'MAT-2026-011',
    birthDate: '1998-05-14',
    className: 'Turma Alpha (Teologia)',
    status: 'Ativo',
    enrollmentDate: '2026-01-22'
  },
  {
    id: 'std-12',
    name: 'Felipe Rodrigues Cruz',
    email: 'feliperodrigues@gmail.com',
    gender: 'M',
    registrationNumber: 'MAT-2026-012',
    birthDate: '1995-01-28',
    className: 'Turma Alpha (Teologia)',
    status: 'Ativo',
    enrollmentDate: '2026-01-24'
  },
  {
    id: 'std-13',
    name: 'Larissa Alves Cabral',
    email: 'larissaalves@gmail.com',
    gender: 'F',
    registrationNumber: 'MAT-2026-013',
    birthDate: '2003-03-12',
    className: 'Turma Alpha (Teologia)',
    status: 'Inativo',
    enrollmentDate: '2026-01-25'
  },
  {
    id: 'std-14',
    name: 'Vinicius Ribeiro Dias',
    email: 'viniciusribeiro@gmail.com',
    gender: 'M',
    registrationNumber: 'MAT-2026-014',
    birthDate: '1997-12-14',
    className: 'Turma Alpha (Teologia)',
    status: 'Ativo',
    enrollmentDate: '2026-01-26'
  },
  {
    id: 'std-adriana',
    name: 'Adriana de Paula',
    email: 'adrianadepaula@gmail.com',
    gender: 'F',
    registrationNumber: 'MAT-2026-015',
    birthDate: '1995-10-18',
    className: 'Turma Alpha (Teologia)',
    status: 'Ativo',
    enrollmentDate: '2026-01-28',
    photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'
  }
];

// Pre-fill grades dynamically for all 40 subjects for all students
const generateGrades = (): GradeRecord[] => {
  const gradesList: GradeRecord[] = [];
  
  const adrianaGrades: Record<string, number | null> = {
    'sub-1': 9.8,
    'sub-2': 9.0,
    'sub-3': 9.5,
    'sub-4': 9.5,
    'sub-5': 9.5,
    'sub-6': 10.0,
    'sub-7': 9.5,
    'sub-8': 9.5,
    'sub-9': null,
    'sub-10': null,
    'sub-11': 8.5,
    'sub-12': null,
    'sub-13': 9.0,
    'sub-14': null,
    'sub-15': null,
    'sub-16': 8.5,
    'sub-17': null,
    'sub-18': 10.0,
    'sub-19': null,
    'sub-20': null,
    'sub-21': 8.5,
    'sub-22': null,
    'sub-23': null,
    'sub-24': 9.5,
    'sub-25': null,
    'sub-26': 10.0,
    'sub-27': null,
    'sub-28': null,
    'sub-29': null,
    'sub-30': 9.0,
    'sub-31': null,
    'sub-32': null,
    'sub-33': 7.0,
    'sub-34': 9.0,
    'sub-35': null,
    'sub-36': 9.0,
    'sub-37': 7.5,
    'sub-38': 10.0,
    'sub-39': null,
    'sub-40': 7.5
  };

  INITIAL_STUDENTS.forEach(student => {
    INITIAL_SUBJECTS.forEach((sub, index) => {
      let isInactive = student.status === 'Inativo';
      let grade1: number | null = 7.0 + (index % 3) * 1.0;
      let grade2: number | null = 6.5 + (index % 4) * 0.8;
      let grade3: number | null = 7.5 + (index % 2) * 1.2;
      
      if (student.id === 'std-reinert') {
        grade1 = 9.0 + (index % 3) * 0.5;
        grade2 = 8.5 + (index % 4) * 0.5;
        grade3 = 9.5;
      } else if (student.id === 'std-adriana') {
        const mappedGrade = adrianaGrades[sub.id];
        if (mappedGrade !== undefined && mappedGrade !== null) {
          grade1 = mappedGrade;
          grade2 = mappedGrade;
          grade3 = mappedGrade;
        } else {
          grade1 = null;
          grade2 = null;
          grade3 = null;
        }
      }
      
      let average: number | null = null;
      if (!isInactive && grade1 !== null && grade2 !== null && grade3 !== null) {
        average = Math.round(((grade1 + grade2 + grade3) / 3) * 10) / 10;
      }
      
      let status: 'Aprovado' | 'Recuperação' | 'Reprovado' = 'Aprovado';
      if (average === null) {
        status = 'Reprovado';
      } else if (average < 6.0) {
        status = 'Reprovado';
      } else if (average < 7.0) {
        status = 'Recuperação';
      }
      
      gradesList.push({
        id: `grd-${student.id}-${sub.id}`,
        studentId: student.id,
        subjectId: sub.id,
        term1Grade: isInactive ? null : grade1,
        term2Grade: isInactive ? null : grade2,
        term3Grade: isInactive ? null : grade3,
        term4Grade: null,
        examGrade: null,
        averageGrade: average,
        status
      });
    });
  });
  return gradesList;
};

export const INITIAL_GRADES: GradeRecord[] = generateGrades();

// Generate attendance records for past few calendar dates:
// Wednesdays & Mondays starting from 2026-05-18 to 2026-06-03
const classDates = ['2026-05-18', '2026-05-20', '2026-05-25', '2026-05-27', '2026-06-01', '2026-06-03'];

export const generateInitialAttendance = (): AttendanceRecord[] => {
  const records: AttendanceRecord[] = [];
  let idCounter = 1;

  classDates.forEach(date => {
    INITIAL_STUDENTS.forEach(student => {
      // Loop only first 3 subjects to keep dataset small and performant
      INITIAL_SUBJECTS.slice(0, 3).forEach(sub => {
        if (student.status === 'Inativo') {
          records.push({
            id: `att-${idCounter++}`,
            studentId: student.id,
            subjectId: sub.id,
            date,
            status: 'Falta Justificada',
            justification: 'Matrícula Trancada'
          });
          return;
        }

        const randSeed = student.id === 'std-reinert' ? 0.99 : Math.random();
        let status: 'Presença' | 'Falta' | 'Falta Justificada' = 'Presença';
        let justification: string | undefined;
        if (randSeed < 0.08) {
          status = 'Falta';
        } else if (randSeed < 0.12) {
          status = 'Falta Justificada';
          justification = 'Atestado Médico';
        }

        records.push({
          id: `att-${idCounter++}`,
          studentId: student.id,
          subjectId: sub.id,
          date,
          status,
          justification
        });
      });
    });
  });

  return records;
};

export const INITIAL_PAYMENTS: PaymentRecord[] = [
  // Payments of Maio 2026 (all completed except a few)
  ...INITIAL_STUDENTS.map(student => {
    const isOverdue = student.id === 'std-4' || student.id === 'std-12';
    const isInactive = student.status === 'Inativo';
    const val = 60.00; // valor do livro

    return {
      id: `pay-5-${student.id}`,
      studentId: student.id,
      value: val,
      dueDate: '2026-05-10',
      status: isInactive ? 'Pendente' : (isOverdue ? 'Atrasado' : 'Pago'),
      paymentDate: isInactive || isOverdue ? undefined : '2026-05-08',
      month: 'Maio 2026'
    } as PaymentRecord;
  }),
  // Payments of Junho 2026 (due date June 10, 2026) -> Since current date is June 7, some are Pago and some are Pendente
  ...INITIAL_STUDENTS.map(student => {
    const isPaid = student.id === 'std-reinert' || student.id === 'std-3' || student.id === 'std-9';
    const isInactive = student.status === 'Inativo';
    const val = 60.00;

    return {
      id: `pay-6-${student.id}`,
      studentId: student.id,
      value: val,
      dueDate: '2026-06-10',
      status: isInactive ? 'Pendente' : (isPaid ? 'Pago' : 'Pendente'),
      paymentDate: isPaid ? '2026-06-02' : undefined,
      month: 'Junho 2026'
    } as PaymentRecord;
  })
];

export const INITIAL_LOGIN_LOGS: any[] = [];

// Localstorage state helpers
export const loadData = <T>(key: string, initial: T): T => {
  const item = localStorage.getItem(key);
  if (!item) {
    // If empty in localStorage, check if we have pre-saved database records from initialState.json
    const savedInWorkspace = (initialState as any)[key];
    const fallbackValue = savedInWorkspace !== undefined && savedInWorkspace !== null ? savedInWorkspace : initial;
    localStorage.setItem(key, JSON.stringify(fallbackValue));
    return fallbackValue;
  }
  try {
    return JSON.parse(item);
  } catch (e) {
    return initial;
  }
};

export const saveData = <T>(key: string, data: T): void => {
  localStorage.setItem(key, JSON.stringify(data));
};
