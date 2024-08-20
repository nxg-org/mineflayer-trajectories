import { InterceptFunctions } from "@nxg-org/mineflayer-util-plugin";
import { Block } from "prismarine-block";
import { Vec3 } from "vec3";
import { projectileGravity, projectileAirResistance, trajectoryInfo } from "./calc/constants";
import { AABBUtils } from "@nxg-org/mineflayer-util-plugin";
const { getEntityAABBRaw } = AABBUtils;
import { AABBComponents, BaseProjectileObjInfo, ProjectileMotion } from "./types";

export class StaticShot {
    static checkForEntityHitFromSortedPoints(
        { position, height, width }: AABBComponents,
        points: Vec3[],
        notchianPointVecs: Vec3[],
        blockChecker?: InterceptFunctions,
        blockChecking: boolean = false
    ): { closestPoint: Vec3; blockHit: Block | null } {
        if (points.length === 0 || notchianPointVecs.length === 0) throw "Not enough points.";
        if (points.length !== notchianPointVecs.length) throw "Invalid positions or velocities: Different amount of inputs.";
        const entityAABB = getEntityAABBRaw({ position, height, width });
        let nearestDistance = entityAABB.distanceToVec(points[0]);
        let currentDistance: number;
        let closestPoint = points[0];
        let intersect: Vec3 | null = null;
        let block: Block | null = null;

        for (let i = 0; i < points.length; i++) {
            const point = points[i];
            currentDistance = entityAABB.distanceToVec(point);
            if (nearestDistance > currentDistance) break;
            nearestDistance = currentDistance;
            closestPoint = point;

            const nextPoint = point.clone().add(notchianPointVecs[i]);
            if (blockChecking && blockChecker) {
                block = blockChecker.check(point, nextPoint)?.block;
                if (block) break;
            }
            intersect = entityAABB.intersectsSegment(point, nextPoint);
            if (intersect) break;
        }

        return { closestPoint: intersect ?? closestPoint, blockHit: block };
    }

    static calculateShotForCollision(
        { position, velocity, name }: BaseProjectileObjInfo,
        target: AABBComponents,
        blockChecking: boolean = false,
        blockChecker?: InterceptFunctions
    ): { positions: Vec3[]; velocities: Vec3[]; blockHit: Block | null; intersectPos: Vec3 | null } {
        if (!projectileGravity[name!]) throw "invalid projectile: " + name;

        const gravity = projectileGravity[name!];
        const entityAABB = getEntityAABBRaw(target);
        let points: Vec3[] = [];
        let pointVelocities: Vec3[] = [];
        let blockHit: Block | null = null;
        let intersectPos: Vec3 | null = null;
        let tickVelocity = velocity.clone();
        let currentPosition = position.clone();
        let nextPosition = position.clone().add(tickVelocity);
        let totalTicks = 0;

        let aH = projectileAirResistance[name!];
        let aY = projectileAirResistance[name!];

        let offsetX: number = -tickVelocity.x * aH;
        let offsetY: number = -tickVelocity.y * aY - gravity;
        let offsetZ: number = -tickVelocity.z * aH;

        while (totalTicks < 300) {
            points.push(currentPosition.clone());
            pointVelocities.push(tickVelocity.clone());

            offsetX = -tickVelocity.x * aH;
            offsetY = -tickVelocity.y * aY - gravity;
            offsetZ = -tickVelocity.z * aH;

            if (blockChecking && blockChecker) {
                blockHit = blockChecker.check(currentPosition, nextPosition)?.block;
                if (blockHit) break;
            }

            intersectPos = entityAABB.intersectsSegment(currentPosition, nextPosition);
            if (intersectPos) break;

            if (tickVelocity.y < 0 && currentPosition.y < 0) break;

            console.log(currentPosition);
            currentPosition.add(tickVelocity);
            tickVelocity.translate(offsetX, offsetY, offsetZ);
            nextPosition.add(tickVelocity);
        }

        return { positions: points, velocities: pointVelocities, blockHit, intersectPos };
    }

    static calculateShotForPoints(
        { position, velocity, name }: BaseProjectileObjInfo,
        blockChecking: boolean = false,
        blockChecker?: InterceptFunctions,
    ): { positions: Vec3[]; velocities: Vec3[]; blockHit: Block | null } {
        if (!projectileGravity[name!]) throw "invalid projectile: " + name;
        const gravity = projectileGravity[name!];
        console.log(gravity);
        
     
        let points: Vec3[] = [];
        let pointVelocities: Vec3[] = [];
        let blockHit: Block | null = null;
        let currentVelocity = velocity.clone();
        let currentPosition = position.clone();
        let nextPosition = position.clone().add(currentVelocity);
        let totalTicks = 0;

        let aH = projectileAirResistance[name!];
        let aY = projectileAirResistance[name!];

        let offsetX: number = -currentVelocity.x * aH;
        let offsetY: number = -currentVelocity.y * aY - gravity;
        let offsetZ: number = -currentVelocity.z * aH;

        while (totalTicks < 300) {
            points.push(currentPosition.clone());
            pointVelocities.push(currentVelocity.clone());

            offsetX = -currentVelocity.x * aH;
            offsetY = -currentVelocity.y * aY - gravity;
            offsetZ = -currentVelocity.z * aH;

            if (blockChecking && blockChecker) {
                blockHit = blockChecker.check(currentPosition, nextPosition)?.block;
                if (blockHit) {
                    // TODO: add block hit position
                    break
                }
            }

            if (currentVelocity.y < 0 && currentPosition.y < 0) break;

            currentPosition.add(currentVelocity);
            currentVelocity.translate(offsetX, offsetY, offsetZ);
            nextPosition.add(currentVelocity);
        }

        return { positions: points, velocities: pointVelocities, blockHit };
    }
}
