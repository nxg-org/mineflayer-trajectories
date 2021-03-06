import { Entity } from "minecraft-data";
import type { Block } from "prismarine-block";
import type { Item } from "prismarine-item";
import type { Vec3 } from "vec3";

export type ShotEntity = { position: Vec3; velocity: Vec3; yaw?: number; pitch?: number; heldItem?: Item, name?: string, onGround?: boolean };
export type AABBComponents = { position: Vec3; height: number; width?: number };
export type ProjectileMotion = { position: Vec3; velocity: Vec3; gravity?: number };
export type ProjectileInfo =  { position: Vec3; velocity: Vec3; name?: string }
export type BasicShotInfo = {
    nearestDistance: number;
    blockingBlock?: Block | null;
    intersectPos?: Vec3 | null;
    closestPoint?: Vec3 | null;
    totalTicks: number;
};

export type BoundedShotInfo = {
    entity: {position: Vec3, height: number, width?: number},
    shotInfo: BasicShotInfo
}