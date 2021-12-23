import { AABB } from "@nxg-org/mineflayer-util-plugin"
import type { Block } from "prismarine-block";
import type {Vec3} from "vec3"

export function getEntityAABB(entity: { position: Vec3; height: number, width?: number}): AABB {
    const w = entity.width ?? (entity.height / 2);
    const { x, y, z } = entity.position;
    return new AABB(-w, 0, -w, w, entity.height, w).offset(x, y, z);
}

export function getBlockAABB(block: Block, height: number = 1) {
    const {x, y, z} = block.position
    return new AABB(x, y, z, x + 1, y + height, z + 1)
}

export function getBlockPosAABB(block: Vec3, height: number = 1) {
    const {x, y, z} = block.floored()
    return new AABB(x, y, z, x + 1, y + height, z + 1)
}