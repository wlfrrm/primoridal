import { Github, Telegram, React, Astro as AstroIcon, Figma, TailwindCss } from '@thesvg/react';
import { RefreshCcw, Zap, DnaOff, Ham, Pause, Play, WheatOff, Cog, Skull } from "lucide-react";
import Pole from "./pole.tsx"
import Configurer from './configurer.tsx';
import { useEffect, useRef, useState } from 'react';
import { feedSignal, toxiSignal, reducedTPS, killHalfSignal, famineSignal } from '../stores/number.ts';
import type { Configuration, FoodType } from './snapshot.ts';
import Unit from "./unit";
import RNG from "./rng.ts"

const BASE_CONFIG = (): Configuration => {
    const seed = Math.round(2128 * Math.random() * 10 ** 4);
    const random = RNG(seed);
    return{
    world: {
            food: Array.from({ length: 700 }, (): FoodType => {
                return { x: random() * 100, y: random() * 100,
                    id: Math.round(random() * 100 ** 4)
                }
            }),
            units: [
                new Unit(Math.round(random() * 100 ** 4), 1, [51,51,51], [60, 50], seed),
                new Unit(Math.round(random() * 100 ** 4), 1, [102,51,0], [48, 60], seed),
                new Unit(Math.round(random() * 100 ** 4), 1, [102,0,51], [41, 46], seed),
                new Unit(Math.round(random() * 100 ** 4), 1, [0,102,51], [41, 54], seed),
                new Unit(Math.round(random() * 100 ** 4), 1, [51,102,0], [56, 58], seed),
                new Unit(Math.round(random() * 100 ** 4), 1, [0,51,102], [48, 40], seed),
                new Unit(Math.round(random() * 100 ** 4), 1, [51,0,102], [56, 42], seed),
                new Unit(Math.round(random() * 100 ** 4), 1, [255, 255, 255], [50, 50], seed),            ],
            unitmap: Array.from(
                { length: 10 },
                () => Array.from(
                    { length: 10 },
                    () => []
                )
            ),
            foodmap: Array.from(
                { length: 10 },
                () => Array.from(
                    { length: 10 },
                    () => []
                )
            )
    },
    tps: 24,
    seed: seed
}}

