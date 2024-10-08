import { Vec3 } from "vec3";
import type { Bot } from "mineflayer";
import { Block } from "prismarine-block";
import type { Entity } from "prismarine-entity";
import type { Item } from "prismarine-item";
import {
    dirToYawAndPitch,
    yawPitchAndSpeedToDir,
    pointToYawAndPitch,
    vectorMagnitude,
    getVoy,
    degreesToRadians,
    getVox,
    getVo,
    getGrades,
    getTargetDistance,
    getPremonition,
    VoToVox,
    notchianVel,
} from "./calc/mathUtils";
import { trajectoryInfo, projectileAirResistance, BlockFace } from "./calc/constants";
import { AABBUtils } from "@nxg-org/mineflayer-util-plugin";
const { getBlockAABB, getBlockPosAABB, getEntityAABBRaw } = AABBUtils;
import { promisify } from "util";
import { AABB, InterceptFunctions } from "@nxg-org/mineflayer-util-plugin";
import { AABBComponents, BasicShotInfo, BoundedShotInfo, ProjectileMotion, ShotEntity } from "./types";

const emptyVec = new Vec3(0, 0, 0);

/**
 * TODO: Change hit detection from AABB -> Ray to AABB -> Moving AABB of 0.5h, 0.5w.
 * ! We are "missing" shots due to this miscalculation.
 * * DONE! WOOOOOOOOOO
 *
 * TODO: Completely rewrite arrow trajectory calculation. Currently using assumptions, can be much better.
 * ! It is very fast; I will have to optimize even more.
 * * DONE! WOOOOOOOOOO
 *
 * TODO: Work on caching arrow trajectories. This will speed up repeated look-ups and encourage reuse of classes to save RAM/CPU.
 *
 */

/**
 * uses:
 * (a) calculate shot based off current entities yaw and target
 * (b) calculate correct yaw and target
 * (c) better block detection
 * (d) velocity checks
 */

/**
 * Purposely left off prediction.
 * You can handle that outside of the Shot class.
 */

export class Shot {
    readonly initialPos: Vec3;
    readonly initialVel: Vec3;
    readonly initialYaw: number;
    readonly initialPitch: number;
    readonly gravity: number;
    readonly airResistance: number;
    private points: Vec3[];
    private pointVelocities: Vec3[];
    private blockHit = false;
    public interceptCalcs?: InterceptFunctions;
    public blockCheck: boolean = false;

    constructor(
        originVel: Vec3,
        { position: pPos, velocity: pVel, gravity, airResistance }: Required<ProjectileMotion>,
        interceptCalcs?: InterceptFunctions
    ) {
        const { yaw, pitch } = dirToYawAndPitch(pVel);
        this.initialPos = pPos.clone();
        this.initialVel = pVel.clone().add(originVel);
        this.gravity = gravity;
        this.airResistance = airResistance;
        this.initialYaw = yaw;
        this.initialPitch = pitch;
        this.points = [];
        this.pointVelocities = [];
        this.interceptCalcs = interceptCalcs;
    }

    public canCollisionDetect(): boolean {
        return !!this.interceptCalcs;
    }

    public loadWorld(bot: Bot): void {
        if (!this.interceptCalcs) this.interceptCalcs = new InterceptFunctions(bot);
    }

    public HitCheckXZ(entity: AABBComponents): boolean {
        return !!this.entityXZInterceptCheck(entity);
    }

    public entityXYZInterceptCheck({ position, height, width }: AABBComponents): Vec3 | null {
        return getEntityAABBRaw({ position, height, width }).intersectsRay(this.initialPos, this.initialVel);
    }

    public entityXZInterceptCheck({ position, height, width }: AABBComponents): { x: number; z: number } | null {
        return getEntityAABBRaw({ position, height, width }).xzIntersectsRay(this.initialPos, this.initialVel);
    }

    public hitEntitiesCheckXZ(...entities: Entity[]): Entity[] {
        return entities
            .sort((a, b) => a.position.distanceTo(this.initialPos) - b.position.distanceTo(this.initialPos))
            .filter((e) => this.HitCheckXZ(e));
    }

