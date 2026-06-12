import React, { useState, useMemo } from 'react';
import { 
  Search, 
  DollarSign, 
  Check, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Plus, 
  Edit, 
  Trash2, 
  X, 
  AlertCircle, 
  Sparkles,
  TrendingUp,
  Tag,
  Download
} from 'lucide-react';
import { Student, PaymentRecord, CashTransaction } from '../types';
import { exportToCSV } from '../utils/exportUtils';

interface FinancialViewProps {
  students: Student[];
  payments: PaymentRecord[];
  onTogglePaymentStatus: (paymentId: string) => void;
  onUpdatePayment?: (payment: PaymentRecord) => void;
  onDeletePayment?: (paymentId: string) => void;
  onAddPayments?: (newPayments: Omit<PaymentRecord, 'id'>[]) => void;
  transactions: CashTransaction[];
  onAddTransaction: (transaction: Omit<CashTransaction, 'id'>) => void;
  onEditTransaction: (transaction: CashTransaction) => void;
  onDeleteTransaction: (id: string) => void;
}

export default function FinancialView({ 
  students, 
  payments, 
  onTogglePaymentStatus,
  onUpdatePayment,
  onDeletePayment,
  onAddPayments,
  transactions = [],
  onAddTransaction,
  onEditTransaction,
  onDeleteTransaction
}: FinancialViewProps) {
  // Visual sub-tabs: 'mensalidades' (tuition status ledger) and 'caixa' (entries and exits)
  const [activeTab, setActiveTab] = useState<'mensalidades' | 'caixa'>('caixa');

  // --- TAB 1: MENSALIDADES STATES ---
  const [tuitionSearch, setTuitionSearch] = useState('');
  const [tuitionStatusFilter, setTuitionStatusFilter] = useState<'Todos' | 'Pago' | 'Pendente' | 'Atrasado'>('Todos');
  const [tuitionMonthFilter, setTuitionMonthFilter] = useState<string>('Janeiro 2026/Todos');

  // CRUD States for Book Payments
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<PaymentRecord | null>(null);
  const [payValue, setPayValue] = useState<number>(0);
  const [payDueDate, setPayDueDate] = useState<string>('');
  const [payStatus, setPayStatus] = useState<'Pago' | 'Pendente' | 'Atrasado'>('Pendente');
  const [payMonth, setPayMonth] = useState<string>('');
  const [payPaymentDate, setPayPaymentDate] = useState<string>('');
  const [paymentToDelete, setPaymentToDelete] = useState<PaymentRecord | null>(null);

  // New Batch Payment Generation States
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [batchStudentId, setBatchStudentId] = useState<string>('all'); // 'all' or studentId
  const [batchMonths, setBatchMonths] = useState<string[]>([]);
  const [batchCustomMonth, setBatchCustomMonth] = useState<string>('');
  const [batchValue, setBatchValue] = useState<number>(60.00);
  const [batchDueDay, setBatchDueDay] = useState<number>(10);
  const [batchInitialStatus, setBatchInitialStatus] = useState<'Pago' | 'Pendente'>('Pendente');

  // --- TAB 2: LIVRO DE CAIXA STATES ---
  const [cashSearch, setCashSearch] = useState('');
  const [cashTypeFilter, setCashTypeFilter] = useState<'todos' | 'entrada' | 'saida'>('todos');
  const [cashCategoryFilter, setCashCategoryFilter] = useState<string>('todos');

  // CRUD States for Cash Transactions
  const [isCashModalOpen, setIsCashModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<CashTransaction | null>(null);
  const [deleteTransactionId, setDeleteTransactionId] = useState<string | null>(null);

  // Form Field States
  const [desc, setDesc] = useState('');
  const [val, setVal] = useState<number>(0);
  const [type, setType] = useState<'entrada' | 'saida'>('entrada');
  const [date, setDate] = useState('2026-06-07');
  const [category, setCategory] = useState('Venda de Livros');

  // Available categories for Cash Ledger
  const availableCategories = [
    'Venda de Livros',
    'Ofertas nas aulas',
    'Contas de Consumo',
    'Aluguel',
    'Material Acadêmico',
    'Doações',
    'Manutenção',
    'Salários',
    'Eventos',
    'Outros'
  ];

  // Presets as requested: quick payment list examples
  const handleLoadBookSaleExample = () => {
    onAddTransaction({
      description: 'Venda de Livro Teológico: Catecismo Reformado de Heidelberg',
      value: 60.00,
      type: 'entrada',
      date: '2026-06-07',
      category: 'Venda de Livros'
    });
  };

  const handleLoadBoletoExample = () => {
    onAddTransaction({
      description: 'Pagamento de Boleto: Serviço Mensal de Internet Banda Larga',
      value: 149.90,
      type: 'saida',
      date: '2026-06-07',
      category: 'Contas de Consumo'
    });
  };

  // --- COMPUTE STATS ---
  // A. Tuition fees stats
  const totals = useMemo(() => {
    let received = 0;
    let pending = 0;
    let overdue = 0;

    payments.forEach(p => {
      const student = students.find(s => s.id === p.studentId);
      if (student?.status !== 'Ativo' && student?.id !== 'std-reinert') return; 

      if (p.status === 'Pago') received += p.value;
      else if (p.status === 'Pendente') pending += p.value;
      else if (p.status === 'Atrasado') overdue += p.value;
    });

    return { received, pending, overdue };
  }, [payments, students]);

  // B. Real-time Cash Book metrics (Summing entries and exits)
  const cashBookStats = useMemo(() => {
    let totalEntradas = 0;
    let totalSaidas = 0;

    transactions.forEach(t => {
      if (t.type === 'entrada') {
        totalEntradas += t.value;
      } else {
        totalSaidas += t.value;
      }
    });

    const saldo = totalEntradas - totalSaidas;

    return { totalEntradas, totalSaidas, saldo };
  }, [transactions]);

  // List unique reference months for tuition filtration
  const uniqueMonths = useMemo(() => {
    return Array.from(new Set(payments.map(p => p.month)));
  }, [payments]);

  // Merge student name into payments list for quick layout rendering
  const enrichedPayments = useMemo(() => {
    return payments.map(p => {
      const student = students.find(s => s.id === p.studentId);
      return {
        ...p,
        studentName: student?.name || 'Aluno Excluído',
        studentRegistration: student?.registrationNumber || 'MAT-000',
        studentStatus: student?.status || 'Ativo'
      };
    }).filter(p => {
      const matchesSearch = 
        p.studentName.toLowerCase().includes(tuitionSearch.toLowerCase()) ||
        p.studentRegistration.toLowerCase().includes(tuitionSearch.toLowerCase());
      
      const matchesStatus = 
        tuitionStatusFilter === 'Todos' || p.status === tuitionStatusFilter;

      const matchesMonth =
        tuitionMonthFilter === 'Janeiro 2026/Todos' || p.month === tuitionMonthFilter;

      return matchesSearch && matchesStatus && matchesMonth;
    });
  }, [payments, students, tuitionSearch, tuitionStatusFilter, tuitionMonthFilter]);

  // Cashbook transaction filters
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchesSearch = t.description.toLowerCase().includes(cashSearch.toLowerCase()) || 
                            t.category.toLowerCase().includes(cashSearch.toLowerCase());
      const matchesType = cashTypeFilter === 'todos' || t.type === cashTypeFilter;
      const matchesCategory = cashCategoryFilter === 'todos' || t.category === cashCategoryFilter;

      return matchesSearch && matchesType && matchesCategory;
    });
  }, [transactions, cashSearch, cashTypeFilter, cashCategoryFilter]);

  // Open modal forms
  const handleOpenAddCash = () => {
    setEditingTransaction(null);
    setDesc('');
    setVal(0);
    setType('entrada');
    setDate('2026-06-07');
    setCategory('Venda de Livros');
    setIsCashModalOpen(true);
  };

  const handleOpenEditCash = (tx: CashTransaction) => {
    setEditingTransaction(tx);
    setDesc(tx.description);
    setVal(tx.value);
    setType(tx.type);
    setDate(tx.date);
    setCategory(tx.category);
    setIsCashModalOpen(true);
  };

  const handleOpenEditPayment = (p: PaymentRecord) => {
    setEditingPayment(p);
    setPayValue(p.value);
    setPayDueDate(p.dueDate);
    setPayStatus(p.status);
    setPayMonth(p.month);
    setPayPaymentDate(p.paymentDate || '');
    setIsPaymentModalOpen(true);
  };

  const handlePaymentFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPayment || !onUpdatePayment) return;

    onUpdatePayment({
      ...editingPayment,
      value: Number(payValue),
      dueDate: payDueDate,
      status: payStatus,
      month: payMonth.trim(),
      paymentDate: payStatus === 'Pago' ? (payPaymentDate || '2026-06-10') : undefined
    });

    setIsPaymentModalOpen(false);
    setEditingPayment(null);
  };

  const getDueDateForMonthAndDay = (monthAndYear: string, day: number): string => {
    const monthMap: Record<string, string> = {
      'janeiro': '01', 'fevereiro': '02', 'março': '03', 'marco': '03',
      'abril': '04', 'maio': '05', 'junho': '06', 'julho': '07',
      'agosto': '08', 'setembro': '09', 'outubro': '10', 'novembro': '11',
      'dezembro': '12'
    };

    const parts = monthAndYear.toLowerCase().trim().split(/\s+/);
    let monthPart = parts[0] || 'junho';
    let yearPart = parts[1] || '2026';

    const monthNum = monthMap[monthPart] || '06';
    const dayStr = String(day).padStart(2, '0');
    return `${yearPart}-${monthNum}-${dayStr}`;
  };

  const handleBatchFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onAddPayments) return;

    let monthsToProcess = [...batchMonths];
    if (batchCustomMonth.trim() && !monthsToProcess.includes(batchCustomMonth.trim())) {
      monthsToProcess.push(batchCustomMonth.trim());
    }

    if (monthsToProcess.length === 0) {
      alert("Por favor, selecione pelo menos um mês de referência ou digite um mês personalizado!");
      return;
    }

    const studentsToProcess = batchStudentId === 'all'
      ? students.filter(s => s.status === 'Ativo')
      : students.filter(s => s.id === batchStudentId);

    if (studentsToProcess.length === 0) {
      alert("Nenhum aluno ativo encontrado para realizar os lançamentos!");
      return;
    }

    const newRecords: Omit<PaymentRecord, 'id'>[] = [];

    studentsToProcess.forEach(student => {
      monthsToProcess.forEach(monthName => {
        const dueDate = getDueDateForMonthAndDay(monthName, batchDueDay);
        newRecords.push({
          studentId: student.id,
          value: Number(batchValue),
          dueDate,
          status: batchInitialStatus as any,
          paymentDate: batchInitialStatus === 'Pago' ? '2026-06-07' : undefined,
          month: monthName
        });

        if (batchInitialStatus === 'Pago') {
          onAddTransaction({
            description: `Pagamento de Livro - ${student.name} (${monthName})`,
            value: Number(batchValue),
            type: 'entrada',
            date: '2026-06-07',
            category: 'Venda de Livros'
          });
        }
      });
    });

    onAddPayments(newRecords);
    
    setIsBatchModalOpen(false);
    setBatchMonths([]);
    setBatchCustomMonth('');
    setBatchStudentId('all');
    setBatchValue(60.00);
    setBatchDueDay(10);
    setBatchInitialStatus('Pendente');
  };

  const handleCashFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc.trim() || val <= 0) return;

    if (editingTransaction) {
      onEditTransaction({
        id: editingTransaction.id,
        description: desc.trim(),
        value: Number(val),
        type,
        date,
        category
      });
    } else {
      onAddTransaction({
        description: desc.trim(),
        value: Number(val),
        type,
        date,
        category
      });
    }

    setIsCashModalOpen(false);
  };

  const handleConfirmDeleteTransaction = () => {
    if (deleteTransactionId) {
      onDeleteTransaction(deleteTransactionId);
      setDeleteTransactionId(null);
    }
  };

  return (
    <div className="space-y-6" id="financial-ledger">
      {/* Title with Sub-navigation Tabs */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-sans font-semibold tracking-tight text-slate-800">Controle Financeiro</h1>
          <p className="text-sm text-slate-500">Acompanhe os pagamentos de livros, liquidações e fluxo de caixa.</p>
        </div>

        {/* Tab Selection */}
        <div className="flex p-1 bg-slate-100 rounded-xl self-start">
          <button
            onClick={() => setActiveTab('caixa')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'caixa'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Livro de Caixa</span>
          </button>
          
          <button
            onClick={() => setActiveTab('mensalidades')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'mensalidades'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Pagamento de Livros</span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 1: LIVRO DE CAIXA (CASH BALANCES & ENTRIES/EXITS FLOW) */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'caixa' && (
        <div className="space-y-6" id="cashflow-ledger-tab">
          
          {/* Cash Summary Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Saldo Disponível */}
            <div className={`p-6 rounded-2xl shadow-lg border border-slate-100 flex flex-col justify-between transition-all ${
              cashBookStats.saldo >= 0 
                ? 'bg-white/80 border-l-4 border-l-emerald-500' 
                : 'bg-white/80 border-l-4 border-l-rose-500'
            }`}>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Saldo do Caixa Central</span>
                <div className={`text-3xl font-black mt-2 font-mono ${
                  cashBookStats.saldo >= 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}>
                  R$ {cashBookStats.saldo.toFixed(2)}
                </div>
              </div>
              <p className="text-[10px] text-slate-400 font-mono mt-3">Soma líquida de todas as movimentações</p>
            </div>

            {/* Total Entradas */}
            <div className="bg-white/80 p-6 rounded-2xl shadow-sm border border-slate-100 border-l-4 border-l-indigo-500 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Receitas acumuladas (entradas)</span>
                <div className="text-2xl font-black mt-2 text-indigo-600 font-mono">
                  + R$ {cashBookStats.totalEntradas.toFixed(2)}
                </div>
              </div>
              <p className="text-[10px] text-slate-400 font-mono mt-3">Livros, doações e matrículas avulsas</p>
            </div>

            {/* Total Saídas */}
            <div className="bg-white/80 p-6 rounded-2xl shadow-sm border border-slate-100 border-l-4 border-l-rose-400 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Despesas pagas (saídas)</span>
                <div className="text-2xl font-black mt-2 text-rose-600 font-mono">
                  - R$ {cashBookStats.totalSaidas.toFixed(2)}
                </div>
              </div>
              <p className="text-[10px] text-slate-400 font-mono mt-3">Contas de consumo, compras e boletos</p>
            </div>
          </div>

          {/* Interactive Examples Quick-Launcher Panel */}
          <div className="bg-indigo-50/50 border border-indigo-100/60 p-5 rounded-2xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-indigo-600 mt-0.5 shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider">Simulador de Demonstrativos Rápidos</h4>
                <p className="text-xs text-indigo-700/80 leading-relaxed mt-0.5">
                  Preparamos atalhos para lançar os exemplos descritos (Venda de Livro Teológico e Pagamento de Boleto de utilidade) em 1 clique para ver como o caixa reage em tempo real.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleLoadBookSaleExample}
                className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-[10px] font-bold px-3 py-2 rounded-xl transition flex items-center gap-1 shadow-2xs"
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>+ Lançar Livro (R$ 60)</span>
              </button>

              <button
                onClick={handleLoadBoletoExample}
                className="bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-800 text-[10px] font-bold px-3 py-2 rounded-xl transition flex items-center gap-1 shadow-2xs"
              >
                <ArrowDownLeft className="w-3.5 h-3.5" />
                <span>- Lançar Boleto (R$ 149)</span>
              </button>
            </div>
          </div>

          {/* Ledger Toolbar Filters */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
            {/* Search inputs */}
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-stretch sm:items-center">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar lançamento ou categoria..."
                  value={cashSearch}
                  onChange={(e) => setCashSearch(e.target.value)}
                  className="block w-full sm:w-64 pl-4 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-semibold"
                />
              </div>

              {/* Category Dropdown Filter */}
              <select
                value={cashCategoryFilter}
                onChange={(e) => setCashCategoryFilter(e.target.value)}
                className="block text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer font-semibold transition-all"
              >
                <option value="todos">Todas Categorias</option>
                {availableCategories.map((cat, idx) => (
                  <option key={idx} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Type controls & New movement button */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-full sm:w-auto justify-center">
                {([
                  { id: 'todos', label: 'Todos' },
                  { id: 'entrada', label: 'Entradas' },
                  { id: 'saida', label: 'Saídas' }
                ] as const).map(f => (
                  <button
                    key={f.id}
                    onClick={() => setCashTypeFilter(f.id)}
                    className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all ${
                      cashTypeFilter === f.id
                        ? 'bg-white text-indigo-600 shadow-3xs'
                        : 'text-slate-400 hover:text-slate-700'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <button
                onClick={() => {
                  const csvHeaders = ['Tipo', 'Descricao', 'Categoria', 'Data', 'Valor'];
                  const csvRows = filteredTransactions.map(t => [
                    t.type === 'entrada' ? 'Entrada' : 'Saida', t.description, t.category, t.date, t.value.toFixed(2)
                  ]);
                  exportToCSV('livro_caixa.csv', csvHeaders, csvRows);
                }}
                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-xl text-xs px-3 py-2.5 flex items-center justify-center gap-1.5 transition-all w-full sm:w-auto shrink-0 shadow-sm"
              >
                <Download className="w-4 h-4" />
                <span>Exportar CSV</span>
              </button>

              <button
                onClick={handleOpenAddCash}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs px-4 py-2.5 flex items-center justify-center gap-1.5 transition-all w-full sm:w-auto shrink-0 shadow-md shadow-indigo-100"
              >
                <Plus className="w-4 h-4" />
                <span>Novo Lançamento</span>
              </button>
            </div>
          </div>

          {/* Cashbook Ledger Table Grid */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="px-6 py-4">Status / Tipo</th>
                    <th className="px-6 py-4">Descrição</th>
                    <th className="px-6 py-4">Categoria</th>
                    <th className="px-6 py-4">Data Registro</th>
                    <th className="px-6 py-4">Valor de Caixa</th>
                    <th className="px-6 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTransactions.length > 0 ? (
                    filteredTransactions.map(tx => (
                      <tr key={tx.id} className="hover:bg-indigo-50/10 transition-colors">
                        
                        {/* Type Indicator */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          {tx.type === 'entrada' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-705 border border-emerald-200/50">
                              <ArrowUpRight className="w-3 h-3 text-emerald-500" />
                              <span>Entrada</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-705 border border-rose-200/50">
                              <ArrowDownLeft className="w-3 h-3 text-rose-505" />
                              <span>Saída</span>
                            </span>
                          )}
                        </td>

                        {/* Description */}
                        <td className="px-6 py-4">
                          <span className="text-xs font-semibold text-slate-800 block max-w-sm md:max-w-md truncate" title={tx.description}>
                            {tx.description}
                          </span>
                        </td>

                        {/* Category */}
                        <td className="px-6 py-4 whitespace-nowrap text-xs font-semibold text-slate-500">
                          <span className="inline-flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-lg text-slate-600 font-sans">
                            <Tag className="w-3 h-3 text-slate-400" />
                            {tx.category}
                          </span>
                        </td>

                        {/* Date */}
                        <td className="px-6 py-4 whitespace-nowrap text-xs font-mono text-slate-500">
                          {new Date(tx.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                        </td>

                        {/* Value */}
                        <td className="px-6 py-4 whitespace-nowrap text-xs font-bold font-mono">
                          <span className={tx.type === 'entrada' ? 'text-emerald-600' : 'text-rose-600'}>
                            {tx.type === 'entrada' ? '+' : '-'} R$ {tx.value.toFixed(2)}
                          </span>
                        </td>

                        {/* Action buttons */}
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEditCash(tx)}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-xl transition"
                              title="Editar registro"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteTransactionId(tx.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-50 rounded-xl transition"
                              title="Remover registro"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>

                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-slate-405 text-sm">
                        Nenhuma transação contábil corresponde aos filtros atuais.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SECTION 2: MENSALIDADES REGULAR REGISTRY (TUITION RECORDS)     */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'mensalidades' && (
        <div className="space-y-6" id="tuition-regular-ledger-tab">
          
          {/* Summary Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Total Pago */}
            <div className="bg-emerald-600 text-white p-6 rounded-2xl shadow-lg shadow-emerald-100/50">
              <span className="text-xs font-bold text-emerald-100 uppercase tracking-widest block">Recebido (Livros)</span>
              <div className="text-2xl font-black mt-2">R$ {totals.received.toFixed(2)}</div>
              <p className="text-[10px] text-emerald-100/80 font-mono mt-1">Somas compensadas de boletos de estudantes</p>
            </div>

            {/* Total Pendente */}
            <div className="bg-indigo-600 text-white p-6 rounded-2xl shadow-lg shadow-indigo-100/50">
              <span className="text-xs font-bold text-indigo-100 uppercase tracking-widest block">Agendado (Aberto)</span>
              <div className="text-2xl font-black mt-2 text-indigo-100">R$ {totals.pending.toFixed(2)}</div>
              <p className="text-[10px] text-indigo-100/80 font-mono mt-1">Estimados em cobranças vigentes</p>
            </div>

            {/* Total Atrasado */}
            <div className="bg-rose-600 text-white p-6 rounded-2xl shadow-lg shadow-rose-100/50">
              <span className="text-xs font-bold text-rose-100 uppercase tracking-widest block">Em Atraso (Vencido)</span>
              <div className="text-2xl font-black mt-2 text-rose-100">R$ {totals.overdue.toFixed(2)}</div>
              <p className="text-[10px] text-rose-100/80 font-mono mt-1">Alunos em inadimplência parcial de prazo</p>
            </div>
          </div>

          {/* Action Hub for Book Fee Generation */}
          <div className="bg-indigo-50 border border-indigo-100/50 p-5 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
            <div className="text-center sm:text-left space-y-1">
              <h4 className="text-sm font-bold text-indigo-900 tracking-wide uppercase flex items-center justify-center sm:justify-start gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                <span>Gestão de Parcelas & Mensalidades de Livros</span>
              </h4>
              <p className="text-xs text-indigo-600 leading-relaxed">
                Adicione cobranças para meses futuros, gere parcelas para um ou todos os alunos de uma vez e acompanhe o recebimento mês a mês.
              </p>
            </div>
            <button
              onClick={() => {
                setBatchStudentId('all');
                setBatchMonths([]);
                setBatchCustomMonth('');
                setBatchValue(60.00);
                setIsBatchModalOpen(true);
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-5 rounded-xl text-xs flex items-center gap-2 transition-all shadow-md shadow-indigo-600/20 active:scale-95 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Gerar Parcela de Livros</span>
            </button>
          </div>

          {/* Filters for tuition log */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-stretch sm:items-center">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar aluno ou matrícula..."
                  value={tuitionSearch}
                  onChange={(e) => setTuitionSearch(e.target.value)}
                  className="block w-full sm:w-64 pl-4 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-semibold"
                />
              </div>

              <select
                value={tuitionMonthFilter}
                onChange={(e) => setTuitionMonthFilter(e.target.value)}
                className="block text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer font-semibold transition-all"
              >
                <option value="Janeiro 2026/Todos">Todos os Meses</option>
                {uniqueMonths.map((m, idx) => (
                  <option key={idx} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-full md:w-auto justify-center">
              {(['Todos', 'Pago', 'Pendente', 'Atrasado'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setTuitionStatusFilter(f)}
                  className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all ${
                    tuitionStatusFilter === f
                      ? 'bg-white text-slate-800 shadow-3xs'
                      : 'text-slate-400 hover:text-slate-700'
                  }`}
                >
                  {f === 'Todos' ? 'Todos Status' : f}
                </button>
              ))}
              <button
                onClick={() => {
                  const csvHeaders = ['Aluno', 'Matricula', 'Mes', 'Vencimento', 'Pagamento', 'Valor', 'Status'];
                  const csvRows = enrichedPayments.map(p => [
                    p.studentName, p.studentRegistration, p.month, p.dueDate, p.paymentDate || '', p.value.toFixed(2), p.status
                  ]);
                  exportToCSV('pagamentos_livros.csv', csvHeaders, csvRows);
                }}
                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-xl text-[11px] px-3 py-1.5 flex items-center justify-center gap-1 transition-all shadow-sm ml-2"
                title="Exportar CSV"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Exportar</span>
              </button>
            </div>
          </div>

          {/* Grid spreadsheet table */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="px-6 py-4">Aluno</th>
                    <th className="px-6 py-4">Mês Referência</th>
                    <th className="px-6 py-4">Data Vencimento</th>
                    <th className="px-6 py-4">Valor do Livro</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {enrichedPayments.length > 0 ? (
                    enrichedPayments.map(p => (
                      <tr key={p.id} className="hover:bg-indigo-50/10 transition-colors">
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <span className="text-xs font-bold text-slate-800 block">{p.studentName}</span>
                            <span className="text-[10px] text-slate-400 font-mono mt-0.5">{p.studentRegistration}</span>
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-xs font-semibold text-slate-600">
                          {p.month}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-xs font-mono text-slate-500">
                          {new Date(p.dueDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-slate-705 font-mono">
                          R$ {p.value.toFixed(2)}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className={`inline-flex px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                            p.status === 'Pago'
                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                              : p.status === 'Pendente'
                              ? 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                              : 'bg-rose-50 text-rose-600 border border-rose-100'
                          }`}>
                            {p.status}
                          </span>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-right text-xs">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenEditPayment(p)}
                              className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-bold px-2.5 py-1.5 rounded-xl transition flex items-center gap-1 shadow-3xs"
                              title="Editar detalhes do pagamento"
                            >
                              <Edit className="w-3 h-3" />
                              <span>Editar</span>
                            </button>

                            {onDeletePayment && (
                              <button
                                onClick={() => setPaymentToDelete(p)}
                                className="bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-650 hover:text-rose-700 text-[10px] font-bold px-2.5 py-1.5 rounded-xl transition flex items-center gap-1 shadow-3xs"
                                title="Excluir lançamento de livro"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Excluir</span>
                              </button>
                            )}

                            {p.status !== 'Pago' ? (
                              <button
                                onClick={() => {
                                  onTogglePaymentStatus(p.id);
                                  // Automatically add tuition received to the cash transactions book too to keep bookkeeping linked!
                                  onAddTransaction({
                                    description: `Pagamento de Livro - ${p.studentName} (${p.month})`,
                                    value: p.value,
                                    type: 'entrada',
                                    date: '2026-06-07',
                                    category: 'Venda de Livros'
                                  });
                                }}
                                className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-[10px] font-bold px-2.5 py-1.5 rounded-xl transition flex items-center gap-1 shadow-3xs"
                              >
                                <Check className="w-3 h-3" />
                                <span>Apenas Receber</span>
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-medium italic">
                                Liquidado {p.paymentDate ? new Date(p.paymentDate + 'T00:00:00').toLocaleDateString('pt-BR') : ''}
                              </span>
                            )}
                          </div>
                        </td>

                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-slate-400 text-sm">
                        Nenhum pagamento de livro cadastrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* CASH FLOW ADD / EDIT DIALOG FORM MODAL                          */}
      {/* ------------------------------------------------------------- */}
      {isCashModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 relative space-y-4">
            <button 
              onClick={() => setIsCashModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 transition"
              type="button"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-md font-sans font-bold text-slate-800">
                {editingTransaction ? 'Editar Registro de Caixa' : 'Novo Lançamento de Caixa'}
              </h3>
              <p className="text-xs text-slate-500">
                Adicione fundos à instituição (entrada) ou registre despesas pagas (saída).
              </p>
            </div>

            <form onSubmit={handleCashFormSubmit} className="space-y-4">
              
              {/* Type Switcher Selector (Entrada vs Saída) */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Tipo de Fluxo Contábil
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setType('entrada')}
                    className={`py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                      type === 'entrada'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700 ring-1 ring-emerald-500/30 font-black shadow-3xs'
                        : 'border-slate-200 text-slate-505 hover:bg-slate-50'
                    }`}
                  >
                    <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                    <span>Inflow (Entrada)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setType('saida')}
                    className={`py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                      type === 'saida'
                        ? 'bg-rose-50 border-rose-500 text-rose-700 ring-1 ring-rose-500/30 font-black shadow-3xs'
                        : 'border-slate-200 text-slate-505 hover:bg-slate-50'
                    }`}
                  >
                    <ArrowDownLeft className="w-4 h-4 text-rose-500" />
                    <span>Outflow (Saída)</span>
                  </button>
                </div>
              </div>

              {/* Description Input */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Descrição do Lançamento
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Compra de livro didático de Grego Bíblico"
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                />
              </div>

              {/* Grid block for Value & Date */}
              <div className="grid grid-cols-2 gap-4">
                {/* Value input */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Valor Financ. (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="0.00"
                    value={val || ''}
                    onChange={(e) => setVal(parseFloat(e.target.value))}
                    className="w-full text-xs px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                  />
                </div>

                {/* Date record */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Data Efetiva
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                  />
                </div>
              </div>

              {/* Selector Category */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Categoria Contábil
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold cursor-pointer"
                >
                  {availableCategories.map((cat, idx) => (
                    <option key={idx} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Buttons controls */}
              <div className="pt-2 flex items-center justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setIsCashModalOpen(false)}
                  className="px-4 py-2 text-slate-500 hover:text-slate-800 font-semibold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl px-4 py-2.5 transition shadow-md shadow-indigo-100"
                >
                  {editingTransaction ? 'Gravar Alterações' : 'Salvar Entrada/Saída'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* CASH FLOW TRANSACTION DELETE CONFIRM DIALOG                   */}
      {/* ------------------------------------------------------------- */}
      {deleteTransactionId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-100 text-center space-y-4">
            <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center text-rose-505 mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-md font-sans font-bold text-slate-800">Estornar Lançamento</h3>
              <p className="text-xs text-slate-500 leading-relaxed mt-1">
                Deseja realmente remover ou estornar este lançamento de fluxo de caixa? Isso alterará o saldo da instituição em tempo real.
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 text-xs">
              <button
                onClick={() => setDeleteTransactionId(null)}
                className="px-4 py-2 text-slate-500 hover:text-slate-800 font-semibold transition"
              >
                Voltar
              </button>
              <button
                onClick={handleConfirmDeleteTransaction}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl px-4 py-2.5 transition shadow-md shadow-rose-100"
              >
                Remover Permanentemente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* BOOK PAYMENT EDIT DIALOG FORM MODAL                           */}
      {/* ------------------------------------------------------------- */}
      {isPaymentModalOpen && editingPayment && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 relative space-y-4">
            <button 
              onClick={() => {
                setIsPaymentModalOpen(false);
                setEditingPayment(null);
              }}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 transition"
              type="button"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-md font-sans font-bold text-slate-800">
                Editar Pagamento do Livro 📚
              </h3>
              <p className="text-xs text-slate-500">
                Atualize o valor, a data de vencimento, a competência e o status deste recebimento.
              </p>
            </div>

            <div className="p-3 bg-indigo-50/50 border border-indigo-100/50 rounded-xl">
              <span className="block text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Aluno(a)</span>
              <span className="text-xs font-bold text-slate-800 block">
                {students.find(s => s.id === editingPayment.studentId)?.name || 'Aluno Selecionado'}
              </span>
              <span className="text-[10px] text-slate-500 block font-mono">
                {students.find(s => s.id === editingPayment.studentId)?.registrationNumber || ''}
              </span>
            </div>

            <form onSubmit={handlePaymentFormSubmit} className="space-y-4">
              
              {/* Reference Month/Competence */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Mês Referência (Livro)
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Junho 2026"
                  value={payMonth}
                  onChange={(e) => setPayMonth(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                />
              </div>

              {/* Grid block for Value & Due Date */}
              <div className="grid grid-cols-2 gap-4">
                {/* Value input */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Valor (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="0.00"
                    value={payValue || ''}
                    onChange={(e) => setPayValue(parseFloat(e.target.value))}
                    className="w-full text-xs px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                  />
                </div>

                {/* Due Date */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Vencimento
                  </label>
                  <input
                    type="date"
                    required
                    value={payDueDate}
                    onChange={(e) => setPayDueDate(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                  />
                </div>
              </div>

              {/* Status & Payment Date Row */}
              <div className="grid grid-cols-2 gap-4">
                {/* Status selection */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Situação (Status)
                  </label>
                  <select
                    value={payStatus}
                    onChange={(e) => setPayStatus(e.target.value as any)}
                    className="w-full text-xs px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold cursor-pointer"
                  >
                    <option value="Pendente">Pendente</option>
                    <option value="Pago">Pago</option>
                    <option value="Atrasado">Atrasado</option>
                  </select>
                </div>

                {/* Payment Date - visible only if Status is Pago */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Data de Pagamento
                  </label>
                  <input
                    type="date"
                    disabled={payStatus !== 'Pago'}
                    required={payStatus === 'Pago'}
                    value={payPaymentDate}
                    onChange={(e) => setPayPaymentDate(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Buttons controls */}
              <div className="pt-2 flex items-center justify-end gap-2 text-xs">
                {onDeletePayment && (
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentToDelete(editingPayment);
                      setIsPaymentModalOpen(false);
                      setEditingPayment(null);
                    }}
                    className="mr-auto px-4 py-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 hover:text-rose-700 font-bold rounded-xl transition flex items-center gap-1.5 shadow-2xs"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Excluir</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setIsPaymentModalOpen(false);
                    setEditingPayment(null);
                  }}
                  className="px-4 py-2 text-slate-500 hover:text-slate-800 font-semibold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl px-4 py-2.5 transition shadow-md shadow-indigo-100"
                >
                  Salvar Alterações
                </button>
              </div>

            </form>
          </div>
         </div>
       )}

      {/* ------------------------------------------------------------- */}
      {/* BOOK PAYMENT BATCH CREATION DIALOG FORM MODAL                 */}
      {/* ------------------------------------------------------------- */}
      {isBatchModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-xl border border-slate-100 relative space-y-4 my-8">
            <button 
              onClick={() => setIsBatchModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 transition"
              type="button"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-base font-display font-extrabold text-slate-800 flex items-center gap-2">
                <span>📚 Gerar Parcelas & Mensalidades de Livros</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Selecione os alunos e marque quais meses deseja lançar no sistema de cobrança.
              </p>
            </div>

            <form onSubmit={handleBatchFormSubmit} className="space-y-4">
              
              {/* Target Students */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-black tracking-widest text-slate-400 uppercase">
                  Aluno(s) de Destino
                </label>
                <select
                  value={batchStudentId}
                  onChange={(e) => setBatchStudentId(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold cursor-pointer focus:bg-white focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">Todos os Alunos Ativos ({students.filter(s => s.status === 'Ativo').length})</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.registrationNumber}) - {s.status}
                    </option>
                  ))}
                </select>
              </div>

              {/* Installments parameters: Value & Due Day */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-black tracking-widest text-slate-400 uppercase mb-1.5">
                    Valor de Cada Livro (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    value={batchValue}
                    onChange={(e) => setBatchValue(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black tracking-widest text-slate-400 uppercase mb-1.5">
                    Dia de Vencimento
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="28"
                    required
                    placeholder="Ex: 10"
                    value={batchDueDay}
                    onChange={(e) => setBatchDueDay(parseInt(e.target.value) || 10)}
                    className="w-full text-xs px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:bg-white"
                  />
                </div>
              </div>

              {/* Reference Months Selectors */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-black tracking-widest text-slate-400 uppercase">
                    Selecione os Meses de Referência
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setBatchMonths([
                        'Janeiro 2026', 'Fevereiro 2026', 'Março 2026', 'Abril 2026', 'Maio 2026', 'Junho 2026',
                        'Julho 2026', 'Agosto 2026', 'Setembro 2026', 'Outubro 2026', 'Novembro 2026', 'Dezembro 2026'
                      ])}
                      className="text-[10px] text-indigo-650 hover:underline font-bold"
                    >
                      Selecionar Todos
                    </button>
                    <span className="text-[10px] text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => setBatchMonths([])}
                      className="text-[10px] text-rose-500 hover:underline font-bold"
                    >
                      Limpar
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-100 max-h-48 overflow-y-auto">
                  {[
                    'Janeiro 2026',
                    'Fevereiro 2026',
                    'Março 2026',
                    'Abril 2026',
                    'Maio 2026',
                    'Junho 2026',
                    'Julho 2026',
                    'Agosto 2026',
                    'Setembro 2026',
                    'Outubro 2026',
                    'Novembro 2026',
                    'Dezembro 2026'
                  ].map(m => {
                    const isChecked = batchMonths.includes(m);
                    return (
                      <label 
                        key={m} 
                        className={`flex items-center gap-2 p-2 rounded-xl border text-xs cursor-pointer select-none transition-all ${
                          isChecked 
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-bold' 
                            : 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) {
                              setBatchMonths(prev => prev.filter(mo => mo !== m));
                            } else {
                              setBatchMonths(prev => [...prev, m]);
                            }
                          }}
                          className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span>{m.replace(' 2026', '')}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Custom Month option */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-black tracking-widest text-slate-400 uppercase">
                  Ou Digite Outros Meses (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Janeiro 2027"
                  value={batchCustomMonth}
                  onChange={(e) => setBatchCustomMonth(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500 font-semibold"
                />
              </div>

              {/* Initial billing status */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-black tracking-widest text-slate-400 uppercase">
                  Estado de Faturamento Inicial
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setBatchInitialStatus('Pendente')}
                    className={`p-2.5 rounded-xl text-xs font-bold border transition-all ${
                      batchInitialStatus === 'Pendente'
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700 ring-2 ring-indigo-500/20 font-black'
                        : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    Marcar como Pendente
                  </button>
                  <button
                    type="button"
                    onClick={() => setBatchInitialStatus('Pago')}
                    className={`p-2.5 rounded-xl text-xs font-bold border transition-all ${
                      batchInitialStatus === 'Pago'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700 ring-2 ring-emerald-500/20 font-black'
                        : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    Marcar como Pago
                  </button>
                </div>
              </div>

              {/* Buttons controls */}
              <div className="pt-3 flex items-center justify-end gap-2 text-xs border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsBatchModalOpen(false)}
                  className="px-4 py-2.5 text-slate-500 hover:text-slate-800 font-semibold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl px-5 py-2.5 transition shadow-lg shadow-indigo-600/20 cursor-pointer"
                >
                  Gerar Cobranças
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* CUSTOM IN-APP CONFIRMATION MODAL FOR DELETING BOOK PAYMENT   */}
      {/* ------------------------------------------------------------- */}
      {paymentToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-55">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-100 relative space-y-4 animate-fade-in">
            <button 
              onClick={() => setPaymentToDelete(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 transition"
              type="button"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center text-rose-500">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-md font-sans font-bold text-slate-800">
                  Confirmar Exclusão
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Tem certeza que deseja excluir o lançamento de livro de:
                </p>
                <div className="my-3 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-xs font-bold text-slate-700 block text-center">
                    {paymentToDelete.studentName}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono block text-center mt-0.5">
                    Mês: {paymentToDelete.month} | Valor: R$ {paymentToDelete.value.toFixed(2)}
                  </span>
                </div>
                <p className="text-[11px] text-amber-600 font-bold bg-amber-50 rounded-lg py-1 px-2.5">
                  Esta ação é irreversível!
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPaymentToDelete(null)}
                className="w-full py-2.5 text-xs text-slate-600 hover:text-slate-800 font-bold border border-slate-200 rounded-xl transition"
              >
                Voltar / Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeletePayment) {
                    onDeletePayment(paymentToDelete.id);
                  }
                  setPaymentToDelete(null);
                }}
                className="w-full py-2.5 text-xs bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition shadow-md shadow-rose-100"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
