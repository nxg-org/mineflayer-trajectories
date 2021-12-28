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
        { position, yaw, pitch, velocity, heldItem, onGround }: ShotEntity,
        interceptCalcs?: InterceptFunctions,
        weapon?: string
    ): Shot {
        const info = trajectoryInfo[weapon! ?? heldItem?.name];
        if (!!info) {
            onGround ??= true;
            const projVel = yawPitchAndSpeedToDir(yaw!, pitch!, info.v0);
            const newOrgVel = velocity.clone().translate(0, onGround ? -velocity.y : 0, 0);
            return new Shot(newOrgVel, { position: position.offset(0, info.ph, 0), velocity: projVel, gravity: info.g }, interceptCalcs);
        } else {
            throw "Invalid weapon: " + weapon ?? heldItem?.name;
        }
    }

    //TODO: Support tridents. Lazy rn.
    static fromMob({ position, velocity, yaw, pitch, onGround }: ShotEntity, interceptCalcs?: InterceptFunctions): Shot {
        onGround ??= true;
        const projVel = yawPitchAndSpeedToDir(yaw!, pitch!, 1.6);
        const newOrgVel = velocity.clone().translate(0, onGround ? -velocity.y : 0, 0);
        return new Shot(newOrgVel, { position: position.offset(0, 1.64, 0), velocity: projVel, gravity: 0.05 }, interceptCalcs);
    }

    static fromEntity({ position, velocity, name }: ProjectileInfo, interceptCalcs?: InterceptFunctions) {
        const gravity = projectileGravity[name!];
        if (!!gravity) return new Shot(emptyVec, { position, velocity, gravity }, interceptCalcs);
        else throw `Invalid projectile type: ${name}`;
    }
}
