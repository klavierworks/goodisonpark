import { useTexture } from "@react-three/drei";
import { ASSET_URL } from "astro:env/client";

type TileProps = {
  entry: Entry
} & React.ComponentPropsWithoutRef<'sprite'>;

const Tile = ({ entry, ...rest }: TileProps) => {
  const texture = useTexture(ASSET_URL + `videos/${entry.filename}/${entry.filename}.jpg`);

  return (
    <sprite {...rest} scale={[entry.thumbnail.width, entry.thumbnail.height, 1]}>
      <spriteMaterial attach="material" map={texture} transparent opacity={0} />
    </sprite>
  )
}

export default Tile;