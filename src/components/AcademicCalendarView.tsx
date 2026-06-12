import React, { useState, useMemo } from 'react';
import { Calendar as CalendarIcon, Plus, Edit, Trash2, X, Clock, LayoutList, ChevronLeft, ChevronRight, Grid, List, Cake } from 'lucide-react';
import { AcademicActivity, ClassGroup, Student } from '../types';

interface AcademicCalendarViewProps {
  activities: AcademicActivity[];
  classes: ClassGroup[];
  students: Student[];
  onAddActivity?: (act: Omit<AcademicActivity, 'id'>) => void;
  onEditActivity?: (act: AcademicActivity) => void;
  onDeleteActivity?: (id: string) => void;
  readOnly?: boolean;
}

export default function AcademicCalendarView({
  activities,
  classes,
  students,
  onAddActivity,
  onEditActivity,
  onDeleteActivity,
  readOnly = false
}: AcademicCalendarViewProps) {
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('calendar');
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 5, 1)); // Starts at June 2026 based on metadata
  
  const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null);
  const [editingData, setEditingData] = useState<AcademicActivity | null>(null);
  const [selectedDayStr, setSelectedDayStr] = useState<string | null>(null);

  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formType, setFormType] = useState<AcademicActivity['type']>('Aviso');
  const [formTargetClass, setFormTargetClass] = useState<string>('');

  const sortedActivities = useMemo(() => {
    return [...activities].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [activities]);

  const handleOpenAdd = (defaultDate?: string) => {
    setFormTitle('');
    setFormDesc('');
    setFormDate(defaultDate || '');
    setFormType('Aviso');
    setFormTargetClass('');
    setEditingData(null);
    setModalMode('add');
  };

  const handleOpenEdit = (act: AcademicActivity) => {
    setEditingData(act);
    setFormTitle(act.title);
    setFormDesc(act.description);
    setFormDate(act.date);
    setFormType(act.type);
    setFormTargetClass(act.targetClass || '');
    setModalMode('edit');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formDate) return;

    const actData: Omit<AcademicActivity, 'id'> = {
      title: formTitle.trim(),
      description: formDesc.trim(),
      date: formDate,
      type: formType,
      targetClass: formTargetClass || undefined
    };

    if (modalMode === 'add' && onAddActivity) {
      onAddActivity(actData);
    } else if (modalMode === 'edit' && editingData && onEditActivity) {
      onEditActivity({ ...actData, id: editingData.id });
    }
    setModalMode(null);
  };

  const getTypeStyle = (type: AcademicActivity['type']) => {
    switch(type) {
      case 'Prova': return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'Trabalho': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Evento': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'Aviso': return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  // --- Calendar Helpers ---
  const handlePrevMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    // Padding up to first day of month
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    // Actual days
    for (let i = 1; i <= daysInMonth; i++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        days.push({ day: i, dateStr });
    }
    // Padding to end the week if needed
    while (days.length % 7 !== 0) {
        days.push(null);
    }
    return days;
  };

  const calendarDays = generateCalendarDays();
  const monthName = currentMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  const formattedDate = useMemo(() => {
    if (!selectedDayStr) return '';
    const [y, m, d] = selectedDayStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    return dateObj.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }, [selectedDayStr]);

  const selectedDayActivities = useMemo(() => {
    if (!selectedDayStr) return [];
    return activities.filter(a => a.date === selectedDayStr);
  }, [activities, selectedDayStr]);

  const selectedDayBirthdays = useMemo(() => {
    if (!selectedDayStr) return [];
    return students.filter(s => {
      if (!s.birthDate) return false;
      try {
        const [, m, d] = s.birthDate.split('-');
        const [, gm, gd] = selectedDayStr.split('-');
        return m === gm && d === gd;
      } catch {
        return false;
      }
    });
  }, [students, selectedDayStr]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-sans font-semibold tracking-tight text-slate-800 flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-indigo-600" />
            Calendário Letivo
          </h1>
          <p className="text-sm text-slate-500">Agende provas, eventos e acompanhe os aniversariantes do mês.</p>
        </div>
        
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex bg-slate-100 p-1 rounded-xl items-center border border-slate-200">
             <button
                onClick={() => setViewMode('calendar')}
                className={`p-2 px-3 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${viewMode === 'calendar' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
             >
                <Grid className="w-4 h-4" />
                Mês
             </button>
             <button
                onClick={() => setViewMode('list')}
                className={`p-2 px-3 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${viewMode === 'list' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
             >
                <List className="w-4 h-4" />
                Lista
             </button>
          </div>
          {!readOnly && (
            <button
              onClick={() => handleOpenAdd()}
              className="bg-indigo-600 hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-150 text-white font-bold rounded-xl text-xs px-4 py-3 flex items-center justify-center gap-1.5 transition-all shadow-md shadow-indigo-100 shrink-0"
            >
              <Plus className="w-4 h-4" />
              Atividade
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm min-h-[500px]">
        {viewMode === 'calendar' && (
           <div className="space-y-4">
              <div className="flex items-center justify-between">
                 <h2 className="text-lg font-bold text-slate-800 capitalize">{monthName}</h2>
                 <div className="flex items-center gap-2">
                    <button onClick={handlePrevMonth} className="p-2 border border-slate-200 text-slate-500 hover:bg-slate-50 rounded-xl transition">
                       <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button onClick={handleNextMonth} className="p-2 border border-slate-200 text-slate-500 hover:bg-slate-50 rounded-xl transition">
                       <ChevronRight className="w-4 h-4" />
                    </button>
                 </div>
              </div>

              <div className="grid grid-cols-7 gap-px bg-slate-200 border border-slate-200 rounded-xl overflow-hidden">
                 {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                    <div key={day} className="bg-slate-50 py-2 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                       {day}
                    </div>
                 ))}
                 
                 {calendarDays.map((dayData, idx) => {
                    if (!dayData) {
                       return <div key={`empty-${idx}`} className="bg-white min-h-[100px] opacity-50"></div>;
                    }

                    const dayActivities = activities.filter(a => a.date === dayData.dateStr);
                    const dayBirthdays = students.filter(s => {
                       if (!s.birthDate) return false;
                       try {
                          const [y, m, d] = s.birthDate.split('-');
                          const [, gm, gd] = dayData.dateStr.split('-');
                          return m === gm && d === gd;
                       } catch { return false; }
                    });

                    return (
                       <div 
                         key={dayData.dateStr} 
                         className="bg-white min-h-[100px] p-2 transition group border-t border-transparent relative hover:bg-slate-50/70 cursor-pointer text-left"
                         onClick={() => setSelectedDayStr(dayData.dateStr)}
                       >
                          <span className="text-xs font-bold text-slate-400 group-hover:text-indigo-600 transition block mb-1">
                             {dayData.day}
                          </span>
                          
                          <div className="space-y-1">
                             {dayActivities.map(act => (
                                <div 
                                   key={act.id} 
                                   onClick={(e) => { e.stopPropagation(); if (!readOnly) handleOpenEdit(act); }}
                                   className={`text-[9px] font-bold px-1.5 py-0.5 rounded truncate border transition ${getTypeStyle(act.type)} ${readOnly ? '' : 'cursor-pointer hover:opacity-80'}`}
                                   title={act.title}
                                >
                                   {act.title}
                                </div>
                             ))}

                             {dayBirthdays.map(student => (
                                <div 
                                   key={`bday-${student.id}`} 
                                   className="text-[9px] font-bold px-1.5 py-0.5 rounded truncate border bg-pink-100 text-pink-700 border-pink-200 flex items-center gap-1"
                                   title={`Aniversário: ${student.name}`}
                                >
                                   <Cake className="w-3 h-3 shrink-0" />
                                   {student.name.split(' ')[0]}
                                </div>
                             ))}
                          </div>
                          
                          <div className="absolute inset-0 border-2 border-indigo-400 rounded-lg opacity-0 group-hover:opacity-10 pointer-events-none transition"></div>
                       </div>
                    );
                 })}
              </div>
           </div>
        )}

        {viewMode === 'list' && (
          sortedActivities.length === 0 ? (
            <div className="text-center text-slate-400 py-20 flex flex-col items-center">
              <LayoutList className="w-12 h-12 mb-3 text-slate-300" />
              <p>Nenhuma atividade cadastrada. As atividades programadas aparecerão aqui.</p>
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              {sortedActivities.map(act => (
                <div key={act.id} className="flex flex-col md:flex-row items-center gap-6 p-5 border border-slate-100 rounded-2xl hover:border-indigo-100 hover:shadow-xs transition bg-slate-50/50">
                  <div className="flex-shrink-0 w-32 flex flex-col items-center justify-center p-3 text-center border-r border-slate-200/60 md:pr-6">
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">{new Date(`${act.date}T12:00:00Z`).toLocaleDateString('pt-BR', { month: 'short' })}</span>
                    <span className="text-3xl font-light text-slate-700">{new Date(`${act.date}T12:00:00Z`).getDate()}</span>
                    <span className="text-xs text-slate-400 font-medium">{new Date(`${act.date}T12:00:00Z`).getFullYear()}</span>
                  </div>
                  <div className="flex-1 space-y-2 text-center md:text-left">
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider ${getTypeStyle(act.type)}`}>
                        {act.type}
                      </span>
                      {act.targetClass && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-200 text-slate-600 border border-slate-300">
                          {act.targetClass}
                        </span>
                      )}
                      {!act.targetClass && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 border border-emerald-200">
                          Geral (Todas as Turmas)
                        </span>
                      )}
                    </div>
                    <h3 className="text-md font-bold text-slate-800">{act.title}</h3>
                    <p className="text-sm text-slate-500 line-clamp-2">{act.description}</p>
                  </div>
                  {!readOnly && (
                    <div className="flex gap-2">
                      <button onClick={() => handleOpenEdit(act)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-xl transition border border-transparent hover:border-slate-200">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => onDeleteActivity && onDeleteActivity(act.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-white rounded-xl transition border border-transparent hover:border-slate-200">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* DAY DETAILS DETAILS VIEW MODAL */}
      {selectedDayStr && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="day-details-modal">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100 relative space-y-5">
            <button 
              onClick={() => setSelectedDayStr(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 transition"
              id="close-day-details-btn"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest block font-mono">Detalhes da Data</span>
              <h3 className="text-lg font-sans font-extrabold text-slate-800 capitalize mt-1">
                {formattedDate}
              </h3>
            </div>

            <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
              {/* Seção 1: Atividades Acadêmicas */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <LayoutList className="w-3.5 h-3.5 text-slate-400" />
                  Atividades e Eventos ({selectedDayActivities.length})
                </h4>
                
                {selectedDayActivities.length === 0 ? (
                  <p className="text-xs text-slate-400 py-3 bg-slate-50 rounded-xl text-center font-medium">
                    Nenhuma atividade letiva agendada para hoje.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {selectedDayActivities.map(act => (
                      <div key={act.id} className="p-3.5 border border-slate-100 rounded-xl bg-slate-50/50 flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${getTypeStyle(act.type)}`}>
                              {act.type}
                            </span>
                            {act.targetClass ? (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-600 border border-slate-300">
                                {act.targetClass}
                              </span>
                            ) : (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 border border-emerald-200">
                                Geral
                              </span>
                            )}
                          </div>
                          <h5 className="text-xs font-bold text-slate-800">{act.title}</h5>
                          {act.description && <p className="text-[11px] text-slate-500 font-medium leading-relaxed">{act.description}</p>}
                        </div>
                        
                        {!readOnly && (
                          <div className="flex gap-1.5 shrink-0">
                            <button 
                              onClick={() => {
                                handleOpenEdit(act);
                                setSelectedDayStr(null);
                              }} 
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg transition border border-transparent hover:border-slate-200"
                              title="Editar"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => {
                                if (onDeleteActivity) onDeleteActivity(act.id);
                              }} 
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition border border-transparent hover:border-slate-200"
                              title="Excluir"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Seção 2: Aniversariantes do Dia */}
              <div className="space-y-2 border-t border-slate-100 pt-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Cake className="w-3.5 h-3.5 text-pink-500" />
                  Aniversariantes do Dia ({selectedDayBirthdays.length})
                </h4>
                
                {selectedDayBirthdays.length === 0 ? (
                  <p className="text-xs text-slate-400 py-3 bg-slate-50 rounded-xl text-center font-medium">
                    Nenhum aluno faz aniversário nesta data.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {selectedDayBirthdays.map(student => (
                      <div key={student.id} className="p-3.5 border border-pink-100 rounded-xl bg-pink-50/20 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          {student.photoUrl ? (
                            <img 
                              src={student.photoUrl} 
                              alt={student.name} 
                              className="w-10 h-10 rounded-full object-cover border border-pink-200"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-pink-100 text-pink-700 font-bold text-xs flex items-center justify-center border border-pink-200 font-sans">
                              {student.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <h5 className="text-xs font-bold text-slate-800">{student.name}</h5>
                            <span className="text-[10px] text-pink-700 font-semibold uppercase">{student.className || 'Teologia'}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="bg-pink-100 text-pink-800 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1">
                            🎂 Festa!
                          </span>
                        </div>
                      </div>
                    ))}
                    <p className="text-[10px] text-pink-600 font-semibold text-center italic mt-1 font-mono">
                      "O Senhor te abençoe e te guarde; o Senhor faça resplandecer o seu rosto sobre ti..." - Números 6:24-25
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              {!readOnly ? (
                <button 
                  onClick={() => {
                    handleOpenAdd(selectedDayStr);
                    setSelectedDayStr(null);
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs px-4 py-2.5 flex items-center gap-1.5 transition-all shadow-md shadow-indigo-100"
                  id="add-activity-from-details-btn"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Nova Atividade
                </button>
              ) : (
                <div />
              )}
              <button 
                onClick={() => setSelectedDayStr(null)} 
                className="px-5 py-2.5 text-slate-500 hover:text-slate-800 font-bold text-xs border border-slate-100 hover:bg-slate-50 rounded-xl transition"
                id="close-day-details-btn-footer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL */}
      {modalMode && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100 relative space-y-4">
            <button 
              onClick={() => setModalMode(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-md font-sans font-bold text-slate-800 text-center">
                {modalMode === 'add' ? 'Registrar Nova Atividade' : 'Editar Atividade'}
              </h3>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Título da Atividade</label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={e => setFormTitle(e.target.value)}
                    placeholder="Ex. Prova Semestral de Grego"
                    className="w-full text-xs px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Data</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={e => setFormDate(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Tipo</label>
                  <select
                    value={formType}
                    onChange={e => setFormType(e.target.value as any)}
                    className="w-full text-xs px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-semibold"
                  >
                    <option value="Prova">Prova</option>
                    <option value="Trabalho">Trabalho</option>
                    <option value="Evento">Evento Extra ou Culto</option>
                    <option value="Aviso">Aviso Geral</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Público - Alvo (Turma)</label>
                  <select
                    value={formTargetClass}
                    onChange={e => setFormTargetClass(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-semibold"
                  >
                    <option value="">Geral (Todas as Turmas do Seminário)</option>
                    {classes.map(cls => (
                      <option key={cls.id} value={cls.name}>{cls.name}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Descrição / Orientações</label>
                  <textarea
                    rows={4}
                    value={formDesc}
                    onChange={e => setFormDesc(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                    placeholder="Descreva o escopo da prova, os requisitos do trabalho ou as informações contextuais logísticas do evento."
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button type="button" onClick={() => setModalMode(null)} className="px-4 py-2 text-slate-500 hover:text-slate-800 font-semibold text-xs">Cancelar</button>
                <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs px-5 py-2.5 shadow-md">Salvar Atividade</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
