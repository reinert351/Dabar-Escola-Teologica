import React, { useState, useMemo } from 'react';
import { 
  Users, 
  BookOpen, 
  Calendar, 
  Plus, 
  Edit, 
  Trash2, 
  X, 
  AlertCircle,
  Tag,
  Clock
} from 'lucide-react';
import { ClassGroup, Student, Subject } from '../types';

interface ClassesViewProps {
  classes: ClassGroup[];
  students: Student[];
  subjects: Subject[];
  onAddClassGroup: (cls: Omit<ClassGroup, 'id'>) => void;
  onEditClassGroup: (cls: ClassGroup) => void;
  onDeleteClassGroup: (id: string) => void;
}

export default function ClassesView({
  classes,
  students,
  subjects,
  onAddClassGroup,
  onEditClassGroup,
  onDeleteClassGroup
}: ClassesViewProps) {
  // Modal states
  const [modalType, setModalType] = useState<'add' | 'edit' | null>(null);
  const [editingClass, setEditingClass] = useState<ClassGroup | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form values
  const [className, setClassName] = useState('');
  const [schedule, setSchedule] = useState('');
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);

  // Open modal forms
  const handleOpenAdd = () => {
    setClassName('');
    setSchedule('Segunda e Quarta, 19h30 - 21h30');
    setSelectedSubjectIds([]);
    setEditingClass(null);
    setModalType('add');
  };

  const handleOpenEdit = (cls: ClassGroup) => {
    setEditingClass(cls);
    setClassName(cls.name);
    setSchedule(cls.schedule);
    setSelectedSubjectIds(cls.subjectIds || []);
    setModalType('edit');
  };

  const handleSubjectToggle = (subId: string) => {
    setSelectedSubjectIds(prev =>
      prev.includes(subId) ? prev.filter(id => id !== subId) : [...prev, subId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!className.trim() || !schedule.trim()) return;

    const classData = {
      name: className.trim(),
      schedule: schedule.trim(),
      subjectIds: selectedSubjectIds
    };

    if (modalType === 'add') {
      onAddClassGroup(classData);
    } else if (modalType === 'edit' && editingClass) {
      onEditClassGroup({
        ...editingClass,
        ...classData
      });
    }
    setModalType(null);
  };

  const handleConfirmDelete = () => {
    if (deleteId) {
      onDeleteClassGroup(deleteId);
      setDeleteId(null);
    }
  };

  // Compute student counts per class name
  const classStats = useMemo(() => {
    return classes.map(cls => {
      const classStudentsCount = students.filter(
        s => s.className.toLowerCase().trim() === cls.name.toLowerCase().trim() && s.status === 'Ativo'
      ).length;

      const mappedSubjects = (cls.subjectIds || []).map(subId => {
        return subjects.find(s => s.id === subId);
      }).filter(Boolean) as Subject[];

      return {
        ...cls,
        activeStudents: classStudentsCount,
        mappedSubjects
      };
    });
  }, [classes, students, subjects]);

  return (
    <div className="space-y-6" id="classes-management-container">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-sans font-semibold tracking-tight text-slate-800">Turmas e Agrupamentos</h1>
          <p className="text-sm text-slate-500">Configure as turmas de alunos teológicos, associe disciplinas vigentes e ajuste horários de aula.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="bg-indigo-600 hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-150 text-white font-bold rounded-xl text-xs px-4 py-3 flex items-center justify-center gap-1.5 transition-all shadow-md shadow-indigo-100 shrink-0 self-start sm:self-center"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Turma</span>
        </button>
      </div>

      {/* Grid listing */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {classStats.map((cls) => (
          <div 
            key={cls.id} 
            className="bg-white rounded-2xl border border-slate-100 p-6 space-y-6 shadow-xs flex flex-col justify-between hover:border-indigo-400 hover:shadow-md transition-colors duration-200"
          >
            <div>
              {/* Card top bar */}
              <div className="flex items-start justify-between">
                <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
                  <Users className="w-6 h-6" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg uppercase tracking-wider">
                    Código: {cls.id.toUpperCase()}
                  </span>
                  
                  {/* Actions */}
                  <button
                    onClick={() => handleOpenEdit(cls)}
                    className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded transition"
                    title="Editar Turma"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteId(cls.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-50 rounded transition"
                    title="Excluir Turma"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Title & Stats summary */}
              <div className="mt-4">
                <h3 className="text-lg font-bold text-slate-800">{cls.name}</h3>
                <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                  <Clock className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="font-semibold text-slate-600">Horário: {cls.schedule}</span>
                </div>
              </div>

              {/* Sub-components mapping */}
              <div className="mt-5 pt-4 border-t border-slate-100 space-y-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Disciplinas Ministradas nesta Turma</span>
                <div className="flex flex-wrap gap-1.5Packed mt-2">
                  {cls.mappedSubjects.length > 0 ? (
                    cls.mappedSubjects.map(sub => (
                      <span key={sub.id} className="inline-flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-600">
                        <BookOpen className="w-3 h-3 text-indigo-500" />
                        <span>{sub.name}</span>
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 italic">Nenhuma disciplina vinculada</span>
                  )}
                </div>
              </div>

            </div>

            {/* Metrics footer */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between bg-slate-50 p-4 rounded-xl">
              <span className="text-xs text-slate-500 font-medium">Estudantes ativos matriculados nesta turma:</span>
              <strong className="text-indigo-600 font-bold font-mono text-sm">{cls.activeStudents} ativos</strong>
            </div>

          </div>
        ))}
      </div>

      {/* MODAL: ADD / EDIT CLASS GROUP */}
      {modalType && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 relative space-y-4">
            <button 
              onClick={() => setModalType(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 transition"
              type="button"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-md font-sans font-bold text-slate-800">
                {modalType === 'add' ? 'Adicionar Nova Turma' : 'Editar Turma'}
              </h3>
              <p className="text-xs text-slate-500">Configure o nome da turma, a agenda letiva e associe as disciplinas bíblicas pertinentes.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nome da Turma</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Turma Alpha (Teologia)"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Agenda / Horário de Aulas</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Segunda e Quarta, 19h30 - 21h30"
                  value={schedule}
                  onChange={(e) => setSchedule(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">Vincular Disciplinas</label>
                <div className="space-y-2 max-h-48 overflow-y-auto p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  {subjects.map(sub => (
                    <label key={sub.id} className="flex items-center gap-2.5 py-1 text-xs text-slate-700 font-semibold hover:text-slate-900 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedSubjectIds.includes(sub.id)}
                        onChange={() => handleSubjectToggle(sub.id)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                      />
                      <span>{sub.name} <span className="text-[10px] text-slate-400">({sub.teacherName})</span></span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-4 py-2 text-slate-500 hover:text-slate-800 font-semibold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl px-4 py-2.5 transition shadow-md shadow-indigo-100"
                >
                  Salvar Turma
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DELETE CONFIRM */}
      {deleteId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-100 text-center space-y-4">
            <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-md font-sans font-bold text-slate-800">Remover Turma</h3>
              <p className="text-xs text-slate-500 leading-relaxed mt-1">
                Atenção: Ao excluir esta turma, os vínculos de disciplinas do calendário de aulas serão desfeitos. Os alunos associados a esta turma permanecerão no banco de alunos sem interrupção de notas.
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 text-xs">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 text-slate-500 hover:text-slate-800 font-semibold transition"
              >
                Voltar
              </button>
              <button
                onClick={handleConfirmDelete}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl px-4 py-2.5 transition shadow-md shadow-rose-100"
              >
                Excluir Turma
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
