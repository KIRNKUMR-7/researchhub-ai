// SearchPapers.tsx — Legacy page, replaced by PlotDirectory
// Keeping this file as a redirect shim so that any stray links don't hard-crash.
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function SearchPapers() {
  const navigate = useNavigate();
  useEffect(() => { navigate("/plots", { replace: true }); }, [navigate]);
  return null;
}
