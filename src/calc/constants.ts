type ProjectileInfo = { v0: number; g: number };
type ProjectileInfos = { [name: string]: ProjectileInfo };
type ProjectileGravity = {[name: string]: number;}


export const trajectoryInfo: ProjectileInfos = {
    bow: { v0: 3, g: 0.05 },
    crossbow: { v0: 3.15, g: 0.05 },
    crossbow_firework: {v0: 1.6, g: 0.00 },
    trident: { v0: 2.5, g: 0.05 },
    snowball: {v0: 1.5, g: 0.04 },
    egg: {v0: 1.5, g: 0.04 },
    ender_pearl: { v0: 1.5, g: 0.0375 },
    splash_potion: { v0: 0.4, g: 0.03 },

};

export const projectileGravity: ProjectileGravity = {
    arrow: 0.05,
    trident: 0.05,
    egg: 0.04,
    snowball: 0.04,
    ender_pearl: 0.04,
    splash_potion: 0.03,
    firework_rocket: 0.00,
} 


export const airResistance = {
    y: 0.01,
    h: 0.01
}


export enum BlockFace {
    UNKNOWN = -999,
    BOTTOM = 0,
    TOP = 1,
    NORTH = 2,
    SOUTH = 3,
    WEST = 4,
    EAST = 5,
}