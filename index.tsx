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
        { id: "inc_nov_3", description: 'MUMBUCA MARCELLY', amount: 650.00, paid: false },
        { id: "inc_nov_4", description: 'MUMBUCA ANDRE', amount: 650.00, paid: false },
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
        { id: "exp_nov_9", description: "REMÉDIOS DO ANDRÉ", amount: 0.00, type: "fixed", category: "saude", paid: true, cyclic: true, dueDate: '2025-11-05', paidDate: '2025-11-05', current: 10, total: 12 },
        { id: "exp_nov_10", description: "INTERMÉDICA DO ANDRÉ (MARCIA BRITO)", amount: 123.00, type: "fixed", category: "saude", paid: true, cyclic: true, dueDate: '2025-11-15', paidDate: '2025-11-15', current: 10, total: 12 },
        { id: "exp_nov_11", description: "APPAI DA MARCELLY", amount: 110.00, type: "fixed", category: "saude", paid: true, cyclic: true, dueDate: '2025-11-15', paidDate: '2025-11-15', current: 10, total: 12 },
        { id: "exp_nov_12", description: "APPAI DO ANDRÉ (MARCIA BRITO)", amount: 129.00, type: "fixed", category: "saude", paid: true, cyclic: true, dueDate: '2025-11-20', paidDate: '2025-11-20', current: 10, total: 12 },
        { id: "exp_nov_13", description: "CIDADANIA PORTUGUESA", amount: 140.00, type: "fixed", category: "outros", paid: true, cyclic: false, dueDate: '2025-11-20', paidDate: '2025-11-20', current: 13, total: 36 },
        { id: "exp_nov_14", description: "EMPRÉSTIMO PARA ACABAR DE PASSAR ABRIL (MARCIA BRITO)", amount: 220.00, type: "fixed", category: "dividas", paid: true, cyclic: false, dueDate: '2025-11-25', paidDate: '2025-11-25', current: 6, total: 6 },
        { id: "exp_nov_15", description: "RENEGOCIAÇÃO DO CARREFOUR (MARCIA BRITO)", amount: 312.50, type: "fixed", category: "dividas", paid: true, cyclic: false, dueDate: '2025-11-28', paidDate: '2025-11-28', current: 1, total: 16 },
        // Despesas Variáveis
        { id: "exp_nov_16", description: "DALUZ (LILI)", amount: 88.50, type: "variable", category: "pessoal", paid: true, cyclic: false, dueDate: '2025-11-03', paidDate: '2025-11-03', current: 1, total: 2 },
        { id: "exp_nov_17", description: "VESTIDO CÍTRICA (LILI)", amount: 53.57, type: "variable", category: "pessoal", paid: true, cyclic: false, dueDate: '2025-11-03', paidDate: '2025-11-03', current: 1, total: 2 },
        { id: "exp_nov_18", description: "PARCELAMENTO DO ITAÚ --- ANDRÉ", amount: 159.59, type: "variable", category: "dividas", paid: true, cyclic: false, dueDate: '2025-10-30', paidDate: '2025-10-30', current: 3, total: 3 },
        { id: "exp_nov_19", description: "Pagamento de fatura atrasada do Inter", amount: 5.50, type: "variable", category: "dividas", paid: true, cyclic: false, dueDate: '2025-10-30', paidDate: '2025-10-30', current: 1, total: 1 },
        { id: "exp_nov_20", description: "ACORDO ITAÚ ANDRÉ (CARTÃO DE CRÉDITO E CHEQUE ESPECIAL)", amount: 233.14, type: "variable", category: "dividas", paid: true, cyclic: false, dueDate: '2025-10-30', paidDate: '2025-10-30', current: 1, total: 1 },
        { id: "exp_nov_21", description: "FATURA DO CARTÃO DO ANDRÉ", amount: 103.89, type: "variable", category: "dividas", paid: true, cyclic: false, dueDate: '2025-10-30', paidDate: '2025-10-30', current: 11, total: 12 },
        { id: "exp_nov_22", description: "TEATRO (JADY)", amount: 126.09, type: "variable", category: "lazer", paid: true, cyclic: false, dueDate: '2025-11-05', paidDate: '2025-11-05', current: 2, total: 2 },
        { id: "exp_nov_23", description: "PRESENTE JULIANA (JADY)", amount: 34.65, type: "variable", category: "pessoal", paid: true, cyclic: false, dueDate: '2025-11-05', paidDate: '2025-11-05', current: 1, total: 1 },
        { id: "exp_nov_24", description: "PRESENTE NENEM GLEYCI (JADY)", amount: 38.94, type: "variable", category: "pessoal", paid: true, cyclic: false, dueDate: '2025-11-05', paidDate: '2025-11-05', current: 1, total: 2 },
        { id: "exp_nov_25", description: "VESTIDO LONGO AMARELO (MÃE DA MARCELLY)", amount: 33.00, type: "variable", category: "pessoal", paid: true, cyclic: false, dueDate: '2025-11-10', paidDate: '2025-11-10', current: 2, total: 3 },
        { id: "exp_nov_26", description: "BLUSA BRANCA DALUZ (MÃE DA MARCELLY)", amount: 34.50, type: "variable", category: "pessoal", paid: true, cyclic: false, dueDate: '2025-11-10', paidDate: '2025-11-10', current: 2, total: 2 },
        { id: "exp_nov_27", description: "FATURA CARTÃO MARCELLY", amount: 193.37, type: "variable", category: "dividas", paid: true, cyclic: false, dueDate: '2025-11-15', paidDate: '2025-11-15', current: 10, total: 12 },
        { id: "exp_nov_28", description: "CONSERTO DO CARRO COM PEÇAS DE OUTUBRO (MARCIA BRITO)", amount: 361.75, type: "variable", category: "transporte", paid: true, cyclic: false, dueDate: '2025-11-28', paidDate: '2025-11-28', current: 1, total: 4 },
        { id: "exp_nov_29", description: "PEÇAS DO CARRO - CONSERTO DE DEZEMBRO (MARCIA BRITO)", amount: 67.70, type: "variable", category: "transporte", paid: true, cyclic: false, dueDate: '2025-11-28', paidDate: '2025-11-28', current: 10, total: 10 },
        { id: "exp_nov_30", description: "MÃO DE OBRA DO DAVI (MARCIA BRITO)", amount: 108.33, type: "variable", category: "transporte", paid: true, cyclic: false, dueDate: '2025-11-28', paidDate: '2025-11-28', current: 3, total: 3 },
        { id: "exp_nov_31", description: "PEÇA DO CARRO (MARCIA BRITO)", amount: 45.00, type: "variable", category: "transporte", paid: true, cyclic: false, dueDate: '2025-11-28', paidDate: '2025-11-28', current: 3, total: 3 },
        { id: "exp_nov_32", description: "MULTAS (MARCIA BRITO)", amount: 260.00, type: "variable", category: "transporte", paid: true, cyclic: false, dueDate: '2025-11-30', paidDate: '2025-11-30', current: 2, total: 4 },
        { id: "exp_nov_33", description: "EMPRÉSTIMO DA TIA CÉLIA", amount: 400.00, type: "variable", category: "dividas", paid: false, cyclic: false, dueDate: '2025-11-30', paidDate: null, current: 8, total: 10 }
    ],
    shoppingItems: [
        
    ],
    avulsosItems: [
        { id: "avulso_nov_1", description: 'Pedágio ponte', amount: 6.20, paid: true, paidDate: '2025-11-10', category: 'transporte'},
        { id: "avulso_nov_2", description: "McDonald's", amount: 56.90, paid: true, paidDate: '2025-11-10', category: 'alimentacao'},
        { id: "avulso_nov_3", description: 'Padaria', amount: 17.00, paid: true, paidDate: '2025-11-08', category: 'alimentacao'},
        { id: "avulso_nov_4", description: 'Almoço do André com instrutores', amount: 30.00, paid: true, paidDate: '2025-11-08', category: 'alimentacao'},
        { id: "avulso_nov_5", description: 'Pastel da Marcelly', amount: 32.00, paid: true, paidDate: '2025-11-08', category: 'alimentacao'},
        { id: "avulso_nov_6", description: 'Correios', amount: 69.02, paid: true, paidDate: '2025-11-05', category: 'outros'},
        { id: "avulso_nov_7", description: 'Mercado', amount: 76.80, paid: true, paidDate: '2025-11-05', category: 'alimentacao'},
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
    generalIncome: document.getElementById('generalIncome'),
    generalIncomeProgressBar: document.getElementById('generalIncomeProgressBar'),
    generalIncomeSubtitle: document.getElementById('generalIncomeSubtitle'),
    salaryIncome: document.getElementById('salaryIncome'),
    salaryIncomeProgressBar: document.getElementById('salaryIncomeProgressBar'),
    salaryIncomeSubtitle: document.getElementById('salaryIncomeSubtitle'),
    availableIncome: document.getElementById('availableIncome'),
    availableIncomeProgressBar: document.getElementById('availableIncomeProgressBar'),
    availableIncomeSubtitle: document.getElementById('availableIncomeSubtitle'),
    mumbucaIncome: document.getElementById('mumbucaIncome'),
    mumbucaIncomeProgressBar: document.getElementById('mumbucaIncomeProgressBar'),
    mumbucaIncomeSubtitle: document.getElementById('mumbucaIncomeSubtitle'),
    generalExpenses: document.getElementById('generalExpenses'),
    generalExpensesProgressBar: document.getElementById('generalExpensesProgressBar'),
    generalExpensesSubtitle: document.getElementById('generalExpensesSubtitle'),
    debtsAndBills: document.getElementById('debtsAndBills'),
    debtsAndBillsProgressBar: document.getElementById('debtsAndBillsProgressBar'),
    debtsAndBillsSubtitle: document.getElementById('debtsAndBillsSubtitle'),
    avulsosBudget: document.getElementById('avulsosBudget'),
    avulsosBudgetProgressBar: document.getElementById('avulsosBudgetProgressBar'),
    avulsosBudgetSubtitle: document.getElementById('avulsosBudgetSubtitle'),
    fixedVariableExpenses: document.getElementById('fixedVariableExpenses'),
    fixedVariableExpensesProgressBar: document.getElementById('fixedVariableExpensesProgressBar'),
    fixedVariableExpensesSubtitle: document.getElementById('fixedVariableExpensesSubtitle'),
    debtSummaryContainer: document.getElementById('debtSummaryContainer'),

    // Lists and other elements
    incomesList: document.getElementById('incomesList'),
    expensesList: document.getElementById('expensesList'),
    comprasMumbucaList: document.getElementById('comprasMumbucaList'),
    abastecimentoMumbucaList: document.getElementById('abastecimentoMumbucaList'),
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
    dateGroup: document.getElementById('dateGroup'),
    transactionDateLabel: document.getElementById('transactionDateLabel'),
    transactionDateInput: document.getElementById('transactionDate'),
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
    generateSavingsSuggestionBtn: document.getElementById('generateSavingsSuggestionBtn'),
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
    if (!currentUser || !isConfigured) return;
    if (isSyncing) return;

    isSyncing = true;
    syncStatus = 'syncing';
    updateSyncButtonState();

    const monthKey = `${currentYear}-${currentMonth.toString().padStart(2, '0')}`;
    const docRef = doc(db, 'users', currentUser.uid, 'months', monthKey);

    try {
        // Sanitize the data to remove any potential Firestore proxy objects before saving.
        // This prevents circular reference errors if the local state object was mutated.
        const cleanData = JSON.parse(JSON.stringify(currentMonthData));
        await setDoc(docRef, cleanData);
        syncStatus = 'synced';
        updateLastSyncTime(true);
    } catch (error) {
        console.error("Error saving data to Firestore:", error);
        syncStatus = 'error';
        syncErrorDetails = "Não foi possível salvar os dados na nuvem. Verifique sua conexão e o formato dos dados.";
        alert(syncErrorDetails);
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
            // Sanitize Firestore data by creating a deep copy that strips proxy objects.
            // This is crucial to prevent circular reference errors in the app's logic.
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

    // Reset main account balance to 0 for the new month.
    const mainAccount = newMonthData.bankAccounts.find(a => a.name === "Conta Principal");
    if (mainAccount) {
        mainAccount.balance = 0;
    }


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
            // User requested change: Adjust Andre's Intermedica amount from December 2025 onwards.
            if (newExpense.description.toUpperCase().includes("INTERMÉDICA DO ANDRÉ") && (currentYear > 2025 || (currentYear === 2025 && currentMonth >= 12))) {
                newExpense.amount = 135.60;
            }

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
         syncStatusText.textContent = 'Erro de Sincronização';
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
    
    const allSpendings = [...(currentMonthData.expenses || []), ...(currentMonthData.shoppingItems || []), ...(currentMonthData.avulsosItems || [])];
    const comprasMumbucaItems = allSpendings.filter(item => item.category === 'shopping');
    const abastecimentoMumbucaItems = allSpendings.filter(item => item.category === 'abastecimento_mumbuca');
    
    renderFilteredList(elements.comprasMumbucaList, comprasMumbucaItems, createShoppingItem, "Nenhuma compra registrada", ICONS.shopping);
    renderFilteredList(elements.abastecimentoMumbucaList, abastecimentoMumbucaItems, createShoppingItem, "Nenhum abastecimento registrado", SPENDING_CATEGORIES.abastecimento_mumbuca.icon);

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

    // Robustly calculate total investment amount by summing all expenses in that category
    const totalTravelInvestmentAmount = (currentMonthData.expenses || [])
        .filter(e => e.category === 'investimento')
        .reduce((sum, expense) => sum + expense.amount, 0);

    const paidTravelInvestmentAmount = (currentMonthData.expenses || [])
        .filter(e => e.category === 'investimento' && e.paid)
        .reduce((sum, expense) => sum + expense.amount, 0);

    // Card 2: General Income (All sources)
    const totalGeneralIncomeAmount = allIncomes.reduce((sum, item) => sum + item.amount, 0);
    const paidGeneralIncome = allIncomes.filter(item => item.paid).reduce((sum, item) => sum + item.amount, 0);
    const generalIncomeProgress = totalGeneralIncomeAmount > 0 ? (paidGeneralIncome / totalGeneralIncomeAmount) * 100 : 0;
    const remainingGeneralIncome = totalGeneralIncomeAmount - paidGeneralIncome;
    
    elements.generalIncome.textContent = formatCurrency(totalGeneralIncomeAmount);
    elements.generalIncomeProgressBar.style.width = `${Math.min(generalIncomeProgress, 100)}%`;
    elements.generalIncomeSubtitle.textContent = `${formatCurrency(paidGeneralIncome)} recebidos / ${formatCurrency(remainingGeneralIncome)} a receber`;

    // Card 3: Salary Income
    const salaryIncomes = allIncomes.filter(i => i.description.toUpperCase().includes('SALARIO'));
    const totalSalaryIncome = salaryIncomes.reduce((sum, item) => sum + item.amount, 0);
    const paidSalaryIncome = salaryIncomes.filter(item => item.paid).reduce((sum, item) => sum + item.amount, 0);
    const salaryIncomeProgress = totalSalaryIncome > 0 ? (paidSalaryIncome / totalSalaryIncome) * 100 : 0;
    const remainingSalaryIncome = totalSalaryIncome - paidSalaryIncome;

    elements.salaryIncome.textContent = formatCurrency(totalSalaryIncome);
    elements.salaryIncomeProgressBar.style.width = `${Math.min(salaryIncomeProgress, 100)}%`;
    elements.salaryIncomeSubtitle.textContent = `${formatCurrency(paidSalaryIncome)} recebidos / ${formatCurrency(remainingSalaryIncome)} a receber`;

    // New Card: Available Income (after investment)
    // User clarification: Available Income = (Salaries + Other Incomes EXCEPT Mumbuca) - (Travel Investment)
    const nonMumbucaIncomes = allIncomes.filter(i => !i.description.toUpperCase().includes('MUMBUCA'));
    const totalNonMumbucaIncome = nonMumbucaIncomes.reduce((sum, item) => sum + item.amount, 0);
    const paidNonMumbucaIncome = nonMumbucaIncomes.filter(item => item.paid).reduce((sum, item) => sum + item.amount, 0);
    
    const totalAvailableIncome = totalNonMumbucaIncome - totalTravelInvestmentAmount;
    const receivedAvailableIncome = paidNonMumbucaIncome - paidTravelInvestmentAmount; 
    const remainingAvailableToReceive = totalAvailableIncome - receivedAvailableIncome;
    const availableIncomeProgress = totalAvailableIncome > 0 ? (receivedAvailableIncome / totalAvailableIncome) * 100 : 0;
    
    elements.availableIncome.textContent = formatCurrency(totalAvailableIncome);
    elements.availableIncomeProgressBar.style.width = `${Math.min(availableIncomeProgress, 100)}%`;
    elements.availableIncomeSubtitle.textContent = `${formatCurrency(receivedAvailableIncome)} disponíveis / ${formatCurrency(remainingAvailableToReceive)} a receber`;


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
    const paidGeneralExpensesAmount = allGeneralExpenses.filter(item => item.paid).reduce((sum, item) => sum + item.amount, 0);
    const totalGeneralExpensesAmount = allGeneralExpenses.reduce((sum, item) => sum + item.amount, 0);
    const generalExpensesProgress = totalGeneralExpensesAmount > 0 ? (paidGeneralExpensesAmount / totalGeneralExpensesAmount) * 100 : 0;
    const remainingGeneralExpenses = totalGeneralExpensesAmount - paidGeneralExpensesAmount;
    
    elements.generalExpenses.textContent = formatCurrency(totalGeneralExpensesAmount);
    elements.generalExpensesProgressBar.style.width = `${Math.min(generalExpensesProgress, 100)}%`;
    elements.generalExpensesSubtitle.textContent = `${formatCurrency(paidGeneralExpensesAmount)} pagos / ${formatCurrency(remainingGeneralExpenses)} a pagar`;

    // New Card: Debts & Bills (General Expenses without investment)
    const totalDebtsAndBills = totalGeneralExpensesAmount - totalTravelInvestmentAmount;
    const paidDebtsAndBills = paidGeneralExpensesAmount - paidTravelInvestmentAmount;
    const debtsAndBillsProgress = totalDebtsAndBills > 0 ? (paidDebtsAndBills / totalDebtsAndBills) * 100 : 0;
    const remainingDebtsAndBills = totalDebtsAndBills - paidDebtsAndBills;

    elements.debtsAndBills.textContent = formatCurrency(totalDebtsAndBills);
    elements.debtsAndBillsProgressBar.style.width = `${Math.min(debtsAndBillsProgress, 100)}%`;
    elements.debtsAndBillsSubtitle.textContent = `${formatCurrency(paidDebtsAndBills)} pagos / ${formatCurrency(remainingDebtsAndBills)} a pagar`;

    // Card 6: Avulsos Budget / Estimativa de Saldo
    const spentOnAvulsos = (currentMonthData.avulsosItems || [])
        .filter(item => item.paid)
        .reduce((sum, item) => sum + item.amount, 0);
    const totalPlannedExpenses = (currentMonthData.expenses || []).reduce((sum, item) => sum + item.amount, 0);
    const avulsosBudgetAmount = totalSalaryIncome - totalPlannedExpenses;
    const avulsosBudgetProgress = avulsosBudgetAmount > 0 ? (spentOnAvulsos / avulsosBudgetAmount) * 100 : (spentOnAvulsos > 0 ? 100 : 0);
    const remainingAvulsosBudget = avulsosBudgetAmount - spentOnAvulsos;

    elements.avulsosBudget.textContent = formatCurrency(avulsosBudgetAmount);
    elements.avulsosBudgetProgressBar.style.width = `${Math.min(avulsosBudgetProgress, 100)}%`;
    elements.avulsosBudgetSubtitle.textContent = `${formatCurrency(spentOnAvulsos)} gastos / ${formatCurrency(remainingAvulsosBudget)} disponíveis`;
    if (avulsosBudgetAmount < 0 || remainingAvulsosBudget < 0) {
        elements.avulsosBudget.classList.add('balance-negative');
        elements.avulsosBudget.classList.remove('balance-positive');
    } else {
        elements.avulsosBudget.classList.add('balance-positive');
        elements.avulsosBudget.classList.remove('balance-negative');
    }

    // Card 7: Fixed & Variable Expenses
    const paidFixedVariableExpenses = fixedVariableExpenses.filter(item => item.paid).reduce((sum, item) => sum + item.amount, 0);
    const totalFixedVariableExpenses = fixedVariableExpenses.reduce((sum, item) => sum + item.amount, 0);
    const fixedVariableExpensesProgress = totalFixedVariableExpenses > 0 ? (paidFixedVariableExpenses / totalFixedVariableExpenses) * 100 : 0;
    const remainingFixedVariableExpenses = totalFixedVariableExpenses - paidFixedVariableExpenses;
    
    elements.fixedVariableExpenses.textContent = formatCurrency(totalFixedVariableExpenses);
    elements.fixedVariableExpensesProgressBar.style.width = `${Math.min(fixedVariableExpensesProgress, 100)}%`;
    elements.fixedVariableExpensesSubtitle.textContent = `${formatCurrency(paidFixedVariableExpenses)} pagos / ${formatCurrency(remainingFixedVariableExpenses)} a pagar`;

    // Marcia Brito Debt Summary
    const marciaBritoDebt = allGeneralExpenses
        .filter(expense => expense.description.toUpperCase().includes('MARCIA BRITO'))
        .reduce((sum, expense) => sum + expense.amount, 0);
    
    if (elements.debtSummaryContainer) {
        if (marciaBritoDebt > 0) {
            elements.debtSummaryContainer.innerHTML = `
                <div class="debt-summary">
                    <div class="debt-summary-header">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                        <span>Total a pagar para</span>
                    </div>
                    <div class="debt-summary-title">Marcia Brito</div>
                    <div class="debt-summary-amount">${formatCurrency(marciaBritoDebt)}</div>
                </div>
            `;
        } else {
            elements.debtSummaryContainer.innerHTML = '';
        }
    }
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

function renderFilteredList(listElement, items, itemCreator, emptyMessage, emptyIcon) {
    listElement.innerHTML = '';

    if (items.length === 0) {
        listElement.innerHTML = `<div class="empty-state">${emptyIcon}<div>${emptyMessage}</div></div>`;
        return;
    }
    
    items.sort((a, b) => {
        const activityTimestampA = a.paidDate ? new Date(a.paidDate).getTime() : (parseInt(a.id.split('_').pop(), 10) || 0);
        const activityTimestampB = b.paidDate ? new Date(b.paidDate).getTime() : (parseInt(b.id.split('_').pop(), 10) || 0);
        return activityTimestampB - activityTimestampA;
    }).forEach(item => listElement.appendChild(itemCreator(item)));
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
    const isOverdue = expense.dueDate && !expense.paid && new Date(expense.dueDate) < new Date();
    
    let dateInfo = '';
    if (expense.paid && expense.paidDate) {
        dateInfo = `<span class="item-paid-date">${ICONS.check} Pago em ${formatDate(expense.paidDate)}</span>`;
    } else if (expense.dueDate) {
        dateInfo = `<span class="item-due-date ${isOverdue ? 'overdue' : ''}">${ICONS.calendar} Vence em ${formatDate(expense.dueDate)}</span>`;
    }

    const isInvestment = expense.category === 'investimento';
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
                    <span class="item-amount expense-amount">${formatCurrency(expense.amount)}</span>
                </div>
            </div>
            <div class="item-secondary-info">
                 <div class="item-meta">
                    <span class="item-type">${SPENDING_CATEGORIES[expense.category]?.icon || ''} ${SPENDING_CATEGORIES[expense.category]?.name || expense.category}</span>
                    ${expense.total > 1 ? `<span class="item-installments">${expense.current}/${expense.total}</span>` : ''}
                    ${dateInfo}
                 </div>
                 <div class="item-actions">
                    <button class="action-btn edit-btn" title="Editar">${ICONS.edit}</button>
                    <button class="action-btn delete-btn" title="Excluir">${ICONS.delete}</button>
                 </div>
            </div>
        </div>
    `;
    item.querySelector('.check-btn').onclick = (e) => { e.stopPropagation(); togglePaid(expense.id, type); };
    item.querySelector('.delete-btn').onclick = (e) => { e.stopPropagation(); deleteItem(expense.id, type); };
    item.querySelector('.edit-btn').onclick = (e) => { e.stopPropagation(); openEditModal(expense.id, type); };
    return item;
}

function createShoppingItem(item) {
    const listItem = document.createElement('div');
    listItem.className = 'item';
    listItem.onclick = () => openEditModal(item.id);
    
    const checkTitle = item.paid ? 'Marcar como pendente' : 'Marcar como pago';

    const categoryInfo = SPENDING_CATEGORIES[item.category];
    const categoryHtml = categoryInfo ? `<span class="item-type">${categoryInfo.icon} ${categoryInfo.name}</span>` : '';
    
    let dateHtml = '';
    if (item.paid && item.paidDate) {
        dateHtml = `<span class="item-paid-date">${ICONS.calendar} Pago em ${formatDate(item.paidDate)}</span>`;
    } else if (item.date) {
        dateHtml = `<span class="item-due-date">${ICONS.calendar} Em ${formatDate(item.date)}</span>`;
    }

    listItem.innerHTML = `
        <button class="check-btn ${item.paid ? 'paid' : ''}" title="${checkTitle}">${ICONS.check}</button>
        <div class="item-info-wrapper" style="gap: 0.25rem;">
            <div class="item-primary-info">
                <div class="item-description ${item.paid ? 'paid' : ''}">${item.description}</div>
                <div class="item-actions">
                    <span class="item-amount expense-amount">${formatCurrency(item.amount)}</span>
                    <button class="action-btn edit-btn" title="Editar">${ICONS.edit}</button>
                    <button class="action-btn delete-btn" title="Excluir">${ICONS.delete}</button>
                </div>
            </div>
            <div class="item-secondary-info">
                <div class="item-meta">
                    ${categoryHtml}
                    ${dateHtml}
                </div>
            </div>
        </div>
    `;

    listItem.querySelector('.check-btn').onclick = (e) => { e.stopPropagation(); togglePaid(item.id); };
    listItem.querySelector('.delete-btn').onclick = (e) => { e.stopPropagation(); deleteItem(item.id); };
    listItem.querySelector('.edit-btn').onclick = (e) => { e.stopPropagation(); openEditModal(item.id); };
    return listItem;
}

function renderGoalsPage() {
    renderSpendingGoals();
    renderSavingsGoals();
}

function renderSpendingGoals() {
    const listElement = elements.goalsList;
    if (!listElement) return;
    listElement.innerHTML = '';
    const goals = currentMonthData.goals || [];
    const allExpenses = [...(currentMonthData.expenses || []), ...(currentMonthData.shoppingItems || []), ...(currentMonthData.avulsosItems || [])];

    if (goals.length === 0) {
        listElement.innerHTML = `<div class="empty-state-small">${ICONS.goal}<div>Defina metas de gastos por categoria para acompanhar seu orçamento.</div><button class="btn btn-secondary" id="addFirstGoalBtn">${ICONS.add} Adicionar Meta</button></div>`;
        document.getElementById('addFirstGoalBtn').onclick = () => openGoalModal();
        return;
    }

    goals.forEach(goal => {
        const categoryInfo = SPENDING_CATEGORIES[goal.category];
        if (!categoryInfo) return;

        const spent = allExpenses
            .filter(e => e.category === goal.category)
            .reduce((sum, e) => sum + e.amount, 0);
        
        const progress = goal.amount > 0 ? (spent / goal.amount) * 100 : (spent > 0 ? 100 : 0);
        const remaining = goal.amount - spent;
        
        let progressClass = 'safe';
        if (progress > 80 && progress <= 100) progressClass = 'warning';
        else if (progress > 100) progressClass = 'danger';

        let remainingText = `${formatCurrency(remaining)} restantes`;
        let remainingClass = 'safe';
        if (remaining < 0) {
            remainingText = `${formatCurrency(Math.abs(remaining))} acima do limite`;
            remainingClass = 'over';
        }

        const autoInfo = (goal.category === 'shopping' || goal.category === 'investimento' || goal.category === 'abastecimento_mumbuca') ? `<div class="goal-card-auto-info">${ICONS.info} Automática</div>` : '';

        const card = document.createElement('div');
        card.className = 'goal-card';
        card.innerHTML = `
            <div class="goal-card-header">
                <div class="goal-card-title">${categoryInfo.icon} ${categoryInfo.name}</div>
                <div class="goal-card-actions">
                    ${autoInfo}
                    <button class="action-btn edit-goal-btn" title="Editar Meta">${ICONS.edit}</button>
                    <button class="action-btn delete-goal-btn" title="Excluir Meta">${ICONS.delete}</button>
                </div>
            </div>
            <div class="goal-card-body">
                <div class="goal-amounts">
                    <span class="goal-spent-amount">${formatCurrency(spent)}</span>
                    <span class="goal-total-amount">/ ${formatCurrency(goal.amount)}</span>
                </div>
                <div class="goal-progress-bar">
                    <div class="goal-progress-bar-inner ${progressClass}" style="width: ${Math.min(progress, 100)}%;"></div>
                </div>
                <div class="goal-remaining ${remainingClass}">${remainingText}</div>
            </div>
        `;
        card.querySelector('.edit-goal-btn').onclick = (e) => { e.stopPropagation(); openGoalModal(goal.id); };
        card.querySelector('.delete-goal-btn').onclick = (e) => { e.stopPropagation(); deleteGoal(goal.id); };
        listElement.appendChild(card);
    });
}

function renderSavingsGoals() {
    const listElement = elements.savingsGoalsList;
    if (!listElement) return;
    listElement.innerHTML = '';
    const goals = currentMonthData.savingsGoals || [];
    
    if (goals.length === 0) {
        listElement.innerHTML = `<div class="empty-state-small">${ICONS.savings}<div>Crie metas de poupança para seus grandes objetivos.</div><button class="btn btn-secondary" id="addFirstSavingsGoalBtn">${ICONS.add} Criar Meta de Poupança</button></div>`;
        document.getElementById('addFirstSavingsGoalBtn').onclick = () => openSavingsGoalModal();
        return;
    }

    goals.forEach(goal => {
        const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
        const remaining = goal.targetAmount - goal.currentAmount;

        const card = document.createElement('div');
        card.className = 'goal-card'; // Reusing goal card styles
        card.innerHTML = `
            <div class="goal-card-header">
                <div class="goal-card-title">${ICONS.savings} ${goal.description}</div>
                <div class="goal-card-actions">
                    <button class="action-btn edit-s-goal-btn" title="Editar Meta">${ICONS.edit}</button>
                </div>
            </div>
            <div class="goal-card-body">
                <div class="goal-amounts">
                    <span class="goal-spent-amount">${formatCurrency(goal.currentAmount)}</span>
                    <span class="goal-total-amount">/ ${formatCurrency(goal.targetAmount)}</span>
                </div>
                <div class="goal-progress-bar">
                    <div class="goal-progress-bar-inner safe" style="width: ${Math.min(progress, 100)}%;"></div>
                </div>
                <div class="goal-remaining safe">${formatCurrency(remaining)} para completar</div>
            </div>
        `;
        card.querySelector('.edit-s-goal-btn').onclick = (e) => { e.stopPropagation(); openSavingsGoalModal(goal.id); };
        listElement.appendChild(card);
    });
}

function renderBankAccounts() {
    const listElement = elements.bankAccountsList;
    if (!listElement) return;
    listElement.innerHTML = '';
    const accounts = currentMonthData.bankAccounts || [];

    accounts.forEach(account => {
        const isReadOnly = account.name === "Poupança Viagem";
        const item = document.createElement('div');
        item.className = `account-item ${isReadOnly ? 'read-only' : ''}`;

        let actionsHtml = `<button class="action-btn edit-account-btn" title="Editar">${ICONS.edit}</button>`;
        if (isReadOnly) {
            actionsHtml = `<div class="account-actions"><div class="goal-card-auto-info">${ICONS.info} Automática</div></div>`;
        }

        item.innerHTML = `
            <span class="account-name">${account.name}</span>
            <div class="d-flex align-items-center">
                <span class="account-balance">${formatCurrency(account.balance)}</span>
                ${actionsHtml}
            </div>
        `;
        
        if (!isReadOnly) {
            item.onclick = () => openAccountModal(account.id);
            item.querySelector('.edit-account-btn').onclick = (e) => {
                e.stopPropagation();
                openAccountModal(account.id);
            };
        }

        listElement.appendChild(item);
    });

    const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
    document.getElementById('accountsTotalValue').textContent = formatCurrency(totalBalance);
}

function renderOverviewChart() {
    const container = elements.overviewChart;
    if (!container) return;
    container.innerHTML = '';
    
    const allExpenses = [...(currentMonthData.expenses || []), ...(currentMonthData.shoppingItems || []), ...(currentMonthData.avulsosItems || [])];
    const totalSpent = allExpenses.filter(e => e.paid).reduce((sum, e) => sum + e.amount, 0);

    if (totalSpent === 0) {
        container.innerHTML = `<div class="empty-state-small">${ICONS.info} Sem dados de despesas pagas para exibir o gráfico.</div>`;
        return;
    }

    const spendingByCategory = allExpenses
        .filter(e => e.paid)
        .reduce((acc, expense) => {
            const category = expense.category || 'outros';
            acc[category] = (acc[category] || 0) + expense.amount;
            return acc;
        }, {});

    const sortedCategories = Object.entries(spendingByCategory)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);

    const otherAmount = Object.entries(spendingByCategory)
        .sort(([, a], [, b]) => b - a)
        .slice(5)
        .reduce((sum, [, amount]) => sum + amount, 0);

    if (otherAmount > 0) {
        sortedCategories.push(['outros', otherAmount]);
    }
    
    let chartHtml = '<div class="pie-chart-legend">';
    sortedCategories.forEach(([categoryKey, amount]) => {
        const categoryInfo = SPENDING_CATEGORIES[categoryKey] || SPENDING_CATEGORIES.outros;
        const percentage = (amount / totalSpent * 100).toFixed(1);
        chartHtml += `
            <div class="legend-item">
                <div class="legend-label">
                   ${categoryInfo.icon} <span>${categoryInfo.name}</span>
                </div>
                <div class="legend-value">
                    ${formatCurrency(amount)} <span class="legend-percentage">(${percentage}%)</span>
                </div>
            </div>
        `;
    });
    chartHtml += '</div>';
    container.innerHTML = chartHtml;
}

function renderMonthlyAnalysis() {
    const section = elements.monthlyAnalysisSection;
    if (section) {
         section.style.display = 'block';
    }
}

function openModal(modal) {
    modal.classList.add('active');
    elements.appContainer.style.overflow = 'hidden';
}

function closeModal() {
    const activeModals = document.querySelectorAll('.modal.active');
    activeModals.forEach(modal => {
        modal.classList.remove('active');
    });
    elements.appContainer.style.overflow = '';
}

function openAddModal(type) {
    currentModalType = type;
    elements.addForm.reset();
    elements.addModalTitle.textContent = `Adicionar ${type === 'incomes' ? 'Entrada' : 'Despesa'}`;
    
    const isExpense = ['expenses', 'shoppingItems', 'avulsosItems'].includes(type);
    elements.typeGroup.style.display = type === 'expenses' ? 'block' : 'none';
    elements.categoryGroup.style.display = isExpense ? 'block' : 'none';
    elements.installmentsGroup.style.display = type === 'expenses' ? 'flex' : 'none';

    const dateGroup = elements.dateGroup;
    const dateLabel = elements.transactionDateLabel;
    const dateInput = elements.transactionDateInput;
    
    // Default to today
    dateInput.value = new Date().toISOString().split('T')[0];
    dateInput.required = false; // default
    dateGroup.style.display = 'none'; // default

    if (type === 'incomes') {
        dateGroup.style.display = 'block';
        dateLabel.textContent = 'Data do Recebimento';
        dateInput.required = true;
    } else if (type === 'expenses') {
        dateGroup.style.display = 'block';
        dateLabel.textContent = 'Data de Vencimento';
        // dueDate is not always required
    } else if (['shoppingItems', 'avulsosItems'].includes(type)) {
        dateGroup.style.display = 'block';
        dateLabel.textContent = 'Data da Compra';
        dateInput.required = true;
    }

    openModal(elements.addModal);
}

function openAddCategorizedModal(type, category) {
    currentModalType = type;
    elements.addForm.reset();
    elements.addModalTitle.textContent = `Adicionar ${SPENDING_CATEGORIES[category].name}`;

    // Hide fields that don't apply
    elements.typeGroup.style.display = 'none';
    elements.installmentsGroup.style.display = 'none';
    elements.categoryGroup.style.display = 'block';

    elements.dateGroup.style.display = 'block';
    elements.transactionDateLabel.textContent = 'Data da Compra';
    elements.transactionDateInput.value = new Date().toISOString().split('T')[0];
    elements.transactionDateInput.required = true;

    // Set and then hide the category
    document.getElementById('category').value = category;
    elements.categoryGroup.style.display = 'none';

    openModal(elements.addModal);
}

function handleAddFormSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const transactionDate = formData.get('transactionDate');
    const newItem = {
        id: `${currentModalType.slice(0, -1)}_${Date.now()}`,
        description: formData.get('description'),
        amount: parseCurrency(formData.get('amount')),
        paid: false // default
    };

    if (currentModalType === 'incomes') {
        newItem.paid = true;
        newItem.paidDate = transactionDate;
    } else if (currentModalType === 'expenses') {
        newItem.type = formData.get('type');
        newItem.category = formData.get('category');
        newItem.dueDate = transactionDate;
        newItem.cyclic = formData.has('cyclic');
        const totalInstallments = parseInt(formData.get('totalInstallments'), 10) || 1;
        if (totalInstallments > 1) {
            newItem.current = parseInt(formData.get('currentInstallment'), 10) || 1;
            newItem.total = totalInstallments;
        } else {
            newItem.current = 1;
            newItem.total = 1;
        }
    } else if (['shoppingItems', 'avulsosItems'].includes(currentModalType)) {
        newItem.category = formData.get('category');
        const isMumbuca = ['shopping', 'abastecimento_mumbuca'].includes(newItem.category);
        
        if(isMumbuca) {
            // Mumbuca purchases are considered paid immediately.
            newItem.paid = true;
            newItem.paidDate = transactionDate;
        } else {
            // Regular avulsos items are added as 'planned' and can be checked off later.
            newItem.paid = false;
            newItem.paidDate = null;
            newItem.date = transactionDate; // This is the date of the expense, not payment.
        }
    }
    
    if (currentMonthData[currentModalType]) {
        currentMonthData[currentModalType].push(newItem);
    } else {
        currentMonthData[currentModalType] = [newItem];
    }

    saveData();
    closeModal();
}

function findItemById(itemId) {
    const lists = ['incomes', 'expenses', 'shoppingItems', 'avulsosItems'];
    for (const listType of lists) {
        const item = (currentMonthData[listType] || []).find(i => i.id === itemId);
        if (item) {
            return { item, type: listType };
        }
    }
    return { item: null, type: null };
}

function openEditModal(itemId, itemType = null) {
    const { item, type } = itemType ? { item: currentMonthData[itemType]?.find(i => i.id === itemId), type: itemType } : findItemById(itemId);
    if (!item) return;

    elements.editModalTitle.textContent = `Editar ${type === 'incomes' ? 'Entrada' : 'Despesa'}`;
    elements.editForm.reset();
    
    elements.editItemId.value = itemId;
    elements.editItemType.value = type;
    elements.editDescription.value = item.description;
    elements.editAmount.value = item.amount.toFixed(2).replace('.', ',');

    // Reset visibility for all groups
    elements.editCategoryGroup.style.display = 'none';
    elements.editDueDateGroup.style.display = 'none';
    elements.editInstallmentsGroup.style.display = 'none';
    elements.editInstallmentsInfo.style.display = 'none';

    // Configure based on item type
    if (type === 'expenses') {
        elements.editCategoryGroup.style.display = 'block';
        elements.editCategory.value = item.category || '';
        elements.editDueDateGroup.style.display = 'block';
        document.querySelector('#editDueDateGroup label').textContent = 'Vencimento';
        elements.editDueDate.value = item.dueDate || '';
        elements.editInstallmentsGroup.style.display = 'flex';
        if(item.total > 1) {
            elements.editInstallmentsInfo.style.display = 'block';
            elements.editCurrentInstallment.value = item.current;
            elements.editTotalInstallments.value = item.total;
        } else {
            elements.editCurrentInstallment.value = '';
            elements.editTotalInstallments.value = '';
        }
    } else if (['shoppingItems', 'avulsosItems'].includes(type)) {
        elements.editCategoryGroup.style.display = 'block';
        elements.editCategory.value = item.category || '';
        elements.editDueDateGroup.style.display = 'block';
        document.querySelector('#editDueDateGroup label').textContent = 'Data da Compra';
        elements.editDueDate.value = item.date || ''; // Use the generic 'date' property
    }

    elements.editPaidDateGroup.style.display = item.paid ? 'block' : 'none';
    if (item.paid) {
        elements.editPaidDate.value = item.paidDate || '';
    }
    
    openModal(elements.editModal);
}


function handleEditFormSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const itemId = formData.get('itemId');
    const itemType = formData.get('itemType');
    const itemIndex = currentMonthData[itemType]?.findIndex(i => i.id === itemId);
    
    if (itemIndex === -1) return;

    const updatedItem = {
        ...currentMonthData[itemType][itemIndex],
        description: formData.get('description'),
        amount: parseCurrency(formData.get('amount')),
    };

    if (itemType === 'expenses') {
        updatedItem.category = formData.get('category');
        updatedItem.dueDate = formData.get('dueDate');
        const total = parseInt(formData.get('totalInstallments'), 10) || 1;
        updatedItem.total = total;
        updatedItem.current = total > 1 ? (parseInt(formData.get('currentInstallment'), 10) || 1) : 1;
    } else if (['shoppingItems', 'avulsosItems'].includes(itemType)) {
        updatedItem.category = formData.get('category');
        updatedItem.date = formData.get('dueDate'); // The input name is 'dueDate'
    }

    if (updatedItem.paid) {
        updatedItem.paidDate = formData.get('paidDate') || updatedItem.paidDate;
    }
    
    currentMonthData[itemType][itemIndex] = updatedItem;
    saveData();
    closeModal();
}

function deleteItem(itemId, itemType = null) {
    if (confirm('Tem certeza que deseja excluir este item?')) {
        const { type } = itemType ? { type: itemType } : findItemById(itemId);
        if (type) {
            currentMonthData[type] = currentMonthData[type].filter(i => i.id !== itemId);
            saveData();
        }
    }
}


function togglePaid(itemId, itemType = null) {
    const { item, type } = itemType ? { item: currentMonthData[itemType]?.find(i => i.id === itemId), type: itemType } : findItemById(itemId);
    if (item) {
        item.paid = !item.paid;
        item.paidDate = item.paid ? new Date().toISOString().split('T')[0] : null;

        const mainAccount = currentMonthData.bankAccounts.find(a => a.name === "Conta Principal");
        if (mainAccount) {
            const amount = item.amount;
            if (type === 'incomes') {
                 mainAccount.balance += item.paid ? amount : -amount;
            } else {
                 mainAccount.balance -= item.paid ? amount : -amount;
            }
        }
        
        saveData();
    }
}

function openGoalModal(goalId = null) {
    elements.goalForm.reset();
    elements.goalId.value = '';
    
    if (goalId) {
        const goal = currentMonthData.goals.find(g => g.id === goalId);
        if (goal) {
            elements.goalModalTitle.textContent = 'Editar Meta de Gastos';
            elements.goalId.value = goal.id;
            elements.goalCategory.value = goal.category;
            elements.goalAmount.value = goal.amount.toFixed(2).replace('.', ',');
        }
    } else {
        elements.goalModalTitle.textContent = 'Nova Meta de Gastos';
    }
    
    openModal(elements.goalModal);
}

function handleGoalFormSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const goalId = formData.get('goalId');
    const goalData = {
        category: formData.get('goalCategory'),
        amount: parseCurrency(formData.get('goalAmount')),
    };

    if (goalId) {
        const index = currentMonthData.goals.findIndex(g => g.id === goalId);
        if (index > -1) {
            currentMonthData.goals[index] = { ...currentMonthData.goals[index], ...goalData };
        }
    } else {
        goalData.id = `goal_${Date.now()}`;
        currentMonthData.goals.push(goalData);
    }

    saveData();
    closeModal();
}

function deleteGoal(goalId) {
    if (confirm('Tem certeza que deseja excluir esta meta?')) {
        currentMonthData.goals = currentMonthData.goals.filter(g => g.id !== goalId);
        saveData();
    }
}

function openSavingsGoalModal(goalId = null) {
    elements.savingsGoalForm.reset();
    elements.savingsGoalId.value = '';
    
    if (goalId) {
        const goal = currentMonthData.savingsGoals.find(g => g.id === goalId);
        if (goal) {
            elements.savingsGoalModalTitle.textContent = 'Editar Meta de Poupança';
            elements.savingsGoalId.value = goal.id;
            elements.savingsGoalDescription.value = goal.description;
            elements.savingsGoalCurrent.value = goal.currentAmount.toFixed(2).replace('.', ',');
            elements.savingsGoalTarget.value = goal.targetAmount.toFixed(2).replace('.', ',');
        }
    } else {
        elements.savingsGoalModalTitle.textContent = 'Nova Meta de Poupança';
    }
    
    openModal(elements.savingsGoalModal);
}

function handleSavingsGoalSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const goalId = formData.get('savingsGoalId');
    const goalData = {
        description: formData.get('savingsGoalDescription'),
        currentAmount: parseCurrency(formData.get('savingsGoalCurrent')),
        targetAmount: parseCurrency(formData.get('savingsGoalTarget')),
    };

    if (goalId) {
        const index = currentMonthData.savingsGoals.findIndex(g => g.id === goalId);
        if (index > -1) {
            currentMonthData.savingsGoals[index] = { ...currentMonthData.savingsGoals[index], ...goalData };
        }
    } else {
        goalData.id = `sg_${Date.now()}`;
        currentMonthData.savingsGoals.push(goalData);
    }

    saveData();
    closeModal();
}

function openAccountModal(accountId = null) {
    elements.accountForm.reset();
    elements.accountId.value = '';

    if (accountId) {
        const account = currentMonthData.bankAccounts.find(a => a.id === accountId);
        if(account) {
            elements.accountModalTitle.textContent = 'Editar Conta';
            elements.accountId.value = account.id;
            elements.accountName.value = account.name;
            elements.accountBalance.value = account.balance.toFixed(2).replace('.', ',');
        }
    } else {
        elements.accountModalTitle.textContent = 'Nova Conta Bancária';
    }

    openModal(elements.accountModal);
}

function handleAccountSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const accountId = formData.get('accountId');
    const accountData = {
        name: formData.get('accountName'),
        balance: parseCurrency(formData.get('accountBalance')),
    };

    if (accountId) {
        const index = currentMonthData.bankAccounts.findIndex(a => a.id === accountId);
        if (index > -1) {
            currentMonthData.bankAccounts[index] = { ...currentMonthData.bankAccounts[index], ...accountData };
        }
    } else {
        accountData.id = `acc_${Date.now()}`;
        currentMonthData.bankAccounts.push(accountData);
    }
    
    saveData();
    closeModal();
}

function initAI() {
    if (process.env.API_KEY) {
        try {
            ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        } catch (error) {
            console.error("Error initializing GoogleGenAI:", error);
            alert("Não foi possível inicializar a IA da Gemini. Verifique se sua API Key é válida.");
        }
    } else {
        console.warn("API_KEY for Gemini not found. AI features will be disabled.");
    }
}

async function openAiModal() {
    if (!ai) {
        alert("A IA da Gemini não está configurada. Verifique sua API Key.");
        return;
    }

    elements.aiAnalysis.innerHTML = '';
    const initialPrompt = "Faça uma análise financeira detalhada para este mês e me dê dicas para economizar. Responda em português brasileiro.";
    addMessageToChat('user', initialPrompt);
    openModal(elements.aiModal);
    
    await generateAiResponse(initialPrompt, true);
}


function addMessageToChat(role, text, isLoading = false) {
    const messageElement = document.createElement('div');
    messageElement.className = `chat-message ${role}-message`;
    
    let content = simpleMarkdownToHtml(text);
    if (isLoading) {
        content = `<div class="loading-dots"><span></span><span></span><span></span></div>`;
        messageElement.id = 'loading-bubble';
    }
    
    messageElement.innerHTML = `<div class="message-bubble">${content}</div>`;
    elements.aiAnalysis.appendChild(messageElement);
    elements.aiAnalysis.scrollTop = elements.aiAnalysis.scrollHeight;
}

async function generateAiResponse(prompt, isInitial = false) {
    const loadingBubble = document.getElementById('loading-bubble');
    if (!loadingBubble && !isInitial) {
        addMessageToChat('ai', '', true);
    }

    try {
        if (!chat) {
            chat = ai.chats.create({
                model: 'gemini-2.5-flash',
                systemInstruction: `Você é um assistente financeiro amigável e especialista em finanças pessoais para um casal brasileiro. Analise os dados financeiros fornecidos em formato JSON e ofereça insights, dicas de economia e projeções. Use sempre o formato de moeda R$ (Real Brasileiro). Seja conciso e direto. Sempre responda em português do Brasil.`
            });
        }
        
        // Sanitize the data to remove any potential Firestore proxy objects before stringifying for the AI.
        const cleanDataForAI = JSON.parse(JSON.stringify(currentMonthData));
        const fullPrompt = `
            Aqui estão os dados financeiros do mês atual em JSON:
            ${JSON.stringify(cleanDataForAI, null, 2)}

            Minha pergunta é: ${prompt}
        `;

        const response = await chat.sendMessage({ message: fullPrompt });
        const text = response.text;
        
        const existingLoadingBubble = document.getElementById('loading-bubble');
        if(existingLoadingBubble) {
             existingLoadingBubble.remove();
        }

        addMessageToChat('ai', text);

    } catch (error) {
        console.error("Error with Gemini API:", error);
        const existingLoadingBubble = document.getElementById('loading-bubble');
        if(existingLoadingBubble) {
             existingLoadingBubble.remove();
        }
        addMessageToChat('ai', "Desculpe, ocorreu um erro ao conectar com a IA. Tente novamente mais tarde.");
    }
}


async function handleAiChatSubmit(e) {
    e.preventDefault();
    const prompt = elements.aiChatInput.value.trim();
    if (!prompt) return;

    addMessageToChat('user', prompt);
    elements.aiChatInput.value = '';
    await generateAiResponse(prompt);
}

function setupPWAInstall() {
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        const banner = document.getElementById('pwa-install-banner');
        if (banner) {
            banner.classList.add('visible');
        }
    });

    const installBtn = document.getElementById('pwa-install-btn');
    if (installBtn) {
        installBtn.addEventListener('click', async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                console.log(`User response to the install prompt: ${outcome}`);
                deferredPrompt = null;
                const banner = document.getElementById('pwa-install-banner');
                if (banner) {
                    banner.classList.remove('visible');
                }
            }
        });
    }
    
    const closeBtn = document.getElementById('pwa-close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
             const banner = document.getElementById('pwa-install-banner');
             if (banner) banner.classList.remove('visible');
        });
    }
}

// =================================================================================
// INITIALIZATION
// =================================================================================
function init() {
    // Event listeners
    document.querySelector('.prev-month').addEventListener('click', () => changeMonth(-1));
    document.querySelector('.next-month').addEventListener('click', () => changeMonth(1));
    
    elements.tabButtons.forEach(btn => {
        btn.addEventListener('click', () => navigateTo(btn.dataset.view));
    });
    
    elements.segmentedBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            elements.segmentedBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            document.querySelectorAll('.list-view').forEach(list => {
                list.style.display = list.id === `list-${btn.dataset.list}` ? 'block' : 'none';
            });
        });
    });

    document.getElementById('add-income-btn')?.addEventListener('click', () => openAddModal('incomes'));
    document.getElementById('add-expense-btn')?.addEventListener('click', () => openAddModal('expenses'));
    document.getElementById('add-compras-mumbuca-btn')?.addEventListener('click', () => openAddCategorizedModal('avulsosItems', 'shopping'));
    document.getElementById('add-abastecimento-mumbuca-btn')?.addEventListener('click', () => openAddCategorizedModal('avulsosItems', 'abastecimento_mumbuca'));
    document.getElementById('add-avulso-btn')?.addEventListener('click', () => openAddModal('avulsosItems'));
    document.getElementById('add-goal-btn')?.addEventListener('click', () => openGoalModal());
    document.getElementById('add-account-btn')?.addEventListener('click', () => openAccountModal());
    document.getElementById('add-savings-goal-btn')?.addEventListener('click', () => openSavingsGoalModal());
    
    document.querySelectorAll('.close-modal-btn').forEach(btn => {
        btn.addEventListener('click', closeModal);
    });

    document.getElementById('open-ai-btn').addEventListener('click', openAiModal);
    
    elements.addForm.addEventListener('submit', handleAddFormSubmit);
    elements.editForm.addEventListener('submit', handleEditFormSubmit);
    elements.aiChatForm.addEventListener('submit', handleAiChatSubmit);
    elements.goalForm.addEventListener('submit', handleGoalFormSubmit);
    elements.accountForm.addEventListener('submit', handleAccountSubmit);
    elements.savingsGoalForm.addEventListener('submit', handleSavingsGoalSubmit);

    document.getElementById('deleteItemBtn')?.addEventListener('click', () => {
        const itemId = elements.editItemId.value;
        const itemType = elements.editItemType.value;
        closeModal();
        deleteItem(itemId, itemType);
    });

    elements.syncBtn.addEventListener('click', () => {
        if (!isSyncing && isConfigured) {
            saveDataToFirestore();
        }
    });
    
    populateCategorySelects();
    initAI();
    setupPWAInstall();

    // Firebase Authentication
    if (isConfigured) {
        onAuthStateChanged(auth, user => {
            if (user) {
                // User is signed in.
                currentUser = user;
                console.log(`[Auth] User signed in: ${user.uid}`);
                syncStatus = 'syncing';
                updateSyncButtonState();
                loadDataForCurrentMonth();
            } else {
                // User is signed out.
                currentUser = null;
                console.log("[Auth] User signed out, signing in anonymously...");
                signInAnonymously(auth).catch(error => {
                    console.error("Anonymous sign-in failed:", error);
                    syncStatus = 'error';
                    syncErrorDetails = 'Falha na autenticação. Não é possível sincronizar.';
                    updateSyncButtonState();
                });
            }
            updateProfilePage();
        });
    } else {
        // Firebase not configured, run in local mode.
        console.log("[App] Running in local mode. Data will not be synced.");
        currentUser = { uid: "localUser" }; // Create a dummy user for local operation
        const localDataKey = `financeData_2025_11`;
        const savedData = localStorage.getItem(localDataKey);
        if (savedData) {
            currentMonthData = JSON.parse(savedData);
        } else {
            currentMonthData = JSON.parse(JSON.stringify(initialMonthData)); // Use deep copy
        }
        updateUI();
        updateMonthDisplay();
    }
}

// Kick off the app
document.addEventListener('DOMContentLoaded', init);