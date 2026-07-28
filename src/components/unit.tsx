import { type FoodType, type Snapshot } from "./snapshot";
import mulberry32 from "./rng";

type MovementTarget = {
    x: number;
    y: number;
    foodType?: "Vegeto" | "Plato";
    foodId?: number;
    unitData?: UnitData;
};

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);

    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    const d = max - min;

    if (d !== 0) {
        s = l > 0.5
            ? d / (2 - max - min)
            : d / (max + min);

        switch (max) {
            case r:
                h = ((g - b) / d + (g < b ? 6 : 0));
                break;
            case g:
                h = ((b - r) / d + 2);
                break;
            case b:
                h = ((r - g) / d + 4);
                break;
        }
        h *= 60;
    }

    return [h, s, l];
}

export default class UnitData {
    readonly id: number;
    readonly gen: number;
    readonly rgb: [number, number, number];
    // rgb[0], red - damage and carnivory
    // rgb[1], green - defence and herbivory
    // rgb[2], blue - survival and speed
    readonly speed: number;
    readonly defence: number;
    readonly damage: number;
    readonly children: number;
    readonly foodCoeficcient: { Vegeto: number, Plato: number };
    readonly lossSatietyPerSec: number;
    readonly satietyToBreed: number;
    readonly hex: string;
    readonly hsl: [number, number, number];
    readonly random: () => number;
    breedCooldown: number = 100;
    immuneticks: number = 100;
    pos: [number, number];
    health: number = 100;
    satiety: number;
    target: MovementTarget | null = null;
    ran: boolean = false;
    priority: "Vegeto" | "Plato" | null = null;
    get cell(): [number, number] { return [
        Math.min(9, Math.floor(this.pos[0] / 10)),
        Math.min(9, Math.floor(this.pos[1] / 10))
    ]; }

    constructor(id: number, gen: number, rgb: [number, number, number], pos: [number, number], seed: number) {
        this.id = id;
        this.gen = gen;
        this.rgb = rgb;
        this.pos = pos;
        this.random = mulberry32(seed);
        this.hsl = rgbToHsl(...this.rgb);
        this.foodCoeficcient = {
            Vegeto: this.rgb[1] / 255,
            Plato: this.rgb[0] / 255
        };
        this.speed = 5 + 15 * Math.pow(rgb[2]/255, 0.7);
        this.defence = this.rgb[1] / 255 * 0.7 + (this.gen > 512 ? this.random() * 0.3 * (1 - Math.exp(-0.003672 * (this.gen - 512))) : 0);
        this.damage = (this.rgb[0] / 255) * 500 * (0.8 + this.random() * 0.4) + (this.gen > 512 ? (Math.log1p(this.gen) * 20 * Math.log1p(this.random())) : 0);
        this.children = 2 + Math.round(rgb[2]/255 * Math.log1p(this.random()) * 10);
        this.hex = "#" + rgb.map(v => v.toString(16).padStart(2, "0")).join("");
        this.lossSatietyPerSec = Math.exp((rgb[0]+rgb[1]+rgb[2])/153)
        this.satietyToBreed = 80 + 70 * (rgb[1]/255 - rgb[0]/255)
        this.satiety = 9 + 21 * rgb[1]/255
    }

    static fromJSON(data: any) {
        const unit = Object.create(UnitData.prototype);
        return Object.assign(unit, data);
    }

    private removeFromMap(world: Snapshot) {
        const list = world.unitmap[this.cell[0]][this.cell[1]];

        for (let i = 0; i < list.length; i++) {
            if (list[i] === this) {
                for (let j = i + 1; j < list.length; j++) {
                    list[j - 1] = list[j];
                }
                list.length--;
                return;
            }
        }
    }

    private move(angle:number, module:number, world: Snapshot){
        const oldCell = this.cell;

        this.pos[0] += Math.cos(angle) * module;
        this.pos[1] += Math.sin(angle) * module;

        const newCell = this.cell;

        if(oldCell[0] === newCell[0] && oldCell[1] === newCell[1]) {
            return;
        }

        const oldList = world.unitmap[oldCell[0]][oldCell[1]];
        const index = oldList.indexOf(this);

        if(index !== -1) {
            oldList.splice(index, 1);
        }

        world.unitmap[newCell[0]][newCell[1]].push(this);
    }