export default function App() {
    const [ky, Refresh] = useState(0);
    const [paused, setPaused] = useState(false);
    const pauseOrContinueRef = useRef<HTMLButtonElement>(null);
    const stimulateRef = useRef<HTMLButtonElement>(null);
    const intoxicateRef = useRef<HTMLButtonElement>(null);
    const feedRef = useRef<HTMLButtonElement>(null);
    const resetRef = useRef<HTMLButtonElement>(null);
    const famineRef = useRef<HTMLButtonElement>(null);
    const killHalfRef = useRef<HTMLButtonElement>(null);
    const [config, setConfig] = useState(BASE_CONFIG);
    const [mode, setMode] = useState<"simulation" | "configuration">("simulation")

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === "Space") {
                e.preventDefault();
                pauseOrContinueRef.current?.click();
            }

            switch (e.code) {
                case "KeyR":
                    resetRef.current?.click();
                    break;

                case "KeyS":
                    stimulateRef.current?.click();
                    break;

                case "KeyD":
                    intoxicateRef.current?.click();
                    break;

                case "KeyF":
                    feedRef.current?.click();
                    break;

                case "KeyB":
                    famineRef.current?.click();
                    break;

                case "KeyK":
                    killHalfRef.current?.click();
                    break;
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, []);

    if(mode == "simulation") return <>
        <div className="md:w-[18%] flex flex-col gap-2">
            <p className="text-3xl font-black mx-auto"><i>Primordial</i> Soup</p>
            <a href="https://github.com/wlfrrm/primordial"><button className="flex w-full px-8 py-2 justify-between
            text-2xl rounded-full
            border border-blue-200/10
            bg-blue-900/10
            backdrop-blur-xl transition-all
            shadow-[0_8px_32px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.15)]
            hover:bg-blue-800/20
            ">
            GitHub <Github variant="mono" className="h-8 w-8" />
            </button></a>
            <a href="https://t.me/ch4ngelog"><button className="flex w-full px-8 py-2 justify-between
            text-2xl rounded-full
            border border-blue-200/10
            bg-blue-900/10
            backdrop-blur-xl transition-all
            shadow-[0_8px_32px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.15)]
           hover:bg-blue-800/20
            ">
            Telegram <Telegram variant="mono" className="h-8 w-8" />
            </button></a>
            <div className="flex justify-between px-2">
                <React className="w-12 h-12 transition-all hover:scale-120" />
                <AstroIcon className="w-12 h-12 transition-all hover:scale-120" />
                <Figma className="w-12 h-12 transition-all hover:scale-120" />
                <TailwindCss className="w-12 h-12 transition-all hover:scale-120" />
            </div>
            <button className="flex w-full px-8 py-2 justify-between
            text-2xl rounded-full
            border border-blue-200/10
            bg-blue-900/10 mt-auto
            backdrop-blur-xl transition-all
            shadow-[0_8px_32px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.15)]
            hover:bg-blue-800/20"
            onClick={() => {
                    Refresh(Math.random());
                    setConfig(BASE_CONFIG())
                }
            }
            ref={resetRef}
            >
            Reset <span className='opacity-25 mr-auto ml-2 text-[80%] align-middle my-auto'>[R]</span> <RefreshCcw className="h-8 w-8" />
            </button>
            <button className="flex w-full px-8 py-2 justify-between
            text-2xl rounded-full
            border border-blue-200/10
            bg-blue-900/10
            backdrop-blur-xl transition-all
            shadow-[0_8px_32px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.15)]
            hover:bg-blue-800/20" 
            onClick={() => reducedTPS.set(3)}
            ref={stimulateRef}
            >
            Stimulate <span className='opacity-25 mr-auto ml-2 text-[80%] align-middle my-auto'>[S]</span> <Zap className="h-8 w-8" />
            </button>
            <button className="flex w-full px-8 py-2 justify-between
            text-2xl rounded-full
            border border-blue-200/10
            bg-blue-900/10
            backdrop-blur-xl transition-all
            shadow-[0_8px_32px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.15)]
            hover:bg-blue-800/20"
            onClick={() => toxiSignal.set(true)}
            ref={intoxicateRef}
            >
            Intoxicate <span className='opacity-25 mr-auto ml-2 text-[80%] align-middle my-auto'>[D]</span> <DnaOff className="h-8 w-8" />
            </button>
            <button className="flex w-full px-8 py-2 justify-between
            text-2xl rounded-full
            border border-blue-200/10
            bg-blue-900/10
            backdrop-blur-xl transition-all
            shadow-[0_8px_32px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.15)]
            hover:bg-blue-800/20"
            onClick={() => feedSignal.set(true)}
            ref={feedRef}
            >
            Feed <span className='opacity-25 mr-auto ml-2 text-[80%] align-middle my-auto'>[F]</span> <Ham className="h-8 w-8" />
            </button>
            <button className="flex w-full px-8 py-2 justify-between
            text-2xl rounded-full
            border border-blue-200/10
            bg-blue-900/10
            backdrop-blur-xl transition-all
            shadow-[0_8px_32px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.15)]
            hover:bg-blue-800/20"
            onClick={() => famineSignal.set(true)}
            ref={famineRef}
            >
            Famine <span className='opacity-25 mr-auto ml-2 text-[80%] align-middle my-auto'>[B]</span> <WheatOff className="h-8 w-8" />
            </button>
            <button className="flex w-full px-8 py-2 justify-between
            text-2xl rounded-full
            border border-blue-200/10
            bg-blue-900/10
            backdrop-blur-xl transition-all
            shadow-[0_8px_32px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.15)]
            hover:bg-blue-800/20"
            onClick={() => killHalfSignal.set(true)}
            ref={killHalfRef}
            >
            50/50 <span className='opacity-25 mr-auto ml-2 text-[80%] align-middle my-auto'>[K]</span> <Skull className="h-8 w-8" />
            </button>
            {paused ? (
                <button className="flex w-full px-8 py-2 justify-between
                text-2xl rounded-full
                border border-blue-200/10
                bg-blue-900/10
                backdrop-blur-xl transition-all
                shadow-[0_8px_32px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.15)]
                hover:bg-blue-800/20"
                ref={pauseOrContinueRef}
                onClick={() => {
                    reducedTPS.set(1);
                    setPaused(false);
                }}
                >
                    Continue <span className='opacity-25 mr-auto ml-2 text-[80%] align-middle my-auto'>[SPACE]</span> <Play className="h-8 w-8" />
                </button>
            ) : (
                <button className="flex w-full px-8 py-2 justify-between
                text-2xl rounded-full
                border border-blue-200/10
                bg-blue-900/10
                backdrop-blur-xl transition-all
                shadow-[0_8px_32px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.15)]
                hover:bg-blue-800/20"
                ref={pauseOrContinueRef}
                onClick={() => {
                    reducedTPS.set(0);
                    setPaused(true);
                }}
                >
                    Pause <span className='opacity-25 mr-auto ml-2 text-[80%] align-middle my-auto'>[SPACE]</span> <Pause className="h-8 w-8" />
                </button>
            )}
            <button className="hidden md:flex w-full px-8 py-2 justify-between
            text-2xl rounded-full
            border border-blue-200/10
            bg-blue-900/10 mb-4
            backdrop-blur-xl transition-all
            shadow-[0_8px_32px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.15)]
            hover:bg-blue-800/20"
            onClick={() => setMode("configuration")}
            >
            Configure <Cog className="h-8 w-8" />
            </button>
        </div>
        <div className="rounded-2xl my-4 w-[80%] bg-[#FFFFFF20] aspect-square mx-auto
        border-[max(2px,0.2vw)] border-[#FFFFFF15] relative">
            <Pole key={ky} cfg={config} />
        </div>
    </>
    if(mode == "configuration") return <Configurer 
        current={config} 
        exit={() => setMode("simulation")}
        setConfig={setConfig}
    />
}