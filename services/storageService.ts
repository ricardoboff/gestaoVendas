
import { Customer, Transaction, TransactionType, User, Expense } from '../types';
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
  getDoc,
  orderBy
} from 'firebase/firestore';

const USERS_COLLECTION = 'users';
const CUSTOMERS_COLLECTION = 'customers';
const EXPENSES_COLLECTION = 'expenses';
const CURRENT_USER_KEY = 'app_current_user_local';

export const initializeStorage = async () => {
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
    await addDoc(collection(db, USERS_COLLECTION), adminData);
  } else {
    const docId = querySnapshot.docs[0].id;
    await updateDoc(doc(db, USERS_COLLECTION, docId), adminData);
  }
};

const calculateBalance = (transactions: Transaction[]): number => {
  if (!transactions || transactions.length === 0) return 0;
  const rawBalance = transactions.reduce((acc, t) => {
    let val = typeof t.value === 'string' ? parseFloat(t.value) : t.value;
    if (isNaN(val)) val = 0;
    return t.type === TransactionType.SALE ? acc + val : acc - val;
  }, 0);
  let balance = Math.round(rawBalance * 100) / 100;
  if (Math.abs(balance) < 0.10) balance = 0;
  return balance;
};

export const registerUser = async (name: string, username: string, password: string, email: string, whatsapp: string) => {
  const q = query(collection(db, USERS_COLLECTION), where("username", "==", username));
  const snapshot = await getDocs(q);
  if (!snapshot.empty) return false;
  await addDoc(collection(db, USERS_COLLECTION), { name, username, password, email, whatsapp, role: 'user', approved: false });
  return true;
};

export const loginUser = async (username: string, password: string) => {
  const q = query(collection(db, USERS_COLLECTION), where("username", "==", username), where("password", "==", password));
  const snapshot = await getDocs(q);
  if (!snapshot.empty) {
    const docData = snapshot.docs[0].data();
    if (docData.approved === false) return { user: null, error: 'PENDING_APPROVAL' };
    const user: User = { id: snapshot.docs[0].id, name: docData.name, username: docData.username, role: docData.role || 'user', email: docData.email, whatsapp: docData.whatsapp, approved: docData.approved };
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    return { user };
  }
  return { user: null, error: 'INVALID_CREDENTIALS' };
};

export const updateUserProfile = async (userId: string, data: any) => {
  const updateData: any = { ...data };
  if (updateData.password === undefined) delete updateData.password;
  await updateDoc(doc(db, USERS_COLLECTION, userId), updateData);
  return true;
};

export const approveUser = async (userId: string) => {
  await updateDoc(doc(db, USERS_COLLECTION, userId), { approved: true });
  return true;
};

export const logoutUser = () => localStorage.removeItem(CURRENT_USER_KEY);
export const getCurrentUser = (): User | null => {
  const stored = localStorage.getItem(CURRENT_USER_KEY);
  return stored ? JSON.parse(stored) : null;
};

export const getUsers = async (): Promise<User[]> => {
  const snapshot = await getDocs(collection(db, USERS_COLLECTION));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
};

export const deleteUser = async (id: string) => {
  await deleteDoc(doc(db, USERS_COLLECTION, id));
  return true;
};

export const getCustomers = async (): Promise<Customer[]> => {
  const snapshot = await getDocs(collection(db, CUSTOMERS_COLLECTION));
  return snapshot.docs.map(doc => {
    const data = doc.data() as any;
    const transactions = data.transactions || [];
    return { id: doc.id, ...data, transactions, balance: calculateBalance(transactions) };
  });
};

export const saveCustomer = async (customer: Customer) => {
  customer.balance = calculateBalance(customer.transactions);
  const { id, ...dataToSave } = customer;
  if (id) await setDoc(doc(db, CUSTOMERS_COLLECTION, id), dataToSave);
  else await addDoc(collection(db, CUSTOMERS_COLLECTION), dataToSave);
};

export const deleteCustomer = async (id: string) => {
  await deleteDoc(doc(db, CUSTOMERS_COLLECTION, id));
  return true;
};

export const createTransaction = async (customerId: string, description: string, value: number, type: TransactionType, date: string) => {
  const customerRef = doc(db, CUSTOMERS_COLLECTION, customerId);
  const customerSnap = await getDoc(customerRef);
  if (customerSnap.exists()) {
    const transactions = customerSnap.data().transactions || [];
    const newTransaction = { id: Date.now().toString(), date, description, value, type, createdAt: Date.now() };
    transactions.push(newTransaction);
    await updateDoc(customerRef, { transactions });
    return newTransaction;
  }
  return null;
};

export const updateTransaction = async (customerId: string, transaction: Transaction) => {
  const customerRef = doc(db, CUSTOMERS_COLLECTION, customerId);
  const customerSnap = await getDoc(customerRef);
  if (customerSnap.exists()) {
    const transactions = customerSnap.data().transactions || [];
    const index = transactions.findIndex((t: any) => t.id === transaction.id);
    if (index !== -1) {
      transactions[index] = transaction;
      await updateDoc(customerRef, { transactions });
      return true;
    }
  }
  return false;
};

export const deleteTransaction = async (customerId: string, transactionId: string) => {
  const customerRef = doc(db, CUSTOMERS_COLLECTION, customerId);
  const customerSnap = await getDoc(customerRef);
  if (customerSnap.exists()) {
    const transactions = (customerSnap.data().transactions || []).filter((t: any) => t.id !== transactionId);
    await updateDoc(customerRef, { transactions });
    return true;
  }
  return false;
};

// --- Despesas (Expenses) ---

export const getExpenses = async (): Promise<Expense[]> => {
  const q = query(collection(db, EXPENSES_COLLECTION), orderBy("dueDate", "asc"));
  const snapshot = await getDocs(q);
  const todayStr = new Date().toISOString().split('T')[0];

  return snapshot.docs.map(doc => {
    const data = doc.data() as Omit<Expense, 'id'>;
    let status: 'PENDING' | 'PAID' | 'OVERDUE' = 'PENDING';
    
    if (data.paidDate) {
      status = 'PAID';
    } else if (data.dueDate < todayStr) {
      status = 'OVERDUE';
    }

    return { id: doc.id, ...data, status } as Expense;
  });
};

export const saveExpense = async (expense: Partial<Expense>) => {
  const { id, ...data } = expense;
  if (id) {
    await updateDoc(doc(db, EXPENSES_COLLECTION, id), data);
  } else {
    await addDoc(collection(db, EXPENSES_COLLECTION), {
      ...data,
      createdAt: Date.now()
    });
  }
};

export const deleteExpense = async (id: string) => {
  await deleteDoc(doc(db, EXPENSES_COLLECTION, id));
  return true;
};

export const exportData = async () => {
  const users = await getUsers();
  const customers = await getCustomers();
  const expenses = await getExpenses();
  return JSON.stringify({ users, customers, expenses, version: '2.5', exportedAt: new Date().toISOString() }, null, 2);
};

export const importData = async (jsonString: string) => {
  const data = JSON.parse(jsonString);
  if (data.customers) for (const c of data.customers) await saveCustomer(c);
  if (data.expenses) for (const e of data.expenses) await saveExpense(e);
  return true;
};
