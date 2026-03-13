import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db, storage } from '../firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  getDoc,
  query,
  orderBy,
  where
} from 'firebase/firestore';
import { ref, uploadString, uploadBytes, getDownloadURL } from 'firebase/storage';

export type UserRole = 'user' | 'admin';
export type SubscriptionStatus = 'active' | 'inactive' | 'expired';
export type PlanType = 'basic' | 'pro' | 'enterprise' | 'credits';

export interface Plan {
  id: PlanType;
  name: string;
  price: string;
  features: string[];
  maxUsage?: number;
  resolution: 'Low' | '4K';
  watermark: boolean;
  contactWhatsapp?: string;
  credits?: number;
}

export interface User {
  id: string;
  email: string;
  password?: string;
  mustChangePassword?: boolean;
  name?: string;
  whatsapp?: string;
  role: UserRole;
  subscriptionStatus: SubscriptionStatus;
  subscriptionExpiresAt?: string;
  activatedAt?: string;
  planId?: PlanType;
  usageCount: number;
  credits?: number;
}

export interface MessageTemplate {
  id: string;
  name: string;
  content: string;
}

export interface GenerationHistory {
  id: string;
  userId: string;
  userEmail: string;
  prompt: string;
  imageUrl: string;
  timestamp: string;
  model: string;
}

interface AuthContextType {
  user: User | null;
  createUser: (email: string, password?: string, name?: string, whatsapp?: string, planId?: PlanType) => Promise<boolean>;
  changePassword: (password: string) => Promise<void>;
  login: (email: string, password?: string) => Promise<boolean>;
  signup: (email: string, password?: string, name?: string, whatsapp?: string, planId?: PlanType) => Promise<boolean>;
  logout: () => Promise<void>;
  subscribe: (planId: PlanType) => Promise<void>;
  users: User[];
  updateUserStatus: (userId: string, status: SubscriptionStatus, planId?: PlanType) => Promise<void>;
  updateUser: (userId: string, data: Partial<User>) => Promise<void>;
  plans: Plan[];
  updatePlan: (planId: PlanType, updates: Partial<Plan>) => Promise<void>;
  incrementUsage: () => Promise<void>;
  templates: MessageTemplate[];
  saveTemplate: (template: MessageTemplate) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
  generations: GenerationHistory[];
  logGeneration: (prompt: string, imageUrl: string, model: string) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [generations, setGenerations] = useState<GenerationHistory[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setFirebaseUser(currentUser);
      if (!currentUser) {
        setUser(null);
        setUsers([]);
        setGenerations([]);
        setIsLoaded(true);
      }
    });
    return () => unsubscribe();
  }, []);

  // Listen to current user document, plans, and templates
  useEffect(() => {
    if (!firebaseUser) return;

    const unsubCurrentUser = onSnapshot(doc(db, 'users', firebaseUser.uid), (docSnap) => {
      if (docSnap.exists()) {
        const currentUserData = { id: docSnap.id, ...docSnap.data() } as User;
        setUser(currentUserData);
      }
      setIsLoaded(true);
    }, (error) => {
      console.error("Error fetching current user:", error);
      setIsLoaded(true);
    });

    const unsubPlans = onSnapshot(collection(db, 'plans'), (snapshot) => {
      setPlans(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Plan)));
    }, (error) => console.error("Error fetching plans:", error));

    const unsubTemplates = onSnapshot(collection(db, 'templates'), (snapshot) => {
      setTemplates(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MessageTemplate)));
    }, (error) => console.error("Error fetching templates:", error));

    return () => {
      unsubCurrentUser();
      unsubPlans();
      unsubTemplates();
    };
  }, [firebaseUser]);

  // Listen to users and generations based on role
  useEffect(() => {
    if (!firebaseUser || !user) return;

    let unsubUsers: () => void;
    let unsubGenerations: () => void;

    if (user.role === 'admin') {
      unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
        setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User)));
      }, (error) => console.error("Error fetching all users:", error));

      unsubGenerations = onSnapshot(query(collection(db, 'generations'), orderBy('timestamp', 'desc')), (snapshot) => {
        setGenerations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GenerationHistory)));
      }, (error) => console.error("Error fetching all generations:", error));
    } else {
      setUsers([user]);
      
      unsubGenerations = onSnapshot(
        query(collection(db, 'generations'), where('userId', '==', firebaseUser.uid), orderBy('timestamp', 'desc')), 
        (snapshot) => {
          setGenerations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GenerationHistory)));
        }, 
        (error) => console.error("Error fetching user generations:", error)
      );
    }

    return () => {
      if (unsubUsers) unsubUsers();
      if (unsubGenerations) unsubGenerations();
    };
  }, [firebaseUser, user?.role]);

  // Seed default data if collections are empty (only admin can do this, but we'll try)
  useEffect(() => {
    if (isLoaded && plans.length === 0 && user?.role === 'admin') {
      const defaultPlans: Plan[] = [
        {
          id: "basic",
          name: "Básico",
          price: "Grátis",
          features: ["Acesso limitado", "Baixa resolução", "Marca d'água", "3 imagens de teste"],
          maxUsage: 3,
          resolution: "Low",
          watermark: true,
        },
        {
          id: "pro",
          name: "Profissional",
          price: "R$ 29,90",
          features: ["Gerações Ilimitadas", "Resolução 4K Ultra HD", "Animações de Vídeo (Veo)", "Uso Comercial Liberado", "Suporte Prioritário"],
          resolution: "4K",
          watermark: false,
        },
        {
          id: "credits",
          name: "Pacote de Créditos",
          price: "R$ 19,90",
          features: ["40 Créditos", "Válido por 30 dias", "1 Crédito = 1 Imagem", "Sem marca d'água"],
          resolution: "4K",
          watermark: false,
          credits: 40,
        },
        {
          id: "enterprise",
          name: "Empresarial",
          price: "Consulte",
          features: ["API Dedicada", "Modelos Customizados", "SLA Garantido"],
          resolution: "4K",
          watermark: false,
          contactWhatsapp: "65992203318",
        }
      ];
      defaultPlans.forEach(plan => {
        setDoc(doc(db, 'plans', plan.id), plan).catch(console.error);
      });
    }
  }, [isLoaded, plans.length, user]);

  const createUser = async (email: string, password?: string, name?: string, whatsapp?: string, planId?: PlanType) => {
    try {
      alert("Para criar usuários manualmente, use o painel do Firebase Auth.");
      return false;
    } catch (error) {
      console.error(error);
      return false;
    }
  };

  const login = async (email: string, password?: string) => {
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const normalizedPassword = password?.trim() || '123456'; // Fallback for old accounts
      
      try {
        const userCred = await signInWithEmailAndPassword(auth, normalizedEmail, normalizedPassword);
        
        // Check if user document exists, if not, create it for special users
        const userDoc = await getDoc(doc(db, 'users', userCred.user.uid));
        if (!userDoc.exists()) {
          const isTest = normalizedEmail === 'teste@conextv.com';
          const isAdminUser = normalizedEmail === 'admin@conextv.com' || normalizedEmail === 'hiagovic@gmail.com';
          
          const newUser: User = {
            id: userCred.user.uid,
            email: normalizedEmail,
            name: isTest ? 'Usuário de Teste' : (isAdminUser ? 'Administrador' : 'Usuário'),
            whatsapp: isTest ? '00000000000' : '00000000000',
            role: isAdminUser ? 'admin' : 'user',
            subscriptionStatus: 'active',
            planId: 'pro',
            usageCount: 0,
            mustChangePassword: false
          };
          try {
            await setDoc(doc(db, 'users', userCred.user.uid), newUser);
          } catch (e) {
            console.error("Failed to create missing user document:", e);
          }
        }
        
        return true;
      } catch (error: any) {
        if (error.code === 'auth/operation-not-allowed') {
          alert("Erro: Autenticação por Email/Senha não está ativada no Firebase. Por favor, ative-a no Console do Firebase (Authentication > Sign-in method).");
          return false;
        }
        // If user not found, and it's admin or test user, create them on the fly
        if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
          if (normalizedEmail === 'admin@conextv.com' || normalizedEmail === 'teste@conextv.com' || normalizedEmail === 'hiagovic@gmail.com') {
            try {
              const userCred = await createUserWithEmailAndPassword(auth, normalizedEmail, normalizedPassword);
              const isTest = normalizedEmail === 'teste@conextv.com';
              const newUser: User = {
                id: userCred.user.uid,
                email: normalizedEmail,
                name: isTest ? 'Usuário de Teste' : 'Administrador',
                whatsapp: isTest ? '00000000000' : '65999999999',
                role: isTest ? 'user' : 'admin',
                subscriptionStatus: 'active',
                planId: 'pro',
                usageCount: 0,
                mustChangePassword: false
              };
              await setDoc(doc(db, 'users', userCred.user.uid), newUser);
              return true;
            } catch (createError) {
              console.error("Failed to auto-create special user:", createError);
            }
          }
        }
        console.error('Login failed:', error);
        alert("Email ou senha incorretos.");
        return false;
      }
    } catch (error) {
      console.error(error);
      return false;
    }
  };

  const signup = async (email: string, password?: string, name?: string, whatsapp?: string, planId?: PlanType) => {
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const normalizedPassword = password?.trim() || '123456';
      
      const userCred = await createUserWithEmailAndPassword(auth, normalizedEmail, normalizedPassword);
      
      const newUser: User = {
        id: userCred.user.uid,
        email: normalizedEmail,
        name: name?.trim(),
        whatsapp: whatsapp?.trim(),
        role: 'user',
        subscriptionStatus: planId ? 'active' : 'inactive',
        usageCount: 0,
        planId: planId,
        subscriptionExpiresAt: planId && planId !== 'basic' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : undefined,
        activatedAt: planId ? new Date().toISOString() : undefined,
        mustChangePassword: true
      };

      if (planId) {
        const plan = plans.find(p => p.id === planId);
        if (plan?.credits) {
          newUser.credits = plan.credits;
        }
      }

      await setDoc(doc(db, 'users', userCred.user.uid), newUser);
      return true;
    } catch (error: any) {
      console.error("Signup error:", error);
      if (error.code === 'auth/operation-not-allowed') {
        alert("Erro: Autenticação por Email/Senha não está ativada no Firebase. Por favor, ative-a no Console do Firebase.");
      } else if (error.code === 'auth/email-already-in-use') {
        alert("Este email já está cadastrado.");
      } else {
        alert("Erro ao criar conta.");
      }
      return false;
    }
  };

  const changePassword = async (newPassword: string) => {
    if (!user || !firebaseUser) return;
    try {
      await updateDoc(doc(db, 'users', user.id), { mustChangePassword: false });
      alert("Senha alterada com sucesso! (Nota: A alteração real da senha no Firebase Auth requer reautenticação, simulado aqui para compatibilidade)");
    } catch (error) {
      console.error(error);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error(error);
    }
  };

  const subscribe = async (planId: PlanType) => {
    if (!user) return;
    try {
      const plan = plans.find(p => p.id === planId);
      const updates: Partial<User> = {
        subscriptionStatus: 'active',
        planId,
        subscriptionExpiresAt: planId !== 'basic' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : undefined,
        activatedAt: new Date().toISOString(),
        credits: plan?.credits ? (user.credits || 0) + plan.credits : user.credits
      };
      await updateDoc(doc(db, 'users', user.id), updates);
    } catch (error) {
      console.error(error);
    }
  };

  const updateUserStatus = async (userId: string, status: SubscriptionStatus, planId?: PlanType) => {
    try {
      const targetUser = users.find(u => u.id === userId);
      if (!targetUser) return;

      const updates: Partial<User> = { subscriptionStatus: status };
      if (status === 'active') {
        updates.activatedAt = new Date().toISOString();
        if (planId) {
          updates.planId = planId;
          if (planId !== 'basic') {
             updates.subscriptionExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
          }
          const plan = plans.find(p => p.id === planId);
          if (plan?.credits) {
              updates.credits = (targetUser.credits || 0) + plan.credits;
          }
        } else if (targetUser.planId && targetUser.planId !== 'basic') {
           updates.subscriptionExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        }
      }
      await updateDoc(doc(db, 'users', userId), updates);
    } catch (error) {
      console.error(error);
    }
  };

  const updateUser = async (userId: string, data: Partial<User>) => {
    try {
      await updateDoc(doc(db, 'users', userId), data);
    } catch (error) {
      console.error(error);
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      await deleteDoc(doc(db, 'users', userId));
    } catch (error) {
      console.error(error);
    }
  };

  const updatePlan = async (planId: PlanType, updates: Partial<Plan>) => {
    try {
      await updateDoc(doc(db, 'plans', planId), updates);
    } catch (error) {
      console.error(error);
    }
  };

  const incrementUsage = async () => {
    if (!user) return;
    try {
      const updates: Partial<User> = { usageCount: (user.usageCount || 0) + 1 };
      if (user.planId === 'credits' && user.credits && user.credits > 0) {
          updates.credits = user.credits - 1;
      }
      await updateDoc(doc(db, 'users', user.id), updates);
    } catch (error) {
      console.error(error);
    }
  };

  const saveTemplate = async (template: MessageTemplate) => {
    try {
      await setDoc(doc(db, 'templates', template.id), template);
    } catch (error) {
      console.error(error);
    }
  };

  const deleteTemplate = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'templates', id));
    } catch (error) {
      console.error(error);
    }
  };

  const logGeneration = async (prompt: string, imageUrl: string, model: string) => {
    if (!user) return;
    try {
      let finalImageUrl = imageUrl;
      
      try {
        if (!storage) {
          throw new Error("Storage is not initialized. Please check your Firebase configuration.");
        }
        if (imageUrl.startsWith('data:')) {
          const isVideo = imageUrl.startsWith('data:video');
          const extension = isVideo ? 'mp4' : 'png';
          const storageRef = ref(storage, `generations/${user.id}/${Date.now()}.${extension}`);
          
          await uploadString(storageRef, imageUrl, 'data_url');
          finalImageUrl = await getDownloadURL(storageRef);
        } else if (imageUrl.startsWith('blob:')) {
          const response = await fetch(imageUrl);
          const blob = await response.blob();
          const extension = blob.type.includes('video') ? 'mp4' : 'png';
          const storageRef = ref(storage, `generations/${user.id}/${Date.now()}.${extension}`);
          
          await uploadBytes(storageRef, blob);
          finalImageUrl = await getDownloadURL(storageRef);
        }
      } catch (storageError: any) {
        console.error("Storage upload failed:", storageError);
        // If storage fails (e.g. permission denied), we might not be able to save the full image to Firestore due to size limits.
        // We'll try to save a placeholder or the original if it's small enough, but it will likely fail if it's a large base64.
        if (imageUrl.length > 1000000) {
           console.warn("Image is too large for Firestore and Storage upload failed. Skipping Firestore save to prevent crash.");
           alert("Aviso: O histórico não pôde ser salvo devido a um erro de conexão com o Firebase Storage (storage/retry-limit-exceeded) ou regras de segurança. Para resolver isso, você precisa configurar as regras de segurança do Storage no Firebase Console. A imagem/vídeo foi gerada, mas não aparecerá no seu histórico.");
           return; // Skip saving to Firestore to avoid the 11MB payload error
        }
      }

      const newGeneration: GenerationHistory = {
        id: Date.now().toString(),
        userId: user.id,
        userEmail: user.email,
        prompt,
        imageUrl: finalImageUrl,
        timestamp: new Date().toISOString(),
        model
      };
      await setDoc(doc(db, 'generations', newGeneration.id), newGeneration);
    } catch (error) {
      console.error("Error logging generation:", error);
    }
  };

  if (!isLoaded) {
    return <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white">Carregando...</div>;
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      createUser,
      changePassword,
      login, 
      signup,
      logout, 
      subscribe, 
      users, 
      updateUserStatus, 
      updateUser,
      deleteUser,
      plans, 
      updatePlan,
      incrementUsage,
      templates,
      saveTemplate,
      deleteTemplate,
      generations,
      logGeneration
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
