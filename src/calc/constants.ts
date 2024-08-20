import { ProjectileEnvInfo } from "../types";

type ProjectileInfos = { [name: string]: ProjectileEnvInfo };


export const projectileGravity: Record<string, number> = {
  arrow: 0.05,
  trident: 0.05,
  egg: 0.04,
  snowball: 0.04,
  ender_pearl: 0.0375,
  splash_potion: 0.03,
  firework_rocket: 0.0,
  fishing_bobber: 0.03,
};

export const projectileAirResistance: Record<string, number> = {
  arrow: 0.99,
  trident: 0.99,
  egg: 0.99,
  snowball: 0.99,
  ender_pearl: 0.99,
  splash_potion: 0.99,
  firework_rocket: 0.99,
  fishing_bobber: 0.92,
};

export const trajectoryInfo: ProjectileInfos = {
  bow: { v0: 3, g: projectileGravity["arrow"], ph: 1.62, a: projectileAirResistance["arrow"] },
  crossbow: { v0: 3.15, g: projectileGravity["arrow"], ph: 1.62, a: projectileAirResistance["arrow"] },
  crossbow_firework: { v0: 1.6, g: projectileGravity["firework_rocket"], ph: 1.62, a: projectileAirResistance["firework_rocket"] },
  trident: { v0: 2.5, g: projectileGravity["trident"], ph: 1.62, a: projectileAirResistance["trident"] },
  snowball: { v0: 1.5, g: projectileGravity["snowball"], ph: 1.52, a: projectileAirResistance["snowball"] },
  egg: { v0: 1.5, g: projectileGravity["egg"], ph: 1.52, a: projectileAirResistance["egg"] },
  ender_pearl: { v0: 1.5, g: projectileGravity["ender_pearl"], ph: 1.52, a: projectileAirResistance["ender_pearl"] },
  splash_potion: { v0: 0.4, g: projectileGravity["potion"], ph: 1.52, a: projectileAirResistance["potion"] },
  fishing_rod: { v0: 1.5, g: projectileGravity["fishing_bobber"], ph: 1.62, a: projectileAirResistance["fishing_bobber"] }, // TODO: nake v0 variable dependent on yaw and pitch.
};

export enum BlockFace {
  UNKNOWN = -999,
  BOTTOM = 0,
  TOP = 1,
  NORTH = 2,
  SOUTH = 3,
  WEST = 4,
  EAST = 5,
}
