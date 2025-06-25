import { useEffect } from "react";

type FallbackProps = {
  onLoadRef: {
    current: () => void;
  }
};
const Fallback = ({ onLoadRef }: FallbackProps) => {
  useEffect(() => {
    return () => {
      onLoadRef.current();
    }
  }, []);

  return null;
}

export default Fallback;