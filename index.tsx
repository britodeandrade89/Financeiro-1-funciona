// @ts-nocheck
import { GoogleGenAI, Chat } from "@google/genai";
import { db, auth, isConfigured, firebaseConfig } from './firebase-config.js';
import { onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { doc, setDoc, getDoc, onSnapshot } from "firebase/firestore";


// =================================================================================
// ICONS & CATEGORIES
// =================================================================================
const INCOME_CATEGORIES = {
    salario: { name: 'Salário', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="22" x2="21" y2="22"></line><line x1="6" y1="18" x2="6" y2="11"></line><line x1="10" y1="18" x2="10" y2="11"></line><line x1="14" y1="18" x2="14" y2="11"></line><line x1="18" y1="18" x2="18" y2="11"></line><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon></svg>`, color: '#C52328' },
    mumbuca: { name: 'Mumbuca', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 9.782L9.531 8.369V5.543L12 4.13l2.469 1.413v2.826zm2.469 5.652L12 16.848l-2.469-1.413v-2.826L12 11.2l2.469 1.413zM9.531 14.13v-2.826L7.062 9.891v2.826zm4.938 0v-2.826L16.938 9.89v2.826zM7.062 8.369L4.594 6.957v5.652L7.062 14.13zm9.876 0l2.468-1.412v5.652L16.938 14.13zM12 2L4.594 6.25v7.5L12 18l7.406-4.25v-7.5z"/></svg>`, color: '#D81920' },
    vendas: { name: 'Vendas', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>`, color: '#3B82F6' },
    outros: { name: 'Outros', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>`, color: '#64748B' },
};

const SPENDING_CATEGORIES = {
    moradia: { name: 'Moradia', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>`, color: '#3B82F6' },
    alimentacao: { name: 'Alimentação', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 15h18v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5z"/><path d="M3 15V6a2 2 0 012-2h14a2 2 0 012 2v9"/></svg>`, color: '#10B981' },
    transporte: { name: 'Transporte', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`, color: '#F97316' }, // Used for Multas
    abastecimento_mumbuca: { name: 'Abastecimento com Mumbuca', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 9.782L9.531 8.369V5.543L12 4.13l2.469 1.413v2.826zm2.469 5.652L12 16.848l-2.469-1.413v-2.826L12 11.2l2.469 1.413zM9.531 14.13v-2.826L7.062 9.891v2.826zm4.938 0v-2.826L16.938 9.89v2.826zM7.062 8.369L4.594 6.957v5.652L7.062 14.13zm9.876 0l2.468-1.412v5.652L16.938 14.13zM12 2L4.594 6.25v7.5L12 18l7.406-4.25v-7.5z"/></svg>`, color: '#D81920' },
    saude: { name: 'Saúde', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>`, color: '#EF4444' },
    lazer: { name: 'Lazer', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`, color: '#EC4899' },
    educacao: { name: 'Educação', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10v6M12 2v14M8 16L4 14M16 16l4-2M12 22a4 4 0 0 0 4-4H8a4 4 0 0 0 4 4z"></path></svg>`, color: '#6366F1' },
    dividas: { name: 'Dívidas', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>`, color: '#78716C' },
    pessoal: { name: 'Pessoal', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M12 16.5c-3.5 0-6.5 2-6.5 4.5h13c0-2.5-3-4.5-6.5-4.5z"></path><path d="M20.5 12c.3 0 .5.2.5.5v3c0 .3-.2.5-.5.5s-.5-.2-.5-.5v-3c0-.3.2-.5.5-.5z"></path><path d="M3.5 12c.3 0 .5.2.5.5v3c0 .3-.2.5-.5.5s-.5-.2-.5-.5v-3c0-.3.2-.5.5-.5z"></path></svg>`, color: '#A855F7' },
    investimento: { name: 'Investimento para Viagem', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="20" x2="12" y2="10"></line><line x1="18" y1="20" x2="18" y2="4"></line><line x1="6" y1="20" x2="6" y2="16"></line></svg>`, color: '#84CC16' },
    shopping: { name: 'Compras com Mumbuca', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 9.782L9.531 8.369V5.543L12 4.13l2.469 1.413v2.826zm2.469 5.652L12 16.848l-2.469-1.413v-2.826L12 11.2l2.469 1.413zM9.531 14.13v-2.826L7.062 9.891v2.826zm4.938 0v-2.826L16.938 9.89v2.826zM7.062 8.369L4.594 6.957v5.652L7.062 14.13zm9.876 0l2.468-1.412v5.652L16.938 14.13zM12 2L4.594 6.25v7.5L12 18l7.406-4.25v-7.5z"/></svg>`, color: '#D81920' },
    avulsos: { name: 'Avulsos', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>`, color: '#64748B' },
    outros: { name: 'Outros', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>`, color: '#64748B' },
};

const MONTH_NAMES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

// =================================================================================
// INITIAL DATA
// =================================================================================
const initialMonthData = {
    incomes: [
        { id: "inc_nov_1", description: 'SALARIO MARCELLY', amount: 3349.92, paid: true, paidDate: '2025-11-05', category: 'salario', cyclic: true },
        { id: "inc_nov_2", description: 'SALARIO ANDRE', amount: 3349.92, paid: true, paidDate: '2025-11-05', category: 'salario', cyclic: true },
        { id: "inc_nov_3", description: 'MUMBUCA MARCELLY', amount: 650.00, paid: true, paidDate: '2025-11-15', category: 'mumbuca', cyclic: true },
        { id: "inc_nov_4", description: 'MUMBUCA ANDRE', amount: 650.00, paid: true, paidDate: '2025-11-15', category: 'mumbuca', cyclic: true },
        { id: "inc_nov_5", description: 'Dinheiro que o seu Claudio deu', amount: 100.00, paid: true, paidDate: '2025-11-10', category: 'outros', cyclic: false },
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
let currentTransactionFilter = 'all'; // 'all', 'incomes', 'expenses'

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
    monthNavigatorContainer: document.getElementById('month-navigator-container'),
    
    // Home screen cards
    totalBalance: document.getElementById('totalBalance'),
    monthlyExpenses: document.getElementById('monthlyExpenses'),

    // Lists and other elements
    transactionsList: document.getElementById('transactionsList'),
    recentTransactionsList: document.getElementById('recentTransactionsList'),
    goalsListContainer: document.getElementById('goalsListContainer'),
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
    incomeCategoryGroup: document.getElementById('incomeCategoryGroup'),
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

function formatDate(dateString, options = { day: '2-digit', month: '2-digit' }) {
    if (!dateString) return '';
    const date = new Date(dateString + 'T00:00:00'); // Ensure correct date parsing
    return date.toLocaleDateString('pt-BR', options);
}

function getNextMonthDate(dateString) {
    if (!dateString) return null;
    const date = new Date(dateString + 'T00:00:00');
    const originalDay = date.getDate();
    date.setMonth(date.getMonth() + 1);
    // Handle edge case of month-end dates (e.g., Jan 31 -> Feb 28/29)
    if (date.getDate() !== originalDay) {
        date.setDate(0); // Go to last day of previous month which is the new month
    }
    return date.toISOString().split('T')[0];
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

    const incomeCategorySelect = document.getElementById('incomeCategory');
    if (incomeCategorySelect) {
        incomeCategorySelect.innerHTML = '<option value="">Selecione...</option>';
        for (const key in INCOME_CATEGORIES) {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = INCOME_CATEGORIES[key].name;
            incomeCategorySelect.appendChild(option);
        }
    }

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

    const monthKey = `${currentYear}-${(currentMonth).toString().padStart(2, '0')}`;
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

    const monthKey = `${currentYear}-${(currentMonth).toString().padStart(2, '0')}`;
    const docRef = doc(db, 'users', currentUser.uid, 'months', monthKey);
    
    firestoreUnsubscribe = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
            currentMonthData = JSON.parse(JSON.stringify(docSnap.data()));
            updateUI();
        } else {
             // If navigating to a future month, create its data based on the previous one.
            createNewMonthData();
        }
    }, (error) => {
        console.error("Error listening to Firestore:", error);
        syncStatus = 'error';
        alert("Erro de conexão com o banco de dados. Tentando reconectar...");
    });
}


async function createNewMonthData() {
    if (!currentUser || !isConfigured) return;
    
    // The most important step to prevent circular reference errors.
    const prevMonthData = JSON.parse(JSON.stringify(currentMonthData));

    // Carry over cyclic incomes
    const newIncomes = (prevMonthData.incomes || [])
        .filter(income => income.cyclic)
        .map(income => ({
            ...income,
            id: `inc_${new Date().getTime()}_${Math.random()}`,
            paid: false,
            paidDate: null,
        }));

    // Carry over cyclic and installment expenses
    const newExpenses = (prevMonthData.expenses || [])
        .map(exp => {
            const newId = `exp_${new Date().getTime()}_${Math.random()}`;
            const newDueDate = getNextMonthDate(exp.dueDate);

            if (exp.cyclic) {
                return { ...exp, id: newId, paid: false, paidDate: null, dueDate: newDueDate };
            }
            if (exp.current && exp.total && exp.current < exp.total) {
                return { ...exp, id: newId, current: exp.current + 1, paid: false, paidDate: null, dueDate: newDueDate };
            }
            return null;
        })
        .filter(Boolean); // Remove null entries

    currentMonthData = {
        incomes: newIncomes,
        expenses: newExpenses,
        shoppingItems: [],
        avulsosItems: [],
        goals: prevMonthData.goals || [],
        bankAccounts: prevMonthData.bankAccounts || [],
        savingsGoals: prevMonthData.savingsGoals || [],
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
    updateUI();
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
    const eyeOpen = document.querySelector('.visibility-btn-home .eye-open');
    const eyeClosed = document.querySelector('.visibility-btn-home .eye-closed');
    if (isBalanceVisible) {
        eyeOpen.style.display = 'block';
        eyeClosed.style.display = 'none';
    } else {
        eyeOpen.style.display = 'none';
        eyeClosed.style.display = 'block';
    }
    updateUI();
}

function updateHeader(viewName) {
    let headerContent = '';

    if (viewName === 'home') {
        headerContent = `
            <div class="header-home-content">
                <div class="header-left">
                    <img src="https://i.pravatar.cc/150?u=familia-bispo-brito" alt="Perfil" class="header-avatar">
                    <div class="header-greeting">
                        <span>Olá,</span>
                        <strong>Família Bispo Brito</strong>
                    </div>
                </div>
                <button class="action-btn">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                </button>
            </div>
        `;
    } else {
        let title = '';
        switch(viewName) {
            case 'extrato': title = 'Extrato Mensal'; break;
            case 'metas': title = 'Metas'; break;
            case 'perfil': title = 'Perfil'; break;
        }
        headerContent = `<h2 class="header-title-centered">${title}</h2>`;
    }
    elements.appHeader.innerHTML = headerContent;
}


// =================================================================================
// UI RENDERING
// =================================================================================
function updateUI() {
    if(!currentUser) return;
    
    const activeViewName = document.querySelector('.tab-btn.active')?.dataset.view || 'home';
    updateHeader(activeViewName);
    
    switch(activeViewName) {
        case 'home':
            renderHomePage();
            break;
        case 'extrato':
            renderTransactionsPage();
            break;
        case 'metas':
            renderGoalsPage();
            break;
        case 'perfil':
            // Perfil is static HTML
            break;
    }
}

function renderHomePage() {
    updateSummary();
    renderRecentTransactions();
    renderExpenseChart();
}

function renderMonthNavigator() {
    const monthName = MONTH_NAMES[currentMonth - 1];
    const navHTML = `
        <div class="month-navigator">
            <button id="prev-month-btn" class="month-nav-btn">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
            </button>
            <span id="current-month-display">${monthName} ${currentYear}</span>
            <button id="next-month-btn" class="month-nav-btn">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
        </div>
    `;
    elements.monthNavigatorContainer.innerHTML = navHTML;
    
    document.getElementById('prev-month-btn').addEventListener('click', goToPrevMonth);
    document.getElementById('next-month-btn').addEventListener('click', goToNextMonth);
}


function updateSummary() {
    const allExpenses = [...(currentMonthData.expenses || []), ...(currentMonthData.shoppingItems || []), ...(currentMonthData.avulsosItems || [])];
    const hiddenValue = 'R$ ••••••';

    const totalBalance = (currentMonthData.bankAccounts || []).reduce((sum, acc) => sum + acc.balance, 0);
    if (elements.totalBalance) {
        elements.totalBalance.textContent = isBalanceVisible ? formatCurrency(totalBalance) : hiddenValue;
    }

    const paidExpensesAmount = allExpenses.filter(item => item.paid).reduce((sum, item) => sum + item.amount, 0);
    if (elements.monthlyExpenses) {
        elements.monthlyExpenses.textContent = isBalanceVisible ? formatCurrency(paidExpensesAmount) : hiddenValue;
    }
}

function renderTransactionItem(item) {
    const isIncome = item.type === 'income';
    const categoryList = isIncome ? INCOME_CATEGORIES : SPENDING_CATEGORIES;
    const categoryInfo = categoryList[item.category] || { icon: SPENDING_CATEGORIES.outros.icon, color: '#ccc' };
    const icon = categoryInfo.icon;
    const color = categoryInfo.color;
    
    return `
        <div class="transaction-item">
            <div class="transaction-icon" style="background-color: ${color};">
                ${icon}
            </div>
            <div class="transaction-details">
                <p>${item.description}</p>
                <span>${formatDate(item.paidDate || item.dueDate)}</span>
            </div>
            <div class="transaction-amount ${isIncome ? 'income' : 'expense'}">
                ${isIncome ? '+' : '-'} ${formatCurrency(item.amount)}
            </div>
        </div>
    `;
}

function renderTransactionsPage() {
    renderMonthNavigator();
    const listElement = elements.transactionsList;
    if (!listElement) return;

    const allIncomes = (currentMonthData.incomes || []).map(i => ({...i, type: 'income'}));
    const allExpenses = [...(currentMonthData.expenses || []), ...(currentMonthData.shoppingItems || []), ...(currentMonthData.avulsosItems || [])].map(e => ({...e, type: 'expense'}));
    
    let allTransactions = [];
    if (currentTransactionFilter === 'all') {
        allTransactions = [...allIncomes, ...allExpenses];
    } else if (currentTransactionFilter === 'incomes') {
        allTransactions = allIncomes;
    } else { // 'expenses'
        allTransactions = allExpenses;
    }
    
    allTransactions.sort((a,b) => new Date(b.paidDate || b.dueDate) - new Date(a.paidDate || a.dueDate));
    
    const totalIncome = allIncomes.reduce((sum, item) => sum + item.amount, 0);
    const totalExpense = allExpenses.reduce((sum, item) => sum + item.amount, 0);
    const monthBalance = totalIncome - totalExpense;

    document.getElementById('extrato-summary-cards').innerHTML = `
        <div class="summary-card-item"><span>Receitas</span><strong>${formatCurrency(totalIncome)}</strong></div>
        <div class="summary-card-item"><span>Despesas</span><strong>${formatCurrency(totalExpense)}</strong></div>
        <div class="summary-card-item"><span>Saldo</span><strong>${formatCurrency(monthBalance)}</strong></div>
    `;

    if (allTransactions.length === 0) {
        listElement.innerHTML = `<div class="empty-state">Nenhuma transação registrada neste mês.</div>`;
        return;
    }

    listElement.innerHTML = allTransactions.map(renderTransactionItem).join('');
}


function renderRecentTransactions() {
    const listElement = elements.recentTransactionsList;
    if (!listElement) return;

    const allTransactions = [
        ...(currentMonthData.incomes || []).map(i => ({...i, type: 'income'})),
        ...(currentMonthData.expenses || []).map(e => ({...e, type: 'expense'})),
        ...(currentMonthData.shoppingItems || []).map(s => ({...s, type: 'expense'})),
        ...(currentMonthData.avulsosItems || []).map(a => ({...a, type: 'expense'}))
    ];
    allTransactions.sort((a,b) => new Date(b.paidDate || b.dueDate) - new Date(a.paidDate || a.dueDate));

    const recent = allTransactions.slice(0, 3);

    if (recent.length === 0) {
        listElement.innerHTML = `<div class="empty-state-small">Nenhuma transação ainda.</div>`;
        return;
    }

    listElement.innerHTML = recent.map(renderTransactionItem).join('');
}


function renderGoalsPage() {
    const listElement = elements.goalsListContainer;
    if (!listElement) return;
    listElement.innerHTML = '';
    
    const savingsGoals = currentMonthData.savingsGoals || [];
    
    if (savingsGoals.length === 0) {
        listElement.innerHTML = `<div class="empty-state">Nenhuma meta de poupança criada.</div>`;
        return;
    }

    listElement.innerHTML = savingsGoals.map(goal => {
        const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
        return `
            <div class="card goal-item">
                <div class="goal-header">
                    <span class="goal-title">${goal.description}</span>
                    <span class="goal-percentage">${Math.round(progress)}%</span>
                </div>
                <div class="goal-progress-bar">
                    <div class="goal-progress-bar-inner" style="width: ${Math.min(progress, 100)}%;"></div>
                </div>
                 <div class="goal-amounts">
                    <span>${formatCurrency(goal.currentAmount)} de </span>
                    <span class="target-amount">${formatCurrency(goal.targetAmount)}</span>
                </div>
            </div>
        `;
    }).join('');
}

function renderExpenseChart() {
    const container = document.getElementById('expense-chart-container');
    if (!container) return;

    const allExpenses = [...(currentMonthData.expenses || []), ...(currentMonthData.shoppingItems || []), ...(currentMonthData.avulsosItems || [])];
    if (allExpenses.length === 0) {
        container.innerHTML = `<div class="section-header"><h3 class="section-title">Análise de Despesas</h3></div><div class="empty-state-small">Sem despesas para analisar.</div>`;
        return;
    }

    const totalSpent = allExpenses.reduce((sum, item) => sum + item.amount, 0);
    const spendingByCategory = allExpenses.reduce((acc, item) => {
        if (!acc[item.category]) {
            acc[item.category] = 0;
        }
        acc[item.category] += item.amount;
        return acc;
    }, {});

    const sortedCategories = Object.entries(spendingByCategory).sort(([, a], [, b]) => b - a);

    let gradientString = '';
    let currentPercentage = 0;
    const colors = [];

    sortedCategories.forEach(([category, amount]) => {
        const percentage = (amount / totalSpent) * 100;
        const color = SPENDING_CATEGORIES[category]?.color || '#ccc';
        colors.push(color);
        gradientString += `${color} ${currentPercentage}% ${currentPercentage + percentage}%, `;
        currentPercentage += percentage;
    });

    gradientString = `conic-gradient(${gradientString.slice(0, -2)})`;

    const legendHTML = sortedCategories.slice(0, 4).map(([category, amount], index) => {
        const categoryInfo = SPENDING_CATEGORIES[category] || { name: 'Desconhecido' };
        return `
            <div class="legend-item">
                <span class="legend-color-dot" style="background-color: ${colors[index]};"></span>
                <span class="legend-label">${categoryInfo.name}</span>
            </div>
        `;
    }).join('');

    container.innerHTML = `
         <h3 class="section-title">Análise de Despesas</h3>
         <div class="chart-wrapper">
             <div class="donut-chart" style="background: ${gradientString};">
                 <div class="chart-center-label">
                    <span>Total</span>
                    <strong>${formatCurrency(totalSpent)}</strong>
                 </div>
             </div>
             <div class="chart-legend">
                ${legendHTML}
             </div>
         </div>
    `;
}


// =================================================================================
// MODALS & FORMS
// =================================================================================

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
    currentModalType = type;
    const form = elements.addForm;
    form.reset();
    
    const today = new Date();
    today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
    const todayString = today.toISOString().split('T')[0];

    populateAccountSelects();

    const dueDateGroup = document.getElementById('dueDateGroup');
    const cyclicGroup = document.getElementById('cyclicGroup');
    const incomeCyclicGroup = document.getElementById('incomeCyclicGroup');
    const incomeCategoryGroup = document.getElementById('incomeCategoryGroup');

    elements.typeGroup.style.display = 'none';
    elements.categoryGroup.style.display = 'none';
    incomeCategoryGroup.style.display = 'none';
    elements.sourceAccountGroup.style.display = 'none';
    elements.installmentsGroup.style.display = 'none';
    cyclicGroup.style.display = 'none';
    incomeCyclicGroup.style.display = 'none';
    elements.dateGroup.style.display = 'none';
    dueDateGroup.style.display = 'none';

    if (type === 'income') {
        elements.addModalTitle.textContent = 'Adicionar Receita';
        elements.dateGroup.style.display = 'block';
        elements.transactionDateLabel.textContent = 'Data do Recebimento';
        elements.transactionDateInput.value = todayString;
        incomeCategoryGroup.style.display = 'block';
        incomeCyclicGroup.style.display = 'block';
    } else { // 'expense' or default
        elements.addModalTitle.textContent = 'Adicionar Despesa';
        elements.typeGroup.style.display = 'block';
        elements.categoryGroup.style.display = 'block';
        elements.sourceAccountGroup.style.display = 'block';
        elements.installmentsGroup.style.display = 'flex';
        cyclicGroup.style.display = 'block';
        
        dueDateGroup.style.display = 'block';
        dueDateGroup.querySelector('input').value = todayString;
    }
    
    openModal(elements.addModal);
}


function handleAddFormSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    const newItem = {
        id: `${currentModalType === 'income' ? 'inc' : 'exp'}_${new Date().getTime()}`,
        description: data.description,
        amount: parseCurrency(data.amount),
        paid: false,
        paidDate: null,
    };

    if (currentModalType === 'income') {
        newItem.paidDate = data.transactionDate;
        newItem.paid = !!data.transactionDate;
        newItem.category = data.incomeCategory;
        newItem.cyclic = data.incomeCyclic === 'on';
        if (!currentMonthData.incomes) currentMonthData.incomes = [];
        currentMonthData.incomes.push(newItem);
    } else { // expense
        newItem.type = data.type;
        newItem.category = data.category;
        newItem.dueDate = data.dueDate;
        newItem.paidDate = data.dueDate; // Assume paid on due date for new entries
        newItem.paid = true; // Assume new manual entries are paid
        newItem.cyclic = data.cyclic === 'on';
        newItem.sourceAccountId = data.sourceAccount;

        const currentInstallment = parseInt(data.currentInstallment, 10);
        const totalInstallments = parseInt(data.totalInstallments, 10);

        if (!isNaN(currentInstallment) && !isNaN(totalInstallments) && totalInstallments > 0) {
            newItem.current = currentInstallment;
            newItem.total = totalInstallments;
        }

        if (!currentMonthData.expenses) currentMonthData.expenses = [];
        currentMonthData.expenses.push(newItem);
    }

    saveData();
    closeModal();
    form.reset();
}


