import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // API Route: Generate AI study material content for a subject
  app.post("/api/gemini/generate-content", async (req, res) => {
    try {
      const { subjectName, teacherName, workload, classNotes, classNumber } = req.body;

      if (!subjectName) {
        return res.status(400).json({ error: "O nome da disciplina é obrigatório." });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ 
          error: "A chave API do Gemini (GEMINI_API_KEY) não está configurada no servidor." 
        });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const isEmenta = classNumber === "ementa";

      let notesSection = "";
      if (classNotes && classNotes.trim()) {
        notesSection = `O professor forneceu as seguintes notas ou direcionamentos para a ${isEmenta ? "MATRIZ / EMENTA GERAL" : `AULA ${classNumber}`} para servir de base direta:
"""
${classNotes.trim()}
"""
Você DEVE basear e estruturar o conteúdo focando na ${isEmenta ? "Matriz / Ementa Geral" : `aula ${classNumber}`}, expandindo os conceitos teológicos fornecidos.`;
      }

      const classContext = isEmenta
        ? `Você está gerando a MATRIZ / EMENTA GERAL de Ensino para a disciplina. Foco em introduzir o plano de ensino geral, objetivos teológicos macros, cronograma resumido de debates e referências basilares.`
        : classNumber 
          ? `Você está gerando o estudo ESPECÍFICO para a AULA ${classNumber} (de um total de 4 aulas). Foco no conteúdo exclusivo deste encontro.`
          : `Você está gerando um ótimo material de subsídio acadêmico e de estudo geral para a disciplina.`;

      const prompt = `Você é um renomado professor e teólogo da "Dabar Escola Teológica". 
Você está gerando um ótimo material de subsídio acadêmico e de estudo para os alunos.
Gere um conteúdo de estudo completo prático e inspirador para a disciplina de "${subjectName}", que é lecionada pelo professor "${teacherName || 'Docente Responsável'}" com carga horária de ${workload || 60} horas.

${classContext}

${notesSection}

Gere o conteúdo em português utilizando formatação Markdown bonita, organizada e limpa (incluindo quebras de linha adequadas, títulos com # ou ##, tópicos e formatações em negrito).

Inclua as seguintes seções estruturadas:
${isEmenta 
  ? `1. **Apresentação e Ementa Geral** (Visão global e cronograma macro da disciplina)
2. **Importância Teológica** (Por que esta disciplina é vital para o ministério e para a fé cristã)
3. **Objetivos Gerais de Aprendizado** (O que se espera que o estudante desenvolva intelectual e ministerialmente)
4. **Referências Bibliográficas Principais** (Obras bíblicas, históricas ou acadêmicas recomendadas)`
  : `1. **Objetivo da Aula ${classNumber || ''}** (Visão geral e metas deste estudo específico)
2. **Desenvolvimento do Tema** (Explique os tópicos de forma profunda, integrando as notas do professor de maneira didática)
3. **Referências de Apoio** (Seções bíblicas ou referências recomendadas para esta aula)
4. **Reflexão Prática** (Um pensamento enriquecedor focado no assunto para edificar o aluno e instigá-lo a refletir de forma teológica profunda)`}

Não acrescente introduções desnecessárias fora do solicitado, vá direto para o conteúdo formatado.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      const text = response.text;
      return res.json({ content: text });
    } catch (error: any) {
      console.error("Erro ao gerar conteúdo Gemini:", error);
      
      let errorMsg = error?.message || "Ocorreu um erro interno ao processar a geração de conteúdo com Inteligência Artificial.";
      if (errorMsg.includes("503") || errorMsg.toLowerCase().includes("high demand") || errorMsg.toLowerCase().includes("unavailable")) {
        errorMsg = "O modelo de IA está temporariamente indisponível devido a alta demanda (Erro 503). Por favor, aguarde alguns instantes e tente novamente.";
      } else if (errorMsg.includes("429") || errorMsg.toLowerCase().includes("quota exceeded") || errorMsg.toLowerCase().includes("rate limit")) {
        errorMsg = "A cota da sua chave de API do Gemini foi excedida (Erro 429). Por favor, verifique seu faturamento ou tente novamente mais tarde.";
      }
      
      return res.status(500).json({ 
        error: errorMsg
      });
    }
  });

  // API Route: Save current database state to the src/initialState.json source file
  app.post("/api/save-workspace-data", async (req, res) => {
    try {
      const data = req.body;
      if (!data || typeof data !== "object") {
        return res.status(400).json({ error: "Dados inválidos enviados no corpo da requisição." });
      }

      // Check key limits
      const keys = [
        'LOGOS_STUDENTS',
        'LOGOS_SUBJECTS',
        'LOGOS_CLASSES',
        'LOGOS_GRADES',
        'LOGOS_ATTENDANCE',
        'LOGOS_PAYMENTS',
        'LOGOS_TRANSACTIONS',
        'LOGOS_ACTIVITIES',
        'LOGOS_LESSON_PLANS',
        'LOGOS_LOGGED_IN_DOCENTE',
        'LOGOS_LOGIN_LOGS'
      ];

      // Build a clean state structure containing only values present in request
      const cleanState: Record<string, any> = {};
      keys.forEach(key => {
        if (data[key] !== undefined) {
          cleanState[key] = data[key];
        }
      });

      const writePath = path.resolve("src/initialState.json");
      fs.writeFileSync(writePath, JSON.stringify(cleanState, null, 2), "utf-8");

      console.log("Database written successfully to source:", writePath);
      return res.json({ success: true, message: "Prontinho! Os dados foram gravados diretamente no arquivo de estado inicial ('src/initialState.json') do projeto com êxito! Ao publicar no GitHub, esse dataset modificado será o banco de dados inicial por padrão para todos os alunos." });
    } catch (e: any) {
      console.error("Erro ao gravar dados no workspace:", e);
      return res.status(500).json({ error: "Erro ao gravar arquivo no disco do servidor: " + (e?.message || e) });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve("dist");
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
