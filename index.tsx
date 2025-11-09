// @ts-nocheck
import { GoogleGenAI, Chat } from "@google/genai";
import { db, auth, isConfigured, firebaseConfig } from './firebase-config.js';
import { onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { doc, setDoc, getDoc, onSnapshot } from "firebase/firestore";


// =================================================================================
// ICONS & CATEGORIES
// =================================================================================
const ICONS = {
    add: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`,
    edit: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>`,
    delete: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>`,
    check: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
    income: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M17 5l-5-5-5 5M17 19l-5 5-5 5"></path></svg>`,
    expense: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M17 5l-5 5-5-5M17 19l-5-5-5-5"></path></svg>`,
    fixed: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>`,
    variable: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>`,
    shopping: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>`,
    calendar: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>`,
    info: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`,
    aiAnalysis: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3c-1.2 0-2.4.6-3 1.7A3.6 3.6 0 0 0 8.3 9c.5 1.1 1.4 2 2.7 2s2.2-.9 2.7-2c.1-.4.2-.8.3-1.3.6-1.1 0-2.3-1-3.1-.3-.2-.6-.3-1-.3z"></path><path d="M12 21c-1.2 0-2.4-.6-3-1.7A3.6 3.6 0 0 1 8.3 15c.5-1.1 1.4-2 2.7-2s2.2.9 2.7 2c.1.4.2.8.3 1.3.6 1.1 0 2.3-1 3.1-.3-.2-.6-.3-1 .3z"></path><path d="M3 12c0-1.2.6-2.4 1.7-3A3.6 3.6 0 0 1 9 8.3c1.1.5 2 1.4 2 2.7s-.9 2.2-2 2.7c.4.1.8.2-1.3.3-1.1.6-2.3 0-3.1-1 .2-.3-.3-.6-.3-1z"></path><path d="M21 12c0-1.2-.6-2.4-1.7-3A3.6 3.6 0 0 0 15 8.3c-1.1.5-2 1.4-2 2.7s.9 2.2 2 2.7c.4.1.8.2 1.3.3 1.1.6 2.3 0-3.1-1 .2-.3.3-.6-.3-1z"></path></svg>`,
    lightbulb: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15.09 16.05a2.41 2.41 0 0 1-2.41-2.41V10a4.69 4.69 0 0 0-9.38 0v3.64a2.41 2.41 0 0 1-2.41 2.41"></path><path d="M8.5 16.05V18a1.5 1.5 0 0 0 3 0v-1.95"></path><path d="M15.09 16.05a2.41 2.41 0 0 0 2.41-2.41V10a4.69 4.69 0 0 1 9.38 0v3.64a2.41 2.41 0 0 0 2.41 2.41"></path><path d="M17.5 16.05V18a1.5 1.5 0 0 1-3 0v-1.95"></path></svg>`,
    close: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`,
    goal: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>`,
    savings: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="12" cy="12" r="4"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line></svg>`,
    investment: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12V8a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v4"></path><path d="M4 12v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6"></path><path d="M12 12h.01"></path></svg>`,
    sync: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6M2.5 22v-6h6"/><path d="M22 11.5A10 10 0 0 0 3.5 12.5"/><path d="M2 12.5a10 10 0 0 0 18.5-1"/></svg>`,
    cloudUp: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L12 12M15 9l-3-3-3 3"/><path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"/></svg>`,
    cloudCheck: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22a5.3 5.3 0 0 1-4.2-2.1"/><path d="M12 22a5.3 5.3 0 0 0 4.2-2.1"/><path d="M15 16.5l-3-3-1.5 1.5"/><path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"/></svg>`,
    cloudOff: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22.61 16.95A5 5 0 0 0 18 10h-1.26a8 8 0 0 0-7.05-6M5 5a8 8 0 0 0 4 15h9a5 5 0 0 0 1.7-.3"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`,
};

const SPENDING_CATEGORIES = {
    moradia: { name: 'Moradia', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>` },
    alimentacao: { name: 'Alimentação', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`},
    transporte: { name: 'Transporte', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1 .4-1 1v1"></path><path d="M14 9H4.5a2.5 2.5 0 0 0 0 5H14a2.5 2.5 0 0 0 0-5z"></path><path d="M5 15h14"></path><circle cx="7" cy="19" r="2"></circle><circle cx="17" cy="19" r="2"></circle></svg>` },
    abastecimento_mumbuca: { name: 'Abastecimento com Mumbuca', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1 .4-1 1v1"></path><path d="M14 9H4.5a2.5 2.5 0 0 0 0 5H14a2.5 2.5 0 0 0 0-5z"></path><path d="M5 15h14"></path><circle cx="7" cy="19" r="2"></circle><circle cx="17" cy="19" r="2"></circle></svg>` },
    saude: { name: 'Saúde', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L12 2A4.99 4.99 0 0 1 17 7L17 7A4.99 4.99 0 0 1 12 12L12 12A4.99 4.99 0 0 1 7 7L7 7A4.99 4.99 0 0 1 12 2z"></path><path d="M12 12L12 22"></path><path d="M17 7L22 7"></path><path d="M7 7L2 7"></path></svg>` },
    lazer: { name: 'Lazer', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>` },
    educacao: { name: 'Educação', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10v6M12 2v14M8 16L4 14M16 16l4-2M12 22a4 4 0 0 0 4-4H8a4 4 0 0 0 4 4z"></path></svg>` },
    dividas: { name: 'Dívidas', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>` },
    pessoal: { name: 'Pessoal', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M12 16.5c-3.5 0-6.5 2-6.5 4.5h13c0-2.5-3-4.5-6.5-4.5z"></path><path d="M20.5 12c.3 0 .5.2.5.5v3c0 .3-.2.5-.5.5s-.5-.2-.5-.5v-3c0-.3.2-.5.5-.5z"></path><path d="M3.5 12c.3 0 .5.2.5.5v3c0 .3-.2.5-.5.5s-.5-.2-.5-.5v-3c0-.3.2-.5.5-.5z"></path></svg>` },
    investimento: { name: 'Investimento para Viagem', icon: ICONS.investment },
    shopping: { name: 'Compras com Mumbuca', icon: ICONS.shopping },
    avulsos: { name: 'Avulsos', icon: ICONS.variable },
    outros: { name: 'Outros', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>` },
};

// =================================================================================
// INITIAL DATA
// =================================================================================
const initialMonthData = {
    incomes: [
        { id: "inc_nov_1", description: 'SALARIO MARCELLY', amount: 3349.92, paid: true },
        { id: "inc_nov_2", description: 'SALARIO ANDRE', amount: 3349.92, paid: true },
        { id: "inc_nov_3", description: 'MUMBUCA MARCELLY', amount: 650.00, paid: true },
        { id: "inc_nov_4", description: 'MUMBUCA ANDRE', amount: 650.00, paid: true },
        { id: "inc_nov_5", description: 'Dinheiro que o seu Claudio deu', amount: 100.00, paid: true },
    ],
    expenses: [
        // Despesas Fixas
        { id: "exp_nov_1", description: "SEGURO DO CARRO (NOVEMBRO)", amount: 142.90, type: "fixed", category: "transporte", paid: true, cyclic: true, dueDate: '2025-11-03', paidDate: '2025-11-03', current: 11, total: 12 },
        { id: "exp_nov_2", description: "INVESTIMENTO PARA VIAGEM DE FÉRIAS (PaGol)", amount: 1000.00, type: "fixed", category: "investimento", paid: true, cyclic: false, dueDate: '2025-10-31', paidDate: '2025-10-31', current: 2, total: 5 },
        { id: "exp_nov_3", description: "ALUGUEL", amount: 1300.00, type: "fixed", category: "moradia", paid: true, cyclic: true, dueDate: '2025-11-03', paidDate: '2025-11-03', current: 10, total: 12 },
        { id: "exp_nov_4", description: "PSICÓLOGA DA MARCELLY", amount: 210.00, type: "fixed", category: "saude", paid: true, cyclic: true, dueDate: '2025-11-05', paidDate: '2025-11-05', current: 10, total: 12 },
        { id: "exp_nov_5", description: "INTERNET DE CASA (ESTAVA ATRASADA)", amount: 125.85, type: "fixed", category: "moradia", paid: true, cyclic: true, dueDate: '2025-10-30', paidDate: '2025-10-30', current: 10, total: 12 },
        { id: "exp_nov_6", description: "CONTA DA VIVO --- ANDRÉ (ATRASADAS DE AGOSTO, SETEMBRO E OUTUBRO)", amount: 86.86, type: "fixed", category: "pessoal", paid: true, cyclic: true, dueDate: '2025-10-30', paidDate: '2025-10-30', current: 10, total: 12 },
        { id: "exp_nov_7", description: "CONTA DA CLARO", amount: 74.99, type: "fixed", category: "pessoal", paid: true, cyclic: true, dueDate: '2025-10-30', paidDate: '2025-10-30', current: 11, total: 12 },
        { id: "exp_nov_8", description: "CONTA DA VIVO --- MARCELLY", amount: 66.56, type: "fixed", category: "pessoal", paid: true, cyclic: true, dueDate: '2025-11-05', paidDate: '2025-11-05', current: 10, total: 12 },
        { id: "exp_nov_9", description: "REMÉDIOS DO ANDRÉ", amount: 0.00, type: "fixed", category: "saude", paid: false, cyclic: true, dueDate: '2025-11-05', paidDate: null, current: 10, total: 12 },
        { id: "exp_nov_10", description: "INTERMÉDICA DO ANDRÉ (MARCIA BRITO)", amount: 123.00, type: "fixed", category: "saude", paid: false, cyclic: true, dueDate: '2025-11-15', paidDate: null, current: 10, total: 12 },
        { id: "exp_nov_11", description: "APPAI DA MARCELLY", amount: 110.00, type: "fixed", category: "educacao", paid: false, cyclic: true, dueDate: '2025-11-15', paidDate: null, current: 10, total: 12 },
        { id: "exp_nov_12", description: "APPAI DO ANDRÉ (MARCIA BRITO)", amount: 129.00, type: "fixed", category: "educacao", paid: false, cyclic: true, dueDate: '2025-11-20', paidDate: null, current: 10, total: 12 },
        { id: "exp_nov_13", description: "CIDADANIA PORTUGUESA", amount: 140.00, type: "fixed", category: "outros", paid: false, cyclic: false, dueDate: '2025-11-20', paidDate: null, current: 13, total: 36 },
        { id: "exp_nov_14", description: "EMPRÉSTIMO PARA ACABAR DE PASSAR ABRIL (MARCIA BRITO)", amount: 220.00, type: "fixed", category: "dividas", paid: false, cyclic: false, dueDate: '2025-11-25', paidDate: null, current: 6, total: 6 },
        { id: "exp_nov_15", description: "RENEGOCIAÇÃO DO CARREFOUR (MARCIA BRITO)", amount: 250.00, type: "fixed", category: "dividas", paid: false, cyclic: false, dueDate: '2025-11-28', paidDate: null, current: 2, total: 12 },
        // Despesas Variáveis
        { id: "exp_nov_16", description: "DALUZ (LILI)", amount: 88.50, type: "variable", category: "pessoal", paid: true, cyclic: false, dueDate: '2025-11-03', paidDate: '2025-11-03', current: 1, total: 2 },
        { id: "exp_nov_17", description: "VESTIDO CÍTRICA (LILI)", amount: 53.57, type: "variable", category: "pessoal", paid: true, cyclic: false, dueDate: '2025-11-03', paidDate: '2025-11-03', current: 1, total: 2 },
        { id: "exp_nov_18", description: "PARCELAMENTO DO ITAÚ --- ANDRÉ", amount: 159.59, type: "variable", category: "dividas", paid: true, cyclic: false, dueDate: '2025-10-30', paidDate: '2025-10-30', current: 3, total: 3 },
        { id: "exp_nov_19", description: "Pagamento de fatura atrasada do Inter", amount: 5.50, type: "variable", category: "dividas", paid: true, cyclic: false, dueDate: '2025-10-30', paidDate: '2025-10-30', current: 1, total: 1 },
        { id: "exp_nov_20", description: "ACORDO ITAÚ ANDRÉ (CARTÃO DE CRÉDITO E CHEQUE ESPECIAL)", amount: 233.14, type: "variable", category: "dividas", paid: true, cyclic: false, dueDate: '2025-10-30', paidDate: '2025-10-30', current: 1, total: 1 },
        { id: "exp_nov_21", description: "FATURA DO CARTÃO DO ANDRÉ", amount: 103.89, type: "variable", category: "dividas", paid: true, cyclic: false, dueDate: '2025-10-30', paidDate: '2025-10-30', current: 11, total: 12 },
        { id: "exp_nov_22", description: "TEATRO (JADY)", amount: 126.09, type: "variable", category: "lazer", paid: false, cyclic: false, dueDate: '2025-11-05', paidDate: null, current: 2, total: 2 },
        { id: "exp_nov_23", description: "PRESENTE JULIANA (JADY)", amount: 34.65, type: "variable", category: "pessoal", paid: false, cyclic: false, dueDate: '2025-11-05', paidDate: null, current: 1, total: 1 },
        { id: "exp_nov_24", description: "PRESENTE NENEM GLEYCI (JADY)", amount: 38.94, type: "variable", category: "pessoal", paid: false, cyclic: false, dueDate: '2025-11-05', paidDate: null, current: 1, total: 2 },
        { id: "exp_nov_25", description: "VESTIDO LONGO AMARELO (MÃE DA MARCELLY)", amount: 33.00, type: "variable", category: "pessoal", paid: false, cyclic: false, dueDate: '2025-11-10', paidDate: null, current: 2, total: 3 },
        { id: "exp_nov_26", description: "BLUSA BRANCA DALUZ (MÃE DA MARCELLY)", amount: 34.50, type: "variable", category: "pessoal", paid: false, cyclic: false, dueDate: '2025-11-10', paidDate: null, current: 2, total: 2 },
        { id: "exp_nov_27", description: "FATURA CARTÃO MARCELLY", amount: 100.00, type: "variable", category: "dividas", paid: false, cyclic: false, dueDate: '2025-11-15', paidDate: null, current: 10, total: 12 },
        { id: "exp_nov_28", description: "CONSERTO DO CARRO COM PEÇAS DE OUTUBRO (MARCIA BRITO)", amount: 361.75, type: "variable", category: "transporte", paid: false, cyclic: false, dueDate: '2025-11-28', paidDate: null, current: 1, total: 4 },
        { id: "exp_nov_29", description: "PEÇAS DO CARRO - CONSERTO DE DEZEMBRO (MARCIA BRITO)", amount: 67.70, type: "variable", category: "transporte", paid: false, cyclic: false, dueDate: '2025-11-28', paidDate: null, current: 10, total: 10 },
        { id: "exp_nov_30", description: "MÃO DE OBRA DO DAVI (MARCIA BRITO)", amount: 108.33, type: "variable", category: "transporte", paid: false, cyclic: false, dueDate: '2025-11-28', paidDate: null, current: 3, total: 3 },
        { id: "exp_nov_31", description: "PEÇA DO CARRO (MARCIA BRITO)", amount: 45.00, type: "variable", category: "transporte", paid: false, cyclic: false, dueDate: '2025-11-28', paidDate: null, current: 3, total: 3 },
        { id: "exp_nov_32", description: "MULTAS (MARCIA BRITO)", amount: 260.00, type: "variable", category: "transporte", paid: false, cyclic: false, dueDate: '2025-11-30', paidDate: null, current: 2, total: 4 },
        { id: "exp_nov_33", description: "EMPRÉSTIMO DA TIA CÉLIA", amount: 400.00, type: "variable", category: "dividas", paid: false, cyclic: false, dueDate: '2025-11-30', paidDate: null, current: 8, total: 10 }
    ],
    shoppingItems: [
        
    ],
    avulsosItems: [
        { id: "avulso_28", description: 'Correios', amount: 69.02, paid: true, paidDate: '2025-11-05', category: 'outros'},
        { id: "avulso_27", description: 'Mercado', amount: 76.80, paid: true, paidDate: '2025-11-05', category: 'alimentacao'},
        { id: "avulso_26", description: 'Pagamento a Gustavo dutra', amount: 40.00, paid: true, paidDate: '2025-11-05', category: 'outros'},
        { id: "avulso_25", description: 'Farmácia', amount: 9.97, paid: true, paidDate: '2025-11-05', category: 'saude'},
        { id: "avulso_24", description: 'Drogaria raia', amount: 9.99, paid: true, paidDate: '2025-11-05', category: 'saude'},
        { id: "avulso_23", description: 'Drogaria', amount: 15.98, paid: true, paidDate: '2025-11-05', category: 'saude'},
        { id: "avulso_22", description: 'Açar', amount: 4.99, paid: true, paidDate: '2025-11-05', category: 'alimentacao'},
        { id: "avulso_21", description: 'Pix pra alguém', amount: 2.00, paid: true, paidDate: '2025-11-05', category: 'outros'},
        { id: "avulso_20", description: 'Hortifruti', amount: 16.37, paid: true, paidDate: '2025-11-05', category: 'alimentacao'},
        { id: "avulso_19", description: 'Drogaria', amount: 44.14, paid: true, paidDate: '2025-11-05', category: 'saude'},
        { id: "avulso_18", description: 'Bar', amount: 94.97, paid: true, paidDate: '2025-11-04', category: 'lazer'},
        { id: "avulso_17", description: 'Gás', amount: 95.00, paid: true, paidDate: '2025-11-04', category: 'moradia'},
        { id: "avulso_16", description: 'Açar', amount: 26.00, paid: true, paidDate: '2025-11-03', category: 'alimentacao'},
        { id: "avulso_15", description: 'Pedágio da ponte', amount: 6.20, paid: true, paidDate: '2025-11-03', category: 'transporte'},
        { id: "avulso_14", description: 'Pipoca', amount: 14.00, paid: true, paidDate: '2025-11-03', category: 'alimentacao'},
        { id: "avulso_13", description: 'Almoço mc-joao-joão', amount: 18.65, paid: true, paidDate: '2025-11-03', category: 'alimentacao'},
        { id: "avulso_12", description: 'Mil opções fita e organizador de remédios', amount: 11.80, paid: true, paidDate: '2025-11-01', category: 'pessoal'},
        { id: "avulso_11", description: 'Mercado', amount: 24.87, paid: true, paidDate: '2025-11-01', category: 'alimentacao'},
        { id: "avulso_10", description: 'Adoçante', amount: 13.99, paid: true, paidDate: '2025-11-01', category: 'alimentacao'},
        { id: "avulso_9", description: 'Hortifruti', amount: 31.66, paid: true, paidDate: '2025-11-01', category: 'alimentacao'},
        { id: "avulso_8", description: 'Mercado cera', amount: 6.80, paid: true, paidDate: '2025-11-01', category: 'moradia'},
        { id: "avulso_7", description: 'Abastecimento', amount: 155.84, paid: true, paidDate: '2025-10-30', category: 'transporte'},
        { id: "avulso_6", description: 'Estacionamento', amount: 20.00, paid: true, paidDate: '2025-10-30', category: 'transporte'},
        { id: "avulso_5", description: 'Pão e Mortadela', amount: 10.00, paid: true, paidDate: '2025-10-30', category: 'alimentacao'},
        { id: "avulso_4", description: 'Troca da pulseira do relógio no mercado livre', amount: 94.84, paid: true, paidDate: '2025-10-30', category: 'pessoal'},
        { id: "avulso_3", description: 'Mercado', amount: 100.00, paid: true, paidDate: '2025-10-30', category: 'alimentacao'},
        { id: "avulso_2", description: 'Pedágio da ponte', amount: 6.20, paid: true, paidDate: '2025-10-30', category: 'transporte'},
        { id: "avulso_1", description: 'Mercado', amount: 6.20, paid: true, paidDate: '2025-10-30', category: 'alimentacao'},
    ],
    goals: [
        { id: "goal_1", category: "shopping", amount: 900 },
        { id: "goal_2", category: "moradia", amount: 1700 },
        { id: "goal_3", category: "saude", amount: 600 },
        { id: "goal_4", category: "dividas", amount: 1500 },
        { id: "goal_5", category: "abastecimento_mumbuca", amount: 400 },
    ],
    savingsGoals: [
        { id: "sg_1", description: "Viagem de Férias", currentAmount: 1000, targetAmount: 5000 },
    ],
    bankAccounts: [
        { id: "acc_1", name: "Conta Principal", balance: 150.32 },
        { id: "acc_2", name: "Poupança Viagem", balance: 1000.00 },
    ]
};

// =================================================================================
// STATE & AI INSTANCE
// =================================================================================
let ai = null; // Lazy initialized to prevent crash on load if process.env is not available
let chat = null;
let currentMonthData = { incomes: [], expenses: [], shoppingItems: [], avulsosItems: [], goals: [], bankAccounts: [], savingsGoals: [] };
let currentModalType = '';
let currentMonth = 11;
let currentYear = 2025;
let deferredPrompt;

// =================================================================================
// FIREBASE SYNC STATE
// =================================================================================
let currentUser = null;
let firestoreUnsubscribe = null;
let isSyncing = false;
let syncStatus = 'disconnected'; // 'disconnected', 'syncing', 'synced', 'error'
let syncErrorDetails = '';


// =================================================================================
// DOM ELEMENTS
// =================================================================================
const elements = {
    monthDisplay: document.getElementById('monthDisplay'),
    
    // Home screen cards
    finalBalance: document.getElementById('finalBalance'),
    generalIncome: document.getElementById('generalIncome'),
    generalIncomeProgressBar: document.getElementById('generalIncomeProgressBar'),
    generalIncomeSubtitle: document.getElementById('generalIncomeSubtitle'),
    salaryIncome: document.getElementById('salaryIncome'),
    salaryIncomeProgressBar: document.getElementById('salaryIncomeProgressBar'),
    salaryIncomeSubtitle: document.getElementById('salaryIncomeSubtitle'),
    mumbucaIncome: document.getElementById('mumbucaIncome'),
    mumbucaIncomeProgressBar: document.getElementById('mumbucaIncomeProgressBar'),
    mumbucaIncomeSubtitle: document.getElementById('mumbucaIncomeSubtitle'),
    generalExpenses: document.getElementById('generalExpenses'),
    generalExpensesProgressBar: document.getElementById('generalExpensesProgressBar'),
    generalExpensesSubtitle: document.getElementById('generalExpensesSubtitle'),
    fixedVariableExpenses: document.getElementById('fixedVariableExpenses'),
    fixedVariableExpensesProgressBar: document.getElementById('fixedVariableExpensesProgressBar'),
    fixedVariableExpensesSubtitle: document.getElementById('fixedVariableExpensesSubtitle'),

    // Lists and other elements
    incomesList: document.getElementById('incomesList'),
    expensesList: document.getElementById('expensesList'),
    shoppingList: document.getElementById('shoppingList'),
    avulsosList: document.getElementById('avulsosList'),
    goalsList: document.getElementById('goalsList'),
    bankAccountsList: document.getElementById('bankAccountsList'),
    overviewChart: document.getElementById('overviewChart'),
    monthlyAnalysisSection: document.getElementById('monthlyAnalysisSection'),
    appContainer: document.getElementById('app-container'),
    mainContent: document.getElementById('main-content'),
    monthSelector: document.querySelector('.month-selector'),
    addModal: document.getElementById('addModal'),
    editModal: document.getElementById('editModal'),
    aiModal: document.getElementById('aiModal'),
    goalModal: document.getElementById('goalModal'),
    accountModal: document.getElementById('accountModal'),
    savingsGoalModal: document.getElementById('savingsGoalModal'),
    addModalTitle: document.getElementById('addModalTitle'),
    addForm: document.getElementById('addForm'),
    typeGroup: document.getElementById('typeGroup'),
    categoryGroup: document.getElementById('categoryGroup'),
    installmentsGroup: document.getElementById('installmentsGroup'),
    dueDateGroup: document.getElementById('dueDateGroup'),
    editForm: document.getElementById('editForm'),
    editModalTitle: document.getElementById('editModalTitle'),
    editItemId: document.getElementById('editItemId'),
    editItemType: document.getElementById('editItemType'),
    editDescription: document.getElementById('editDescription'),
    editAmount: document.getElementById('editAmount'),
    editCategoryGroup: document.getElementById('editCategoryGroup'),
    editCategory: document.getElementById('editCategory'),
    editDueDate: document.getElementById('editDueDate'),
    editDueDateGroup: document.getElementById('editDueDateGroup'),
    editPaidDate: document.getElementById('editPaidDate'),
    editPaidDateGroup: document.getElementById('editPaidDateGroup'),
    editInstallmentsGroup: document.getElementById('editInstallmentsGroup'),
    editCurrentInstallment: document.getElementById('editCurrentInstallment'),
    editTotalInstallments: document.getElementById('editTotalInstallments'),
    editInstallmentsInfo: document.getElementById('editInstallmentsInfo'),
    aiAnalysis: document.getElementById('aiAnalysis'),
    aiModalTitle: document.getElementById('aiModalTitle'),
    aiChatForm: document.getElementById('aiChatForm'),
    aiChatInput: document.getElementById('aiChatInput'),
    goalModalTitle: document.getElementById('goalModalTitle'),
    goalForm: document.getElementById('goalForm'),
    goalId: document.getElementById('goalId'),
    goalCategory: document.getElementById('goalCategory'),
    goalAmount: document.getElementById('goalAmount'),
    accountModalTitle: document.getElementById('accountModalTitle'),
    accountForm: document.getElementById('accountForm'),
    accountId: document.getElementById('accountId'),
    accountName: document.getElementById('accountName'),
    accountBalance: document.getElementById('accountBalance'),
    savingsGoalsList: document.getElementById('savingsGoalsList'),
    savingsGoalModalTitle: document.getElementById('savingsGoalModalTitle'),
    savingsGoalForm: document.getElementById('savingsGoalForm'),
    savingsGoalId: document.getElementById('savingsGoalId'),
    savingsGoalDescription: document.getElementById('savingsGoalDescription'),
    savingsGoalCurrent: document.getElementById('savingsGoalCurrent'),
    savingsGoalTarget: document.getElementById('savingsGoalTarget'),
    tabBar: document.getElementById('tab-bar'),
    tabButtons: document.querySelectorAll('.tab-btn'),
    appViews: document.querySelectorAll('.app-view'),
    segmentedBtns: document.querySelectorAll('.segmented-btn'),
    syncBtn: document.getElementById('sync-btn'),
};

// =================================================================================
// UTILS
// =================================================================================
function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function parseCurrency(value) {
    if (typeof value !== 'string' || !value) return 0;
    const digits = value.replace(/\D/g, '');
    if (!digits) return 0;
    return parseInt(digits, 10) / 100;
}

function getMonthName(month) {
    const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    return months[month - 1];
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString + 'T00:00:00'); // Ensure correct date parsing
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function simpleMarkdownToHtml(text) {
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n\s*-\s/g, '<br>• ')
        .replace(/\n\s*\*\s/g, '<br>• ')
        .replace(/\n/g, '<br>');
}

function populateCategorySelects() {
    const selects = [
        document.getElementById('category'),
        document.getElementById('editCategory'),
    ];
    selects.forEach(select => {
        if (select) {
            select.innerHTML = '<option value="">Selecione...</option>';
            for (const key in SPENDING_CATEGORIES) {
                const option = document.createElement('option');
                option.value = key;
                option.textContent = SPENDING_CATEGORIES[key].name;
                select.appendChild(option);
            }
        }
    });

    const goalCategorySelect = document.getElementById('goalCategory');
    if (goalCategorySelect) {
        goalCategorySelect.innerHTML = '<option value="">Selecione...</option>';
        Object.keys(SPENDING_CATEGORIES)
            .filter(key => key !== 'avulsos') // Don't allow manual 'avulsos' goal
            .forEach(key => {
                const option = document.createElement('option');
                option.value = key;
                option.textContent = SPENDING_CATEGORIES[key].name;
                goalCategorySelect.appendChild(option);
            });
    }
}


// =================================================================================
// DATA HANDLING (FIREBASE ONLY)
// =================================================================================
async function saveDataToFirestore() {
    if (!currentUser || !isConfigured) {
        return;
    }
    if (isSyncing) return;

    isSyncing = true;
    syncStatus = 'syncing';
    updateSyncButtonState();

    const monthKey = `${currentYear}-${currentMonth.toString().padStart(2, '0')}`;
    const docRef = doc(db, 'users', currentUser.uid, 'months', monthKey);

    try {
        // We save a deep copy to avoid any Firestore proxy issues with the local state
        await setDoc(docRef, JSON.parse(JSON.stringify(currentMonthData)));
        syncStatus = 'synced';
        updateLastSyncTime(true);
    } catch (error) {
        console.error("Error saving data to Firestore:", error);
        syncStatus = 'error';
        alert("Não foi possível salvar os dados na nuvem. Verifique sua conexão com a internet.");
    } finally {
        isSyncing = false;
        updateSyncButtonState();
    }
}


function saveData() {
    updateUI();
    saveDataToFirestore();
}

function loadDataForCurrentMonth() {
    if (!currentUser || !isConfigured) return;
    
    if (firestoreUnsubscribe) {
        firestoreUnsubscribe();
    }

    const monthKey = `${currentYear}-${currentMonth.toString().padStart(2, '0')}`;
    const docRef = doc(db, 'users', currentUser.uid, 'months', monthKey);
    
    firestoreUnsubscribe = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
            console.log(`[Firestore] Data received for ${monthKey}`);
            // Sanitize Firestore data to prevent circular reference errors
            // by creating a deep copy that strips proxy objects.
            currentMonthData = JSON.parse(JSON.stringify(docSnap.data()));
            updateUI();
        } else {
            console.log(`[Firestore] No data for ${monthKey}, creating new month.`);
            createNewMonthData();
        }
        updateMonthDisplay();
    }, (error) => {
        console.error("Error listening to Firestore:", error);
        syncStatus = 'error';
        updateSyncButtonState();
        alert("Erro de conexão com o banco de dados. Tentando reconectar...");
    });
}


async function createNewMonthData() {
    console.log("[Data] Creating new month data...");
    if (!currentUser || !isConfigured) return;

    const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
    const previousMonthKey = `${prevYear}-${prevMonth.toString().padStart(2, '0')}`;
    
    let baseData = null;
    const prevDocRef = doc(db, 'users', currentUser.uid, 'months', previousMonthKey);
    const prevDocSnap = await getDoc(prevDocRef);
    if (prevDocSnap.exists()) {
        // Sanitize Firestore data to prevent circular reference errors.
        baseData = JSON.parse(JSON.stringify(prevDocSnap.data()));
    }
    
    // If there's no previous data, and we're on the initial month, seed it.
    if (!baseData && currentYear === 2025 && currentMonth === 11) {
        currentMonthData = JSON.parse(JSON.stringify(initialMonthData));
        saveData();
        return;
    }

    if (!baseData || typeof baseData !== 'object') {
        baseData = { incomes: [], expenses: [], shoppingItems: [], avulsosItems: [], goals: [], bankAccounts: [], savingsGoals: [] };
    }
    
    const newMonthData = {
        incomes: [],
        expenses: [],
        shoppingItems: [],
        avulsosItems: [],
        goals: [],
        savingsGoals: JSON.parse(JSON.stringify(baseData.savingsGoals || [])),
        bankAccounts: JSON.parse(JSON.stringify(baseData.bankAccounts || []))
    };

    newMonthData.incomes.push(
        { id: `inc_salario_marcelly_${Date.now()}`, description: 'SALARIO MARCELLY', amount: 3349.92, paid: false },
        { id: `inc_salario_andre_${Date.now()}`, description: 'SALARIO ANDRE', amount: 3349.92, paid: false },
        { id: `inc_mumbuca_marcelly_${Date.now()}`, description: 'MUMBUCA MARCELLY', amount: 650.00, paid: false },
        { id: `inc_mumbuca_andre_${Date.now()}`, description: 'MUMBUCA ANDRE', amount: 650.00, paid: false }
    );
    
    if (currentYear === 2025 && currentMonth === 12) {
        newMonthData.incomes.push(
            { id: `inc_13_marcelly_${Date.now()}`, description: 'SEGUNDA PARCELA 13º SALÁRIO MARCELLY', amount: 3349.92 / 2, paid: false },
            { id: `inc_13_andre_${Date.now()}`, description: 'SEGUNDA PARCELA 13º SALÁRIO ANDRÉ', amount: 3349.92 / 2, paid: false }
        );
    }

    newMonthData.goals.push(
        { id: `goal_shopping_${Date.now()}`, category: 'shopping', amount: 900.00 },
        { id: `goal_abastecimento_${Date.now()}`, category: 'abastecimento_mumbuca', amount: 400.00 }
    );

    const travelInvestment = (baseData.expenses || []).find(e => e.description.toUpperCase().includes('INVESTIMENTO PARA VIAGEM'));
    if (travelInvestment) {
        newMonthData.goals.push({ id: `goal_investimento_${Date.now()}`, category: 'investimento', amount: travelInvestment.amount });
    }
    
    const otherGoals = (baseData.goals || []).filter(g => 
        g.category !== 'shopping' && g.category !== 'transporte' && g.category !== 'investimento' && g.category !== 'abastecimento_mumbuca'
    );
    newMonthData.goals.push(...JSON.parse(JSON.stringify(otherGoals)));

    (baseData.expenses || []).forEach(expense => {
        let shouldAdd = false;
        const newExpense = { ...expense, id: `exp_${Date.now()}_${Math.random()}`, paid: false, paidDate: null };
        
        if (expense.total > 1 && expense.current < expense.total) {
            newExpense.current += 1;
            shouldAdd = true;
        } else if (expense.cyclic) {
            newExpense.current = 1;
            shouldAdd = true;
        }

        if(shouldAdd) {
            const newDate = new Date(newExpense.dueDate + 'T00:00:00');
            newDate.setMonth(newDate.getMonth() + 1);
            newExpense.dueDate = newDate.toISOString().split('T')[0];
            newMonthData.expenses.push(newExpense);
        }
    });

    currentMonthData = newMonthData;
    saveData();
}

function changeMonth(offset) {
    currentMonth += offset;
    if (currentMonth > 12) {
        currentMonth = 1;
        currentYear++;
    } else if (currentMonth < 1) {
        currentMonth = 12;
        currentYear--;
    }
    loadDataForCurrentMonth();
}

// =================================================================================
// SYNC UI
// =================================================================================

function updateProfilePage() {
    const syncStatusText = document.getElementById('sync-status-text');
    const userIdText = document.getElementById('user-id-text');
    const userIdContainer = document.getElementById('user-id-container');
    const syncStatusInfo = document.getElementById('sync-status-info');

    if (currentUser) {
        userIdText.textContent = currentUser.uid;
        userIdContainer.style.display = 'block';
    } else {
         userIdContainer.style.display = 'none';
    }

    if (!isConfigured) {
        syncStatusText.textContent = 'Nuvem Não Configurada';
        syncStatusText.style.color = 'var(--text-light)';
        if (syncStatusInfo) {
            syncStatusInfo.innerHTML = `Seus dados não estão sendo salvos. Para habilitar a sincronização na nuvem e acessar de qualquer lugar, configure suas credenciais no arquivo <code>firebase-config.js</code>.`;
        }
        return;
    }

    if (syncStatus === 'synced') {
        syncStatusText.textContent = 'Conectado e Sincronizado';
        syncStatusText.style.color = 'var(--success)';
        if (syncStatusInfo) syncStatusInfo.innerHTML = 'Seus dados são salvos automaticamente na nuvem, permitindo o acesso de qualquer dispositivo.';
    } else if (syncStatus === 'syncing') {
         syncStatusText.textContent = 'Sincronizando...';
         syncStatusText.style.color = 'var(--warning)';
         if (syncStatusInfo) syncStatusInfo.innerHTML = 'Enviando as últimas alterações para a nuvem...';
    } else if (syncStatus === 'error') {
         syncStatusText.textContent = 'Erro de Configuração';
         syncStatusText.style.color = 'var(--danger)';
         if (syncStatusInfo) {
             if(syncErrorDetails) {
                 syncStatusInfo.innerHTML = syncErrorDetails;
             } else {
                 syncStatusInfo.innerHTML = 'Ocorreu um erro ao sincronizar com a nuvem. Verifique sua conexão com a internet.';
             }
         }
    } else {
         syncStatusText.textContent = 'Desconectado';
         syncStatusText.style.color = 'var(--text-light)';
         if (syncStatusInfo) syncStatusInfo.innerHTML = 'Tentando conectar com a nuvem...';
    }
}

function updateSyncButtonState() {
    if (!elements.syncBtn) return;
    
    if (!isConfigured) {
        elements.syncBtn.innerHTML = ICONS.cloudOff;
        elements.syncBtn.title = 'App não configurado para sincronizar. Siga as instruções em firebase-config.js.';
        elements.syncBtn.style.display = 'flex';
        elements.syncBtn.classList.remove('syncing', 'unsynced', 'sync-error');
        elements.syncBtn.disabled = true;
        return;
    }
    
    elements.syncBtn.style.display = 'flex';
    elements.syncBtn.classList.remove('syncing', 'unsynced', 'sync-error');
    elements.syncBtn.disabled = true; // Button is now just an indicator

    if (isSyncing || syncStatus === 'syncing') {
        elements.syncBtn.innerHTML = ICONS.sync;
        elements.syncBtn.title = 'Sincronizando...';
        elements.syncBtn.classList.add('syncing');
    } else if (syncStatus === 'error') {
        elements.syncBtn.innerHTML = ICONS.info;
        elements.syncBtn.title = 'Erro na sincronização. Verifique a conexão.';
        elements.syncBtn.classList.add('sync-error');
    } else { // 'synced' or 'disconnected'
        elements.syncBtn.innerHTML = ICONS.cloudCheck;
        const lastSync = localStorage.getItem('lastSync');
        const lastSyncTime = lastSync ? new Date(lastSync).toLocaleTimeString('pt-BR') : 'agora';
        elements.syncBtn.title = `Sincronizado. Última vez em: ${lastSyncTime}`;
    }
}


function updateLastSyncTime(isSuccess) {
    if (isSuccess) {
        const now = new Date();
        localStorage.setItem('lastSync', now.toISOString());
    }
}

// =================================================================================
// NAVIGATION
// =================================================================================
function navigateTo(viewName) {
    elements.appViews.forEach(view => {
        view.classList.toggle('active', view.id === `view-${viewName}`);
    });

    elements.tabButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === viewName);
    });

    const showMonthSelector = ['home', 'lancamentos', 'metas'].includes(viewName);
    elements.monthSelector.style.display = showMonthSelector ? 'flex' : 'none';

    if (viewName === 'perfil') {
        updateProfilePage();
    }
}

// =================================================================================
// UI RENDERING
// =================================================================================
function updateUI() {
    if(!currentUser) return; // Don't render if not logged in
    updateSummary();
    renderList('incomes', elements.incomesList, createIncomeItem, "Nenhuma entrada registrada", ICONS.income);
    renderList('expenses', elements.expensesList, createExpenseItem, "Nenhuma despesa registrada", ICONS.expense, true);
    renderList('shoppingItems', elements.shoppingList, createShoppingItem, "Nenhuma compra registrada", ICONS.shopping);
    renderList('avulsosItems', elements.avulsosList, createShoppingItem, "Nenhuma despesa avulsa registrada", ICONS.variable);
    renderGoalsPage();
    renderBankAccounts();
    renderOverviewChart();
    renderMonthlyAnalysis();
}

function updateSummary() {
    // Shared calculations
    const allIncomes = currentMonthData.incomes || [];
    const allGeneralExpenses = [...(currentMonthData.expenses || []), ...(currentMonthData.shoppingItems || []), ...(currentMonthData.avulsosItems || [])];
    const fixedVariableExpenses = currentMonthData.expenses || [];

    // Card 1: Final Balance
    const paidIncomeAmount = allIncomes.filter(item => item.paid).reduce((sum, item) => sum + item.amount, 0);
    const paidGeneralExpensesAmount = allGeneralExpenses.filter(item => item.paid).reduce((sum, item) => sum + item.amount, 0);
    const finalBalance = paidIncomeAmount - paidGeneralExpensesAmount;
    
    elements.finalBalance.textContent = formatCurrency(finalBalance);
    if (finalBalance >= 0) {
        elements.finalBalance.classList.add('balance-positive');
        elements.finalBalance.classList.remove('balance-negative');
    } else {
        elements.finalBalance.classList.add('balance-negative');
        elements.finalBalance.classList.remove('balance-positive');
    }

    // Card 2: General Income (All sources)
    const totalGeneralIncome = allIncomes.reduce((sum, item) => sum + item.amount, 0);
    const paidGeneralIncome = allIncomes.filter(item => item.paid).reduce((sum, item) => sum + item.amount, 0);
    const generalIncomeProgress = totalGeneralIncome > 0 ? (paidGeneralIncome / totalGeneralIncome) * 100 : 0;
    
    elements.generalIncome.textContent = formatCurrency(totalGeneralIncome);
    elements.generalIncomeProgressBar.style.width = `${Math.min(generalIncomeProgress, 100)}%`;
    elements.generalIncomeSubtitle.textContent = `${formatCurrency(paidGeneralIncome)} recebidos`;

    // Card 3: Salary Income
    const salaryIncomes = allIncomes.filter(i => i.description.toUpperCase().includes('SALARIO'));
    const totalSalaryIncome = salaryIncomes.reduce((sum, item) => sum + item.amount, 0);
    const paidSalaryIncome = salaryIncomes.filter(item => item.paid).reduce((sum, item) => sum + item.amount, 0);
    const salaryIncomeProgress = totalSalaryIncome > 0 ? (paidSalaryIncome / totalSalaryIncome) * 100 : 0;
    
    elements.salaryIncome.textContent = formatCurrency(totalSalaryIncome);
    elements.salaryIncomeProgressBar.style.width = `${Math.min(salaryIncomeProgress, 100)}%`;
    elements.salaryIncomeSubtitle.textContent = `${formatCurrency(paidSalaryIncome)} recebidos`;

    // Card 4: Mumbuca Income
    const mumbucaIncomes = allIncomes.filter(i => i.description.toUpperCase().includes('MUMBUCA'));
    const totalMumbucaIncome = mumbucaIncomes.reduce((sum, item) => sum + item.amount, 0);
    
    const mumbucaSpending = allGeneralExpenses
        .filter(item => item.category === 'shopping' || item.category === 'abastecimento_mumbuca')
        .reduce((sum, item) => sum + item.amount, 0);
    
    const mumbucaProgress = totalMumbucaIncome > 0 ? (mumbucaSpending / totalMumbucaIncome) * 100 : 0;
    const mumbucaAvailable = totalMumbucaIncome - mumbucaSpending;

    elements.mumbucaIncome.textContent = formatCurrency(totalMumbucaIncome);
    elements.mumbucaIncomeProgressBar.style.width = `${Math.min(mumbucaProgress, 100)}%`;
    elements.mumbucaIncomeProgressBar.classList.remove('income');
    elements.mumbucaIncomeProgressBar.classList.add('expense');
    elements.mumbucaIncomeSubtitle.textContent = `${formatCurrency(mumbucaSpending)} gastos / ${formatCurrency(mumbucaAvailable)} disponíveis`;


    // Card 5: General Expenses
    const totalGeneralExpenses = allGeneralExpenses.reduce((sum, item) => sum + item.amount, 0);
    const generalExpensesProgress = totalGeneralExpenses > 0 ? (paidGeneralExpensesAmount / totalGeneralExpenses) * 100 : 0;
    const remainingGeneralExpenses = totalGeneralExpenses - paidGeneralExpensesAmount;
    
    elements.generalExpenses.textContent = formatCurrency(totalGeneralExpenses);
    elements.generalExpensesProgressBar.style.width = `${Math.min(generalExpensesProgress, 100)}%`;
    elements.generalExpensesSubtitle.textContent = `${formatCurrency(paidGeneralExpensesAmount)} pagos / ${formatCurrency(remainingGeneralExpenses)} a pagar`;

    // Card 6: Fixed & Variable Expenses
    const totalFixedVariableExpenses = fixedVariableExpenses.reduce((sum, item) => sum + item.amount, 0);
    const paidFixedVariableExpenses = fixedVariableExpenses.filter(item => item.paid).reduce((sum, item) => sum + item.amount, 0);
    const fixedVariableExpensesProgress = totalFixedVariableExpenses > 0 ? (paidFixedVariableExpenses / totalFixedVariableExpenses) * 100 : 0;
    const remainingFixedVariableExpenses = totalFixedVariableExpenses - paidFixedVariableExpenses;
    
    elements.fixedVariableExpenses.textContent = formatCurrency(totalFixedVariableExpenses);
    elements.fixedVariableExpensesProgressBar.style.width = `${Math.min(fixedVariableExpensesProgress, 100)}%`;
    elements.fixedVariableExpensesSubtitle.textContent = `${formatCurrency(paidFixedVariableExpenses)} pagos / ${formatCurrency(remainingFixedVariableExpenses)} a pagar`;
}


function updateMonthDisplay() {
    elements.monthDisplay.textContent = `${getMonthName(currentMonth)} ${currentYear}`;
}

function renderList(type, listElement, itemCreator, emptyMessage, emptyIcon, groupByCat = false) {
    listElement.innerHTML = '';
    const items = currentMonthData[type] || [];

    if (items.length === 0) {
        listElement.innerHTML = `<div class="empty-state">${emptyIcon}<div>${emptyMessage}</div></div>`;
        return;
    }
    
    if (groupByCat) {
        const fixed = items.filter(i => i.type === 'fixed');
        const variable = items.filter(i => i.type === 'variable');
        
        if (fixed.length > 0) {
            const header = document.createElement('div');
            header.className = 'item-header';
            header.innerHTML = `${ICONS.fixed} Despesas Fixas`;
            listElement.appendChild(header);
            fixed.sort((a,b) => Number(a.paid) - Number(b.paid) || new Date(a.dueDate) - new Date(b.dueDate)).forEach(item => listElement.appendChild(itemCreator(item, type)));
        }

        if (variable.length > 0) {
            const header = document.createElement('div');
            header.className = 'item-header';
            header.innerHTML = `${ICONS.variable} Despesas Variáveis`;
            listElement.appendChild(header);
            variable.sort((a,b) => Number(a.paid) - Number(b.paid) || new Date(a.dueDate) - new Date(b.dueDate)).forEach(item => listElement.appendChild(itemCreator(item, type)));
        }

    } else {
        items.sort((a, b) => {
            // Use paidDate as the primary sort key if available, otherwise fallback to creation timestamp from ID.
            // This ensures the most recent activity (payment or creation) brings an item to the top.
            const activityTimestampA = a.paidDate ? new Date(a.paidDate).getTime() : (parseInt(a.id.split('_').pop(), 10) || 0);
            const activityTimestampB = b.paidDate ? new Date(b.paidDate).getTime() : (parseInt(b.id.split('_').pop(), 10) || 0);
            return activityTimestampB - activityTimestampA;
        }).forEach(item => listElement.appendChild(itemCreator(item, type)));
    }
}

function createIncomeItem(income, type) {
    const item = document.createElement('div');
    item.className = 'item';
    item.onclick = () => openEditModal(income.id, type);
    
    const checkTitle = income.paid ? 'Marcar como não recebido' : 'Marcar como recebido';

    item.innerHTML = `
        <button class="check-btn ${income.paid ? 'paid' : ''}" title="${checkTitle}">${ICONS.check}</button>
        <div class="item-info-wrapper">
            <div class="item-primary-info">
                <div class="item-description ${income.paid ? 'paid' : ''}">${income.description}</div>
                <div class="item-actions">
                     <span class="item-amount income-amount">${formatCurrency(income.amount)}</span>
                    <button class="action-btn edit-btn" title="Editar">${ICONS.edit}</button>
                    <button class="action-btn delete-btn" title="Excluir">${ICONS.delete}</button>
                </div>
            </div>
        </div>
    `;
    item.querySelector('.check-btn').onclick = (e) => { e.stopPropagation(); togglePaid(income.id, type); };
    item.querySelector('.delete-btn').onclick = (e) => { e.stopPropagation(); deleteItem(income.id, type); };
    item.querySelector('.edit-btn').onclick = (e) => { e.stopPropagation(); openEditModal(income.id, type); };
    return item;
}


function createExpenseItem(expense, type) {
    const item = document.createElement('div');
    const isFinal = expense.current === expense.total;
    const isOverdue = expense.dueDate && !expense.paid && new Date(expense.dueDate) < new Date();
    
    let dateInfo = '';
    if (expense.paid && expense.paidDate) {
        dateInfo = `<span class="item-paid-date">${ICONS.check} Pago em ${formatDate(expense.paidDate)}</span>`;
    } else if (expense.dueDate) {
        dateInfo = `<span class="item-due-date ${isOverdue ? 'overdue' : ''}">${ICONS.calendar} Vence em ${formatDate(expense.dueDate)}</span>`;
    }

    const isInvestment = expense.description?.toUpperCase().includes('INVESTIMENTO PARA VIAGEM');
    const checkTitle = isInvestment
        ? (expense.paid ? 'Cancelar Check-in do Investimento' : 'Fazer Check-in do Investimento')
        : (expense.paid ? 'Marcar como pendente' : 'Marcar como pago');

    item.className = 'item';
    item.onclick = () => openEditModal(expense.id, type);
    
    item.innerHTML = `
        <button class="check-btn ${expense.paid ? 'paid' : ''}" title="${checkTitle}">${ICONS.check}</button>
        <div class="item-info-wrapper">
            <div class="item-primary-info">
                <div class="item-description ${expense.paid ? 'paid' : ''}">${expense.description}</div>
                <div class="item-actions">
                    <button class="action-btn edit-btn" title="Editar">${ICONS.edit}</button>
                    <button class="action-btn delete-btn" title="Excluir">${ICONS.delete}</button>
                </div>
            </div>
            <div class="item-secondary-info">
                 <div class="item-meta">
                    <span class="item-type type-${expense.type}">${expense.type === 'fixed' ? 'Fixo' : 'Variável'}</span>
                    ${expense.total > 1 ? `<span class="item-installments ${isFinal ? 'final-installment' : ''}">${expense.current}/${expense.total}</span>` : ''}
                </div>
                <div class="item-amount expense-amount">${formatCurrency(expense.amount)}</div>
            </div>
            <div class="item-tertiary-info">
                ${dateInfo}
            </div>
        </div>
    `;

    item.querySelector('.check-btn').onclick = (e) => { e.stopPropagation(); togglePaid(expense.id, type); };
    item.querySelector('.delete-btn').onclick = (e) => { e.stopPropagation(); deleteItem(expense.id, type); };
    item.querySelector('.edit-btn').onclick = (e) => { e.stopPropagation(); openEditModal(expense.id, type); };
    
    return item;
}

function createShoppingItem(itemData, type) {
    const item = document.createElement('div');
    const isOverdue = itemData.dueDate && !itemData.paid && new Date(itemData.dueDate) < new Date();

    let dateInfo = '';
    if (itemData.paid && itemData.paidDate) {
        dateInfo = `<span class="item-paid-date">${ICONS.check} Pago em ${formatDate(itemData.paidDate)}</span>`;
    } else if (itemData.dueDate) {
        dateInfo = `<span class="item-due-date ${isOverdue ? 'overdue' : ''}">${ICONS.calendar} Vence em ${formatDate(itemData.dueDate)}</span>`;
    }
    
    const checkTitle = itemData.paid ? 'Marcar como pendente' : 'Marcar como pago';

    item.className = 'item';
    item.onclick = () => openEditModal(itemData.id, type);
    
    item.innerHTML = `
        <button class="check-btn ${itemData.paid ? 'paid' : ''}" title="${checkTitle}">${ICONS.check}</button>
        <div class="item-info-wrapper">
            <div class="item-primary-info">
                <div class="item-description ${itemData.paid ? 'paid' : ''}">${itemData.description}</div>
                <div class="item-actions">
                    <button class="action-btn edit-btn" title="Editar">${ICONS.edit}</button>
                    <button class="action-btn delete-btn" title="Excluir">${ICONS.delete}</button>
                </div>
            </div>
            <div class="item-secondary-info">
                 <div class="item-meta">
                    ${dateInfo}
                </div>
                <div class="item-amount expense-amount">${formatCurrency(itemData.amount)}</div>
            </div>
        </div>
    `;

    item.querySelector('.check-btn').onclick = (e) => { e.stopPropagation(); togglePaid(itemData.id, type); };
    item.querySelector('.delete-btn').onclick = (e) => { e.stopPropagation(); deleteItem(itemData.id, type); };
    item.querySelector('.edit-btn').onclick = (e) => { e.stopPropagation(); openEditModal(itemData.id, type); };
    
    return item;
}

function renderOverviewChart() {
    const allExpenses = [...(currentMonthData.expenses || []), ...(currentMonthData.shoppingItems || []), ...(currentMonthData.avulsosItems || [])];
    const totalExpenses = allExpenses.reduce((s, e) => s + e.amount, 0);

    if (elements.overviewChart) {
        let overviewHTML = '';
        if (totalExpenses > 0) {
            overviewHTML += createPieChart();

            const marciaBritoDebt = allExpenses
                .filter(expense => expense.description.toUpperCase().includes('MARCIA BRITO'))
                .reduce((sum, expense) => sum + expense.amount, 0);
            
            if (marciaBritoDebt > 0) {
                overviewHTML += `
                    <div class="debt-summary">
                        <div class="debt-summary-header">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                            <span>Total a pagar para</span>
                        </div>
                        <div class="debt-summary-title">Marcia Brito</div>
                        <div class="debt-summary-amount">${formatCurrency(marciaBritoDebt)}</div>
                    </div>
                `;
            }
        } else {
            overviewHTML = `
                <div class="chart-placeholder">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path><path d="M22 12A10 10 0 0 0 12 2v10z"></path></svg>
                    Sem dados de despesas para exibir o gráfico.
                </div>
            `;
        }
        elements.overviewChart.innerHTML = overviewHTML;
    }
}

// =================================================================================
// EVENT HANDLERS & ACTIONS
// =================================================================================
function togglePaid(id, type) {
    const items = currentMonthData[type] || [];
    const item = items.find(i => i.id === id);
    if (item) {
        item.paid = !item.paid;
        
        if (item.paid) {
            item.paidDate = new Date().toISOString().split('T')[0];
        } else {
            item.paidDate = null;
        }

        // Automation: Update bank account balances based on payments
        const mainAccount = (currentMonthData.bankAccounts || []).find(a => a.name === "Conta Principal");

        if (mainAccount) {
            const amountChange = item.paid ? item.amount : -item.amount;
            
            if (type === 'incomes') {
                mainAccount.balance += amountChange;
            } else if (['expenses', 'shoppingItems', 'avulsosItems'].includes(type)) {
                mainAccount.balance -= amountChange;
                
                // Special case for travel investment: move money from main to savings
                const isInvestmentExpense = item.description?.toUpperCase().includes('INVESTIMENTO PARA VIAGEM');
                if (isInvestmentExpense) {
                    const savingsAccount = (currentMonthData.bankAccounts || []).find(a => a.name === "Poupança Viagem");
                    if (savingsAccount) {
                        savingsAccount.balance += amountChange;
                    }
                }
            }
        }

        saveData(); 
    }
}


function deleteItem(id, type) {
    if (!currentMonthData[type]) return;
    currentMonthData[type] = currentMonthData[type].filter(i => i.id !== id);
    saveData();
}

function handleAddItem(event) {
    event.preventDefault();
    const form = event.target;
    const description = form.description.value;
    const amount = parseCurrency(form.amount.value);
    const dueDate = form.dueDate.value;

    if (!description || isNaN(amount) || amount <= 0) return;
    
    const newItem = { id: `${currentModalType}_${Date.now()}`, description, amount, paid: false, dueDate, paidDate: null };
    
    if (currentModalType === 'income') {
        if (!currentMonthData.incomes) currentMonthData.incomes = [];
        currentMonthData.incomes.unshift(newItem);
    } else if (currentModalType === 'expense') {
        newItem.type = form.type.value;
        newItem.category = form.category.value;
        newItem.current = parseInt(form.currentInstallment.value) || 1;
        newItem.total = parseInt(form.totalInstallments.value) || 1;
        newItem.cyclic = form.cyclic.checked;
        if (!currentMonthData.expenses) currentMonthData.expenses = [];
        currentMonthData.expenses.push(newItem);
    } else if (currentModalType === 'shopping') {
        newItem.category = form.category.value;
        if (!currentMonthData.shoppingItems) currentMonthData.shoppingItems = [];
        currentMonthData.shoppingItems.unshift(newItem);
    } else if (currentModalType === 'avulso') {
        newItem.category = form.category.value;
        if (!currentMonthData.avulsosItems) currentMonthData.avulsosItems = [];
        currentMonthData.avulsosItems.unshift(newItem);
    }
    
    saveData(); 
    closeAddModal();
}

function handleEditItem(event) {
    event.preventDefault();
    const id = elements.editItemId.value;
    const type = elements.editItemType.value;
    const item = (currentMonthData[type] || []).find(i => i.id === id);

    if (item) {
        item.description = elements.editDescription.value;
        item.amount = parseCurrency(elements.editAmount.value);
        
        if (item.dueDate !== undefined) item.dueDate = elements.editDueDate.value;
        if (item.paidDate !== undefined) item.paidDate = elements.editPaidDate.value || item.paidDate;
        if (item.category !== undefined) item.category = elements.editCategory.value;

        if (item.type === 'fixed' || item.type === 'variable') {
            item.current = parseInt(elements.editCurrentInstallment.value);
            item.total = parseInt(elements.editTotalInstallments.value);
        }
        saveData();
        closeEditModal();
    }
}


// =================================================================================
// MODAL LOGIC
// =================================================================================
function openModal(modalElement) {
    modalElement.classList.add('active');
}
function closeModal(modalElement) {
    modalElement.classList.remove('active');
}

function openAddModal(type) {
    currentModalType = type;
    elements.addForm.reset();
    
    const titles = {
        income: 'Nova Entrada',
        expense: 'Nova Despesa',
        shopping: 'Nova Compra com Mumbuca',
        avulso: 'Nova Despesa Avulsa'
    };
    elements.addModalTitle.innerHTML = `${ICONS.add} ${titles[type]}`;
    
    const isExpense = type === 'expense';
    const isShopping = type === 'shopping';
    const isAvulso = type === 'avulso';

    elements.typeGroup.style.display = isExpense ? 'block' : 'none';
    elements.categoryGroup.style.display = isExpense || isShopping || isAvulso ? 'block' : 'none';
    elements.dueDateGroup.style.display = type !== 'income' ? 'block' : 'none';
    elements.installmentsGroup.style.display = isExpense ? 'flex' : 'none';
    document.getElementById('cyclicGroup').style.display = isExpense ? 'flex' : 'none';

    openModal(elements.addModal);
}

function closeAddModal() {
    closeModal(elements.addModal);
}

function openEditModal(id, type) {
    const item = (currentMonthData[type] || []).find(i => i.id === id);
    if (!item) return;

    elements.editForm.reset();
    elements.editItemId.value = id;
    elements.editItemType.value = type;
    elements.editDescription.value = item.description;
    elements.editAmount.value = formatCurrency(item.amount);
    elements.editModalTitle.innerHTML = `${ICONS.edit} Editar Item`;
    
    const hasDueDate = type !== 'incomes';
    elements.editDueDateGroup.style.display = hasDueDate ? 'flex' : 'none';
    if(hasDueDate) elements.editDueDate.value = item.dueDate || '';

    const hasCategory = type === 'expenses' || type === 'shoppingItems' || type === 'avulsosItems';
    elements.editCategoryGroup.style.display = hasCategory ? 'block' : 'none';
    if (hasCategory) elements.editCategory.value = item.category;

    const canBePaid = type === 'expenses' || type === 'shoppingItems' || type === 'avulsosItems';
    elements.editPaidDateGroup.style.display = canBePaid && item.paid ? 'block' : 'none';
    if (canBePaid && item.paid) {
        elements.editPaidDate.value = item.paidDate || new Date().toISOString().split('T')[0];
    }

    const isExpense = type === 'expenses';
    elements.editInstallmentsGroup.style.display = isExpense ? 'flex' : 'none';
    elements.editInstallmentsInfo.style.display = isExpense ? 'block' : 'none';
    if(isExpense) {
        elements.editCurrentInstallment.value = item.current;
        elements.editTotalInstallments.value = item.total;
    } else {
        elements.editInstallmentsGroup.style.display = 'none';
        elements.editInstallmentsInfo.style.display = 'none';
    }

    openModal(elements.editModal);
}

function closeEditModal() {
    closeModal(elements.editModal);
}


// =================================================================================
// GOALS FEATURE
// =================================================================================
function renderGoalsPage() {
    renderSavingsGoals();
    renderSpendingGoals();
}

function renderSpendingGoals() {
    const userGoals = currentMonthData.goals || [];
    elements.goalsList.innerHTML = '';

    const allIncomes = currentMonthData.incomes || [];
    const allExpenses = currentMonthData.expenses || [];
    const totalSalaryIncome = allIncomes
        .filter(item => item.description.toUpperCase().includes('SALARIO'))
        .reduce((sum, item) => sum + item.amount, 0);
    const plannedExpensesFromSalary = allExpenses.filter(item => item.category !== 'abastecimento_mumbuca');
    const totalPlannedExpensesFromSalary = plannedExpensesFromSalary.reduce((sum, item) => sum + item.amount, 0);
    const avulsosBudget = totalSalaryIncome - totalPlannedExpensesFromSalary;
    const avulsosAutoGoal = { id: 'goal_auto_avulsos', category: 'avulsos', amount: avulsosBudget, isAuto: true };

    const allGoals = [avulsosAutoGoal, ...userGoals];

    if (allGoals.length === 0) {
        elements.goalsList.innerHTML = `<div class="empty-state">${ICONS.goal}<div>Você ainda não definiu nenhuma meta para este mês. Que tal começar agora?</div></div>`;
        return;
    }

    allGoals.forEach(goal => {
        let spent = 0;
        
        if (goal.category === 'shopping' || goal.category === 'abastecimento_mumbuca') {
             // Mumbuca goals track ALL items (paid or not) from any list with the matching category.
            const allSpendingItems = [
                ...(currentMonthData.expenses || []),
                ...(currentMonthData.shoppingItems || []),
                ...(currentMonthData.avulsosItems || [])
            ];
            spent = allSpendingItems
                .filter(item => item.category === goal.category)
                .reduce((sum, item) => sum + item.amount, 0);
        } else if (goal.category === 'avulsos') {
            // The 'Avulsos' goal tracks the sum of ALL items in the avulsosItems list.
            spent = (currentMonthData.avulsosItems || [])
                .reduce((sum, item) => sum + item.amount, 0);
        } else {
            // All other goals track only PAID items.
            const allPaidItems = [
                ...(currentMonthData.expenses || []),
                ...(currentMonthData.shoppingItems || []),
                ...(currentMonthData.avulsosItems || [])
            ].filter(item => item.paid);
            
            spent = allPaidItems
                .filter(item => item.category === goal.category)
                .reduce((sum, item) => sum + item.amount, 0);
        }


        const percentage = goal.amount > 0 ? (spent / goal.amount) * 100 : 0;
        const remaining = goal.amount - spent;
        let progressBarClass = 'safe';
        if (percentage > 100) progressBarClass = 'danger';
        else if (percentage > 75) progressBarClass = 'warning';

        const card = document.createElement('div');
        card.className = 'goal-card';
        
        let actionsHTML = `
            <button class="action-btn edit-goal-btn" title="Editar Meta">${ICONS.edit}</button>
            <button class="action-btn delete-goal-btn" title="Excluir Meta">${ICONS.delete}</button>
        `;
        if (goal.isAuto) {
            actionsHTML = `<div class="goal-card-auto-info" title="Esta meta é calculada automaticamente (Receitas - Dívidas).">${ICONS.info}<span>Automático</span></div>`;
        }

        card.innerHTML = `
            <div class="goal-card-header">
                <div class="goal-card-title">
                    ${SPENDING_CATEGORIES[goal.category]?.icon || ''}
                    <span>${SPENDING_CATEGORIES[goal.category]?.name || goal.category}</span>
                </div>
                <div class="goal-card-actions">
                     ${actionsHTML}
                </div>
            </div>
            <div class="goal-card-body">
                <div class="goal-amounts">
                    <span class="goal-spent-amount">${formatCurrency(spent)}</span>
                    <span class="goal-total-amount">de ${formatCurrency(goal.amount)}</span>
                </div>
                <div class="goal-progress-bar">
                    <div class="goal-progress-bar-inner ${progressBarClass}" style="width: ${Math.min(percentage, 100)}%;"></div>
                </div>
                <div class="goal-remaining ${remaining < 0 ? 'over' : 'safe'}">
                    ${remaining >= 0 ? `${formatCurrency(remaining)} restantes` : `${formatCurrency(Math.abs(remaining))} acima`}
                </div>
            </div>
        `;
        
        if (!goal.isAuto) {
            card.querySelector('.edit-goal-btn').onclick = () => openGoalModal(goal.id);
            card.querySelector('.delete-goal-btn').onclick = () => deleteGoal(goal.id);
        }
        elements.goalsList.appendChild(card);
    });
}


function openGoalModal(id = null) {
    elements.goalForm.reset();
    const existingGoal = id ? (currentMonthData.goals || []).find(g => g.id === id) : null;

    if (existingGoal) {
        elements.goalModalTitle.innerHTML = `${ICONS.edit} Editar Meta`;
        elements.goalId.value = existingGoal.id;
        elements.goalCategory.value = existingGoal.category;
        elements.goalAmount.value = formatCurrency(existingGoal.amount);
        elements.goalCategory.disabled = true;
    } else {
        elements.goalModalTitle.innerHTML = `${ICONS.add} Nova Meta`;
        elements.goalId.value = '';
        elements.goalCategory.disabled = false;
    }
    openModal(elements.goalModal);
}

function closeGoalModal() {
    closeModal(elements.goalModal);
}

function handleSaveGoal(event) {
    event.preventDefault();
    const id = elements.goalId.value;
    const category = elements.goalCategory.value;
    const amount = parseCurrency(elements.goalAmount.value);

    if (!category || isNaN(amount) || amount <= 0) return;
    
    if (category === 'avulsos') {
        alert('A meta para a categoria "Avulsos" é calculada automaticamente e não pode ser definida manually.');
        return;
    }

    if (id) { 
        const goal = (currentMonthData.goals || []).find(g => g.id === id);
        if (goal) goal.amount = amount;
    } else { 
        if (!currentMonthData.goals) currentMonthData.goals = [];
        if (currentMonthData.goals.some(g => g.category === category)) {
            alert('Já existe uma meta para esta categoria.');
            return;
        }
        const newGoal = { id: `goal_${Date.now()}`, category, amount };
        currentMonthData.goals.push(newGoal);
    }
    saveData();
    closeGoalModal();
}

function deleteGoal(id) {
    if (confirm('Tem certeza que deseja excluir esta meta?')) {
        currentMonthData.goals = (currentMonthData.goals || []).filter(g => g.id !== id);
        saveData();
    }
}

// =================================================================================
// SAVINGS GOALS FEATURE
// =================================================================================
function renderSavingsGoals() {
    const savingsGoals = currentMonthData.savingsGoals || [];
    elements.savingsGoalsList.innerHTML = '';

    if (savingsGoals.length === 0) {
        elements.savingsGoalsList.innerHTML = `<div class="empty-state">${ICONS.savings}<div>Crie metas de poupança para seus grandes objetivos, como uma viagem ou um fundo de emergência.</div></div>`;
        return;
    }

    savingsGoals.forEach(goal => {
        const percentage = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
        const remaining = goal.targetAmount - goal.currentAmount;
        let progressBarClass = 'safe';
        if (percentage > 75) progressBarClass = 'success';
        else if (percentage > 40) progressBarClass = 'warning';

        const card = document.createElement('div');
        card.className = 'goal-card';

        card.innerHTML = `
            <div class="goal-card-header">
                <div class="goal-card-title">
                    ${ICONS.savings}
                    <span>${goal.description}</span>
                </div>
                <div class="goal-card-actions">
                    <button class="action-btn edit-savings-goal-btn" title="Editar Meta">${ICONS.edit}</button>
                    <button class="action-btn delete-savings-goal-btn" title="Excluir Meta">${ICONS.delete}</button>
                </div>
            </div>
            <div class="goal-card-body">
                <div class="goal-amounts">
                    <span class="goal-spent-amount">${formatCurrency(goal.currentAmount)}</span>
                    <span class="goal-total-amount">de ${formatCurrency(goal.targetAmount)}</span>
                </div>
                <div class="goal-progress-bar">
                    <div class="goal-progress-bar-inner ${progressBarClass}" style="width: ${Math.min(percentage, 100)}%;"></div>
                </div>
                <div class="goal-remaining safe">
                    ${remaining > 0 ? `${formatCurrency(remaining)} restantes` : `Meta alcançada!`}
                </div>
            </div>
        `;
        
        card.querySelector('.edit-savings-goal-btn').onclick = () => openSavingsGoalModal(goal.id);
        card.querySelector('.delete-savings-goal-btn').onclick = () => deleteSavingsGoal(goal.id);
        elements.savingsGoalsList.appendChild(card);
    });
}

function openSavingsGoalModal(id = null) {
    elements.savingsGoalForm.reset();
    const existingGoal = id ? (currentMonthData.savingsGoals || []).find(g => g.id === id) : null;

    if (existingGoal) {
        elements.savingsGoalModalTitle.innerHTML = `${ICONS.edit} Editar Meta de Poupança`;
        elements.savingsGoalId.value = existingGoal.id;
        elements.savingsGoalDescription.value = existingGoal.description;
        elements.savingsGoalCurrent.value = formatCurrency(existingGoal.currentAmount);
        elements.savingsGoalTarget.value = formatCurrency(existingGoal.targetAmount);
    } else {
        elements.savingsGoalModalTitle.innerHTML = `${ICONS.add} Nova Meta de Poupança`;
        elements.savingsGoalId.value = '';
    }
    openModal(elements.savingsGoalModal);
}

function closeSavingsGoalModal() {
    closeModal(elements.savingsGoalModal);
}

function handleSaveSavingsGoal(event) {
    event.preventDefault();
    const id = elements.savingsGoalId.value;
    const description = elements.savingsGoalDescription.value.trim();
    const currentAmount = parseCurrency(elements.savingsGoalCurrent.value);
    const targetAmount = parseCurrency(elements.savingsGoalTarget.value);

    if (!description || isNaN(currentAmount) || isNaN(targetAmount) || targetAmount <= 0) {
        alert("Por favor, preencha todos os campos com valores válidos.");
        return;
    }
    
    if (!currentMonthData.savingsGoals) currentMonthData.savingsGoals = [];

    if (id) { // Editing
        const goal = currentMonthData.savingsGoals.find(g => g.id === id);
        if (goal) {
            goal.description = description;
            goal.currentAmount = currentAmount;
            goal.targetAmount = targetAmount;
        }
    } else { // Adding
        const newGoal = { id: `sg_${Date.now()}`, description, currentAmount, targetAmount };
        currentMonthData.savingsGoals.push(newGoal);
    }

    saveData();
    closeSavingsGoalModal();
}

function deleteSavingsGoal(id) {
    if (confirm('Tem certeza que deseja excluir esta meta de poupança?')) {
        currentMonthData.savingsGoals = (currentMonthData.savingsGoals || []).filter(g => g.id !== id);
        saveData();
    }
}


// =================================================================================
// BANK ACCOUNTS FEATURE
// =================================================================================
function renderBankAccounts() {
    const accounts = currentMonthData.bankAccounts || [];
    const listEl = elements.bankAccountsList;
    listEl.innerHTML = '';

    if (accounts.length === 0) {
        listEl.innerHTML = `<div class="empty-state-small">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
            <span>Adicione suas contas para ver os saldos.</span>
        </div>`;
        document.getElementById('accounts-total-container').style.display = 'none';
        return;
    }

    document.getElementById('accounts-total-container').style.display = 'flex';
    const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
    document.getElementById('accounts-total-amount').textContent = formatCurrency(totalBalance);

    accounts.forEach(acc => {
        const item = document.createElement('div');
        item.className = 'account-item';
        item.onclick = () => openAccountModal(acc.id);
        item.innerHTML = `
            <div class="account-details">
                <div class="account-name">${acc.name}</div>
                <div class="account-balance">${formatCurrency(acc.balance)}</div>
            </div>
            <div class="account-actions">
                <button class="action-btn edit-btn" title="Editar Saldo">${ICONS.edit}</button>
                <button class="action-btn delete-btn" title="Excluir Conta">${ICONS.delete}</button>
            </div>
        `;
        item.querySelector('.delete-btn').onclick = (e) => { e.stopPropagation(); deleteAccount(acc.id); };
        listEl.appendChild(item);
    });
}

function openAccountModal(id = null) {
    elements.accountForm.reset();
    const existingAccount = id ? (currentMonthData.bankAccounts || []).find(a => a.id === id) : null;

    if (existingAccount) {
        elements.accountModalTitle.innerHTML = `${ICONS.edit} Editar Saldo da Conta`;
        elements.accountId.value = existingAccount.id;
        elements.accountName.value = existingAccount.name;
        elements.accountBalance.value = formatCurrency(existingAccount.balance);
        elements.accountName.disabled = true; // prevent name change
    } else {
        elements.accountModalTitle.innerHTML = `${ICONS.add} Adicionar Conta Bancária`;
        elements.accountId.value = '';
        elements.accountName.disabled = false;
    }
    openModal(elements.accountModal);
}

function closeAccountModal() {
    closeModal(elements.accountModal);
}

function handleSaveAccount(event) {
    event.preventDefault();
    const id = elements.accountId.value;
    const name = elements.accountName.value.trim();
    const balance = parseCurrency(elements.accountBalance.value);

    if (!name || isNaN(balance)) {
        alert('Por favor, preencha o nome da conta e um saldo válido.');
        return;
    }
    
    if (!currentMonthData.bankAccounts) currentMonthData.bankAccounts = [];

    if (id) { // Editing
        const account = currentMonthData.bankAccounts.find(a => a.id === id);
        if (account) {
            account.name = name;
            account.balance = balance;
        }
    } else { // Adding
        const newAccount = { id: `acc_${Date.now()}`, name, balance };
        currentMonthData.bankAccounts.push(newAccount);
    }

    saveData();
    closeAccountModal();
}

function deleteAccount(id) {
    if (confirm('Tem certeza que deseja excluir esta conta?')) {
        currentMonthData.bankAccounts = (currentMonthData.bankAccounts || []).filter(a => a.id !== id);
        saveData();
    }
}


// =================================================================================
// AI ANALYSIS & CHAT
// =================================================================================
async function initializeAndStartChat() {
    openModal(elements.aiModal);
    elements.aiModalTitle.innerHTML = `${ICONS.aiAnalysis} IA Financeira`;
    elements.aiAnalysis.innerHTML = `
        <div id="ai-loading-state" class="loading">
            <div class="spinner"></div>
            <div>Analisando seus dados e preparando a IA...</div>
        </div>
    `;

    elements.aiChatInput.disabled = true;
    document.getElementById('aiChatSendBtn').disabled = true;
    elements.aiChatInput.placeholder = "Inicializando IA...";
    elements.aiChatForm.removeEventListener('submit', handleAiChatSubmit);

    try {
        // Lazy initialize the AI client. This prevents the app from crashing on load
        // if the API key environment variable isn't set.
        if (!ai) {
             ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        }

        chat = ai.chats.create({
            model: 'gemini-2.5-pro',
            config: {
                systemInstruction: "Você é a 'IA Financeira', uma assistente especialista em finanças pessoais, amigável e perspicaz. Seu objetivo é ajudar o usuário a entender suas finanças, identificar padrões de gastos e encontrar oportunidades de economia. Suas respostas DEVEM ser em Português do Brasil. Baseie TODAS as suas respostas estritamente nos dados financeiros fornecidos no contexto da conversa. INSTRUÇÃO ESPECIAL E OBRIGATÓRIA: Sempre que identificar despesas contendo 'Marcia Brito' na descrição, você DEVE somar todos os valores e tratá-los como uma única dívida consolidada ao responder. Forneça conselhos claros, concisos e práticos. Utilize Markdown simples para formatação (ex: `**negrito**` e listas com `-`). Nunca inclua blocos de código JSON em suas respostas, a menos que seja explicitamente solicitado.",
            },
        });

        const initialPrompt = `
        ## Dados Financeiros do Mês de ${getMonthName(currentMonth)}/${currentYear} (Formato JSON):
        ${JSON.stringify(currentMonthData, null, 2)}
        
        ## Tarefa
        A partir de agora, analise esses dados para responder às minhas perguntas.

        Olá! Como minha assistente financeira, por favor, apresente-se brevemente, confirme que você analisou meus dados do mês atual e me diga como pode me ajudar a entender minhas finanças.
        `;

        const responseStream = await chat.sendMessageStream({ message: initialPrompt });

        const aiMessageEl = document.createElement('div');
        aiMessageEl.className = `chat-message ai-message`;
        const aiBubbleEl = document.createElement('div');
        aiBubbleEl.className = 'message-bubble';
        aiMessageEl.appendChild(aiBubbleEl);
        
        let fullResponseText = '';
        let firstChunk = true;
        for await (const chunk of responseStream) {
            if (firstChunk) {
                const pieChartHTML = createPieChart();
                elements.aiAnalysis.innerHTML = pieChartHTML;
                elements.aiAnalysis.appendChild(aiMessageEl);
                firstChunk = false;
            }
            fullResponseText += chunk.text;
            aiBubbleEl.innerHTML = simpleMarkdownToHtml(fullResponseText);
            elements.aiAnalysis.scrollTop = elements.aiAnalysis.scrollHeight;
        }

        elements.aiChatInput.disabled = false;
        document.getElementById('aiChatSendBtn').disabled = false;
        elements.aiChatInput.placeholder = "Pergunte sobre suas finanças...";
        elements.aiChatInput.focus();

    } catch (error) {
        console.error("Error initializing AI Chat:", error);
        elements.aiAnalysis.innerHTML = '';
        let errorMessage = 'Ocorreu um erro ao inicializar a IA. Verifique sua conexão ou tente novamente mais tarde.';
        // Check for common Vercel/environment variable error
        if (error instanceof TypeError && (error.message.includes('process') || error.message.includes('env'))) {
            errorMessage = '<strong>Erro de Configuração:</strong> A chave da API de IA não foi encontrada. O administrador precisa configurar a variável de ambiente `API_KEY` nas configurações do Vercel para que a Análise IA funcione.';
        }
        appendChatMessage('ai', errorMessage);
        elements.aiChatInput.placeholder = "Erro ao conectar com a IA";
    }

    elements.aiChatForm.addEventListener('submit', handleAiChatSubmit);
}

async function openAiModal() {
    await initializeAndStartChat();
}

function closeAiModal() {
    closeModal(elements.aiModal);
    elements.aiChatForm.removeEventListener('submit', handleAiChatSubmit);
    chat = null;
}

async function handleAiChatSubmit(event) {
    event.preventDefault();
    if (!chat) {
        appendChatMessage('ai', 'A sessão com a IA não foi iniciada. Por favor, feche e abra a janela novamente.');
        return;
    }
    const userInput = elements.aiChatInput.value.trim();
    if (!userInput) return;

    appendChatMessage('user', userInput);
    elements.aiChatInput.value = '';
    
    const sendButton = document.getElementById('aiChatSendBtn');
    elements.aiChatInput.disabled = true;
    sendButton.disabled = true;
    
    const aiMessageEl = document.createElement('div');
    aiMessageEl.className = `chat-message ai-message`;
    const aiBubbleEl = document.createElement('div');
    aiBubbleEl.className = 'message-bubble';
    aiMessageEl.appendChild(aiBubbleEl);
    elements.aiAnalysis.appendChild(aiMessageEl);

    aiBubbleEl.innerHTML = `<div class="typing-indicator"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div>`;
    elements.aiAnalysis.scrollTop = elements.aiAnalysis.scrollHeight;

    try {
        const responseStream = await chat.sendMessageStream({ message: userInput });
        
        let fullResponseText = '';
        let firstChunk = true;

        for await (const chunk of responseStream) {
            if (firstChunk) {
                aiBubbleEl.innerHTML = ''; 
                firstChunk = false;
            }
            fullResponseText += chunk.text;
            aiBubbleEl.innerHTML = simpleMarkdownToHtml(fullResponseText);
            elements.aiAnalysis.scrollTop = elements.aiAnalysis.scrollHeight;
        }
        
    } catch(error) {
        console.error("AI chat error:", error);
        aiBubbleEl.innerHTML = simpleMarkdownToHtml('**Erro:** Desculpe, não consegui processar sua solicitação no momento. Tente novamente.');
    } finally {
        elements.aiChatInput.disabled = false;
        sendButton.disabled = false;
        elements.aiChatInput.focus();
    }
}

function appendChatMessage(role, text) {
    const messageEl = document.createElement('div');
    messageEl.className = `chat-message ${role}-message`;

    const bubbleEl = document.createElement('div');
    bubbleEl.className = 'message-bubble';
    
    bubbleEl.innerHTML = role === 'ai' ? simpleMarkdownToHtml(text) : text;
    
    messageEl.appendChild(bubbleEl);
    elements.aiAnalysis.appendChild(messageEl);
    elements.aiAnalysis.scrollTop = elements.aiAnalysis.scrollHeight;
}

function createPieChart() {
    const allExpenses = [...(currentMonthData.expenses || []), ...(currentMonthData.shoppingItems || []), ...(currentMonthData.avulsosItems || [])];
    const total = allExpenses.reduce((s, e) => s + e.amount, 0);

    if (total === 0) return '';
    
    const categoryTotals = {};
    allExpenses.forEach(exp => {
        const catName = SPENDING_CATEGORIES[exp.category]?.name || 'Outros';
        if (!categoryTotals[catName]) {
            categoryTotals[catName] = 0;
        }
        categoryTotals[catName] += exp.amount;
    });

    const colors = ['#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#ec4899', '#a1a1aa', '#6366f1', '#10b981'];
    let colorIndex = 0;

    const categories = Object.entries(categoryTotals).map(([name, value]) => ({
        name,
        value,
        color: colors[colorIndex++ % colors.length]
    })).sort((a,b) => b.value - a.value);

    let cumulativePercent = 0;
    const paths = categories.map(cat => {
        const percent = cat.value / total;
        const startAngle = cumulativePercent * 360;
        const endAngle = (cumulativePercent + percent) * 360;
        cumulativePercent += percent;
        
        const largeArcFlag = percent > 0.5 ? 1 : 0;
        const x1 = 50 + 45 * Math.cos(Math.PI * startAngle / 180);
        const y1 = 50 + 45 * Math.sin(Math.PI * startAngle / 180);
        const x2 = 50 + 45 * Math.cos(Math.PI * endAngle / 180);
        const y2 = 50 + 45 * Math.sin(Math.PI * endAngle / 180);

        return `<path d="M 50,50 L ${x1},${y1} A 45,45 0 ${largeArcFlag},1 ${x2},${y2} Z" fill="${cat.color}" />`;
    }).join('');
    
    const legend = categories.map(cat => `
        <div class="legend-item">
            <div class="legend-label"><div class="legend-color" style="background-color:${cat.color}"></div>${cat.name}</div>
            <div class="legend-value">${formatCurrency(cat.value)} <span class="legend-percentage">(${(cat.value / total * 100).toFixed(1)}%)</span></div>
        </div>
    `).join('');

    return `
        <div class="pie-chart-container">
            <svg viewBox="0 0 100 100" class="pie-chart">${paths}</svg>
            <div class="pie-chart-legend">${legend}</div>
        </div>`;
}

// =================================================================================
// PWA
// =================================================================================
function setupPWA() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/service-worker.js')
                .then(reg => console.log('Service Worker registered.', reg))
                .catch(err => console.log('Service Worker registration failed: ', err));
        });
    }

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        const installBanner = document.getElementById('pwa-install-banner');
        if(installBanner) installBanner.classList.add('visible');
    });

    document.getElementById('pwa-install-btn')?.addEventListener('click', () => {
        const installBanner = document.getElementById('pwa-install-banner');
        if (installBanner) installBanner.classList.remove('visible');
        if (deferredPrompt) {
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then(() => {
                deferredPrompt = null;
            });
        }
    });

    document.getElementById('pwa-dismiss-btn')?.addEventListener('click', () => {
        const installBanner = document.getElementById('pwa-install-banner');
        if (installBanner) installBanner.classList.remove('visible');
    });

    window.addEventListener('appinstalled', () => {
        const installBanner = document.getElementById('pwa-install-banner');
        if (installBanner) installBanner.classList.remove('visible');
    });
}

// =================================================================================
// MONTHLY ANALYSIS
// =================================================================================
async function renderMonthlyAnalysis() {
    elements.monthlyAnalysisSection.innerHTML = '';
    elements.monthlyAnalysisSection.style.display = 'none';

    if (!currentUser) return;

    // Data for current month
    const allCurrentExpenses = [...(currentMonthData.expenses || []), ...(currentMonthData.shoppingItems || []), ...(currentMonthData.avulsosItems || [])];
    if (allCurrentExpenses.length === 0) return;

    const currentCategoryTotals = allCurrentExpenses.reduce((acc, exp) => {
        const catName = SPENDING_CATEGORIES[exp.category]?.name || 'Outros';
        acc[catName] = (acc[catName] || 0) + exp.amount;
        return acc;
    }, {});
    const totalCurrentSpending = allCurrentExpenses.reduce((sum, exp) => sum + exp.amount, 0);

    // Get top spending categories
    const topCategories = Object.entries(currentCategoryTotals)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);
    
    // Fetch previous month data
    const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
    const prevMonthKey = `${prevYear}-${prevMonth.toString().padStart(2, '0')}`;
    const prevDocRef = doc(db, 'users', currentUser.uid, 'months', prevMonthKey);
    const prevDocSnap = await getDoc(prevDocRef);
    
    let prevCategoryTotals = {};
    if (prevDocSnap.exists()) {
        const prevData = prevDocSnap.data();
        const allPrevExpenses = [...(prevData.expenses || []), ...(prevData.shoppingItems || []), ...(prevData.avulsosItems || [])];
        prevCategoryTotals = allPrevExpenses.reduce((acc, exp) => {
            const catName = SPENDING_CATEGORIES[exp.category]?.name || 'Outros';
            acc[catName] = (acc[catName] || 0) + exp.amount;
            return acc;
        }, {});
    }

    // Build HTML for Top Categories
    let topCategoriesHTML = `
        <div class="analysis-block">
            <div class="analysis-block-title">${ICONS.shopping} Maiores Gastos do Mês</div>
            <div class="top-spending-list">
                ${topCategories.map(([name, amount]) => `
                    <div class="top-spending-item">
                        <div>${Object.values(SPENDING_CATEGORIES).find(c => c.name === name)?.icon || ICONS.variable}</div>
                        <div class="item-info">
                            <span class="item-name">${name}</span>
                            <span class="item-percentage">${((amount / totalCurrentSpending) * 100).toFixed(0)}% do total</span>
                        </div>
                        <div class="item-amount">${formatCurrency(amount)}</div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    // Build HTML for Comparison
    let comparisonHTML = '';
    if (Object.keys(prevCategoryTotals).length > 0) {
        const comparisons = topCategories.map(([name, currentAmount]) => {
            const prevAmount = prevCategoryTotals[name] || 0;
            if (prevAmount === 0 && currentAmount > 0) {
                 return { name, change: Infinity, currentAmount, prevAmount };
            }
            if(prevAmount === 0 && currentAmount === 0) {
                return { name, change: 0, currentAmount, prevAmount };
            }
            const change = ((currentAmount - prevAmount) / prevAmount) * 100;
            return { name, change, currentAmount, prevAmount };
        });

        comparisonHTML = `
            <div class="analysis-block">
                <div class="analysis-block-title">${ICONS.calendar} Comparativo com ${getMonthName(prevMonth)}</div>
                <div class="comparison-list">
                    ${comparisons.map(c => {
                        let changeClass = 'neutral';
                        let changeIcon = '';
                        let changeText = 'Sem alteração';

                        if (isFinite(c.change) && Math.abs(c.change) >= 1) {
                            if (c.change > 0) {
                                changeClass = 'increase';
                                changeIcon = '▲';
                                changeText = `+${c.change.toFixed(0)}%`;
                            } else {
                                changeClass = 'decrease';
                                changeIcon = '▼';
                                changeText = `${c.change.toFixed(0)}%`;
                            }
                        } else if (c.change === Infinity) {
                            changeClass = 'increase';
                            changeIcon = '▲';
                            changeText = 'Novo Gasto';
                        }
                        
                        return `
                            <div class="comparison-item">
                                <div class="comparison-details">
                                    <span class="comparison-name">${c.name}</span>
                                    <span class="comparison-amounts">${formatCurrency(c.currentAmount)} vs ${formatCurrency(c.prevAmount)}</span>
                                </div>
                                <div class="comparison-change ${changeClass}">
                                    ${changeIcon} ${changeText}
                                </div>
                            </div>
                        `
                    }).join('')}
                </div>
            </div>
        `;
    }

    elements.monthlyAnalysisSection.innerHTML = `
        <div class="section-header">
            <h2 class="section-title">Análise Mensal Detalhada</h2>
        </div>
        <div class="analysis-content">
            ${topCategoriesHTML}
            ${comparisonHTML}
        </div>
    `;
    elements.monthlyAnalysisSection.style.display = 'block';
}

// =================================================================================
// INITIALIZATION
// =================================================================================

function initializeFirebase() {
    if (isConfigured && auth) {
        onAuthStateChanged(auth, user => {
            if (user) {
                currentUser = user;
                console.log("Authenticated anonymously with UID:", user.uid);
                syncStatus = 'synced';
                updateSyncButtonState();
                updateProfilePage();
                loadDataForCurrentMonth();
            } else {
                currentUser = null;
                console.log("No user signed in. Attempting anonymous sign-in.");
                signInAnonymously(auth).catch(error => {
                    console.error("Anonymous sign-in failed:", error);
                    syncStatus = 'error';
                    
                    if (error.code === 'auth/configuration-not-found') {
                        syncErrorDetails = `<p><strong>Falha na autenticação anônima.</strong> Verifique se o método de login anônimo está ativado no seu painel do Firebase em Authentication > Sign-in method.</p>`;
                    } else {
                        syncErrorDetails = `<p>Falha na autenticação. Não é possível salvar os dados na nuvem.</p><p><strong>Erro:</strong> ${error.message}</p>`;
                    }

                    // Fallback to local mode if sign-in fails
                    console.warn("Firebase sign-in failed. Initializing with local data.", error);
                    currentUser = { uid: 'local-user', isAnonymous: true }; // Mock user
                    if (currentYear === 2025 && currentMonth === 11) {
                        currentMonthData = JSON.parse(JSON.stringify(initialMonthData));
                    } else {
                        currentMonthData = { incomes: [], expenses: [], shoppingItems: [], avulsosItems: [], goals: [], bankAccounts: [], savingsGoals: [] };
                    }
                    updateMonthDisplay();
                    updateUI();
                    updateSyncButtonState();
                    updateProfilePage();
                });
            }
        });
    } else {
        // Firebase is not configured. App remains in a 'disconnected' state.
        console.warn("Firebase not configured. Please update firebase-config.js to enable cloud sync.");
        currentUser = null;
        syncStatus = 'disconnected';
        updateSyncButtonState();
        updateProfilePage();
        
        elements.mainContent.innerHTML = `
            <div class="empty-state">
                ${ICONS.cloudOff}
                <h2>Sincronização na Nuvem Desativada</h2>
                <p style="max-width: 450px; line-height: 1.8;">Para salvar seus dados na nuvem e acessá-los de qualquer dispositivo, você precisa configurar o Firebase. Siga as instruções no arquivo <strong>firebase-config.js</strong>.</p>
            </div>
        `;
        // Hide month selector as it's not usable
        elements.monthSelector.style.display = 'none';
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    populateCategorySelects();
    setupPWA();
    initializeFirebase();
    
    // Only navigate to home if firebase is configured
    if (isConfigured) {
        navigateTo('home');
    }
    
    const amountInputs = [
        document.getElementById('amount'), 
        document.getElementById('editAmount'),
        document.getElementById('goalAmount'),
        document.getElementById('accountBalance'),
        document.getElementById('savingsGoalCurrent'),
        document.getElementById('savingsGoalTarget')
    ];
    amountInputs.forEach(input => {
        if (input) {
            input.addEventListener('input', (e) => {
                const target = e.target;
                let value = target.value.replace(/\D/g, '');
                if (value) {
                    const numberValue = parseInt(value, 10) / 100;
                    target.value = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(numberValue);
                } else {
                    target.value = '';
                }
            });
        }
    });

    // --- EVENT LISTENERS ---
    document.getElementById('prevMonthBtn').addEventListener('click', () => changeMonth(-1));
    document.getElementById('nextMonthBtn').addEventListener('click', () => changeMonth(1));
    document.getElementById('openAiModalBtnTab').addEventListener('click', openAiModal);
    
    // These listeners target elements inside the main content, which is replaced if Firebase is not configured.
    if (isConfigured) {
        document.getElementById('openAddIncomeModalBtn').addEventListener('click', () => openAddModal('income'));
        document.getElementById('openAddExpenseModalBtn').addEventListener('click', () => openAddModal('expense'));
        document.getElementById('openAddShoppingModalBtn').addEventListener('click', () => openAddModal('shopping'));
        document.getElementById('openAddAvulsoModalBtn').addEventListener('click', () => openAddModal('avulso'));
        
        document.getElementById('openAddGoalModalBtn').addEventListener('click', () => openGoalModal());
        document.getElementById('openAddAccountModalBtn').addEventListener('click', () => openAccountModal());
        document.getElementById('openAddSavingsGoalModalBtn').addEventListener('click', () => openSavingsGoalModal());
    
        elements.segmentedBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                elements.segmentedBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const listId = btn.dataset.list;
                document.getElementById('incomesList').style.display = listId === 'incomesList' ? 'block' : 'none';
                document.getElementById('expensesList').style.display = listId === 'expensesList' ? 'block' : 'none';
                document.getElementById('shoppingList').style.display = listId === 'shoppingList' ? 'block' : 'none';
                document.getElementById('avulsosList').style.display = listId === 'avulsosList' ? 'block' : 'none';
                
                document.getElementById('openAddIncomeModalBtn').style.display = listId === 'incomesList' ? 'flex' : 'none';
                document.getElementById('openAddExpenseModalBtn').style.display = listId === 'expensesList' ? 'flex' : 'none';
                document.getElementById('openAddShoppingModalBtn').style.display = listId === 'shoppingList' ? 'flex' : 'none';
                document.getElementById('openAddAvulsoModalBtn').style.display = listId === 'avulsosList' ? 'flex' : 'none';
            });
        });
    }


    elements.tabBar.addEventListener('click', (e) => {
        const tabBtn = e.target.closest('.tab-btn');
        if (tabBtn && tabBtn.dataset.view) {
             // Do not allow navigation if Firebase is not configured, except to the profile page
            if (!isConfigured && tabBtn.dataset.view !== 'perfil') {
                return;
            }
            navigateTo(tabBtn.dataset.view);
        }
    });

    document.getElementById('closeAddModalBtn').addEventListener('click', closeAddModal);
    document.getElementById('cancelAddBtn').addEventListener('click', closeAddModal);
    document.getElementById('closeEditModalBtn').addEventListener('click', closeEditModal);
    document.getElementById('cancelEditBtn').addEventListener('click', closeEditModal);
    document.getElementById('closeAiModalBtn').addEventListener('click', closeAiModal);
    document.getElementById('closeGoalModalBtn').addEventListener('click', closeGoalModal);
    document.getElementById('cancelGoalBtn').addEventListener('click', closeGoalModal);
    document.getElementById('closeAccountModalBtn').addEventListener('click', closeAccountModal);
    document.getElementById('cancelAccountBtn').addEventListener('click', closeAccountModal);
    document.getElementById('closeSavingsGoalModalBtn').addEventListener('click', closeSavingsGoalModal);
    document.getElementById('cancelSavingsGoalBtn').addEventListener('click', closeSavingsGoalModal);

    elements.addForm.addEventListener('submit', handleAddItem);
    elements.editForm.addEventListener('submit', handleEditItem);
    elements.goalForm.addEventListener('submit', handleSaveGoal);
    elements.accountForm.addEventListener('submit', handleSaveAccount);
    elements.savingsGoalForm.addEventListener('submit', handleSaveSavingsGoal);

    document.getElementById('type').addEventListener('change', (e) => {
        const isFixed = e.target.value === 'fixed';
        document.getElementById('cyclicGroup').style.display = isFixed ? 'flex' : 'none';
        document.getElementById('installmentsGroup').style.display = isFixed ? 'flex' : 'none';
    });
});