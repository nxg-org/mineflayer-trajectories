import { createBot } from "mineflayer";
import { InterceptFunctions } from "@nxg-org/mineflayer-util-plugin";
import { projectileGravity } from "./calc/constants";
import { Vec3 } from "vec3";
import type { Entity } from "prismarine-entity";
import { ShotFactory } from "./shotFactory";
import { vectorMagnitude } from "./calc/mathUtilts";
import { StaticShot } from "./staticShot";

const bot = createBot({
    username: "shot-testing",
    host: process.argv[2] ?? "localhost",
    port: Number(process.argv[3]) ?? 25565,
    version: "1.17.1",
});

let checkedEntities: { [entityId: number]: Entity } = {};
let intercepter = new InterceptFunctions(bot);
const emptyVec = new Vec3(0, 0, 0);

bot.on("entityMoved", async (ent) => {
    // if (checkedEntities[orgEntityData.id]) return;
    // checkedEntities[orgEntityData.id] = orgEntityData;

    if (["arrow", "firework_rocket", "ender_pearl"].includes(ent.name!)) {
        const initShot = StaticShot.calculateShotForPoints(ent, false);
        for (const pos of initShot.positions) {
            const { x, y, z } = pos;
            bot.chat(`/particle flame ${x} ${y} ${z} 0 0 0 0 1 force`);
        }
    }

    // // console.log(vectorMagnitude(orgEntityData.velocity));
    // if (["arrow", "firework_rocket", "ender_pearl"].includes(ent.name!)) {
    //     for (const entity of Object.values(bot.entities).filter(e => e !== ent && (e.type === "mob" || e.type === "player"))) {
    //         const hit = ShotFactory.fromEntity(ent, intercepter).hitsEntityWithPrediction({position: entity.position, height: entity.height + 0.18, width: entity.width}, emptyVec);
    //         if (!hit) continue;
    //         if (hit.intersectPos) {
    //             bot.chat(`/particle note ${ent.position.x} ${ent.position.y} ${ent.position.z} 0 0 0 0 1 force`);
    //             console.log(ent.name, "is going to hit entity", entity.username ?? entity.name, "at position:", hit.intersectPos);
    //             bot.chat(`/particle flame ${hit.closestPoint!.x} ${hit.closestPoint!.y + 2} ${hit.closestPoint!.z} 0 0 0 0 1 force`);
    //         }
    //     }
    // }
});
