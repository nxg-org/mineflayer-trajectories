import { InterceptFunctions } from "@nxg-org/mineflayer-util-plugin";
import { Vec3 } from "vec3";
import { trajectoryInfo } from "./calc/constants";
import { yawPitchAndSpeedToDir } from "./calc/mathUtilts";
import { Shot } from "./shot";
import { ProjectileMotion, ShotEntity } from "./types";

const emptyVec = new Vec3(0, 0, 0);


export class ShotFactory {


    static fromShootingPlayer(
        { position, yaw, pitch, velocity, heldItem }: ShotEntity,
        interceptCalcs?: InterceptFunctions,
        weapon?: string
    ): Shot {
        const info = trajectoryInfo[weapon! ?? heldItem?.name];
        if (!!info) {
            const projVel = yawPitchAndSpeedToDir(yaw!, pitch!, info.v0);
            return new Shot(velocity, { position: position.offset(0, 1.62, 0), velocity: projVel, gravity: info.g }, interceptCalcs);
        } else {
            throw "Invalid weapon";
        }
    }

    static fromWeapon({ position, velocity }: ProjectileMotion, interceptCalcs?: InterceptFunctions): Shot {
        return new Shot(emptyVec, { position, velocity, gravity: 0.05 }, interceptCalcs);
    }

    static fromThrowable({ position, velocity }: ProjectileMotion, interceptCalcs?: InterceptFunctions): Shot {
        return new Shot(emptyVec, { position, velocity, gravity: 0.03 }, interceptCalcs);
    }

    static withoutGravity({ position, velocity }: ProjectileMotion, interceptCalcs?: InterceptFunctions): Shot {
        return new Shot(emptyVec, { position, velocity, gravity: 0.00 }, interceptCalcs);
    }

    static customGravity({ position, velocity }: ProjectileMotion, gravity: number, interceptCalcs?: InterceptFunctions,): Shot {
        return new Shot(emptyVec, { position, velocity, gravity }, interceptCalcs);
    }

}