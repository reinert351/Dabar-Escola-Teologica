import React, { useState, useMemo } from 'react';
import { BookOpen, User, Clock, GraduationCap, Plus, Edit, Trash2, X, AlertCircle, Sparkles, BookCopy } from 'lucide-react';
import { Subject, Student, GradeRecord, LessonPlanRecord } from '../types';

interface SubjectsViewProps {
  subjects: Subject[];
  students: Student[];
  grades: GradeRecord[];
  lessonPlans: LessonPlanRecord[];
  onAddSubject: (subject: Omit<Subject, 'id'>) => void;
  onEditSubject: (subject: Subject) => void;
  onDeleteSubject: (id: string) => void;
  onSaveLessonPlan: (plan: LessonPlanRecord) => void;
}

export default function SubjectsView({ 
  subjects, 
  students, 
  grades,
  lessonPlans = [],
  onAddSubject,
  onEditSubject,
  onDeleteSubject,
  onSaveLessonPlan
}: SubjectsViewProps) {
  const activeStudents = useMemo(() => students.filter(s => s.status === 'Ativo'), [students]);

  // Modal and form states
  const [modalType, setModalType] = useState<'add' | 'edit' | null>(null);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form values
  const [name, setName] = useState('');
  const [teacherName, setTeacherName] = useState('Pb. Marcelo Reinert');
  const [workload, setWorkload] = useState<number>(60);

  // Compute stats per subject
  const subjectStats = useMemo(() => {
    return subjects.map(sub => {
      const subjectGrades = grades.filter(g => g.subjectId === sub.id && g.averageGrade !== null);
      const studentCount = activeStudents.length;

      const average = subjectGrades.length
        ? parseFloat((subjectGrades.reduce((acc, curr) => acc + (curr.averageGrade || 0), 0) / subjectGrades.length).toFixed(1))
        : 0;

      const passed = subjectGrades.filter(g => g.status === 'Aprovado').length;
      const passedRate = studentCount > 0 ? Math.round((passed / studentCount) * 100) : 100;

      return {
        ...sub,
        studentCount,
        average,
        passedRate
      };
    });
  }, [subjects, students, grades, activeStudents]);

  const handleOpenAdd = () => {
    setName('');
    setTeacherName('Pb. Marcelo Reinert');
    setWorkload(60);
    setEditingSubject(null);
    setModalType('add');
  };

  const handleOpenEdit = (sub: Subject) => {
    setEditingSubject(sub);
    setName(sub.name);
    setTeacherName(sub.teacherName);
    setWorkload(sub.workload);
    setModalType('edit');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !teacherName.trim()) return;

    if (modalType === 'add') {
      onAddSubject({
        name: name.trim(),
        teacherName: teacherName.trim(),
        workload: Number(workload)
      });
    } else if (modalType === 'edit' && editingSubject) {
      onEditSubject({
        id: editingSubject.id,
        name: name.trim(),
        teacherName: teacherName.trim(),
        workload: Number(workload)
      });
    }
    setModalType(null);
  };

  const handleConfirmDelete = () => {
    if (deleteId) {
      onDeleteSubject(deleteId);
      setDeleteId(null);
    }
  };

  // AI Content modal & generation states
  const [aiModalSubject, setAiModalSubject] = useState<Subject | null>(null);
  const [selectedClassNumber, setSelectedClassNumber] = useState<'ementa' | number>(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiContentText, setAiContentText] = useState('');
  const [aiError, setAiError] = useState('');
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [customClassNotes, setCustomClassNotes] = useState('');

  const loadLessonContent = (sub: Subject, clsNum: 'ementa' | number) => {
    if (clsNum === 'ementa') {
      return sub.aiContent || '';
    }
    const plan = lessonPlans.find(p => p.subjectId === sub.id && p.classNumber === clsNum);
    return plan?.content || '';
  };

  const handleOpenAiModal = (sub: Subject) => {
    setAiModalSubject(sub);
    setSelectedClassNumber('ementa');
    setAiContentText(sub.aiContent || '');
    setCustomClassNotes('');
    setAiError('');
    setIsEditingMode(false);
  };

  const handleSwitchClassNumber = (num: 'ementa' | number) => {
    if (!aiModalSubject) return;
    
    // Auto-save current content before switching
    if (aiContentText.trim()) {
      if (selectedClassNumber === 'ementa') {
        const updatedSub = { ...aiModalSubject, aiContent: aiContentText.trim() };
        onEditSubject(updatedSub);
        setAiModalSubject(updatedSub);
      } else {
        onSaveLessonPlan({
          id: `lesson-${aiModalSubject.id}-${selectedClassNumber}`,
          subjectId: aiModalSubject.id,
          classNumber: selectedClassNumber as number,
          content: aiContentText.trim()
        });
      }
    }

    setSelectedClassNumber(num);
    const existing = loadLessonContent(aiModalSubject, num);
    setAiContentText(existing);
    setCustomClassNotes('');
    setIsEditingMode(false);
    setAiError('');
  };

  const handleGenerateAiContent = async () => {
    if (!aiModalSubject) return;
    setIsGenerating(true);
    setAiError('');
    try {
      const response = await fetch("/api/gemini/generate-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectName: aiModalSubject.name,
          teacherName: aiModalSubject.teacherName,
          workload: aiModalSubject.workload,
          classNotes: customClassNotes,
          classNumber: selectedClassNumber,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Houve uma falha ao gerar o conteúdo.");
      }

      const data = await response.json();
      setAiContentText(data.content);
      
      // Auto-save generated content immediately
      if (selectedClassNumber === 'ementa') {
        const updatedSub = { ...aiModalSubject, aiContent: data.content.trim() };
        onEditSubject(updatedSub);
        setAiModalSubject(updatedSub);
      } else {
        onSaveLessonPlan({
          id: `lesson-${aiModalSubject.id}-${selectedClassNumber}`,
          subjectId: aiModalSubject.id,
          classNumber: selectedClassNumber as number,
          content: data.content.trim()
        });
      }
    } catch (err: any) {
      console.error("Erro na geração de IA:", err);
      setAiError(err.message || "Não foi possível se conectar ao serviço de inteligência artificial. Verifique se o servidor está ativo.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveAiContent = () => {
    if (!aiModalSubject) return;
    if (selectedClassNumber === 'ementa') {
      onEditSubject({
        ...aiModalSubject,
        aiContent: aiContentText.trim()
      });
    } else {
      onSaveLessonPlan({
        id: `lesson-${aiModalSubject.id}-${selectedClassNumber}`,
        subjectId: aiModalSubject.id,
        classNumber: selectedClassNumber as number,
        content: aiContentText.trim()
      });
    }
    setAiModalSubject(null);
  };

  function renderMarkdown(md: string) {
    if (!md) {
      return (
        <p className="text-xs text-slate-400 italic text-center py-6">
          {selectedClassNumber === 'ementa'
            ? 'Nenhuma ementa teológica estruturada para esta disciplina. Clique em "Gerar com IA" para planejar esta ementa de forma automatizada!'
            : `Nenhum plano de estudos estruturado para a Aula ${selectedClassNumber}. Clique em "Gerar com IA" para planejar esta aula de forma automatizada!`}
        </p>
      );
    }
    const lines = md.split('\n');
    return lines.map((line, idx) => {
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
    });
  }

  return (
    <div className="space-y-6" id="subjects-container">
      {/* Title & Action Call */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-sans font-semibold tracking-tight text-slate-800">Cursos e Disciplinas</h1>
          <p className="text-sm text-slate-500">Consulte a ementa de estudos, carga horária docente e coeficientes de aproveitamento acadêmico.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="bg-indigo-600 hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-150 text-white font-bold rounded-xl text-xs px-4 py-3 flex items-center justify-center gap-1.5 transition-all shadow-md shadow-indigo-100 shrink-0 self-start sm:self-center"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Disciplina</span>
        </button>
      </div>

      {/* Grid of subjects */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {subjectStats.map((sub) => (
          <div key={sub.id} className="bg-white rounded-2xl border border-slate-100 p-6 space-y-6 shadow-xs flex flex-col justify-between hover:border-indigo-400 hover:shadow-md transition-colors duration-200">
            <div>
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg uppercase tracking-wider">
                    Código: {sub.id.toUpperCase()}
                  </span>
                  
                  {/* Action buttons */}
                  <button
                    onClick={() => handleOpenEdit(sub)}
                    className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded transition"
                    title="Editar Disciplina"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteId(sub.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-50 rounded transition"
                    title="Excluir Disciplina"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Title & Teacher */}
              <div className="mt-4">
                <h3 className="text-lg font-bold text-slate-800">{sub.name}</h3>
                <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                  <User className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="font-semibold text-slate-600">Docente: {sub.teacherName}</span>
                </div>
              </div>

              {/* Data descriptors */}
              <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Carga Horária</span>
                    <span className="text-xs font-semibold text-slate-700">{sub.workload} horas aula</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-slate-400" />
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Alunos Matriculados</span>
                    <span className="text-xs font-semibold text-slate-700">{sub.studentCount} ativos</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Metrics */}
            <div className="mt-6 pt-4 border-t border-slate-100 space-y-3 bg-slate-50/50 p-4 rounded-2xl">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 font-medium">Média de Classificação da Turma:</span>
                <strong className="font-mono text-slate-800 font-bold">{sub.average} / 10</strong>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 font-medium">Taxa de Aproveitamento (Aprovados):</span>
                <strong className="text-emerald-600 font-bold">{sub.passedRate}%</strong>
              </div>
            </div>

            {/* AI Planejador de Ementas */}
            <div className="mt-4 pt-4 border-t border-dashed border-slate-200">
              {(() => {
                const plansCount = lessonPlans.filter(p => p.subjectId === sub.id).length;
                if (plansCount > 0) {
                  return (
                    <button
                      type="button"
                      onClick={() => handleOpenAiModal(sub)}
                      className="w-full bg-indigo-50 hover:bg-indigo-100/70 border border-indigo-100 text-indigo-700 text-xs font-bold py-2.5 px-4 rounded-xl transition flex items-center justify-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
                      <span>Ver Planejador de Aulas ({plansCount}/4)</span>
                    </button>
                  );
                } else {
                  return (
                    <button
                      type="button"
                      onClick={() => handleOpenAiModal(sub)}
                      className="w-full bg-white hover:bg-indigo-50/50 border border-dashed border-indigo-200 text-indigo-600 text-xs font-bold py-2.5 px-4 rounded-xl transition flex items-center justify-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Gerar Planejador de Aulas (0/4)</span>
                    </button>
                  );
                }
              })()}
            </div>

          </div>
        ))}
      </div>

      {/* MODAL: ADD / EDIT SUBJECT */}
      {modalType && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 relative space-y-4">
            <button 
              onClick={() => setModalType(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-md font-sans font-bold text-slate-800">
                {modalType === 'add' ? 'Adicionar Nova Disciplina' : 'Editar Disciplina'}
              </h3>
              <p className="text-xs text-slate-500">Insira as informações acadêmicas e o professor encarregado.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nome da Disciplina</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Grego e Exegese Bíblica"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nome do Docente</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Prof. Dr. André Castelo"
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Carga Horária (horas)</label>
                <input
                  type="number"
                  min={1}
                  max={200}
                  required
                  placeholder="Ex: 60"
                  value={workload}
                  onChange={(e) => setWorkload(Number(e.target.value))}
                  className="w-full text-xs px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                />
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
                  Salvar
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
              <h3 className="text-md font-sans font-bold text-slate-800">Remover Disciplina</h3>
              <p className="text-xs text-slate-500 leading-relaxed mt-1">
                Atenção: Ao excluir esta disciplina, todas as avaliações, boletins de notas e registros de frefuência associados a ela serão apagados permanentemente!
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
                Excluir Permanentemente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: AI CONTENT GENERATOR / VIEWER */}
      {aiModalSubject && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-slate-100 relative flex flex-col max-h-[85vh]">
            <button 
              onClick={() => setAiModalSubject(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 transition"
              disabled={isGenerating}
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-2 shrink-0">
              <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg uppercase tracking-wider">Módulo de Inteligência Artificial</span>
                <h3 className="text-md font-sans font-bold text-slate-800 leading-tight mt-0.5">Planejador Teológico Virtual</h3>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 mb-4 flex justify-between items-center text-xs shrink-0">
              <div>
                <strong className="text-slate-700 block">Disciplina: {aiModalSubject.name}</strong>
                <span className="text-slate-500 font-mono text-[10px]">Carga Horária: {aiModalSubject.workload}h / Docente: {aiModalSubject.teacherName}</span>
              </div>
            </div>

            {/* Lesson selector */}
            <div className="flex border-b border-slate-100 pb-1.5 gap-1.5 overflow-x-auto scrollbar-none mb-4 shrink-0">
              <button
                type="button"
                onClick={() => handleSwitchClassNumber('ementa')}
                disabled={isGenerating}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition whitespace-nowrap ${
                  selectedClassNumber === 'ementa'
                    ? 'bg-indigo-50 text-indigo-605 border border-indigo-200'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                Matriz / Ementa Geral
              </button>
              {[1, 2, 3, 4].map(num => {
                const hasPlan = lessonPlans.some(p => p.subjectId === aiModalSubject.id && p.classNumber === num && p.content.trim().length > 10);
                return (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleSwitchClassNumber(num)}
                    disabled={isGenerating}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1.5 whitespace-nowrap ${
                      selectedClassNumber === num
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200/50'
                    }`}
                  >
                    <span>Aula {num}</span>
                    {hasPlan ? (
                      <span className={`w-1.5 h-1.5 rounded-full ${selectedClassNumber === num ? 'bg-white animate-pulse' : 'bg-emerald-500'}`} />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Input for custom lesson snippets */}
            <div className="mb-4 bg-indigo-50/40 p-3 rounded-xl border border-indigo-100/50 shrink-0 font-sans">
              <label className="block text-[10px] font-extrabold text-indigo-950 uppercase tracking-wider mb-1">
                {selectedClassNumber === 'ementa'
                  ? 'Foco ou direcionamento da disciplina (Opcional):'
                  : 'Tópicos lecionados ou trechos da aula (Opcional):'}
              </label>
              <textarea
                value={customClassNotes}
                onChange={(e) => setCustomClassNotes(e.target.value)}
                placeholder={selectedClassNumber === 'ementa'
                  ? 'Ex: Focar na teologia das epístolas paulinas, com ênfase na graça, soberania de Deus e eclesiologia prática...'
                  : 'Ex: Discutimos a Teologia Paulina sobre a Justificação pela Fé em Romanos 3-5, a diferença com as obras da lei e as implicações teológicas para a igreja...'}
                disabled={isGenerating}
                className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-1.5 focus:ring-indigo-500 font-medium min-h-[60px] max-h-[100px] transition"
              />
              <p className="text-[9px] text-indigo-900/60 mt-1 leading-snug font-sans">
                {selectedClassNumber === 'ementa'
                  ? 'A Inteligência Artificial estruturará uma ementa teológica rica, com os objetivos gerais da disciplina, cronograma macro de debates e referências bibliográficas recomendadas.'
                  : 'A Inteligência Artificial expandirá estes trechos criando planos de ensino periódicos, referências bibliográficas e perguntas de reflexão prática para os alunos.'}
              </p>
            </div>

            {/* Selector tabs between view and edit */}
            {aiContentText && !isGenerating && (
              <div className="flex border-b border-slate-150 mb-3 text-xs shrink-0">
                <button
                  type="button"
                  onClick={() => setIsEditingMode(false)}
                  className={`px-4 py-2 font-bold border-b-2 transition ${!isEditingMode ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                >
                  Visualizar Formatação
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingMode(true)}
                  className={`px-4 py-2 font-bold border-b-2 transition ${isEditingMode ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                >
                  Editar Texto (Markdown)
                </button>
              </div>
            )}

            {/* Error banner */}
            {aiError && (
              <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 text-xs rounded-xl flex items-start gap-2 mb-3 shrink-0">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="font-semibold">{aiError}</span>
              </div>
            )}

            {/* Main Area: Scrollable Content, Textarea or Loading */}
            <div className="flex-1 overflow-y-auto mb-4 border border-slate-100 rounded-xl p-4 bg-slate-50/50 min-h-[150px] md:min-h-[250px]">
              {isGenerating ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-12">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin" />
                    <Sparkles className="w-5 h-5 text-indigo-500 absolute inset-0 m-auto animate-pulse" />
                  </div>
                  <div className="space-y-1.5">
                    <h4 className="text-sm font-bold text-indigo-950 animate-pulse">Consultando I.A. Hermenêutica...</h4>
                    <p className="text-[10px] text-slate-400 font-mono italic max-w-xs mx-auto">
                      "Estruturando ementa, selecionando conteúdos de apoio, inserindo sugestões bibliográficas e traçando reflexões teológicas..."
                    </p>
                  </div>
                </div>
              ) : isEditingMode ? (
                <textarea
                  value={aiContentText}
                  onChange={(e) => setAiContentText(e.target.value)}
                  placeholder="Cole ou escreva o plano de aula em formato Markdown aqui..."
                  className="w-full h-full text-xs font-mono p-1 bg-transparent border-0 focus:ring-0 resize-none outline-none min-h-[280px]"
                />
              ) : (
                <div className="prose prose-slate max-w-none text-xs leading-relaxed">
                  {renderMarkdown(aiContentText)}
                </div>
              )}
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs shrink-0">
              <button
                type="button"
                onClick={() => handleGenerateAiContent()}
                disabled={isGenerating}
                className="bg-indigo-50 text-indigo-600 font-bold hover:bg-indigo-100 border border-indigo-100 px-4 py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 disabled:opacity-50 shadow-3xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>{aiContentText ? 'Regenerar com IA' : 'Gerar com IA'}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAiModalSubject(null)}
                  disabled={isGenerating}
                  className="px-4 py-2 text-slate-500 hover:text-slate-800 font-semibold transition"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveAiContent}
                  disabled={isGenerating}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl px-4 py-2.5 transition disabled:opacity-50 shadow-md shadow-indigo-100"
                >
                  Salvar e Fechar
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