    private getNearbyFood(world: Snapshot) {
        const foodCells: FoodType[] = [];

        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                const cx = this.cell[0] + dx;
                const cy = this.cell[1] + dy;

                if (cx < 0 || cx >= 10 || cy < 0 || cy >= 10) continue;
                foodCells.push(...world.foodmap[cx][cy]);
            }
        }

        return foodCells;
    }

    private removeFoodFromMap(food: FoodType, world: Snapshot) {
        const cx = Math.min(9, Math.max(0, Math.floor(food.x / 10)));
        const cy = Math.min(9, Math.max(0, Math.floor(food.y / 10)));
        const list = world.foodmap[cx][cy];
        const index = list.indexOf(food);

        if (index !== -1) {
            list.splice(index, 1);
        }
    }

    private select_target(world: Snapshot) {
        if(!!this.target?.unitData &&
            this.target.unitData.health > 0 &&
            this.random() > 0.8
        ) {
            this.target = { 
                x: this.target.unitData.pos[0], 
                y: this.target.unitData.pos[1], 
                unitData: this.target.unitData 
            }
            return;
        }
        let bestTarget: MovementTarget | null = null;
        if(!this.ran) {
            if(this.target === null) {
                this.target = { x: this.random() * 100, y: this.random() * 100 }
            }
            return
        }
        const nearbyUnits: {unit: UnitData, distance: number}[] = [];
        for(let dx = -1; dx <= 1; dx++) {
            for(let dy = -1; dy <= 1; dy++) {
                const cx = this.cell[0] + dx;
                const cy = this.cell[1] + dy;

                if(cx < 0 || cx >= 10 || cy < 0 || cy >= 10)
                    continue;

                for(const unit of world.unitmap[cx][cy]) {
                    if(unit.id === this.id || unit.health <= 0)
                        continue;

                    const distance =
                        (unit.pos[0] - this.pos[0]) ** 2 +
                        (unit.pos[1] - this.pos[1]) ** 2;

                    nearbyUnits.push({unit, distance});
                    if(nearbyUnits.length > 5) {
                        if(nearbyUnits.length < 5)
                            nearbyUnits.push({unit,distance});
                        else {
                            let max = 0;
                            let index = 0;

                            for(let i=0;i<5;i++){
                                if(nearbyUnits[i].distance > max){
                                    max = nearbyUnits[i].distance;
                                    index=i;
                                }
                            }

                            if(distance < max)
                                nearbyUnits[index]={unit,distance};
                        }
                        nearbyUnits.pop();
                    }
                }
            }
        }
        const prey = nearbyUnits.find(
            ({ unit }) => unit.rgb[0] * 100 / this.health < this.rgb[0]
        );
        if (prey) {
            bestTarget = {
                x: prey.unit.pos[0],
                y: prey.unit.pos[1],
                foodType: "Plato",
                foodId: prey.unit.id,
                unitData: prey.unit
            };
            this.target = bestTarget;
            return;
        }
        if (world.food.length > 0 && this.foodCoeficcient.Vegeto > 0) {
            const nearbyFood = this.getNearbyFood(world);
            if (nearbyFood.length > 0) {
                let closestFood = nearbyFood[0];
                let closestDistance = Infinity;

                for (const food of nearbyFood) {
                    const distance =
                        (food.x - this.pos[0]) ** 2 +
                        (food.y - this.pos[1]) ** 2;

                    if (distance < closestDistance) {
                        closestDistance = distance;
                        closestFood = food;
                    }
                }

                bestTarget = {
                    x: closestFood.x,
                    y: closestFood.y,
                    foodType: "Vegeto",
                    foodId: closestFood.id
                };

                this.target = bestTarget;
                return;
            }
        }
        if (nearbyUnits.length > 0) {
            let weakest = nearbyUnits[0];

            for (const u of nearbyUnits) {
                if (u.unit.rgb[0] < weakest.unit.rgb[0]) {
                    weakest = u;
                }
            }

            bestTarget = {
                x: weakest.unit.pos[0],
                y: weakest.unit.pos[1],
                foodType: "Plato",
                foodId: weakest.unit.id,
                unitData: weakest.unit
            };
        }


        this.target = bestTarget;
    }

    private mutateRGB(rgb: [number, number, number]): [number, number, number] {
        const newrgb = [...rgb] as [number, number, number];
        if (this.random() < 0.6) {
            const maxValue = Math.max(...newrgb);

            const maxIndexes = newrgb
                .map((v, i) => v === maxValue ? i : -1)
                .filter(i => i !== -1);

            const maxIndex = maxIndexes[Math.floor(this.random() * maxIndexes.length)];

            const transfer = Math.floor(newrgb[maxIndex] * 0.14);
            newrgb[maxIndex] -= transfer;

            const targets = [0, 1, 2].filter(i => i !== maxIndex);

            for (let i = 0; i < transfer; i++) {
                const target = targets[Math.floor(this.random() * targets.length)];
                if (newrgb[target] < 255) {
                    newrgb[target]++;
                }
            }
        }
        const mutationIndex = Math.floor(this.random() * 3);
        const mutation = Math.floor(this.random() * 61) - 30;

        newrgb[mutationIndex] += mutation;

        for (let i = 0; i < 3; i++) {
            newrgb[i] = Math.max(0, Math.min(255, newrgb[i]));
        }

        return newrgb;
    }

    private breed(world: Snapshot) {
        if(this.breedCooldown > 0) {
            this.breedCooldown -= 1
            return;
        }
        Array.from({ length: this.children }, () => {
            const rgb = this.mutateRGB(this.rgb);
            world.units.push(
                new UnitData(
                    Math.round(this.random() * 1000000),
                    this.gen + 1,
                    rgb,
                    [
                        this.pos[0] + this.random() - 0.5,
                        this.pos[1] + this.random() - 0.5
                    ],
                    this.random() 
                ),
            );
        });

        this.satiety = 9 + 21 * this.rgb[1]/255
        this.breedCooldown = 100
    }

    tick(world: Snapshot, tps: number): void {
        this.immuneticks -= 1
        this.satiety -= this.lossSatietyPerSec/tps
        if(this.target) {
            if(
                (this.pos[0] - this.target.x)**2+(this.pos[1] - this.target.y)**2 < 1) {
                this.target = null;
                if(!this.ran) { this.ran = true }
            } else {
                this.move(Math.atan2(
                    this.target.y - this.pos[1], this.target.x - this.pos[0]
                ), this.speed / tps, world)
            }
        } else {
            this.target = { x: this.random()*100, y: this.random()*100 }
        }
        if(this.random() < 0.07) {
            this.select_target(world);
        }
        if(this.satiety < 0) {
            this.health -= 15 / tps
        } else if(this.satiety > this.satietyToBreed && this.immuneticks < -100) {
            this.breed(world)
        }
        if(this.health <= 0) {
            this.removeFromMap(world);
            const index = world.units.indexOf(this);
            if(index !== -1)
                world.units.splice(index,1);
            return;
        }
        if (this.satiety > 25 && this.health < 100) {
            this.health += 50 / tps
        }

        for (const fd of this.getNearbyFood(world)) {
            if ((fd.x - this.pos[0]) ** 2 + (fd.y - this.pos[1]) ** 2 < 1) {
                const index = world.food.indexOf(fd);
                if (index !== -1) {
                    world.food.splice(index, 1);
                }
                this.removeFoodFromMap(fd, world);
                this.satiety += 40 * this.foodCoeficcient.Vegeto + this.gen / 50;
            }
        }
        
        world.unitmap[this.cell[0]][this.cell[1]].forEach((unit) => {
            if(
                ((unit.pos[0] - this.pos[0])**2 + (unit.pos[1] - this.pos[1])**2 < 3) 
                && (unit.id !== this.id)
                && (unit.health > 0)
            ) {
                if(this.immuneticks < 0) {
                    const damaged = this.damage * (1 - unit.defence) / tps
                    unit.health -= damaged
                    this.satiety += damaged * this.foodCoeficcient.Plato
                }
            }
        })
        
        return;
    }
}
