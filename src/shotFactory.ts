import { InterceptFunctions } from "@nxg-org/mineflayer-util-plugin";
import { Vec3 } from "vec3";
import { projectileGravity, projectileAirResistance, trajectoryInfo } from "./calc/constants";
import { yawPitchAndSpeedToDir } from "./calc/mathUtils";
import { Shot } from "./shot";
import { ShotEntity, ProjectileEnvInfo, BaseProjectileObjInfo } from "./types";

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
      return new Shot(
        newOrgVel,
        { position: position.offset(0, info.ph, 0), velocity: projVel, gravity: info.g, airResistance: info.a },
        interceptCalcs
      );
    } else {
      throw "Invalid weapon: " + weapon ?? heldItem?.name;
    }
  }

  //TODO: Support tridents. Lazy rn.
  static fromMob({ position, velocity, yaw, pitch, onGround, name }: ShotEntity, interceptCalcs?: InterceptFunctions): Shot {
    onGround ??= true;
    const projVel = yawPitchAndSpeedToDir(yaw!, pitch!, 1.6);
    const newOrgVel = velocity.clone().translate(0, onGround ? -velocity.y : 0, 0);
    
    let info: ProjectileEnvInfo = trajectoryInfo.bow;

    if (name != null) {
      switch (name) {
        case "drowned": {
          info = trajectoryInfo.trident;
        }

        case "skeleton":
        default: {
          info = trajectoryInfo.bow;
          break;
        }
      }
    }

    return new Shot(
      newOrgVel,
      { position: position.offset(0, 1.62, 0), velocity: projVel, gravity: info.g, airResistance: info.a },
      interceptCalcs
    );
  }

  static fromEntity({ position, velocity, name }: BaseProjectileObjInfo, interceptCalcs?: InterceptFunctions) {
    const gravity = projectileGravity[name!];
    const airResistance = projectileAirResistance[name!];
    if (!!gravity) return new Shot(emptyVec, { position, velocity, gravity, airResistance }, interceptCalcs);
    else throw `Invalid projectile type: ${name}`;
  }
}
