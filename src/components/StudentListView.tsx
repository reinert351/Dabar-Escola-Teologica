import React, { useState, useMemo } from 'react';
import { Search, Plus, Edit, Trash2, UserPlus, X, Check, Eye, User, Calendar, Mail, Download } from 'lucide-react';
import { Student, ClassGroup } from '../types';
import { exportToCSV } from '../utils/exportUtils';

interface StudentListViewProps {
  students: Student[];
  classes?: ClassGroup[];
  onAddStudent: (student: Omit<Student, 'id' | 'registrationNumber' | 'enrollmentDate'>) => void;
  onEditStudent: (student: Student) => void;
  onDeleteStudent: (id: string) => void;
}

export default function StudentListView({ students, classes = [], onAddStudent, onEditStudent, onDeleteStudent }: StudentListViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Todos' | 'Ativo' | 'Inativo'>('Todos');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  
  // Modal states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [studentToDeleteId, setStudentToDeleteId] = useState<string | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formBirthDate, setFormBirthDate] = useState('');
  const [formGender, setFormGender] = useState<'M' | 'F'>('M');
  const [formClassName, setFormClassName] = useState('Turma Alpha (Teologia)');
  const [formStatus, setFormStatus] = useState<'Ativo' | 'Inativo'>('Ativo');
  const [editingId, setEditingId] = useState('');

  // Filtering
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const matchesSearch = 
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = 
        statusFilter === 'Todos' || student.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [students, searchTerm, statusFilter]);

  const openAddModal = () => {
    setFormName('');
    setFormEmail('');
    setFormBirthDate('1998-01-01');
    setFormGender('M');
    setFormClassName(classes[0]?.name || 'Turma Alpha (Teologia)');
    setFormStatus('Ativo');
    setIsAddOpen(true);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim()) return;
    onAddStudent({
      name: formName,
      email: formEmail,
      gender: formGender,
      birthDate: formBirthDate,
      className: formClassName,
      status: formStatus
    });
    setIsAddOpen(false);
  };

  const openEditModal = (student: Student) => {
    setEditingId(student.id);
    setFormName(student.name);
    setFormEmail(student.email);
    setFormBirthDate(student.birthDate);
    setFormGender(student.gender);
    setFormClassName(student.className);
    setFormStatus(student.status);
    setIsEditOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim()) return;
    const original = students.find(s => s.id === editingId);
    if (original) {
      onEditStudent({
        ...original,
        name: formName,
        email: formEmail,
        gender: formGender,
        birthDate: formBirthDate,
        className: formClassName,
        status: formStatus
      });
    }
    setIsEditOpen(false);
  };

  const handleDeleteClick = (id: string) => {
    setStudentToDeleteId(id);
  };

  const confirmDelete = () => {
    if (studentToDeleteId) {
      onDeleteStudent(studentToDeleteId);
      if (selectedStudent?.id === studentToDeleteId) {
        setSelectedStudent(null);
      }
      setStudentToDeleteId(null);
    }
  };

  return (
    <div className="space-y-6" id="student-list-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-sans font-semibold tracking-tight text-slate-800">Gestão de Alunos</h1>
          <p className="text-sm text-slate-500">Cadastre, edite e consulte informações de alunos matriculados.</p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            onClick={() => {
              const csvHeaders = ['Nome', 'Matricula', 'Email', 'Turma', 'Status', 'Data Nascimento', 'Genero', 'Data Matricula'];
              const csvRows = filteredStudents.map(s => [
                s.name, s.registrationNumber, s.email, s.className, s.status, s.birthDate, s.gender, s.enrollmentDate
              ]);
              exportToCSV('alunos_lista.csv', csvHeaders, csvRows);
            }}
            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-xl text-xs px-4 py-3 flex items-center justify-center gap-1.5 transition-all shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Exportar CSV</span>
          </button>
          <button
            onClick={openAddModal}
            className="bg-indigo-600 hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-100 text-white font-medium rounded-xl text-sm px-4 py-2.5 flex items-center gap-2 transition-colors duration-150 shadow-md shadow-indigo-100"
          >
            <UserPlus className="w-4 h-4" />
            <span>Matricular Aluno</span>
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search input */}
        <div className="relative w-full md:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            placeholder="Buscar por nome, e-mail ou matrícula..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg w-full md:w-auto self-stretch md:self-auto justify-center">
          {(['Todos', 'Ativo', 'Inativo'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all duration-150 ${
                statusFilter === filter
                  ? 'bg-white text-slate-800 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {filter === 'Todos' ? 'Todos os Alunos' : filter}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content split Grid List vs Details Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Student Table/Card List (2/3 width on large screens) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-100 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Aluno</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Matrícula</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Turma</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => (
                    <tr 
                      key={student.id} 
                      className={`hover:bg-indigo-50/30 cursor-pointer transition-colors ${selectedStudent?.id === student.id ? 'bg-indigo-50/50' : ''}`}
                      onClick={() => setSelectedStudent(student)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          {student.photoUrl ? (
                            <img src={student.photoUrl} alt={student.name} referrerPolicy="no-referrer" className="w-9 h-9 rounded-full object-cover border border-slate-100 shadow-xs" />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold border border-slate-200">
                              {student.name.charAt(0)}
                            </div>
                          )}
                          <div>
                            <div className="text-sm font-semibold text-slate-800">{student.name}</div>
                            <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                              <Mail className="w-3 h-3" />
                              <span>{student.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs font-mono text-slate-500">
                        {student.registrationNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {student.className}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          student.status === 'Ativo' 
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}>
                          {student.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm" onClick={(e) => e.stopPropagation()}>
                        <div className="inline-flex gap-1">
                          <button
                            onClick={() => setSelectedStudent(student)}
                            title="Visualizar Detalhes"
                            className="p-1 px-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(student)}
                            title="Editar Cadastro"
                            className="p-1 px-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(student.id)}
                            title="Excluir Aluno"
                            className="p-1 px-1.5 text-slate-400 hover:text-rose-500 rounded-md hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-slate-400 text-sm">
                      Nenhum aluno cadastrado atende aos filtros atuais.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Student details panel (1/3 width) */}
        <div className="lg:col-span-1">
          {selectedStudent ? (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6 sticky top-4">
              <div className="flex items-start justify-between">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-4 h-4 text-indigo-500" /> Detalhes do Aluno
                </h3>
                <button 
                  onClick={() => setSelectedStudent(null)} 
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Bio block */}
              <div className="flex flex-col items-center text-center pb-4 border-b border-slate-100">
                {selectedStudent.photoUrl ? (
                  <img src={selectedStudent.photoUrl} alt={selectedStudent.name} referrerPolicy="no-referrer" className="w-20 h-20 rounded-full object-cover border-2 border-indigo-300 shadow-md mb-3" />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-3xl font-bold mb-3 border-2 border-indigo-100">
                    {selectedStudent.name.charAt(0)}
                  </div>
                )}
                <h4 className="text-md font-bold text-slate-800 leading-tight">{selectedStudent.name}</h4>
                <p className="text-xs text-slate-400 font-mono mt-1">{selectedStudent.email}</p>
                
                <span className={`inline-flex items-center mt-3 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  selectedStudent.status === 'Ativo' 
                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                    : 'bg-slate-100 text-slate-500 border border-slate-100'
                }`}>
                  {selectedStudent.status}
                </span>
              </div>

              {/* Data list */}
              <div className="space-y-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-medium">Nº de Matrícula:</span>
                  <span className="font-mono font-bold text-slate-700">{selectedStudent.registrationNumber}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-medium">Turma Associada:</span>
                  <span className="font-semibold text-slate-700">{selectedStudent.className}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-medium">Data de Nascimento:</span>
                  <span className="font-semibold text-slate-700">{new Date(selectedStudent.birthDate + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-medium">Gênero:</span>
                  <span className="font-semibold text-slate-700">{selectedStudent.gender === 'M' ? 'Masculino' : 'Feminino'}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-medium">Data de Matrícula:</span>
                  <span className="font-semibold text-slate-700 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {new Date(selectedStudent.enrollmentDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>

              {/* Actions Box */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  onClick={() => openEditModal(selectedStudent)}
                  className="p-2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Editar Perfil</span>
                </button>
                <button
                  onClick={() => handleDeleteClick(selectedStudent.id)}
                  className="p-2 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Excluir Ficha</span>
                </button>
              </div>

            </div>
          ) : (
            <div className="bg-slate-50/50 rounded-xl border-2 border-dashed border-slate-200 p-8 text-center text-slate-400 text-xs">
              <User className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              Clique em um aluno na lista para examinar sua ficha cadastral completa e realizar ações rápidas.
            </div>
          )}
        </div>

      </div>

      {/* ================= ADD STUDENT MODAL ================= */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-md w-full overflow-hidden">
            <div className="bg-indigo-950 px-6 py-4 flex items-center justify-between text-white">
              <h3 className="font-sans font-semibold text-md flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-400" /> Matricular Novo Aluno
              </h3>
              <button onClick={() => setIsAddOpen(false)} className="p-1 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Nome Completo</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Nome do aluno"
                  className="block w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">E-mail de Contato</label>
                <input
                  type="email"
                  required
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="exemplo@gmail.com"
                  className="block w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Nascimento</label>
                  <input
                    type="date"
                    required
                    value={formBirthDate}
                    onChange={(e) => setFormBirthDate(e.target.value)}
                    className="block w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Gênero</label>
                  <select
                    value={formGender}
                    onChange={(e) => setFormGender(e.target.value as 'M' | 'F')}
                    className="block w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                  >
                    <option value="M">Masculino</option>
                    <option value="F">Feminino</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Turma de Ingresso</label>
                <select
                  value={formClassName}
                  onChange={(e) => setFormClassName(e.target.value)}
                  className="block w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                >
                  {classes.map(cls => (
                    <option key={cls.id} value={cls.name}>{cls.name}</option>
                  ))}
                  {classes.length === 0 && (
                    <option value="Turma Alpha (Teologia)">Turma Alpha (Teologia)</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Status Inicial</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as 'Ativo' | 'Inativo')}
                  className="block w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                >
                  <option value="Ativo">Ativo (Confirmado)</option>
                  <option value="Inativo">Inativo (Trancado)</option>
                </select>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="w-1/2 p-2.5 border border-slate-200 rounded-xl text-slate-600 text-sm font-semibold hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-100 transition-all"
                >
                  Matricular
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= EDIT STUDENT MODAL ================= */}
      {isEditOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-md w-full overflow-hidden">
            <div className="bg-indigo-950 px-6 py-4 flex items-center justify-between text-white">
              <h3 className="font-sans font-semibold text-md flex items-center gap-2">
                <Edit className="w-5 h-5 text-indigo-400" /> Editar Ficha do Aluno
              </h3>
              <button onClick={() => setIsEditOpen(false)} className="p-1 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Nome Completo</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="block w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">E-mail de Contato</label>
                <input
                  type="email"
                  required
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="block w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Nascimento</label>
                  <input
                    type="date"
                    required
                    value={formBirthDate}
                    onChange={(e) => setFormBirthDate(e.target.value)}
                    className="block w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Gênero</label>
                  <select
                    value={formGender}
                    onChange={(e) => setFormGender(e.target.value as 'M' | 'F')}
                    className="block w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                  >
                    <option value="M">Masculino</option>
                    <option value="F">Feminino</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-605 uppercase mb-1.5">Turma</label>
                <select
                  value={formClassName}
                  onChange={(e) => setFormClassName(e.target.value)}
                  className="block w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                >
                  {classes.map(cls => (
                    <option key={cls.id} value={cls.name}>{cls.name}</option>
                  ))}
                  {classes.length === 0 && (
                    <option value="Turma Alpha (Teologia)">Turma Alpha (Teologia)</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Status</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as 'Ativo' | 'Inativo')}
                  className="block w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                >
                  <option value="Ativo">Ativo</option>
                  <option value="Inativo">Inativo (Trancado)</option>
                </select>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="w-1/2 p-2.5 border border-slate-200 rounded-xl text-slate-600 text-sm font-semibold hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-100 transition-all"
                >
                  Salvar Edição
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= CONFIRM DELETE MODAL ================= */}
      {studentToDeleteId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-sm w-full overflow-hidden">
            <div className="bg-rose-50 border-b border-rose-100 px-6 py-4 flex items-center gap-3 text-rose-800">
              <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-sans font-bold text-sm tracking-tight text-rose-900">Excluir Ficha do Aluno?</h3>
                <p className="text-[10px] text-rose-600/80 font-medium">Esta ação não pode ser desfeita.</p>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed font-sans">
                Deseja realmente remover o registro de <strong>{students.find(s => s.id === studentToDeleteId)?.name || 'Este Aluno'}</strong>? 
                Todos os dados históricos relacionados, boletim de notas e registros de presença associados a este aluno também serão desfeitos do sistema.
              </p>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStudentToDeleteId(null)}
                  className="w-1/2 p-2.5 border border-slate-200 rounded-xl text-slate-600 text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  className="w-1/2 p-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-100 transition-all cursor-pointer"
                >
                  Confirmar Exclusão
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