    private aabbHitCheckXZ(...aabbs: AABBComponents[] | AABB[]): AABB[] {
        if (!(aabbs instanceof AABB)) aabbs = (aabbs as AABBComponents[]).map(getEntityAABBRaw);
        return (aabbs as AABB[])
            .sort((a, b) => a.xzDistanceToVec(this.initialPos) - b.xzDistanceToVec(this.initialPos))
            .filter((box) => !!box.xzIntersectsRay(this.initialPos, this.initialVel));
    }

    public hitEntitiesCheck(blockCheck: boolean = false, ...entities: AABBComponents[]): { entity: AABB; shotInfo: BasicShotInfo }[] {
        const shots = [];
        const possibleEntities = this.aabbHitCheckXZ(...entities);
        for (const entity of possibleEntities) {
            shots.push({ entity, shotInfo: this.calcToEntity(entity, blockCheck) });
        }
        return shots;
    }

    public hitsEntity(
        entity: AABBComponents,
        extras: { yawChecked: boolean; blockCheck: boolean } = { yawChecked: false, blockCheck: true }
    ): BoundedShotInfo | null {
        if (extras.yawChecked) {
            return { entity: entity, shotInfo: this.calcToEntity(entity, extras.blockCheck) };
        } else {
            const shotInfo = this.hitEntitiesCheck(extras.blockCheck, entity)[0]?.shotInfo;
            return !!shotInfo ? { entity, shotInfo } : null;
        }
    }

    //TODO: Make this *not* lazy.
    public hitsEntities(blockCheck: boolean = false, ...entities: AABBComponents[]): BoundedShotInfo[] {
        const hits = [];
        for (const info of this.hitEntitiesCheck(blockCheck, ...entities)) {
            const found = entities.find((e) => getEntityAABBRaw(e).equals(info.entity))!;
            hits.push({ entity: found, shotInfo: info.shotInfo });
        }
        return hits;
    }

    public hitsEntityWithPrediction({ position, height, width }: AABBComponents, avgSpeed: Vec3): BasicShotInfo {
        //Ignore XZ check as we will check two different XZ coords.
        const calcShot = this.calcToEntity({ position, height, width });
        const { newTarget } = getPremonition(
            this.initialPos,
            position.clone().add(avgSpeed.clone().scale(calcShot.totalTicks + 5)),
            avgSpeed,
            calcShot.totalTicks
        );
        const newAABB = getEntityAABBRaw({ position: newTarget, height, width });
        const calcPredictShot = this.calcToEntity(newAABB, true);
        return calcPredictShot;
    }

    /**
     *
     * @param {boolean} blockChecking Whether to check for blocks or not.
     * @param {Entity[]} Entity list of entities from Prismarine-entity.
     * @returns TODO: Typing
     */
    public calcToIntercept(blockChecking: boolean = false, entities: Entity[] = []) {
        const entityAABBs = entities
            .sort((a, b) => this.initialPos.distanceTo(a.position) - this.initialPos.distanceTo(b.position))
            .map((e) => getEntityAABBRaw(e)); //slightly inaccurate.
        let currentPosition = this.initialPos.clone();
        let currentVelocity = this.initialVel.clone();
        let nextPosition = currentPosition.clone().add(currentVelocity);
        let hitPos: Vec3 | null = null;
        let block: Block | null = null;

        let totalTicks = 0;
        const gravity = this.gravity; // + this.gravity * airResistance.y;
        let offsetX: number = -currentVelocity.x * this.airResistance;
        let offsetY: number = -currentVelocity.y * this.airResistance - gravity;
        let offsetZ: number = -currentVelocity.z * this.airResistance;

        while (totalTicks < 300) {
            totalTicks += 1;
            offsetX = -currentVelocity.x * this.airResistance;
            offsetY = -currentVelocity.y * this.airResistance - gravity;
            offsetZ = -currentVelocity.z * this.airResistance;

            if (blockChecking && this.interceptCalcs) {
                block = this.interceptCalcs.check(currentPosition, nextPosition)?.block;
            }

            if (block) {
                const blockAABB = getBlockAABB(block);
                hitPos = blockAABB.intersectsSegment(currentPosition, nextPosition);
                break;
            }

            //TODO:  Make this check more efficient by checking from line, not from entity AABBs.
            const hits = entityAABBs.map((aabb) => aabb.intersectsSegment(currentPosition, nextPosition)).filter((vec) => !!vec);
            if (hits.length > 0) {
                hitPos = hits[0]; //sorted for distance already.
                break;
            }

            if (currentVelocity.y < 0 && currentPosition.y < 0) break;

            currentPosition.add(currentVelocity);
            currentVelocity.translate(offsetX, offsetY, offsetZ);
            nextPosition.add(currentVelocity);
        }

        return {
            block,
            hitPos,
            totalTicks,
        };
    }

