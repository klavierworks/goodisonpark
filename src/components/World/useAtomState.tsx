import type { Atom } from "nanostores";
import { useEffect, useState } from "react";

const useAtomState = <T,>(atom: Atom<T>) => {
  const [state, setState] = useState<T>(atom.get());

  useEffect(() => {
    const unsubscribe = atom.subscribe(setState);
    return () => unsubscribe();
  }, [atom]);

  return [state, setState] as const;
}

export default useAtomState;