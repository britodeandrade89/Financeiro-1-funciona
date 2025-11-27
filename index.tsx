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
    goal: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>`,
    savings: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="12" cy="12" r="4"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line></svg>`,
    investment: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12V8a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v4"></path><path d="M4 12v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6"></path><path d="M12 12h.01"></path></svg>`,
    salary: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>`
};

const SPENDING_CATEGORIES = {
    moradia: { name: 'Moradia', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>` },
    alimentacao: { name: 'Alimentação', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 15h18v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5z"/><path d="M3 15V6a2 2 0 012-2h14a2 2 0 012 2v9"/></svg>`},
    transporte: { name: 'Transporte', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1 .4-1 1v1"></path><path d="M14 9H4.5a2.5 2.5 0 0 0 0 5H14a2.5 2.5 0 0 0 0-5z"></path><path d="M5 15h14"></path><circle cx="7" cy="19" r="2"></circle><circle cx="17" cy="19" r="2"></circle></svg>` },
    abastecimento_mumbuca: { name: 'Abastecimento com Mumbuca', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1 .4-1 1v1"></path><path d="M14 9H4.5a2.5 2.5 0 0 0 0 5H14a2.5 2.5 0 0 0 0-5z"></path><path d="M5 15h14"></path><circle cx="7" cy="19" r="2"></circle><circle cx="17" cy="19" r="2"></circle></svg>` },
    saude: { name: 'Saúde', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>` },
    lazer: { name: 'Lazer', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>` },
    educacao: { name: 'Educação', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10v6M12 2v14M8 16L4 14M16 16l4-2M12 22a4 4 0 0 0 4-4H8a4 4 0 0 0 4 4z"></path></svg>` },
    dividas: { name: 'Dívidas', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>` },
    pessoal: { name: 'Pessoal', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M12 16.5c-3.5 0-6.5 2-6.5 4.5h13c0-2.5-3-4.5-6.5-4.5z"></path><path d="M20.5 12c.3 0 .5.2.5.5v3c0 .3-.2.5-.5.5s-.5-.2-.5-.5v-3c0-.3.2-.5.5-.5z"></path><path d="M3.5 12c.3 0 .5.2.5.5v3c0 .3-.2.5-.5.5s-.5-.2-.5-.5v-3c0-.3.2-.5.5-.5z"></path></svg>` },
    investimento: { name: 'Investimento para Viagem', icon: ICONS.investment },
    shopping: { name: 'Compras com Mumbuca', icon: ICONS.shopping },
    avulsos: { name: 'Avulsos', icon: ICONS.variable },
    outros: { name: 'Outros', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>` },
};

const MONTH_NAMES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

// =================================================================================
// INITIAL DATA
// =================================================================================
const initialMonthData = {
    incomes: [
        { id: "inc_nov_1", description: 'SALARIO MARCELLY', amount: 3349.92, paid: true, paidDate: '2025-11-05' },
        { id: "inc_nov_2", description: 'SALARIO ANDRE', amount: 3349.92, paid: true, paidDate: '2025-11-05' },
        { id: "inc_nov_3", description: 'MUMBUCA MARCELLY', amount: 650.00, paid: true, paidDate: '2025-11-15' },
        { id: "inc_nov_4", description: 'MUMBUCA ANDRE', amount: 650.00, paid: true, paidDate: '2025-11-15' },
        { id: "inc_nov_5", description: 'Dinheiro que o seu Claudio deu', amount: 100.00, paid: true, paidDate: '2025-11-10' },
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
        { id: "exp_nov_13", description: "CIDADANIA PORTUGUESA", amount: 140.00, type: "fixed", category: "outros", paid: true, cyclic: false, dueDate: '2025-11-20', paidDate: '2025-11-20', current: 13, total: 36, sourceAccountId: 'acc_2' },
        { id: "exp_nov_14", description: "EMPRÉSTIMO PARA ACABAR DE PASSAR ABRIL (MARCIA BRITO)", amount: 220.00, type: "fixed", category: "dividas", paid: true, cyclic: false, dueDate: '2025-11-25', paidDate: '2025-11-25', current: 6, total: 6 },
        { id: "exp_nov_15", description: "RENEGOCIAÇÃO DO CARREFOUR (MARCIA BRITO)", amount: 312.50, type: "fixed", category: "dividas", paid: true, cyclic: false, dueDate: '2025-11-28', paidDate: '2025-11-28', current: 1, total: 16, sourceAccountId: 'acc_2' },
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
        { id: "exp_nov_25", description: "VESTIDO LONGO AMARELO (MÃE DA MARCELLY)", amount: 33.00, type: "variable", category: "pessoal", paid: true, cyclic: false, dueDate: '2025-11-10', paidDate: '2025-11-10', current: 2, total: 3, sourceAccountId: 'acc_2' },
        { id: "exp_nov_26", description: "BLUSA BRANCA DALUZ (MÃE DA MARCELLY)", amount: 34.50, type: "variable", category: "pessoal", paid: true, cyclic: false, dueDate: '2025-11-10', paidDate: '2025-11-10', current: 2, total: 2, sourceAccountId: 'acc_2' },
        { id: "exp_nov_27", description: "FATURA CARTÃO MARCELLY", amount: 193.37, type: "variable", category: "dividas", paid: true, cyclic: false, dueDate: '2025-11-15', paidDate: '2025-11-15', current: 10, total: 12, sourceAccountId: 'acc_2' },
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
        { id: "avulso_nov_1", description: 'Pedágio ponte', amount: 6.20, paid: true, paidDate: '2025-11-10', category: 'avulsos'},
        { id: "avulso_nov_2", description: "McDonald's", amount: 56.90, paid: true, paidDate: '2025-11-10', category: 'alimentacao'},
        { id: "avulso_nov_3", description: 'Padaria', amount: 17.00, paid: true, paidDate: '2025-11-08', category: 'alimentacao'},
        { id: "avulso_nov_4", description: 'Almoço do André com instrutores', amount: 30.00, paid: true, paidDate: '2025-11-08', category: 'alimentacao'},
        { id: "avulso_nov_5", description: 'Pastel da Marcelly', amount: 32.00, paid: true, paidDate: '2025-11-08', category: 'alimentacao'},
        { id: "avulso_nov_6", description: 'Correios', amount: 69.02, paid: true, paidDate: '2025-11-05', category: 'outros'},
        { id: "avulso_nov_7", description: 'Mercado', amount: 76.80, paid: true, paidDate: '2025-11-05', category: 'alimentacao'},
        { id: "avulso_nov_8", description: 'Mercado', amount: 36.38, paid: true, paidDate: '2025-11-13', category: 'alimentacao', sourceAccountId: 'acc_2' },
        { id: "avulso_nov_9", description: 'Amendoim', amount: 8.99, paid: true, paidDate: '2025-11-12', category: 'alimentacao', sourceAccountId: 'acc_2' },
        { id: "avulso_nov_10", description: 'Neosaldina', amount: 15.99, paid: true, paidDate: '2025-11-12', category: 'saude', sourceAccountId: 'acc_2' },
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
        { id: "sg_2", description: "Reserva de Emergência", currentAmount: 4000, targetAmount: 5000 },
        { id: "sg_3", description: "Carro Novo", currentAmount: 1000, targetAmount: 10000 },
        { id: "sg_4", description: "Reforma", currentAmount: 600, targetAmount: 1000 }
    ],
    bankAccounts: [
        { id: "acc_1", name: "Conta Principal", balance: 6829.84 },
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
let currentMonth = 11; // November
let currentYear = 2025;
let isBalanceVisible = true;

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
    splashScreen: document.getElementById('splash-screen'),
    appWrapper: document.getElementById('app-wrapper'),
    appHeader: document.getElementById('app-header'),
    
    // Home screen cards
    totalBalance: document.getElementById('totalBalance'),
    availableIncome: document.getElementById('availableIncome'),
    monthlyExpenses: document.getElementById('monthlyExpenses'),
    mumbucaBalance: document.getElementById('mumbucaBalance'),

    // Lists and other elements
    transactionsList: document.getElementById('transactionsList'),
    goalsListContainer: document.getElementById('goalsListContainer'),
    overviewChart: document.getElementById('overviewChart'),
    overviewChartLegend: document.getElementById('overviewChartLegend'),
    mainContent: document.getElementById('main-content'),
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
    sourceAccountGroup: document.getElementById('sourceAccountGroup'),
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
    editSourceAccountGroup: document.getElementById('editSourceAccountGroup'),
    editSourceAccount: document.getElementById('editSourceAccount'),
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
    savingsGoalModalTitle: document.getElementById('savingsGoalModalTitle'),
    savingsGoalForm: document.getElementById('savingsGoalForm'),
    savingsGoalId: document.getElementById('savingsGoalId'),
    savingsGoalDescription: document.getElementById('savingsGoalDescription'),
    savingsGoalCurrent: document.getElementById('savingsGoalCurrent'),
    savingsGoalTarget: document.getElementById('savingsGoalTarget'),
    tabBar: document.getElementById('tab-bar'),
    tabButtons: document.querySelectorAll('.tab-btn'),
    appViews: document.querySelectorAll('.app-view'),
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

function populateAccountSelects() {
    const selects = [
        document.getElementById('sourceAccount'),
        document.getElementById('editSourceAccount'),
    ];
    const accounts = currentMonthData.bankAccounts || [];
    
    selects.forEach(select => {
        if (select) {
            select.innerHTML = ''; // Clear existing options
            accounts.forEach(account => {
                const option = document.createElement('option');
                option.value = account.id;
                option.textContent = account.name;
                select.appendChild(option);
            });
        }
    });
}


// =================================================================================
// DATA HANDLING (FIREBASE ONLY)
// =================================================================================
async function saveDataToFirestore() {
    if (!currentUser || !isConfigured) return;
    if (isSyncing) return;

    isSyncing = true;
    syncStatus = 'syncing';

    const monthKey = `${currentYear}-${currentMonth.toString().padStart(2, '0')}`;
    const docRef = doc(db, 'users', currentUser.uid, 'months', monthKey);

    try {
        const cleanData = JSON.parse(JSON.stringify(currentMonthData));
        await setDoc(docRef, cleanData);
        syncStatus = 'synced';
    } catch (error) {
        console.error("Error saving data to Firestore:", error);
        syncStatus = 'error';
        syncErrorDetails = "Não foi possível salvar os dados na nuvem.";
        alert(syncErrorDetails);
    } finally {
        isSyncing = false;
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
            currentMonthData = JSON.parse(JSON.stringify(docSnap.data()));
        } else {
            // If it's the very first time loading this user, use initial data.
            // Otherwise, create a blank slate for the new month.
            const isFirstLoadEver = !Object.keys(currentMonthData).some(key => Array.isArray(currentMonthData[key]) && currentMonthData[key].length > 0);
            if (isFirstLoadEver && currentYear === 2025 && currentMonth === 11) {
                 currentMonthData = JSON.parse(JSON.stringify(initialMonthData));
            } else {
                 createNewMonthData();
            }
        }
        updateUI();
    }, (error) => {
        console.error("Error listening to Firestore:", error);
        syncStatus = 'error';
        alert("Erro de conexão com o banco de dados. Tentando reconectar...");
    });
}


async function createNewMonthData() {
    if (!currentUser || !isConfigured) return;
    
    // Create a blank slate but preserve goals, accounts, and savings goals
    const preservedData = {
        goals: currentMonthData.goals || [],
        bankAccounts: currentMonthData.bankAccounts || [],
        savingsGoals: currentMonthData.savingsGoals || []
    };

    currentMonthData = {
        incomes: [],
        expenses: [],
        shoppingItems: [],
        avulsosItems: [],
        goals: preservedData.goals,
        bankAccounts: preservedData.bankAccounts,
        savingsGoals: preservedData.savingsGoals,
    };

    saveData();
}


// =================================================================================
// NAVIGATION & UI TOGGLES
// =================================================================================
function navigateTo(viewName) {
    elements.appViews.forEach(view => {
        view.classList.toggle('active', view.id === `view-${viewName}`);
    });

    elements.tabButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === viewName);
    });
    
    updateHeader(viewName);
}

function goToPrevMonth() {
    currentMonth--;
    if (currentMonth < 1) {
        currentMonth = 12;
        currentYear--;
    }
    loadDataForCurrentMonth();
}

function goToNextMonth() {
    currentMonth++;
    if (currentMonth > 12) {
        currentMonth = 1;
        currentYear++;
    }
    loadDataForCurrentMonth();
}

function toggleBalanceVisibility() {
    isBalanceVisible = !isBalanceVisible;
    const btn = document.querySelector('.visibility-btn');
    if (!btn) return;
    
    if (isBalanceVisible) {
        btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
    } else {
        btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;
    }
    updateSummary();
}

function updateHeader(viewName) {
    let title = '';
    switch(viewName) {
        case 'home': title = 'Resumo Mensal'; break;
        case 'extrato': title = 'Extrato'; break;
        case 'metas': title = 'Metas'; break;
        case 'perfil': title = 'Perfil'; break;
    }

    const monthName = MONTH_NAMES[currentMonth - 1];

    const headerContent = `
        <div class="header-content-wrapper">
            <h2 class="header-title">${title}</h2>
            <div class="month-navigator">
                <button id="prev-month-btn" class="month-nav-btn">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                </button>
                <span id="current-month-display">${monthName} ${currentYear}</span>
                <button id="next-month-btn" class="month-nav-btn">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </button>
            </div>
        </div>
    `;
    elements.appHeader.innerHTML = headerContent;
}


// =================================================================================
// UI RENDERING
// =================================================================================
function updateUI() {
    if(!currentUser) return; // Don't render if not logged in
    
    // The active view name might be lost on reload, so we get it from the active button
    const activeViewName = document.querySelector('.tab-btn.active')?.dataset.view || 'home';
    updateHeader(activeViewName); // Update header with correct month name
    
    updateSummary();
    renderTransactions();
    renderGoalsPage();
    renderOverviewChart();
}

function updateSummary() {
    // Shared calculations
    const allIncomes = currentMonthData.incomes || [];
    const allExpenses = [...(currentMonthData.expenses || []), ...(currentMonthData.shoppingItems || []), ...(currentMonthData.avulsosItems || [])];
    const hiddenValue = 'R$ ••••••';

    // Card 1: Main Summary Card
    const totalBalance = (currentMonthData.bankAccounts || []).reduce((sum, acc) => sum + acc.balance, 0);
    elements.totalBalance.textContent = isBalanceVisible ? formatCurrency(totalBalance) : hiddenValue;

    const nonMumbucaIncomes = allIncomes.filter(i => !i.description.toUpperCase().includes('MUMBUCA'));
    const totalNonMumbucaIncome = nonMumbucaIncomes.reduce((sum, item) => sum + item.amount, 0);
    const totalTravelInvestmentAmount = allExpenses
        .filter(e => e.category === 'investimento')
        .reduce((sum, expense) => sum + expense.amount, 0);
    const availableIncome = totalNonMumbucaIncome - totalTravelInvestmentAmount;
    elements.availableIncome.textContent = isBalanceVisible ? formatCurrency(availableIncome) : hiddenValue;

    // Card 2: Monthly Expenses
    const paidExpensesAmount = allExpenses.filter(item => item.paid).reduce((sum, item) => sum + item.amount, 0);
    elements.monthlyExpenses.textContent = isBalanceVisible ? formatCurrency(paidExpensesAmount) : hiddenValue;

    // Card 3: Mumbuca Balance
    const totalMumbucaIncome = allIncomes
        .filter(i => i.description.toUpperCase().includes('MUMBUCA'))
        .reduce((sum, item) => sum + item.amount, 0);
    
    const mumbucaSpending = allExpenses
        .filter(item => item.category === 'shopping' || item.category === 'abastecimento_mumbuca')
        .reduce((sum, item) => sum + item.amount, 0);
    
    const mumbucaBalance = totalMumbucaIncome - mumbucaSpending;
    elements.mumbucaBalance.textContent = isBalanceVisible ? formatCurrency(mumbucaBalance) : hiddenValue;
}

function renderTransactions() {
    const listElement = elements.transactionsList;
    listElement.innerHTML = '';

    const incomes = (currentMonthData.incomes || []).map(i => ({...i, type: 'income'}));
    const expenses = (currentMonthData.expenses || []).map(e => ({...e, type: 'expense'}));
    const shopping = (currentMonthData.shoppingItems || []).map(s => ({...s, type: 'expense'}));
    const avulsos = (currentMonthData.avulsosItems || []).map(a => ({...a, type: 'expense'}));

    const allTransactions = [...incomes, ...expenses, ...shopping, ...avulsos];
    
    allTransactions.sort((a,b) => new Date(b.paidDate || b.dueDate) - new Date(a.paidDate || a.dueDate));

    if (allTransactions.length === 0) {
        listElement.innerHTML = `<div class="empty-state">${ICONS.expense}<div>Nenhuma transação registrada neste mês</div></div>`;
        return;
    }
    
    allTransactions.forEach(item => {
        const li = document.createElement('div');
        li.className = 'transaction-item';

        const isIncome = item.type === 'income';
        const categoryKey = isIncome ? (item.description.toUpperCase().includes('SALARIO') ? 'salary' : 'income') : item.category;
        const categoryInfo = SPENDING_CATEGORIES[categoryKey] || {};
        const icon = isIncome ? ICONS.salary : (categoryInfo.icon || ICONS.expense);

        li.innerHTML = `
            <div class="transaction-icon ${isIncome ? 'income' : 'expense'}">
                ${icon}
            </div>
            <div class="transaction-details">
                <p>${item.description}</p>
                <span>${isIncome ? 'Receita' : 'Despesa'}</span>
            </div>
            <div class="transaction-amount ${isIncome ? 'income' : 'expense'}">
                ${isIncome ? '+' : '-'} ${formatCurrency(item.amount)}
            </div>
        `;
        listElement.appendChild(li);
    });
}

function renderGoalsPage() {
    const listElement = elements.goalsListContainer;
    if (!listElement) return;
    listElement.innerHTML = '';
    
    const savingsGoals = currentMonthData.savingsGoals || [];
    
    if (savingsGoals.length === 0) {
        listElement.innerHTML = `<div class="empty-state">${ICONS.goal}<div>Nenhuma meta de poupança criada.</div></div>`;
        return;
    }

    savingsGoals.forEach(goal => {
        const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
        const card = document.createElement('div');
        card.className = 'goal-item';
        card.innerHTML = `
            <div class="goal-header">
                <span class="goal-title">${goal.description}</span>
                <span class="goal-percentage">${Math.round(progress)}%</span>
            </div>
            <div class="goal-progress-bar">
                <div class="goal-progress-bar-inner" style="width: ${Math.min(progress, 100)}%;"></div>
            </div>
        `;
        listElement.appendChild(card);
    });
}


function renderOverviewChart() {
    const chartEl = elements.overviewChart;
    const legendEl = elements.overviewChartLegend;
    if (!chartEl || !legendEl) return;

    chartEl.style.background = '';
    legendEl.innerHTML = '';

    const allPaidExpenses = [...(currentMonthData.expenses || []), ...(currentMonthData.shoppingItems || []), ...(currentMonthData.avulsosItems || [])].filter(e => e.paid);

    if (allPaidExpenses.length === 0) {
        legendEl.innerHTML = '<div class="empty-state-chart">Sem gastos para analisar.</div>';
        return;
    }

    const expensesByCategory = allPaidExpenses.reduce((acc, expense) => {
        const categoryKey = expense.category || 'outros';
        acc[categoryKey] = (acc[categoryKey] || 0) + expense.amount;
        return acc;
    }, {});

    const totalExpenses = allPaidExpenses.reduce((sum, e) => sum + e.amount, 0);

    const categoryColors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#2ECC71', '#E74C3C', '#3498DB', '#F1C40F'];
    let colorIndex = 0;

    const sortedCategories = Object.entries(expensesByCategory)
        .sort(([, a], [, b]) => b - a); // Sort by amount descending

    const data = sortedCategories.map(([categoryKey, amount]) => {
        const categoryInfo = SPENDING_CATEGORIES[categoryKey] || { name: 'Outros' };
        const color = categoryColors[colorIndex % categoryColors.length];
        colorIndex++;
        return {
            label: categoryInfo.name,
            value: amount,
            color: color
        };
    });

    let gradient = 'conic-gradient(';
    let currentPercentage = 0;

    data.forEach(item => {
        const percentage = (item.value / totalExpenses) * 100;
        if (percentage < 0.1) return; // Don't show tiny slices

        gradient += `${item.color} ${currentPercentage}% ${currentPercentage + percentage}%, `;
        currentPercentage += percentage;

        const legendItem = document.createElement('div');
        legendItem.className = 'legend-item';
        legendItem.innerHTML = `
            <div class="legend-info">
                <div class="legend-dot" style="background-color: ${item.color}"></div>
                ${item.label}
            </div>
            <div class="legend-values">
                <span class="value">${formatCurrency(item.value)}</span>
                <span class="percentage">(${percentage.toFixed(0)}%)</span>
            </div>`;
        legendEl.appendChild(legendItem);
    });

    gradient = gradient.slice(0, -2) + ')';
    chartEl.style.background = gradient;
}


// ... (Modal and Form handling functions remain largely the same) ...

function openModal(modal) {
    modal.classList.add('active');
}

function closeModal() {
    const activeModals = document.querySelectorAll('.modal.active');
    activeModals.forEach(modal => {
        modal.classList.remove('active');
    });
}

function openAddModal(type) {
    // This is a placeholder now, can be wired to a FAB menu
}

// =================================================================================
// INITIALIZATION
// =================================================================================
function init() {
    // Splash screen logic
    setTimeout(() => {
        elements.splashScreen.style.opacity = '0';
        elements.splashScreen.style.visibility = 'hidden';
        elements.appWrapper.classList.remove('hidden');
    }, 2000);

    elements.tabButtons.forEach(btn => {
        btn.addEventListener('click', () => navigateTo(btn.dataset.view));
    });
    
    // Use event delegation for month navigator buttons as header is dynamic
    elements.appHeader.addEventListener('click', (e) => {
        if (e.target.closest('#prev-month-btn')) {
            goToPrevMonth();
        }
        if (e.target.closest('#next-month-btn')) {
            goToNextMonth();
        }
    });

    document.getElementById('add-goal-btn')?.addEventListener('click', () => openGoalModal());
    document.querySelector('.visibility-btn')?.addEventListener('click', toggleBalanceVisibility);

    
    // Firebase Authentication
    if (isConfigured) {
        onAuthStateChanged(auth, user => {
            if (user) {
                currentUser = user;
                syncStatus = 'syncing';
                loadDataForCurrentMonth();
            } else {
                signInAnonymously(auth).catch(error => {
                    console.error("Anonymous sign-in failed:", error);
                    syncStatus = 'error';
                });
            }
        });
    } else {
        // Firebase not configured, run in local mode.
        currentUser = { uid: "localUser" };
        currentMonthData = JSON.parse(JSON.stringify(initialMonthData));
        updateUI();
    }
    
    navigateTo('home');
}

// Kick off the app
document.addEventListener('DOMContentLoaded', init);
