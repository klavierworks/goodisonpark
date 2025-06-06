import { useEffect } from "react";
import { $isLoading } from "../../../store/data";

const Fallback = () => {
  useEffect(() => {
    $isLoading.set(true);
    return () => {
      $isLoading.set(false);
    };
  }, []);

  return null;
}

export default Fallback;