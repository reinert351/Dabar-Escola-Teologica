export interface Student {
  id: string;
  name: string;
  email: string;
  gender: 'M' | 'F';
  registrationNumber: string; // Matrícula
  birthDate: string;
  className: string; // Ex: "7º Ano A", "8º Ano B"
  status: 'Ativo' | 'Inativo';
  enrollmentDate: string;
  photoUrl?: string;
}

export interface LessonPlanRecord {
  id: string;
  subjectId: string;
  classNumber: number; // 1, 2, 3, 4
  content: string; // The markdown generated content
}

export interface Subject {
  id: string;
  name: string;
  teacherName: string;
  workload: number; // Carga horária em horas
  aiContent?: string; // Legacy
}

export interface ClassGroup {
  id: string;
  name: string;
  subjectIds: string[];
  schedule: string; // Ex: "Segunda e Quarta, 08h - 10h"
}

export interface GradeRecord {
  id: string;
  studentId: string;
  subjectId: string;
  term1Grade: number | null; // Bimestre 1
  term2Grade: number | null; // Bimestre 2
  term3Grade: number | null; // Bimestre 3
  term4Grade: number | null; // Bimestre 4
  examGrade: number | null;   // Exame final
  averageGrade: number | null;
  status: 'Aprovado' | 'Recuperação' | 'Reprovado';
}

export type AttendanceStatus = 'Presença' | 'Falta' | 'Falta Justificada';

export interface AttendanceRecord {
  id: string;
  studentId: string;
  subjectId: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  justification?: string;
  period?: string; // Manhã, Tarde, Noite
}

export interface PaymentRecord {
  id: string;
  studentId: string;
  value: number;
  dueDate: string; // YYYY-MM-DD
  status: 'Pago' | 'Pendente' | 'Atrasado';
  paymentDate?: string;
  month: string; // Referência Ex: "Janeiro 2026"
}

export interface CashTransaction {
  id: string;
  description: string;
  value: number;
  type: 'entrada' | 'saida'; // 'entrada' = inflow, 'saida' = outflow
  date: string; // YYYY-MM-DD
  category: string; // Ex: "Venda de Livros", "Ofertas nas aulas", "Contas de Consumo", "Impostos", "Salários", "Material Acadêmico", "Eventos", "Manutenção"
}

export interface AcademicActivity {
  id: string;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
  type: 'Prova' | 'Trabalho' | 'Evento' | 'Aviso';
  targetClass?: string; // If undefined, for everyone
}

export interface AuditLog {
  id: string;
  timestamp: string; // ISO String
  docenteEmail: string;
  action: string;
  details: string;
}

export interface LoginRecord {
  id: string;
  timestamp: string; // ISO String
  userType: 'Docente' | 'Aluno';
  identifier: string; // E-mail ou Matrícula
  name: string; // Nome do Docente ou Aluno
}