    public calcToEntity(target: AABBComponents | AABB, blockChecking: boolean = false): BasicShotInfo {
        if (!(target instanceof AABB)) target = getEntityAABBRaw(target);
        // height = height = 1.62 ? height + 0.18 : 0;
        const entityAABB = target;
        let currentPosition = this.initialPos.clone();
        let currentVelocity = this.initialVel.clone();
        let perTickVel = currentVelocity.clone();
        let nearestDistance = entityAABB.distanceToVec(currentPosition);
        let nextPosition = currentPosition.clone().add(currentVelocity);
        let currentDist = currentPosition.xzDistanceTo(currentPosition);
        let intersectPos: Vec3 | null = null;
        let blockingBlock: Block | null = null;
        let closestPoint: Vec3 | null = null;

        let totalTicks = 0;
        let gravity = this.gravity; // + this.gravity * airResistance.y;
        let offsetX: number = -currentVelocity.x * this.airResistance;
        let offsetY: number = -currentVelocity.y * this.airResistance - gravity;
        let offsetZ: number = -currentVelocity.z * this.airResistance;

        const entityDist = target.xzDistanceToVec(this.initialPos);
        while (totalTicks < 300) {
            const testDist = entityAABB.distanceToVec(currentPosition);
            // if (nearestDistance !== testDist) {
            //     if (nearestDistance > 6) {
            //         totalTicks += 1;
            //         gravity = this.gravity; // - this.gravity * airResistance.y;
            //         offsetX = -perTickVel.x * airResistance.h;
            //         offsetY = -perTickVel.y * airResistance.y - gravity;
            //         offsetZ = -perTickVel.z * airResistance.h;
            //     } else {
            //         totalTicks += 0.2;
            //         gravity = this.gravity * 0.2; //- this.gravity * airResistance.y) * 0.2
            //         offsetX = -perTickVel.x * (airResistance.h * 0.2);
            //         offsetY = -perTickVel.y * (airResistance.y * 0.2) - gravity;
            //         offsetZ = -perTickVel.z * (airResistance.h * 0.2);
            //     }
            // }
            totalTicks++;
            offsetX = -perTickVel.x * this.airResistance
            offsetY = -perTickVel.y * this.airResistance - this.gravity;
            offsetZ = -perTickVel.z * this.airResistance;

            if (nearestDistance > testDist) {
                nearestDistance = testDist;
                closestPoint = currentPosition;
            }

            if (blockChecking && this.interceptCalcs) {
                blockingBlock = this.interceptCalcs.check(currentPosition, nextPosition)?.block;
            }

            if (blockingBlock) break;

            intersectPos = entityAABB.intersectsSegment(currentPosition, nextPosition);
            if (intersectPos) {
                nearestDistance = 0;
                closestPoint = intersectPos;
                break;
            }

            currentDist = currentPosition.xzDistanceTo(this.initialPos);
            if (currentDist > entityDist || (currentVelocity.y < 0 && currentPosition.y - target.minY < 0)) break;

            currentPosition.add(currentVelocity);
            currentVelocity.translate(offsetX, offsetY, offsetZ);
            if (totalTicks % 1 === 0) perTickVel = currentVelocity;
            nextPosition.add(currentVelocity);
        }

        return {
            nearestDistance,
            blockingBlock,
            intersectPos,
            closestPoint,
            totalTicks,
        };
    }
}
