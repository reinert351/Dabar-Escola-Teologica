import React, { useRef } from 'react';
import { X, Printer, Award, BookOpen } from 'lucide-react';
import { Student } from '../types';

interface CertificatePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  courseType: 'Básico' | 'Médio';
  isExample?: boolean;
}

export default function CertificatePreviewModal({ isOpen, onClose, student, courseType, isExample = false }: CertificatePreviewModalProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    const printHtml = contentRef.current?.innerHTML;
    if (!printHtml) return;

    const printWin = window.open('', '_blank');
    if (!printWin) {
       console.warn("Por favor, permita pop-ups para imprimir o certificado.");
       return;
    }
    
    // Injecting Tailwind for the print preview window
    printWin.document.write(`
      <html>
        <head>
          <title>Imprimir Certificado - ${student.name}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
             @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700&family=Montserrat:wght@300;400;500;600&family=Great+Vibes&display=swap');
            
            @media print {
              @page { 
                size: A4 landscape; 
                margin: 0; 
              }
              body { 
                -webkit-print-color-adjust: exact !important; 
                print-color-adjust: exact !important; 
                margin: 0;
                padding: 0;
                background: white;
                display: flex;
                align-items: center;
                justify-content: center;
              }
              .cert-container {
                 transform-origin: center;
                 transform: scale(0.95);
              }
            }
          </style>
        </head>
        <body class="bg-white m-0 p-0 flex items-center justify-center min-h-screen">
          <div class="cert-container" style="width: 1122px; height: 793px;">
            ${printHtml}
          </div>
          <script>
            setTimeout(() => {
              window.print();
              window.close();
            }, 1000);
          </script>
        </body>
      </html>
    `);
    printWin.document.close();
  };

  const workload = courseType === 'Básico' ? '1.440' : '2.400';
  const subjectsCount = courseType === 'Básico' ? '24' : '40';
  
  // Format date elegantly
  const dateObj = new Date();
  const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const issueDate = `São Paulo, ${String(dateObj.getDate()).padStart(2, '0')} de ${months[dateObj.getMonth()]} de ${dateObj.getFullYear()}`;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700&family=Montserrat:wght@300;400;500;600&family=Great+Vibes&display=swap');
      `}</style>
      <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
        <div className="bg-[#f8f9fa] rounded-3xl w-full max-w-[1200px] shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
          
          <div className="p-4 bg-white border-b border-slate-200 flex items-center justify-between shrink-0 rounded-t-3xl shadow-sm z-10 relative">
            <div>
               <h2 className="text-md font-bold text-slate-800 flex items-center gap-2">
                 <Award className="w-5 h-5 text-[#d4af37]" />
                 {isExample ? 'Pré-visualização de Exemplo' : 'Certificado de Conclusão Oficial'}
               </h2>
               <p className="text-xs text-slate-500 font-medium tracking-wide">Curso {courseType} em Teologia - Formato A4 (Paisagem)</p>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={handlePrint}
                className="px-5 py-2.5 bg-indigo-950 hover:bg-indigo-900 focus:ring-4 focus:ring-indigo-200 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all shadow-md shadow-slate-200"
              >
                <Printer className="w-4 h-4" />
                Imprimir / PDF
              </button>
              <button 
                onClick={onClose}
                className="p-2.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto bg-slate-300/50 flex flex-col items-center p-6 md:p-12 relative print:bg-white min-h-[500px]">
             
             {/* THE CERTIFICATE HTML TO BE PRINTED/DISPLAYED */}
             {/* A4 Size (Landscape): 297mm x 210mm -> ~1122px x 793px */}
             <div className="w-[1122px] min-w-[1122px] h-[793px] bg-white relative shadow-2xl overflow-hidden box-border mx-auto shrink-0 print:shadow-none" ref={contentRef}>
                
                {/* The Background */}
                <div className="absolute inset-0 bg-[#FAFAFA]"></div>

                {/* Outer Border Layer 1 */}
                <div className="absolute inset-[24px] border border-[#d4af37] p-[8px]">
                  {/* Outer Border Layer 2 */}
                  <div className="absolute inset-[6px] border-[1px] border-[#d4af37]"></div>
                  {/* Outer Border Layer 3 (Thick) */}
                  <div className="absolute inset-[14px] border-[3px] border-[#d4af37]"></div>

                  {/* Corner Ornaments */}
                  <div className="absolute top-[6px] left-[6px] w-[40px] h-[40px] border-t-[5px] border-l-[5px] border-[#d4af37]"></div>
                  <div className="absolute top-[6px] right-[6px] w-[40px] h-[40px] border-t-[5px] border-r-[5px] border-[#d4af37]"></div>
                  <div className="absolute bottom-[6px] left-[6px] w-[40px] h-[40px] border-b-[5px] border-l-[5px] border-[#d4af37]"></div>
                  <div className="absolute bottom-[6px] right-[6px] w-[40px] h-[40px] border-b-[5px] border-r-[5px] border-[#d4af37]"></div>

                  {/* Core Inner content */}
                  <div className="absolute inset-[20px] bg-[#ffffff] flex flex-col items-center pt-16 pb-12 px-24">
                     
                     {/* Background Watermark */}
                     <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] select-none pointer-events-none">
                        <Award className="w-[600px] h-[600px] text-[#0f172a]" strokeWidth={0.5} />
                     </div>

                     {/* Top Institutional Header */}
                     <div className="w-full flex justify-between items-center z-10 mt-2">
                        <div className="text-center w-[280px]">
                           <h2 className="text-[#0f172a] text-[16px] font-bold tracking-[0.25em] uppercase" style={{ fontFamily: "'Cinzel', serif" }}>Núcleo Dabar</h2>
                           <p className="text-[#d4af37] text-[11px] tracking-[0.15em] uppercase mt-1 font-semibold" style={{ fontFamily: "'Montserrat', sans-serif" }}>Educação Teológica</p>
                        </div>

                        <div className="flex flex-col items-center">
                           <div className="w-[72px] h-[72px] rounded-full border border-[#d4af37] flex items-center justify-center relative bg-[#FAFAFA]">
                              <div className="absolute inset-[3px] border border-[#d4af37] rounded-full"></div>
                              <BookOpen className="w-8 h-8 text-[#d4af37]" />
                           </div>
                        </div>

                        <div className="text-center w-[280px]">
                           <h2 className="text-[#0f172a] text-[16px] font-bold tracking-[0.25em] uppercase" style={{ fontFamily: "'Cinzel', serif" }}>Faculdade Refidim</h2>
                           <p className="text-[#d4af37] text-[11px] tracking-[0.15em] uppercase mt-1 font-semibold" style={{ fontFamily: "'Montserrat', sans-serif" }}>Ensino Superior</p>
                        </div>
                     </div>

                     {/* Main "CERTIFICADO" Title */}
                     <div className="mt-20 text-center z-10 relative w-full">
                        <h1 className="text-[#0f172a] text-[68px] font-bold tracking-[0.25em] uppercase leading-none drop-shadow-sm" style={{ fontFamily: "'Cinzel', serif" }}>
                           Certificado
                        </h1>
                        <div className="mt-8 flex items-center justify-center w-full relative">
                           <div className="absolute w-[80%] max-w-[700px] h-[1px] bg-gradient-to-r from-transparent via-[#d4af37]/40 to-transparent top-1/2 left-1/2 -translate-x-1/2"></div>
                           <span className="text-[#d4af37] text-[14px] tracking-[0.3em] uppercase font-bold bg-[#ffffff] px-6 relative z-10" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                              Confere este certificado de conclusão a
                           </span>
                        </div>
                     </div>

                     {/* Student Name */}
                     <div className="mt-12 mb-8 z-10 text-center w-full max-w-[900px]">
                        <h2 className="text-[#0f172a] text-[90px] leading-none" style={{ fontFamily: "'Great Vibes', cursive" }}>
                           {student.name}
                        </h2>
                     </div>

                     {/* Body Text */}
                     <div className="z-10 text-center max-w-[850px] mt-4">
                        <p className="text-[#334155] text-[16px] font-light leading-relaxed tracking-[0.02em]" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                           Por ter concluído com pleno êxito o <strong className="font-semibold text-[#0f172a]">Curso {courseType} em Teologia</strong>, 
                           tendo cumprido integralmente todos os rigorosos requisitos da grade acadêmica de <strong className="font-semibold text-[#0f172a]">{subjectsCount} disciplinas obrigatórias</strong>,
                           abrangendo uma carga horária estimada de <strong className="font-semibold text-[#0f172a]">{workload} horas aula</strong>.{isExample && " (Exemplo Ilustrativo)."}
                        </p>
                     </div>

                     {/* Footer: Signatures and Date */}
                     <div className="flex w-full justify-between items-end mt-auto z-10 px-8 pb-10">
                        {/* Left Signature */}
                        <div className="flex flex-col items-center pb-6">
                           <div className="w-[240px] h-[1px] bg-[#94a3b8] mb-2"></div>
                           <span className="text-[#0f172a] text-[12px] uppercase font-bold tracking-[0.15em]" style={{ fontFamily: "'Montserrat', sans-serif" }}>Direção Geral</span>
                           <span className="text-[#64748b] text-[10px] uppercase tracking-[0.1em] mt-1 font-medium bg-[#ffffff] px-2" style={{ fontFamily: "'Montserrat', sans-serif" }}>Faculdade Refidim</span>
                        </div>

                        {/* Central Seal */}
                        <div className="relative flex flex-col items-center">
                           <div className="w-[120px] h-[120px] relative flex flex-col items-center justify-center">
                              <div className="absolute inset-0 border-[6px] border-[#0f172a] rounded-full shadow-lg"></div>
                              <div className="absolute inset-[4px] border border-[#d4af37] rounded-full"></div>
                              <div className="absolute inset-[8px] bg-[#0f172a] rounded-full flex flex-col items-center justify-center">
                                 <Award className="w-[32px] h-[32px] text-[#d4af37] mb-1" />
                                 <span className="text-[#d4af37] text-[9px] font-bold tracking-[0.2em] uppercase" style={{ fontFamily: "'Cinzel', serif" }}>Oficial</span>
                              </div>
                           </div>
                        </div>

                        {/* Right Signature & Date */}
                        <div className="flex flex-col items-center pb-6">
                           <div className="w-[240px] h-[1px] bg-[#94a3b8] mb-2 mt-4 relative">
                               <span className="absolute bottom-1 left-0 w-full text-center text-[#64748b] text-[18px] leading-none opacity-80 select-none pb-1" style={{ fontFamily: "'Great Vibes', cursive" }}>{issueDate}</span>
                           </div>
                           <span className="text-[#0f172a] text-[12px] uppercase font-bold tracking-[0.15em]" style={{ fontFamily: "'Montserrat', sans-serif" }}>Coordenação</span>
                           <span className="text-[#64748b] text-[10px] uppercase tracking-[0.1em] mt-1 font-medium bg-[#ffffff] px-2" style={{ fontFamily: "'Montserrat', sans-serif" }}>Núcleo Dabar</span>
                        </div>
                     </div>

                  </div>
                </div>
             </div>

          </div>
        </div>
      </div>
    </>
  );
}

