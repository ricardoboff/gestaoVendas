export enum TransactionType {
  SALE = 'SALE', // Venda (Débito do cliente)
  PAYMENT = 'PAYMENT' // Pagamento (Crédito do cliente)
}

export interface Transaction {
  id: string;
  date: string; // ISO Date or simple string
  description: string;
  value: number;
  type: TransactionType;
  createdAt: number;
}

export interface Customer {
  id: string;
  name: string;
  cpf?: string;
  phonePrimary: string;
  phoneSecondary?: string;
  address?: string;
  notes?: string;
  transactions: Transaction[];
  balance: number; // Positive means client owes money
}

export interface User {
  id: string;
  name: string;
  username: string;
  role: 'admin' | 'user'; // Adicionado para controle de acesso
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
}