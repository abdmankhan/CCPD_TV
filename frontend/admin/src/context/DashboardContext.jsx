import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import { BACKEND_URL } from "../config";

const DashboardContext = createContext(null);

export function DashboardProvider({ children }) {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadState = async () => {
      try {
        const res = await axios.get(`${BACKEND_URL}/dashboard-state`);
        setDashboard(res.data);
      } catch (err) {
        console.error("Failed to fetch dashboard state", err);
      } finally {
        setLoading(false);
      }
    };

    loadState();
  }, []);

  return (
    <DashboardContext.Provider value={{ dashboard, setDashboard, loading }}>
      {children}
    </DashboardContext.Provider>
  );
}

export const useDashboard = () => useContext(DashboardContext);
