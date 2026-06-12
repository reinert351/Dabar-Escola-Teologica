import React, { useState, useMemo } from 'react';
import { Save, Search, RefreshCw, Award, BookOpen, Calculator, Sparkles, Check } from 'lucide-react';
import { Student, Subject, GradeRecord } from '../types';

interface GradesViewProps {
  students: Student[];
  subjects: Subject[];
  grades: GradeRecord[];
  onSaveGrades: (records: GradeRecord[]) => void;
}

export default function GradesView({ students, subjects, grades, onSaveGrades }: GradesViewProps) {
  const activeStudents = useMemo(() => students.filter(s => s.status === 'Ativo'), [students]);
  const [selectedSubjectId, setSelectedSubjectId] = useState(subjects[0]?.id || '');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Local state for editing grades in real-time
  // Stores { [studentId]: Partial<GradeRecord> }
  const [editedGrades, setEditedGrades] = useState<Record<string, Partial<GradeRecord>>>({});
  const [isModified, setIsModified] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // Compute database grade records for the selected subject
  const currentSubjectGrades = useMemo(() => {
    return grades.filter(g => g.subjectId === selectedSubjectId);
  }, [grades, selectedSubjectId]);

  // Compute final grade values merge
  const mergedGradesSheet = useMemo(() => {
    const sheet: Record<string, GradeRecord> = {};
    
    activeStudents.forEach(student => {
      const dbRecord = currentSubjectGrades.find(g => g.studentId === student.id);
      const studentEdits = editedGrades[student.id] || {};

      // Initialize default structured record if no existing record
      const baseRecord: GradeRecord = dbRecord || {
        id: `grd-new-${Date.now()}-${student.id}`,
        studentId: student.id,
        subjectId: selectedSubjectId,
        term1Grade: null,
        term2Grade: null,
        term3Grade: null,
        term4Grade: null,
        examGrade: null,
        averageGrade: null,
        status: 'Reprovado'
      };

      // Combine database + local edits
      const merged = { ...baseRecord, ...studentEdits };

      // Dynamically Recalculate Average and Status for a single exam-based subject
      const avg = merged.term1Grade;
      let finalStatus: 'Aprovado' | 'Recuperação' | 'Reprovado' = 'Reprovado';
      let finalReputedAverage: number | null = avg;

      if (avg !== null) {
        if (avg >= 6.0) {
          finalStatus = 'Aprovado';
          finalReputedAverage = avg;
        } else if (avg >= 4.0) {
          if (merged.examGrade !== null) {
            const finalFormula = parseFloat(((avg + merged.examGrade) / 2).toFixed(1));
            finalReputedAverage = finalFormula;
            if (finalFormula >= 5.0) {
              finalStatus = 'Aprovado';
            } else {
              finalStatus = 'Reprovado';
            }
          } else {
            finalStatus = 'Recuperação';
            finalReputedAverage = avg;
          }
        } else {
          finalStatus = 'Reprovado';
          finalReputedAverage = avg;
        }
      }

      sheet[student.id] = {
        ...merged,
        term2Grade: null,
        term3Grade: null,
        term4Grade: null,
        averageGrade: finalReputedAverage,
        status: finalStatus
      };
    });

    return sheet;
  }, [activeStudents, currentSubjectGrades, editedGrades, selectedSubjectId]);

  // Handle cell text edits
  const handleGradeCellChange = (studentId: string, termField: 'term1Grade' | 'term2Grade' | 'term3Grade' | 'term4Grade' | 'examGrade', valueStr: string) => {
    let numVal: number | null = null;
    if (valueStr.trim() !== '') {
      const parsed = parseFloat(valueStr.replace(',', '.'));
      if (isNaN(parsed)) return;
      if (parsed < 0 || parsed > 10) return; // boundary check
      numVal = parsed;
    }

    setEditedGrades(prev => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {}),
        [termField]: numVal
      }
    }));
    setIsModified(true);
  };

  // Save edits
  const handleSaveAll = () => {
    const listToSave: GradeRecord[] = activeStudents.map(student => mergedGradesSheet[student.id]);
    onSaveGrades(listToSave);
    setEditedGrades({});
    setIsModified(false);
    setShowSuccessToast(true);
    setTimeout(() => {
      setShowSuccessToast(false);
    }, 4000);
  };

  // Search filter
  const filteredStudents = useMemo(() => {
    return activeStudents.filter(student =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [activeStudents, searchTerm]);

  // Aggregate class average calculation
  const classStats = useMemo(() => {
    const records = Object.values(mergedGradesSheet) as GradeRecord[];
    const validAverages = records
      .map(r => r.averageGrade)
      .filter((avg): avg is number => avg !== null);

    const classAverage = validAverages.length
      ? parseFloat((validAverages.reduce((acc, curr) => acc + curr, 0) / validAverages.length).toFixed(1))
      : 0;

    let totalApproved = 0;
    let totalRecovery = 0;
    records.forEach(r => {
      // ignore empty
      if (r.averageGrade === null) return;
      if (r.status === 'Aprovado') totalApproved++;
      else if (r.status === 'Recuperação') totalRecovery++;
    });

    return { classAverage, totalApproved, totalRecovery };
  }, [mergedGradesSheet]);

  return (
    <div className="space-y-6" id="grades-container">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-sans font-semibold tracking-tight text-slate-800">Boletim e Notas</h1>
          <p className="text-sm text-slate-500">Administre as notas de cada aula da disciplina (4 aulas mensais de 1:30h cada).</p>
        </div>
        
        <div className="flex items-center gap-2">
          {isModified && (
            <span className="text-xs text-indigo-600 font-semibold animate-pulse mr-2">
              ⚠️ Modificações não gravadas
            </span>
          )}
          <button
            onClick={handleSaveAll}
            className="bg-indigo-600 hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-100 text-white font-semibold rounded-xl text-sm px-4 py-2.5 flex items-center gap-2 transition-colors shadow-lg shadow-indigo-100"
          >
            <Save className="w-4 h-4" />
            <span>Gravar Notas</span>
          </button>
        </div>
      </div>

      {/* Selectors and search row */}
      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs flex flex-col md:flex-row items-center gap-4 justify-between">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          {/* Subject pick */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-2 py-1">
            <BookOpen className="w-4 h-4 text-indigo-500 ml-1" />
            <select
              value={selectedSubjectId}
              onChange={(e) => {
                setSelectedSubjectId(e.target.value);
                setEditedGrades({});
                setIsModified(false);
              }}
              className="bg-transparent border-0 text-xs font-semibold text-slate-700 py-1.5 focus:outline-none focus:ring-0 cursor-pointer"
            >
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Search box */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-3.5 w-3.5 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar aluno na lista..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
            />
          </div>
        </div>

        {/* Info card overview */}
        <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
          <div className="flex items-center gap-1">
            <Calculator className="w-4 h-4 text-slate-400" />
            <span>Média da Turma: </span>
            <strong className="text-slate-700 font-bold">{classStats.classAverage} / 10</strong>
          </div>
          <div className="w-px h-4 bg-slate-200" />
          <div className="flex items-center gap-1 text-emerald-600">
            <Award className="w-4 h-4" />
            <span>Aprovados: </span>
            <strong className="font-bold">{classStats.totalApproved}</strong>
          </div>
        </div>
      </div>

      {/* Main Grid spreadsheet table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <th className="px-6 py-4 w-1/3">Aluno</th>
                <th className="px-6 py-4 text-center w-1/5">Nota da Disciplina</th>
                <th className="px-6 py-4 text-center w-1/5 bg-indigo-50/50 text-indigo-700">Prova de Recuperação</th>
                <th className="px-6 py-4 text-center w-1/6 bg-slate-50/50 font-semibold">Média Final</th>
                <th className="px-6 py-4 text-center w-40">Situação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => {
                  const record = mergedGradesSheet[student.id];
                  
                  return (
                    <tr key={student.id} className="hover:bg-indigo-50/20 transition-colors">
                      {/* Name column */}
                      <td className="px-6 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          {student.photoUrl ? (
                            <img src={student.photoUrl} alt={student.name} referrerPolicy="no-referrer" className="w-7 h-7 rounded-full object-cover border" />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-xs border">
                              {student.name.charAt(0)}
                            </div>
                          )}
                          <div>
                            <span className="text-sm font-semibold text-slate-800 block">{student.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{student.registrationNumber}</span>
                          </div>
                        </div>
                      </td>

                      {/* Subject main Grade */}
                      <td className="px-2 sm:px-4 py-3 text-center">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={record.term1Grade ?? ''}
                          placeholder="-"
                          onChange={(e) => handleGradeCellChange(student.id, 'term1Grade', e.target.value)}
                          className="w-16 sm:w-20 min-h-[44px] py-1.5 text-center bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg focus:bg-white focus:ring-1.5 focus:ring-indigo-500 focus:outline-none text-base sm:text-sm font-bold text-slate-800 font-mono"
                        />
                      </td>

                      {/* Exam final (Recovery) */}
                      <td className="px-2 sm:px-4 py-3 text-center bg-indigo-50/10">
                        <input
                          type="text"
                          inputMode="decimal"
                          disabled={record.status !== 'Recuperação' && record.examGrade === null}
                          value={record.examGrade ?? ''}
                          placeholder={record.status === 'Recuperação' ? 'Prova' : '-'}
                          onChange={(e) => handleGradeCellChange(student.id, 'examGrade', e.target.value)}
                          className={`w-16 sm:w-24 min-h-[44px] py-1.5 text-center border rounded-lg text-base sm:text-sm font-bold font-mono ${
                            record.status === 'Recuperação'
                              ? 'bg-indigo-50 border-indigo-200 focus:bg-white text-indigo-700 focus:ring-1.5 focus:ring-indigo-500'
                              : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                          }`}
                        />
                      </td>

                      {/* Computed average */}
                      <td className="px-4 py-3 text-center bg-slate-50/30 text-sm font-extrabold font-mono text-slate-800">
                        {record.averageGrade !== null ? record.averageGrade.toFixed(1) : '-'}
                      </td>

                      {/* Situation label */}
                      <td className="px-6 py-3 whitespace-nowrap text-center">
                        <span className={`inline-flex px-2 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${
                          record.status === 'Aprovado'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                            : record.status === 'Recuperação'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200 border-dashed'
                            : 'bg-rose-50 text-rose-700 border border-rose-100'
                        }`}>
                          {record.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-slate-400 text-sm">
                    Nenhum aluno encontrado para os filtros atuais.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Qualitative assessment notes */}
      <div className="bg-indigo-50 border border-indigo-150 rounded-2xl p-5 flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-700 leading-relaxed">
          <p className="font-bold text-indigo-800 uppercase tracking-wider mb-1">Diretrizes de Avaliação:</p>
          <ul className="list-disc pl-4 space-y-1 mt-1 font-semibold">
            <li>Cada disciplina tem duração de 1 mês (composta por 4 encontros presenciais de 1h30).</li>
            <li>A avaliação é constituída por uma <strong>única prova final</strong>, lançada no campo "Nota da Disciplina".</li>
            <li>O status <strong>Recuperação</strong> é ativado se a nota informada estiver entre 4.0 e 5.9. O campo de <strong>Prova de Recuperação</strong> se habilitará para lançamento.</li>
            <li>A média de aprovação pós-recuperação é 5.0 (calculada como a média simples entre a nota original da disciplina e a nota do exame de recuperação).</li>
          </ul>
        </div>
      </div>

      {showSuccessToast && (
        <div className="fixed top-6 right-6 z-55 flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-800 px-5 py-4 rounded-xl shadow-lg shadow-emerald-100 animate-slide-in">
          <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold">
            <Check className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-xs text-slate-800">Boletins Salvos!</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">As notas acadêmicas foram persistidas e atualizadas com sucesso no sistema local.</p>
          </div>
        </div>
      )}

    </div>
  );
}
