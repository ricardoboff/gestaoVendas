import { Customer, Transaction, TransactionType, User } from '../types';
import { db } from './firebaseConfig';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where,
  setDoc,
  getDoc
} from 'firebase/firestore';

// Nomes das coleções no banco de dados
const USERS_COLLECTION = 'users';
const CUSTOMERS_COLLECTION = 'customers';
const CURRENT_USER_KEY = 'app_current_user_local'; // Mantém sessão local simples

// --- Inicialização e Usuário Admin ---

export const initializeStorage = async () => {
  // Verifica se o admin existe no banco
  const q = query(collection(db, USERS_COLLECTION), where("username", "==", "admin"));
  const querySnapshot = await getDocs(q);

  const adminData = {
    name: 'Ricardo Boff',
    username: 'admin',
    password: 'Jul1@1008',
    role: 'admin' as const,
    email: 'ricardoboff@gmail.com',
    whatsapp: '6984030262',
    approved: true
  };

  if (querySnapshot.empty) {
    // Cria admin se não existir
    await addDoc(collection(db, USERS_COLLECTION), adminData);
    console.log("Admin criado no Firebase");
  } else {
    // Atualiza admin se já existir (garante senha/role/contatos corretos)
    const docId = querySnapshot.docs[0].id;
    await updateDoc(doc(db, USERS_COLLECTION, docId), adminData);
  }
};

// --- Helpers ---

const calculateBalance = (transactions: Transaction[]): number => {
  if (!transactions || transactions.length === 0) return 0;

  const rawBalance = transactions.reduce((acc, t) => {
    let val = typeof t.value === 'string' ? parseFloat(t.value) : t.value;
    if (isNaN(val)) val = 0;
    return t.type === TransactionType.SALE ? acc + val : acc - val;
  }, 0);
  
  let balance = Math.round(rawBalance * 100) / 100;
  if (Math.abs(balance) < 0.10) balance = 0;
  if (balance === 0) balance = 0;
  
  return balance;
};

// --- Usuários ---

export const registerUser = async (
  name: string, 
  username: string, 
  password: string, 
  email: string, 
  whatsapp: string
): Promise<boolean> => {
  try {
    const q = query(collection(db, USERS_COLLECTION), where("username", "==", username));
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) return false; // Usuário já existe

    await addDoc(collection(db, USERS_COLLECTION), {
      name,
      username,
      password, // Nota: Em produção real, senhas devem ser hash
      email,
      whatsapp,
      role: 'user',
      approved: false // Por padrão, precisa de aprovação
    });
    return true;
  } catch (e) {
    console.error("Erro ao registrar", e);
    return false;
  }
};

export const loginUser = async (username: string, password: string): Promise<{user: User | null, error?: string}> => {
  try {
    const q = query(collection(db, USERS_COLLECTION), where("username", "==", username), where("password", "==", password));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const docData = snapshot.docs[0].data();
      
      // Verifica aprovação
      if (docData.approved === false) {
        return { user: null, error: 'PENDING_APPROVAL' };
      }

      const user: User = {
        id: snapshot.docs[0].id,
        name: docData.name,
        username: docData.username,
        role: docData.role || (docData.username === 'admin' ? 'admin' : 'user'),
        email: docData.email,
        whatsapp: docData.whatsapp,
        approved: docData.approved
      };
      
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
      return { user };
    }
    return { user: null, error: 'INVALID_CREDENTIALS' };
  } catch (e) {
    console.error("Erro no login", e);
    return { user: null, error: 'ERROR' };
  }
};

export const updateUserProfile = async (
  userId: string, 
  data: { email?: string, whatsapp?: string, password?: string }
): Promise<boolean> => {
  try {
    const updateData: any = {};
    if (data.email) updateData.email = data.email;
    if (data.whatsapp) updateData.whatsapp = data.whatsapp;
    if (data.password && data.password.trim() !== "") updateData.password = data.password;

    await updateDoc(doc(db, USERS_COLLECTION, userId), updateData);
    
    // Atualiza local storage se for o usuário atual
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.id === userId) {
      const updatedUser = { ...currentUser, ...updateData };
      // Remove senha do objeto local por segurança (embora o tipo User não tenha senha explicitamente definida aqui, é bom garantir)
      delete updatedUser.password; 
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser));
    }
    
    return true;
  } catch (e) {
    console.error("Erro ao atualizar perfil", e);
    return false;
  }
};

export const approveUser = async (userId: string): Promise<boolean> => {
  try {
    await updateDoc(doc(db, USERS_COLLECTION, userId), { approved: true });
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
};

export const logoutUser = () => {
  localStorage.removeItem(CURRENT_USER_KEY);
};

export const getCurrentUser = (): User | null => {
  const stored = localStorage.getItem(CURRENT_USER_KEY);
  return stored ? JSON.parse(stored) : null;
};

export const getUsers = async (): Promise<User[]> => {
  const snapshot = await getDocs(collection(db, USERS_COLLECTION));
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name,
      username: data.username,
      role: data.role || 'user',
      email: data.email,
      whatsapp: data.whatsapp,
      approved: data.approved
    } as User;
  });
};

