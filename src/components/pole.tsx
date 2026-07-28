import { type FoodType, type Snapshot, type Configuration } from "./snapshot";
import { useEffect, useRef } from "react";
import drawStage from "./drawstage";
import { feedSignal, toxiSignal, reducedTPS, unitsRemained, famineSignal, killHalfSignal } from '../stores/number.ts';
import mulberry32 from "./rng.ts";

export default function Pole({cfg}: {cfg:Configuration}) {
    const TPS = cfg.tps;
    const world = cfg.world;
    const random = mulberry32(cfg.seed);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    useEffect(() => {
        let dTPS = 1;
        if (!canvasRef.current) return;
        canvasRef.current.width = canvasRef.current.clientWidth;
        canvasRef.current.height = canvasRef.current.clientHeight;
        const ctx = canvasRef.current.getContext("2d");
        if (!ctx) return;
        const refreshFoodMap = () => {
            world.foodmap = Array.from(
                { length: 10 },
                () => Array.from(
                    { length: 10 },
                    () => []
                )
            );

            for (const food of world.food) {
                const cx = Math.min(9, Math.max(0, Math.floor(food.x / 10)));
                const cy = Math.min(9, Math.max(0, Math.floor(food.y / 10)));
                world.foodmap[cx][cy].push(food);
            }
        };

        refreshFoodMap();

        let lastTick = performance.now();
        let realTPS = 0;
        let feedNow = true;
        let renderRequested = false;
        let renderFrame = 0;

        const scheduleRender = () => {
            if (renderRequested) {
                return;
            }
            renderRequested = true;
            renderFrame = requestAnimationFrame(() => {random()
                renderRequested = false;
                drawStage(ctx, world);
            });
        };

        scheduleRender();

        const cycle = setInterval(() => {
            const now = performance.now();
            const delta = now - lastTick;
            lastTick = now;
            realTPS = 1000 / delta;
            console.log("TPS:", realTPS.toFixed(1), "loss%:", realTPS/TPS, "lossT:", TPS-realTPS, "units:", world.units.length);
            unitsRemained.set(world.units.length)
            if(feedSignal.get()) {
                if(world.food.length < 3000) {
                    world.food = [...world.food, ...Array.from({ length: 100 }, (): FoodType => {
                        return { x: random() * 100, y: random() * 100,
                            id: Math.round(random() * 100 ** 4)
                        }
                    })];
                }
                refreshFoodMap();
                feedSignal.set(false)
            }
            if(toxiSignal.get())  {
                world.units.forEach(un => {
                    un.health -= 40
                })
                canvasRef.current!.style.backgroundColor = "rgba(0, 255, 0, 0.15)";
                canvasRef.current!.style.transitionDuration = "2";
                setTimeout(() => canvasRef.current!.style.backgroundColor = "", 300)
                toxiSignal.set(false)
            }
            if(famineSignal.get())  {
                world.food = [];
                refreshFoodMap();
                feedNow = false;
                setTimeout(() => feedNow = true, 5000)
                famineSignal.set(false)
            }
            if(killHalfSignal.get())  {
                world.units = world.units.filter(un => Math.random() > 0.5)
                killHalfSignal.set(false)
            }
            if (reducedTPS.get() > 1) {
                dTPS = 3
                setTimeout(() => {
                    dTPS = 1;
                    reducedTPS.set(1);
                }, 3000)
            } else if (reducedTPS.get() == 1) {
                dTPS = 1
            } else if (reducedTPS.get() < 1) {
                dTPS = 0
                reducedTPS.set(0)
            }
            const tickTPS = dTPS === 0 ? TPS : TPS / dTPS;
            if (dTPS !== 0) {
                for (let i = world.units.length - 1; i >= 0; i--) {
                    world.units[i].tick(world, tickTPS);
                }
            }
            if(feedNow && random() > 0.9 && dTPS != 0 && world.food.length < 3000) {
                for(let i = 0; i < 1 + Math.round(Math.sqrt(world.units.length / TPS)); i++) {
                    const foodItem = { id: Math.round(random() * 100000), x: random() * 100, y: random() * 100 };
                    world.food.push(foodItem);
                }
                refreshFoodMap();
            }
            scheduleRender();
        }, 1000/TPS)
        return () => {
            clearInterval(cycle);
            cancelAnimationFrame(renderFrame);
        };
    }, [cfg]);

    return <canvas ref={canvasRef} className="w-full h-full p-1 transition-all duration-300" />;
}
