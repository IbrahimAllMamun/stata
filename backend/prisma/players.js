import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const positions = ["DEFENDER", "MIDFIELDER", "FORWARD", "GOALKEEPER"];

const names = [
    "Rahim", "Karim", "Sakib", "Tamim", "Mashrafi", "Mahmudullah",
    "Litton", "Shanto", "Afif", "Taskin", "Mustafiz", "Shadman",
    "Nasum", "Mehidy", "Rony", "Sabbir", "Imran", "Fahim",
    "Arif", "Jahid", "Rakib", "Sohan", "Tanzim", "Nayeem"
];

async function main() {
    const seasonId = 1; // make sure this season exists

    const players = [];

    for (let i = 1; i <= 50; i++) {
        const randomName =
            names[Math.floor(Math.random() * names.length)] +
            " " +
            names[Math.floor(Math.random() * names.length)];

        players.push({
            sl: i,
            season_id: seasonId,
            name: randomName,
            batch: 20 + Math.floor(Math.random() * 25), // batch 20–44
            playing_position: positions[Math.floor(Math.random() * positions.length)],
            status: false,
            randomized: false,
        });
    }

    await prisma.asplPlayer.createMany({
        data: players,
        skipDuplicates: true,
    });

    console.log("✅ 50 random players created");
}

main()
    .catch((e) => {
        console.error(e);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });