interface AuthState {
   isSignedIn: boolean;
   username: string | null;
   userId: string | null;
}

type AuthContext = {
   isSignedIn: boolean;
   username: string | null;
   userId: string | null;
   refreshAuth: () => Promise<void>;
   signIn: () => Promise<void>;
   signOut: () => Promise<void>;
};
