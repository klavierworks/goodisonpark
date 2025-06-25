import { $allEntries, $entries } from "../../../store/data";
import useAtomState from "../useAtomState";
import Model from "./Model/Model";

const Space = () => {
  const [entries] = useAtomState($allEntries);

  return null;
  return <Model entries={entries} />
}

export default Space;