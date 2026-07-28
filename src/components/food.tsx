export default function({ x, y }: { x: number, y: number }) {
    return (
        <div
            style={{
                left: `${x}%`,
                bottom: `${y}%`,
            }}
            className="w-2 h-2 bg-green-400 absolute rounded-full"
        />
    )
}