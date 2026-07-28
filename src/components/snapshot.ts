import type UnitData from "./unit"

export type FoodType = {
    id: number;
    x: number;
    y: number;
};

export type Snapshot = {
    food: FoodType[];
    units: UnitData[];
    unitmap: UnitData[][][];
    foodmap: FoodType[][][];
}

export type Configuration = {
    world: Snapshot,
    seed: number,
    tps: number
}