import { $allEntries } from "../../../store/data";
import useAtomState from "../useAtomState";
import Model from "./Model/Model";

const Space = () => {
  const [entries] = useAtomState($allEntries);

  return <Model entries={entries} />
}

export default Space;