import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Config do Firebase — não é segredo (identifica o projeto, não autentica
// acesso; a segurança real vem das regras do Firestore), por isso fica
// comitada direto no repo em vez de .env.
// Sem Cloud Storage: exige plano Blaze (cartão cadastrado), então o
// comprovante de pagamento é um link colado (Google Fotos/Drive), não
// upload — ver comprovante_url em src/types/models.ts.
const firebaseConfig = {
  apiKey: 'AIzaSyAo_C4DDPqc4zpKGkIit64y9P2QQBJ-R5c',
  authDomain: 'contas-a-dois-1e084.firebaseapp.com',
  projectId: 'contas-a-dois-1e084',
  storageBucket: 'contas-a-dois-1e084.firebasestorage.app',
  messagingSenderId: '235740035030',
  appId: '1:235740035030:web:ed9513a96ae02223259677',
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