export const deleteUser = async (id: string): Promise<boolean> => {
  try {
    await deleteDoc(doc(db, USERS_COLLECTION, id));
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
};

// --- Clientes ---

export const getCustomers = async (): Promise<Customer[]> => {
  const snapshot = await getDocs(collection(db, CUSTOMERS_COLLECTION));
  const customers = snapshot.docs.map(doc => {
    const data = doc.data() as Omit<Customer, 'id' | 'balance'>;
    // Garante que transactions é um array
    const transactions = Array.isArray(data.transactions) ? data.transactions : [];
    return {
      id: doc.id,
      ...data,
      transactions: transactions,
      balance: calculateBalance(transactions)
    };
  });
  return customers;
};

export const saveCustomer = async (customer: Customer): Promise<void> => {
  // Recalcula saldo antes de salvar
  customer.balance = calculateBalance(customer.transactions);
  
  // Remove o ID do objeto de dados para não duplicar no Firestore
  const { id, ...dataToSave } = customer;

  // Verifica se existe um ID válido (não vazio)
  if (id && id.trim() !== '') {
    // Atualiza cliente existente
    await setDoc(doc(db, CUSTOMERS_COLLECTION, id), dataToSave);
  } else {
    // Novo cliente
    await addDoc(collection(db, CUSTOMERS_COLLECTION), dataToSave);
  }
};

export const deleteCustomer = async (id: string): Promise<boolean> => {
  try {
    await deleteDoc(doc(db, CUSTOMERS_COLLECTION, id));
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
};

// --- Transações ---

export const createTransaction = async (
  customerId: string, 
  description: string, 
  value: number, 
  type: TransactionType,
  date: string
) => {
  try {
    const customerRef = doc(db, CUSTOMERS_COLLECTION, customerId);
    const customerSnap = await getDoc(customerRef);
    
    if (customerSnap.exists()) {
      const customerData = customerSnap.data() as Customer;
      const transactions = customerData.transactions || [];
      
      const newTransaction: Transaction = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        date,
        description,
        value,
        type,
        createdAt: Date.now()
      };

      transactions.push(newTransaction);
      
      await updateDoc(customerRef, { transactions });
      return newTransaction;
    }
  } catch (e) {
    console.error("Erro ao criar transação", e);
  }
  return null;
};

export const updateTransaction = async (
  customerId: string,
  transaction: Transaction
): Promise<boolean> => {
  try {
    const customerRef = doc(db, CUSTOMERS_COLLECTION, customerId);
    const customerSnap = await getDoc(customerRef);
    
    if (customerSnap.exists()) {
      const customerData = customerSnap.data() as Customer;
      const transactions = customerData.transactions || [];
      
      const index = transactions.findIndex((t: any) => t.id === transaction.id);
      if (index === -1) return false;

      transactions[index] = transaction;
      await updateDoc(customerRef, { transactions });
      return true;
    }
  } catch (e) {
    console.error(e);
  }
  return false;
};

export const deleteTransaction = async (
  customerId: string,
  transactionId: string
): Promise<boolean> => {
  try {
    const customerRef = doc(db, CUSTOMERS_COLLECTION, customerId);
    const customerSnap = await getDoc(customerRef);
    
    if (customerSnap.exists()) {
      const customerData = customerSnap.data() as Customer;
      const transactions = customerData.transactions || [];
      
      const filtered = transactions.filter((t: any) => t.id !== transactionId);
      await updateDoc(customerRef, { transactions: filtered });
      return true;
    }
  } catch (e) {
    console.error(e);
  }
  return false;
};

// --- Backup ---

export const exportData = async (): Promise<string> => {
  const users = await getUsers();
  const customers = await getCustomers();
  
  const data = {
    users,
    customers,
    version: '2.0-firebase',
    exportedAt: new Date().toISOString()
  };
  return JSON.stringify(data, null, 2);
};

export const importData = async (jsonString: string): Promise<boolean> => {
  try {
    const data = JSON.parse(jsonString);
    
    if (data.customers && Array.isArray(data.customers)) {
      for (const c of data.customers) {
        await saveCustomer(c);
      }
    }
    return true;
  } catch (e) {
    console.error("Erro ao importar", e);
    return false;
  }
};

// --- Migração / Manutenção ---

export const migrateDates2024to2025 = async (): Promise<number> => {
  try {
    const customers = await getCustomers();
    let updatedCount = 0;

    for (const customer of customers) {
      if (!customer.transactions || customer.transactions.length === 0) continue;

      let hasChanges = false;
      const updatedTransactions = customer.transactions.map(t => {
        // Verifica se a data começa com 2024
        if (t.date && t.date.startsWith('2024-')) {
          hasChanges = true;
          // Substitui 2024 por 2025
          return { ...t, date: t.date.replace('2024-', '2025-') };
        }
        return t;
      });

      if (hasChanges) {
        // Atualiza apenas o campo transactions no Firestore
        await updateDoc(doc(db, CUSTOMERS_COLLECTION, customer.id), {
          transactions: updatedTransactions
        });
        updatedCount++;
      }
    }
    return updatedCount;
  } catch (e) {
    console.error("Erro na migração de datas", e);
    return 0;
  }
};