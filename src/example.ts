import { createBot } from "mineflayer";
import { InterceptFunctions } from "@nxg-org/mineflayer-util-plugin";
import { projectileGravity } from "./calc/constants";
import { Vec3 } from "vec3";
import type { Entity } from "prismarine-entity";
import { ShotFactory } from "./shotFactory";

const bot = createBot({
    username: "shot-testing",
    host: process.argv[2] ?? "localhost",
    port: Number(process.argv[3]) ?? 25565,
});

let checkedEntities: { [entityId: number]: Entity } = {};
let intercepter = new InterceptFunctions(bot);
const emptyVec = new Vec3(0, 0, 0);

bot.on("entityMoved", async (orgEntityData) => {
    if (checkedEntities[orgEntityData.id]) return;
    checkedEntities[orgEntityData.id] = orgEntityData;

    console.log(orgEntityData.name);
    if (["arrow", "firework_rocket", "egg"].includes(orgEntityData.name!)) {
        for (const entity of Object.values(bot.entities)) {
            const hit = ShotFactory.customGravity(
                { position: orgEntityData.position, velocity: orgEntityData.velocity },
                projectileGravity[orgEntityData.name!],
                intercepter
            ).hitsEntityWithPrediction(entity, emptyVec);
            if (!hit) continue;
            if (hit.intersectPos) {
                console.log("Arrow is going to hit entity", entity.name, "at position:", hit.intersectPos);
                bot.chat(`/particle note ${hit.closestPoint!.x} ${hit.closestPoint!.y + 2} ${hit.closestPoint!.z} 0 1 0 1 5`);
            }
        }
    }
});
