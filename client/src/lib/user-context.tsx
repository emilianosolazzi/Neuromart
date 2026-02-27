import { createContext, useContext, useState, useEffect } from "react";
import { useUsers } from "@/hooks/use-users";

interface UserContextType {
  userId: number | null;
  setUserId: (id: number | null) => void;
}

const UserContext = createContext<UserContextType>({
  userId: null,
  setUserId: () => {},
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<number | null>(null);
  const { data: users, isLoading } = useUsers();

  useEffect(() => {
    // Auto-select the first user if none selected (Mock Auth behavior)
    if (!isLoading && users && users.length > 0 && !userId) {
      setUserId(users[0].id);
    }
  }, [users, isLoading, userId]);

  return (
    <UserContext.Provider value={{ userId, setUserId }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);
