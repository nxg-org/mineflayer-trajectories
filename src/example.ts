import { createBot } from "mineflayer";
import { InterceptFunctions } from "@nxg-org/mineflayer-util-plugin";
import { projectileGravity } from "./calc/constants";
import { Vec3 } from "vec3";
import type { Entity } from "prismarine-entity";
import { ShotFactory } from "./shotFactory";
import { vectorMagnitude } from "./calc/mathUtilts";
import { ProjectileTracker } from "./test";

const bot = createBot({
    username: "shot-testing",
    host: process.argv[2] ?? "localhost",
    port: Number(process.argv[3]) ?? 25565,
});

const tracker = new ProjectileTracker(bot);

let checkedEntities: { [entityId: number]: Entity } = {};
let intercepter = new InterceptFunctions(bot);
const emptyVec = new Vec3(0, 0, 0);

bot.on("entityMoved", async (orgEntityData) => {
    if (checkedEntities[orgEntityData.id]) return;
    checkedEntities[orgEntityData.id] = orgEntityData;

    console.log(vectorMagnitude(orgEntityData.velocity));
    if (["arrow", "firework_rocket", "ender_pearl"].includes(orgEntityData.name!)) {
        for (const entity of Object.values(bot.entities)) {
            const hit = ShotFactory.fromEntity(orgEntityData, intercepter).hitsEntityWithPrediction(entity, emptyVec);
            if (!hit) continue;
            if (hit.intersectPos) {
                console.log(orgEntityData.position);
                console.log(orgEntityData.name, "is going to hit entity", entity.username ?? entity.name, "at position:", hit.intersectPos);
                bot.chat(`/particle note ${hit.closestPoint!.x} ${hit.closestPoint!.y + 2} ${hit.closestPoint!.z} 0 1 0 1 5`);
            }
        }
    }
});

function equipShield() {
    const shield = bot.util.inv.getAllItemsExceptCurrent("off-hand").find((e) => e.name === "shield");
    if (shield) {
        bot.util.inv.customEquip(shield, "off-hand");
    }
}

bot.on("physicsTick", () => {
    const target = bot.nearestEntity(e => e.username === "Generel_Schwerz")
    if (target) console.log(tracker.getProjectileDestination(target))
    // const entity = tracker.getHighestPriorityEntity();
    // if (entity) {
    //     bot.lookAt(entity.entity.position);
    //     // if (!bot.util.entity.isOffHandActive()) bot.activateItem(true);
    // } else {
    //     // bot.deactivateItem();
    // }
});

bot.on("entityMoved", async (entity) => {
    if (!Object.keys(projectileGravity).includes(entity.name!)) return;
    // const pos = tracker.getHighestPriorityProjectile()?.entity?.position
    // if (pos) {
    //     bot.lookAt(pos, true);
    //     equipShield();
    //     if (!bot.util.entity.isOffHandActive()) bot.activateItem(true);
    // } else {
    //     bot.deactivateItem();
    // }
});