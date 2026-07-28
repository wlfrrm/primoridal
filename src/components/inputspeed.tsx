import { numberValue } from "../stores/number";

export default function NumberInput() {
    return (
        <input
            type="text"
            className={`
                rounded-full text-white bg-blue-900/10
                backdrop-blur-xl transition-all
                focus:outline-none focus:ring-0
                w-[30%] my-auto px-4 py-2
                text-center
                shadow-[0_8px_32px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.15)]
                inset_0_1px_1px_rgba(255,255,255,0.15)]
            `}
            value={numberValue.get()}
        />
    );
}