import React, { useState, useMemo } from 'react';
import { Check, X, AlertCircle, Save, Calendar, BookOpen, Clock, RefreshCw, Download } from 'lucide-react';
import { Student, Subject, AttendanceRecord, AttendanceStatus } from '../types';
import { exportToCSV } from '../utils/exportUtils';

interface AttendanceViewProps {
  students: Student[];
  subjects: Subject[];
  attendance: AttendanceRecord[];
  onSaveAttendance: (records: AttendanceRecord[]) => void;
}

export default function AttendanceView({ students, subjects, attendance, onSaveAttendance }: AttendanceViewProps) {
  const activeStudents = useMemo(() => students.filter(s => s.status === 'Ativo'), [students]);
  
  const [selectedSubjectId, setSelectedSubjectId] = useState(subjects[0]?.id || '');
  const [selectedDate, setSelectedDate] = useState('2026-06-03'); // Default to a populated mock class day
  
  // Local state for temporary sheet edits
  // Stores { [studentId]: { status: AttendanceStatus, justification?: string } }
  const [editedSheet, setEditedSheet] = useState<Record<string, { status: AttendanceStatus; justification?: string }>>({});

  // Flag to know if the user customized anything
  const [isModified, setIsModified] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // Load existing records for the chosen date & subject
  const existingRecordsForDay = useMemo(() => {
    return attendance.filter(
      r => r.date === selectedDate && r.subjectId === selectedSubjectId
    );
  }, [attendance, selectedDate, selectedSubjectId]);

  // Merge existing records with active students so we always have a row for everyone
  const mergedSheetData = useMemo(() => {
    const sheet: Record<string, { status: AttendanceStatus; justification?: string }> = {};
    
    activeStudents.forEach(student => {
      // 1. Check if we edited it in local state
      if (editedSheet[student.id]) {
        sheet[student.id] = editedSheet[student.id];
        return;
      }
      
      // 2. Check if we have an existing database record
      const dbRecord = existingRecordsForDay.find(r => r.studentId === student.id);
      if (dbRecord) {
        sheet[student.id] = {
          status: dbRecord.status,
          justification: dbRecord.justification
        };
      } else {
        // 3. Default state is 'Presença'
        sheet[student.id] = { status: 'Presença' };
      }
    });
    
    return sheet;
  }, [activeStudents, existingRecordsForDay, editedSheet]);

  // Handle setting status for a student
  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setEditedSheet(prev => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || mergedSheetData[studentId]),
        status,
        // clear justification if not justified
        justification: status === 'Falta Justificada' ? (prev[studentId]?.justification || 'Atestado Médico') : undefined
      }
    }));
    setIsModified(true);
  };

  // Handle editing the text justification
  const handleJustificationChange = (studentId: string, text: string) => {
    setEditedSheet(prev => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || mergedSheetData[studentId]),
        justification: text
      }
    }));
    setIsModified(true);
  };

  const handleMarkAllPresent = () => {
    const nextEdits: typeof editedSheet = {};
    activeStudents.forEach(student => {
      nextEdits[student.id] = { status: 'Presença' };
    });
    setEditedSheet(nextEdits);
    setIsModified(true);
  };

  const handleSaveClick = () => {
    const recordsToSave: AttendanceRecord[] = activeStudents.map(student => {
      const parentData = mergedSheetData[student.id];
      const existing = existingRecordsForDay.find(r => r.studentId === student.id);
      
      return {
        id: existing?.id || `att-new-${Date.now()}-${student.id}`,
        studentId: student.id,
        subjectId: selectedSubjectId,
        date: selectedDate,
        status: parentData.status,
        justification: parentData.justification
      };
    });

    onSaveAttendance(recordsToSave);
    setEditedSheet({});
    setIsModified(false);
    setShowSuccessToast(true);
    setTimeout(() => {
      setShowSuccessToast(false);
    }, 4000);
  };

  // Stats calculation for the day
  const dailyStats = useMemo(() => {
    let present = 0;
    let absent = 0;
    let excused = 0;
    
    activeStudents.forEach(student => {
      const status = mergedSheetData[student.id]?.status || 'Presença';
      if (status === 'Presença') present++;
      else if (status === 'Falta') absent++;
      else if (status === 'Falta Justificada') excused++;
    });

    const attendanceRate = activeStudents.length 
      ? Math.round((present / activeStudents.length) * 100) 
      : 100;

    return { present, absent, excused, attendanceRate };
  }, [activeStudents, mergedSheetData]);

  const selectedSubjectName = useMemo(() => {
    return subjects.find(s => s.id === selectedSubjectId)?.name || 'Disciplina';
  }, [subjects, selectedSubjectId]);

  return (
    <div className="space-y-6" id="attendance-container">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-sans font-semibold tracking-tight text-slate-800">Controle de Presença</h1>
          <p className="text-sm text-slate-500">Registre e justifique a frequência diária dos alunos por disciplina.</p>
        </div>
        
        <div className="flex items-center gap-2">
          {isModified && (
            <span className="text-xs text-indigo-650 font-semibold animate-pulse mr-2">
              ⚠️ Modificações não salvas
            </span>
          )}
          <button
            onClick={() => {
              const csvHeaders = ['Aluno', 'Matricula', 'Disciplina', 'Data', 'Status', 'Justificativa'];
              const csvRows = activeStudents.map(student => {
                const parentData = mergedSheetData[student.id];
                return [student.name, student.registrationNumber, selectedSubjectName, selectedDate, parentData.status, parentData.justification || ''];
              });
              exportToCSV(`diario_classe_${selectedDate}.csv`, csvHeaders, csvRows);
            }}
            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-xl text-xs px-4 py-2.5 flex items-center justify-center gap-1.5 transition-all shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Exportar Diário CSV</span>
          </button>
          <button
            onClick={handleSaveClick}
            className="bg-indigo-600 hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-150 text-white font-semibold rounded-xl text-sm px-4 py-2.5 flex items-center gap-2 transition-colors shadow-lg shadow-indigo-100"
          >
            <Save className="w-4 h-4" />
            <span>Salvar Diário</span>
          </button>
        </div>
      </div>

      {/* Date & Subject Selectors */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        {/* Subject ID select */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5" /> Disciplina
          </label>
          <select
            value={selectedSubjectId}
            onChange={(e) => {
              setSelectedSubjectId(e.target.value);
              setEditedSheet({});
              setIsModified(false);
            }}
            className="block w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {subjects.map(s => (
              <option key={s.id} value={s.id}>{s.name} ({s.teacherName})</option>
            ))}
          </select>
        </div>

        {/* Date input */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" /> data da Aula
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => {
              setSelectedDate(e.target.value);
              setEditedSheet({});
              setIsModified(false);
            }}
            className="block w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Rapid Actions */}
        <div className="flex gap-2">
          <button
            onClick={handleMarkAllPresent}
            type="button"
            className="w-full flex-1 py-2 px-3 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 transition"
          >
            Presença para Todos
          </button>
          
          <button
            onClick={() => {
              setEditedSheet({});
              setIsModified(false);
            }}
            type="button"
            className="p-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-500 transition"
            title="Resetar Planilha"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Statistics Indicator Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
        <div className="text-center p-3">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ativos na Turma</div>
          <div className="text-xl font-bold text-slate-800 mt-1">{activeStudents.length}</div>
        </div>
        <div className="text-center p-3 border-l border-slate-200/60">
          <div className="text-xs font-bold text-emerald-500 uppercase tracking-wider">Presentes</div>
          <div className="text-xl font-bold text-emerald-600 mt-1">{dailyStats.present}</div>
        </div>
        <div className="text-center p-3 border-l border-slate-200/60">
          <div className="text-xs font-bold text-rose-400 uppercase tracking-wider">Faltas</div>
          <div className="text-xl font-bold text-rose-500 mt-1">{dailyStats.absent}</div>
        </div>
        <div className="text-center p-3 border-l border-slate-200/60">
          <div className="text-xs font-bold text-indigo-500 uppercase tracking-wider">Presença Geral</div>
          <div className="text-xl font-bold text-indigo-600 mt-1">{dailyStats.attendanceRate}%</div>
        </div>
      </div>

      {/* Academic attendance Sheet List */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-slate-50/40 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Planilha Nominal de Frequência</span>
          <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-indigo-500" /> Aula Ref: {selectedSubjectName}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/20 border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <th className="px-6 py-4 w-1/3">Nome do Aluno</th>
                <th className="px-6 py-4 w-1/4">Nº de Matrícula</th>
                <th className="px-6 py-4 text-center">Status de Frequência</th>
                <th className="px-6 py-4">Observações / Justificativa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activeStudents.map((student) => {
                const row = mergedSheetData[student.id] || { status: 'Presença' };
                
                return (
                  <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                    {/* Student Identity */}
                    <td className="px-6 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        {student.photoUrl ? (
                          <img src={student.photoUrl} alt={student.name} referrerPolicy="no-referrer" className="w-8 h-8 rounded-full object-cover border border-slate-100 shadow-xs" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-semibold border text-xs">
                            {student.name.charAt(0)}
                          </div>
                        )}
                        <span className="text-sm font-semibold text-slate-800">{student.name}</span>
                      </div>
                    </td>

                    {/* Registry */}
                    <td className="px-6 py-3 whitespace-nowrap text-xs font-mono text-slate-400">
                      {student.registrationNumber}
                    </td>

                    {/* Interactive Selector */}
                    <td className="px-3 sm:px-6 py-3 whitespace-nowrap">
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-1.5 bg-slate-100 p-1 sm:p-0.5 rounded-lg w-full sm:w-fit mx-auto">
                        
                        {/* PRESENCE button */}
                        <button
                          type="button"
                          onClick={() => handleStatusChange(student.id, 'Presença')}
                          className={`flex justify-center items-center gap-1 w-full sm:w-auto min-h-[44px] sm:min-h-[32px] px-4 sm:px-3 py-2 sm:py-1.5 text-sm sm:text-xs font-bold rounded-md transition-all ${
                            row.status === 'Presença'
                              ? 'bg-emerald-500 text-white shadow-xs'
                              : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'
                          }`}
                        >
                          <Check className="w-5 h-5 sm:w-3.5 sm:h-3.5" />
                          <span className="hidden sm:inline">Presente</span>
                        </button>

                        {/* ABSENCE button */}
                        <button
                          type="button"
                          onClick={() => handleStatusChange(student.id, 'Falta')}
                          className={`flex justify-center items-center gap-1 w-full sm:w-auto min-h-[44px] sm:min-h-[32px] px-4 sm:px-3 py-2 sm:py-1.5 text-sm sm:text-xs font-bold rounded-md transition-all ${
                            row.status === 'Falta'
                              ? 'bg-rose-500 text-white shadow-xs'
                              : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'
                          }`}
                        >
                          <X className="w-5 h-5 sm:w-3.5 sm:h-3.5" />
                          <span className="hidden sm:inline">Falta</span>
                        </button>

                        {/* EXCUSED button */}
                        <button
                          type="button"
                          onClick={() => handleStatusChange(student.id, 'Falta Justificada')}
                          className={`flex justify-center items-center gap-1 w-full sm:w-auto min-h-[44px] sm:min-h-[32px] px-4 sm:px-3 py-2 sm:py-1.5 text-sm sm:text-xs font-bold rounded-md transition-all ${
                            row.status === 'Falta Justificada'
                              ? 'bg-indigo-500 text-white shadow-xs'
                              : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'
                          }`}
                        >
                          <AlertCircle className="w-5 h-5 sm:w-3.5 sm:h-3.5" />
                          <span className="hidden sm:inline">Justificar</span>
                        </button>
                        
                      </div>
                    </td>

                    {/* Justification text box */}
                    <td className="px-6 py-3 whitespace-nowrap">
                      {row.status === 'Falta Justificada' ? (
                        <input
                          type="text"
                          value={row.justification || ''}
                          onChange={(e) => handleJustificationChange(student.id, e.target.value)}
                          placeholder="Ex: Atestado / Motivo..."
                          className="w-full max-w-[240px] border border-indigo-200 bg-indigo-50/20 text-xs px-3 py-1.5 rounded-md text-indigo-700 placeholder-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      ) : (
                        <span className="text-xs text-slate-400 font-mono italic">Sem anotações</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      
      {showSuccessToast && (
        <div className="fixed top-6 right-6 z-55 flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-800 px-5 py-4 rounded-xl shadow-lg shadow-emerald-100 animate-slide-in">
          <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold">
            <Check className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-xs text-slate-800">Diário Salvo!</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">A frequência foi salva e o boletim foi atualizado com sucesso no sistema local.</p>
          </div>
        </div>
      )}

    </div>
  );
}
