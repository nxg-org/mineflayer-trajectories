import { InterceptFunctions } from "@nxg-org/mineflayer-util-plugin";
import { Block } from "prismarine-block";
import { Vec3 } from "vec3";
import { airResistance } from "./calc/constants";
import { getEntityAABB } from "./calc/aabbUtil";
import { AABBComponents } from "./types";

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
        const entityAABB = getEntityAABB({ position, height, width });
        let nearestDistance = entityAABB.distanceTo(points[0]);
        let currentDistance: number;
        let closestPoint = points[0];
        let intersect: Vec3 | null = null;
        let block: Block | null = null;

        for (let i = 0; i < points.length; i++) {
            const point = points[i];
            currentDistance = entityAABB.distanceTo(point);
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
        origin: Vec3,
        target: AABBComponents,
        rawVelocity: Vec3,
        gravity: number,
        blockChecker?: InterceptFunctions,
        blockChecking: boolean = false
    ): { positions: Vec3[]; velocities: Vec3[]; blockHit: Block | null, intersectPos: Vec3 | null } {
        // rawVelocity = notchianVel(rawVelocity).vel
        const entityAABB = getEntityAABB(target);
        let points: Vec3[] = [];
        let pointVelocities: Vec3[] = [];
        let blockHit: Block | null = null;
        let intersectPos: Vec3 | null = null;
        let tickVelocity = rawVelocity.clone();
        let nextPosition = origin.clone().add(rawVelocity);
        let totalTicks = 0;
        let offsetX: number = -tickVelocity.x * airResistance.h;
        let offsetY: number = gravity - tickVelocity.y * airResistance.y;
        let offsetZ: number = -tickVelocity.z * airResistance.h;

        while (totalTicks < 150) {
            points.push(origin.clone());
            pointVelocities.push(rawVelocity.clone());

            offsetX = -tickVelocity.x * airResistance.h;
            offsetY = -tickVelocity.y * airResistance.y - gravity;
            offsetZ = -tickVelocity.z * airResistance.h;

            if (blockChecking && blockChecker) {
                blockHit = blockChecker.check(origin, nextPosition)?.block;
                if (blockHit) break;
            }

            intersectPos = entityAABB.intersectsSegment(origin, nextPosition);
            if (intersectPos) break;
            

            if (rawVelocity.y < 0 && origin.y < 0) break;

            origin.add(rawVelocity);
            rawVelocity.translate(offsetX, offsetY, offsetZ);
            if (totalTicks % 1 === 0) tickVelocity = rawVelocity;
            nextPosition.add(rawVelocity);
        }

        return { positions: points, velocities: pointVelocities, blockHit, intersectPos };
    }

    static calculateShotForPoints(
        origin: Vec3,
        rawVelocity: Vec3,
        gravity: number,
        blockChecker?: InterceptFunctions,
        blockChecking: boolean = false
    ): { positions: Vec3[]; velocities: Vec3[]; blockHit: Block | null } {
        let points: Vec3[] = [];
        let pointVelocities: Vec3[] = [];
        let blockHit: Block | null = null;
        let tickVelocity = rawVelocity.clone();
        let nextPosition = origin.clone().add(rawVelocity);
        let totalTicks = 0;
        let offsetX: number = -tickVelocity.x * airResistance.h;
        let offsetY: number = gravity - tickVelocity.y * airResistance.y;
        let offsetZ: number = -tickVelocity.z * airResistance.h;

        while (totalTicks < 150) {
            points.push(origin.clone());
            pointVelocities.push(rawVelocity.clone());

            offsetX = -tickVelocity.x * airResistance.h;
            offsetY = -tickVelocity.y * airResistance.y - gravity;
            offsetZ = -tickVelocity.z * airResistance.h;

            if (blockChecking && blockChecker) {
                blockHit = blockChecker.check(origin, nextPosition)?.block;
                if (blockHit) break;
            }

            if (rawVelocity.y < 0 && origin.y < 0) break;

            origin.add(rawVelocity);
            rawVelocity.translate(offsetX, offsetY, offsetZ);
            if (totalTicks % 1 === 0) tickVelocity = rawVelocity;
            nextPosition.add(rawVelocity);
        }

        return { positions: points, velocities: pointVelocities, blockHit };
    }
}