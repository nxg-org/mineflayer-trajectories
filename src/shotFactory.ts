import { InterceptFunctions } from "@nxg-org/mineflayer-util-plugin";
import { Vec3 } from "vec3";
import { projectileGravity, trajectoryInfo } from "./calc/constants";
import { yawPitchAndSpeedToDir } from "./calc/mathUtilts";
import { Shot } from "./shot";
import { ProjectileInfo, ProjectileMotion, ShotEntity } from "./types";

const emptyVec = new Vec3(0, 0, 0);

export class ShotFactory {
    static fromPlayer = ShotFactory.fromShootingPlayer;

    static fromShootingPlayer(
        { position, yaw, pitch, velocity, heldItem }: ShotEntity,
        interceptCalcs?: InterceptFunctions,
        weapon?: string
    ): Shot {
        const info = trajectoryInfo[weapon! ?? heldItem?.name];
        if (!!info) {
            const projVel = yawPitchAndSpeedToDir(yaw!, pitch!, info.v0);
            return new Shot(velocity, { position: position.offset(0, info.ph, 0), velocity: projVel, gravity: info.g }, interceptCalcs);
        } else {
            throw "Invalid weapon: " + weapon ?? heldItem?.name;
        }
    }

    static fromEntity({ position, velocity, name }: ProjectileInfo, interceptCalcs?: InterceptFunctions) {
        const gravity = projectileGravity[name!];
        if (!!gravity) return new Shot(velocity, { position, velocity, gravity }, interceptCalcs);
        else throw `Invalid projectile type: ${name}`;
    }
}