// =================================================================================
// INITIALIZATION
// =================================================================================
function init() {
    setTimeout(() => {
        elements.splashScreen.style.opacity = '0';
        elements.splashScreen.style.visibility = 'hidden';
        elements.appWrapper.classList.remove('hidden');
    }, 2000);

    populateCategorySelects();

    elements.tabButtons.forEach(btn => {
        btn.addEventListener('click', () => navigateTo(btn.dataset.view));
    });
    
    document.body.addEventListener('click', (e) => {
        const seeAllBtn = e.target.closest('.see-all-btn');
        if (seeAllBtn) {
            navigateTo(seeAllBtn.dataset.view);
        }
        const visibilityBtn = e.target.closest('.visibility-btn-home');
        if (visibilityBtn) {
            toggleBalanceVisibility();
        }
    });

    document.getElementById('transaction-filter-container')?.addEventListener('click', e => {
        const target = e.target.closest('.filter-btn');
        if (target) {
            currentTransactionFilter = target.dataset.filter;
            document.querySelectorAll('#transaction-filter-container .filter-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            target.classList.add('active');
            renderTransactionsPage();
        }
    });

    document.getElementById('home-add-expense-btn')?.addEventListener('click', () => openAddModal('expense'));
    document.getElementById('home-add-income-btn')?.addEventListener('click', () => openAddModal('income'));
    elements.addForm.addEventListener('submit', handleAddFormSubmit);

    document.querySelectorAll('.close-modal-btn').forEach(btn => {
        btn.addEventListener('click', closeModal);
    });
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', e => {
            if (e.target === modal) closeModal();
        });
    });
    
    if (isConfigured) {
        onAuthStateChanged(auth, user => {
            if (user) {
                currentUser = user;
                syncStatus = 'syncing';
                const initialMonthKey = `${currentYear}-${(currentMonth).toString().padStart(2, '0')}`;
                const docRef = doc(db, 'users', currentUser.uid, 'months', initialMonthKey);
                getDoc(docRef).then(docSnap => {
                    if (docSnap.exists()) {
                         loadDataForCurrentMonth();
                    } else {
                        currentMonthData = JSON.parse(JSON.stringify(initialMonthData));
                        saveDataToFirestore().then(() => {
                           loadDataForCurrentMonth();
                        });
                    }
                });

            } else {
                signInAnonymously(auth).catch(error => {
                    console.error("Anonymous sign-in failed:", error);
                    syncStatus = 'error';
                });
            }
        });
    } else {
        currentUser = { uid: "localUser" };
        currentMonthData = JSON.parse(JSON.stringify(initialMonthData));
        updateUI();
    }
    
    navigateTo('home');
}

document.addEventListener('DOMContentLoaded', init);